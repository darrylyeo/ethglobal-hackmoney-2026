/**
 * SQD Portal API client for EVM blockchain data.
 * Public Portal: 20 req/10s. Use client-side throttle.
 */

import {
	getSqdDatasetSlug,
	getSqdPortalBaseUrl,
	hasSqdTraces,
} from '$/constants/sqd-datasets.ts'
import type { Trace } from '$/data/Trace.ts'

const PORTAL_REQ_LIMIT = 20
const PORTAL_WINDOW_MS = 10_000
const reqTimestamps: number[] = []

async function throttle(): Promise<void> {
	const cutoff = () => Date.now() - PORTAL_WINDOW_MS
	while (reqTimestamps.length > 0 && reqTimestamps[0]! <= cutoff()) reqTimestamps.shift()
	while (reqTimestamps.length >= PORTAL_REQ_LIMIT) {
		const waitMs = reqTimestamps[0]! + PORTAL_WINDOW_MS - Date.now()
		if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs))
		while (reqTimestamps.length > 0 && reqTimestamps[0]! <= cutoff()) reqTimestamps.shift()
	}
	reqTimestamps.push(Date.now())
}

export type SqdEvmFields = {
	block?: Record<string, boolean>
	log?: Record<string, boolean>
	transaction?: Record<string, boolean>
	trace?: Record<string, boolean>
	stateDiff?: Record<string, boolean>
}

export type SqdLogFilter = {
	address?: string[]
	topic0?: string[]
	topic1?: string[]
	topic2?: string[]
	topic3?: string[]
}

export type SqdEvmQuery = {
	type: 'evm'
	fromBlock: number
	toBlock?: number
	fields: SqdEvmFields
	logs?: SqdLogFilter[]
	transactions?: Array<{ from?: string[]; to?: string[]; sighash?: string[] }>
	traces?: Array<{ type?: string[]; callTo?: string[]; callFrom?: string[] }>
	stateDiffs?: Array<{ address?: string[]; key?: string[]; kind?: string[] }>
	includeAllBlocks?: boolean
	finalizedOnly?: boolean
}

export type SqdBlockHeader = {
	number: number
	timestamp?: number
	hash?: string
	parentHash?: string
	gasUsed?: string
	gasLimit?: string
	miner?: string
	baseFeePerGas?: string
}

export type SqdBlockItem = {
	header: SqdBlockHeader
	transactions?: Array<{ hash?: string; blockNumber?: number }>
	logs?: Array<{
		address?: string
		topics?: string[]
		data?: string
		transactionHash?: string
		logIndex?: number
		blockNumber?: number
	}>
	traces?: SqdTraceItem[]
	stateDiffs?: unknown[]
}

export type SqdTraceItem = {
	type?: string
	transactionHash?: string
	transactionIndex?: number
	callFrom?: string
	callTo?: string
	callValue?: string
	callInput?: string
	callResultOutput?: string
	callResultGasUsed?: string
	error?: string
	createFrom?: string
	createResultAddress?: string
}

export type SqdMetadata = {
	name?: string
	aliases?: string[]
	startBlock?: number
	genesisHash?: string
	realtime?: boolean
}

export { getSqdDatasetSlug, getSqdPortalBaseUrl }

export async function fetchSqdHead(
	chainId: number,
): Promise<{ number: number } | null> {
	const base = getSqdPortalBaseUrl(chainId)
	if (!base) return null
	await throttle()
	const res = await fetch(`${base}/head`, { headers: { Accept: 'application/json' } })
	if (!res.ok) throw new Error(`SQD head failed: ${res.status}`)
	const json = (await res.json()) as { number?: number }
	return { number: json.number ?? 0 }
}

export async function fetchSqdFinalizedHead(
	chainId: number,
): Promise<{ number: number } | null> {
	const base = getSqdPortalBaseUrl(chainId)
	if (!base) return null
	await throttle()
	const res = await fetch(`${base}/finalized-head`, {
		headers: { Accept: 'application/json' },
	})
	if (!res.ok) throw new Error(`SQD finalized-head failed: ${res.status}`)
	const json = (await res.json()) as { number?: number }
	return { number: json.number ?? 0 }
}

