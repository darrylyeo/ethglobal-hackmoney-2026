/**
 * Fetch and normalize USDC transfer events from Covalent (or compatible indexer).
 * Single module so endpoint/pagination can be adapted without changing callers.
 */
import { COVALENT_TRANSFERS_MAX } from '$/constants/query-limits.ts'

export type NormalizedTransfer = {
	fromAddress: string
	toAddress: string
	amount: string
	timestamp: number
	chainId: number
}

export type TransferNode = {
	address: string
	chainIds: number[]
}

export type TransferEdge = {
	fromAddress: string
	toAddress: string
	amount: string
	totalAmount: number
	timestamps: number[]
	chainIds: number[]
}

export type TransferGraph = {
	nodes: TransferNode[]
	edges: TransferEdge[]
}

export type ChainContract = {
	chainId: number
	contractAddress: string
}

export type TimePeriodEntry = { value: string; label: string; ms: number }

export type TransfersGraphResult = {
	graph: TransferGraph
	period: string
	periods: readonly TimePeriodEntry[]
}

const COVALENT_BASE = 'https://api.covalenthq.com'

type CovalentTransferItem = {
	from_address?: string
	to_address?: string
	delta?: string
	amount?: string
	block_signed_at?: string
}

type CovalentResponse = {
	data?: { items?: CovalentTransferItem[] }
	error?: boolean
}

function parseCovalentItem(
	item: CovalentTransferItem,
	chainId: number,
): NormalizedTransfer | null {
	const from = item.from_address ?? ''
	const to = item.to_address ?? ''
	const amount =
		item.delta != null
			? String(Math.abs(Number(item.delta)))
			: item.amount != null
				? String(Math.abs(Number(item.amount)))
				: '0'
	const timestamp = item.block_signed_at
		? new Date(item.block_signed_at).getTime()
		: 0
	if (!from || !to) return null
	return {
		fromAddress: from.toLowerCase(),
		toAddress: to.toLowerCase(),
		amount,
		timestamp,
		chainId,
	}
}

export async function fetchTransfersForChain(
	chainId: number,
	contractAddress: string,
	startTime: number,
	endTime: number,
	apiKey: string,
): Promise<NormalizedTransfer[]> {
	const url = `${COVALENT_BASE}/v1/${chainId}/address/${contractAddress}/transfers_v2/?key=${apiKey}`
	const res = await fetch(url)
	if (!res.ok) return []
	const data = (await res.json()) as CovalentResponse
	if (data.error || !data.data?.items) return []
	const start = startTime / 1000
	const end = endTime / 1000
	return data.data.items
		.map((item) => parseCovalentItem(item, chainId))
		.filter((t): t is NormalizedTransfer => t !== null)
		.filter((t) => {
			const sec = t.timestamp / 1000
			return sec >= start && sec <= end
		})
		.slice(0, COVALENT_TRANSFERS_MAX)
}

export async function fetchAllTransfers(
	chains: ChainContract[],
	startTime: number,
	endTime: number,
	apiKey: string,
): Promise<NormalizedTransfer[]> {
	const results = await Promise.all(
		chains.map(({ chainId, contractAddress }) =>
			fetchTransfersForChain(
				chainId,
				contractAddress,
				startTime,
				endTime,
				apiKey,
			),
		),
	)
	return results.flat()
}

export function buildGraph(transfers: NormalizedTransfer[]): TransferGraph {
	const nodeByAddress = new Map<string, TransferNode>()
	const edgeKey = (from: string, to: string) => `${from}:${to}`
	const edgeByKey = new Map<string, TransferEdge>()

	for (const t of transfers) {
		const from = t.fromAddress
		const to = t.toAddress
		if (!from || !to) continue

		if (!nodeByAddress.has(from)) {
			nodeByAddress.set(from, { address: from, chainIds: [] })
		}
		const nFrom = nodeByAddress.get(from)!
		if (!nFrom.chainIds.includes(t.chainId)) nFrom.chainIds.push(t.chainId)

		if (!nodeByAddress.has(to)) {
			nodeByAddress.set(to, { address: to, chainIds: [] })
		}
		const nTo = nodeByAddress.get(to)!
		if (!nTo.chainIds.includes(t.chainId)) nTo.chainIds.push(t.chainId)

		const key = edgeKey(from, to)
		const amountNum = parseFloat(t.amount) || 0
		if (!edgeByKey.has(key)) {
			edgeByKey.set(key, {
				fromAddress: from,
				toAddress: to,
				amount: t.amount,
				totalAmount: 0,
				timestamps: [],
				chainIds: [],
			})
		}
		const edge = edgeByKey.get(key)!
		edge.totalAmount += amountNum
		edge.timestamps.push(t.timestamp)
		if (!edge.chainIds.includes(t.chainId)) edge.chainIds.push(t.chainId)
	}

	return {
		nodes: [...nodeByAddress.values()],
		edges: [...edgeByKey.values()],
	}
}

export const TIME_PERIODS = [
	{ value: '1h', label: '1h', ms: 60 * 60 * 1000 },
	{ value: '6h', label: '6h', ms: 6 * 60 * 60 * 1000 },
	{ value: '12h', label: '12h', ms: 12 * 60 * 60 * 1000 },
	{ value: '1d', label: '1d', ms: 24 * 60 * 60 * 1000 },
	{ value: '3d', label: '3d', ms: 3 * 24 * 60 * 60 * 1000 },
	{ value: '7d', label: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
] as const

export function periodToRange(periodMs: number): {
	start: number
	end: number
} {
	const end = Date.now()
	return { start: end - periodMs, end, }
}

const FETCH_TIMEOUT_MS = 30_000

/** Primary: eth_getLogs (Voltaire). Returns graph for the selected period. */
export async function fetchTransfersGraphFromVoltaire(
	period: string,
): Promise<TransfersGraphResult> {
	const { fetchTransferEventsForPeriod } = await import('$/api/transfers-logs.ts')
	const periodDef =
		TIME_PERIODS.find((p) => p.value === period) ?? TIME_PERIODS[3]
	const events = await fetchTransferEventsForPeriod(period)
	const transfers: NormalizedTransfer[] = events.map((e) => ({
		fromAddress: e.fromAddress,
		toAddress: e.toAddress,
		amount: e.amount,
		timestamp: e.timestamp,
		chainId: e.chainId,
	}))
	const graph = buildGraph(transfers)
	return { graph, period: periodDef.value, periods: TIME_PERIODS }
}

export async function fetchTransfersGraph(
	period: string,
	apiKey: string,
	chains: ChainContract[],
): Promise<TransfersGraphResult> {
	const periodDef =
		TIME_PERIODS.find((p) => p.value === period) ?? TIME_PERIODS[3]
	const { start, end } = periodToRange(periodDef.ms)
	const fetchTransfers =
		apiKey.length > 0
			? () => fetchAllTransfers(chains, start, end, apiKey)
			: () => Promise.resolve([])
	const timeout = new Promise<never>((_, reject) =>
		setTimeout(
			() => reject(new Error('Transfers load timed out')),
			FETCH_TIMEOUT_MS,
		),
	)
	const transfers = await Promise.race([fetchTransfers(), timeout]).catch(
		() => [],
	)
	const graph = buildGraph(transfers)
	return { graph, period: periodDef.value, periods: TIME_PERIODS }
}