export async function fetchSqdMetadata(
	chainId: number,
): Promise<SqdMetadata | null> {
	const base = getSqdPortalBaseUrl(chainId)
	if (!base) return null
	await throttle()
	const res = await fetch(`${base}/metadata`, {
		headers: { Accept: 'application/json' },
	})
	if (!res.ok) throw new Error(`SQD metadata failed: ${res.status}`)
	return res.json() as Promise<SqdMetadata>
}

export async function* streamSqdEvm(
	chainId: number,
	query: SqdEvmQuery,
): AsyncGenerator<SqdBlockItem> {
	const base = getSqdPortalBaseUrl(chainId)
	if (!base) return
	const path = query.finalizedOnly ? 'finalized-stream' : 'stream'
	const body = {
		type: 'evm',
		fromBlock: query.fromBlock,
		toBlock: query.toBlock,
		fields: query.fields,
		logs: query.logs,
		transactions: query.transactions,
		traces: query.traces,
		stateDiffs: query.stateDiffs,
		includeAllBlocks: query.includeAllBlocks,
	}
	await throttle()
	const res = await fetch(`${base}/${path}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'Accept-Encoding': 'gzip',
		},
		body: JSON.stringify(body),
	})
	if (!res.ok) throw new Error(`SQD stream failed: ${res.status}`)
	const text = await res.text()
	for (const line of text.split('\n')) {
		const trimmed = line.trim()
		if (!trimmed) continue
		const item = JSON.parse(trimmed) as SqdBlockItem
		if (item.header) yield item
	}
}

function sqdTraceToTrace(raw: SqdTraceItem, index: number): Trace {
	const parseHex = (v: string | undefined): bigint | undefined =>
		v ? BigInt(v) : undefined
	return {
		index,
		type: raw.type,
		from: raw.callFrom ?? raw.createFrom,
		to: raw.callTo ?? raw.createResultAddress,
		value: raw.callValue,
		gasUsed: parseHex(raw.callResultGasUsed),
		input: raw.callInput,
		output: raw.callResultOutput,
		error: raw.error,
	}
}

/** Fetch traces for a transaction from SQD Portal. Only for chains with traces: true. */
export async function fetchTracesForTransactionFromSqd(
	chainId: number,
	blockNumber: number,
	txHash: `0x${string}`,
): Promise<Trace | null> {
	if (!hasSqdTraces(chainId)) return null
	const txHashLc = txHash.toLowerCase()
	const query: SqdEvmQuery = {
		type: 'evm',
		fromBlock: blockNumber,
		toBlock: blockNumber,
		fields: {
			transaction: { hash: true },
			trace: {
				type: true,
				transactionHash: true,
				transactionIndex: true,
				callFrom: true,
				callTo: true,
				callValue: true,
				callInput: true,
				callResultOutput: true,
				callResultGasUsed: true,
				error: true,
				createFrom: true,
				createResultAddress: true,
			},
		},
		transactions: [{}],
		traces: [{}],
	}
	for await (const block of streamSqdEvm(chainId, query)) {
		const traces = block.traces ?? []
		const forTx = traces.filter(
			(t) =>
				(t as SqdTraceItem).transactionHash?.toLowerCase() === txHashLc ||
				(block.transactions &&
					(t as SqdTraceItem).transactionIndex != null &&
					block.transactions[(t as SqdTraceItem).transactionIndex!]?.hash?.toLowerCase() === txHashLc),
		)
		if (forTx.length === 0) {
			const txIdx = block.transactions?.findIndex(
				(t) => t.hash?.toLowerCase() === txHashLc,
			)
			if (txIdx === undefined || txIdx < 0) return null
			const byIndex = traces.filter(
				(t) => (t as SqdTraceItem).transactionIndex === txIdx,
			)
			if (byIndex.length > 0) {
				forTx.push(...byIndex)
			} else if (
				block.transactions?.length === 1 &&
				block.transactions[0]?.hash?.toLowerCase() === txHashLc
			) {
				forTx.push(...traces)
			}
		}
		if (forTx.length === 0) return null
		const mapped = forTx.map((t, i) =>
			sqdTraceToTrace(t as SqdTraceItem, i),
		)
		const root = mapped[0]
		if (!root) return null
		if (mapped.length > 1) root.children = mapped.slice(1)
		return root
	}
	return null
}
