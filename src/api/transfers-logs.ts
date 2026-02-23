/**
 * Fetch USDC Transfer events via Voltaire eth_getLogs or SQD Portal.
 * Used by the transfers page to build the graph.
 */

import {
	type VoltaireProvider,
	createHttpProvider,
	getBlockByNumber,
	getBlockNumberByTimestamp,
	getLogs,
	TRANSFER_TOPIC,
} from '$/api/voltaire.ts'
import { SQD_DATASETS_BY_CHAIN_ID } from '$/constants/sqd-datasets.ts'
import { ChainId } from '$/constants/networks.ts'
import { streamSqdEvm } from '$/api/sqd.ts'
import { DataSource } from '$/constants/data-sources.ts'
import { normalizeAddress } from '$/lib/address.ts'
import { type ChainContract, TIME_PERIODS, periodToRange } from '$/api/transfers-indexer.ts'
import { erc20InstancesByCoinId } from '$/constants/coin-instances.ts'
import { CoinId } from '$/constants/coins.ts'
import { TRANSFER_EVENTS_MAX_TOTAL } from '$/constants/query-limits.ts'
import { createProviderForChain, getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'

const ERC20_TRANSFER_TOPIC =
	'0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' as const

export type NormalizedTransferEvent = {
	transactionHash: string
	fromAddress: string
	toAddress: string
	amount: string
	/** Unix time in milliseconds (normalized at API boundary). */
	timestamp: number
	chainId: number
	blockNumber: number
	logIndex: number
}

function parseTransferLog(
	log: {
		topics?: string[]
		data?: string
		blockNumber?: string | number
		transactionHash?: string
		logIndex?: string | number
	},
	chainId: number,
	blockTimestampMs: number,
): NormalizedTransferEvent | null {
	if (!log.topics?.[1] || !log.topics?.[2] || !log.data) return null
	const amount = BigInt(log.data)
	if (amount === 0n) return null
	const fromRaw = `0x${log.topics[1].slice(-40)}` as `0x${string}`
	const toRaw = `0x${log.topics[2].slice(-40)}` as `0x${string}`
	const fromChecksummed = normalizeAddress(fromRaw)
	const toChecksummed = normalizeAddress(toRaw)
	if (!fromChecksummed || !toChecksummed) return null
	const blockNum =
		typeof log.blockNumber === 'number'
			? log.blockNumber
			: parseInt(String(log.blockNumber ?? 0), 16)
	const logIdx =
		typeof log.logIndex === 'number'
			? log.logIndex
			: parseInt(String(log.logIndex ?? 0), 16)
	return {
		transactionHash: log.transactionHash ?? '',
		fromAddress: fromChecksummed,
		toAddress: toChecksummed,
		amount: amount.toString(),
		timestamp: blockTimestampMs,
		chainId,
		blockNumber: blockNum,
		logIndex: logIdx,
	}
}

const PRUNED_EARLIEST_RE = /earliest available is (\d+)/i

function parsePrunedEarliestBlock(message: string): bigint | null {
	const m = message.match(PRUNED_EARLIEST_RE)
	return m ? BigInt(m[1]) : null
}

const BLOCK_FETCH_CONCURRENCY = 3
const BLOCK_FETCH_DELAY_MS = 180

async function getBlockTimestampsBatched(
	provider: VoltaireProvider,
	blockNumbers: number[],
): Promise<Map<number, number>> {
	const out = new Map<number, number>()
	const queue = [...blockNumbers]
	async function runBatch() {
		const chunk = queue.splice(0, BLOCK_FETCH_CONCURRENCY)
		if (chunk.length === 0) return
		await Promise.all(
			chunk.map(async (num) => {
				try {
					const { timestamp } = await getBlockByNumber(
						provider,
						BigInt(num),
					)
					out.set(num, timestamp)
				} catch {
					out.set(num, 0)
				}
			}),
		)
		if (queue.length > 0) {
			await new Promise((r) => setTimeout(r, BLOCK_FETCH_DELAY_MS))
			await runBatch()
		}
	}
	await runBatch()
	return out
}

async function fetchTransferLogsForChain(
	chainId: number,
	contractAddress: `0x${string}`,
	fromBlock: bigint,
	toBlock: bigint,
	rpcUrl: string,
): Promise<NormalizedTransferEvent[]> {
	const provider = createHttpProvider(rpcUrl)
	let logs: Awaited<ReturnType<typeof getLogs>>
	try {
		logs = await getLogs(provider, {
			address: contractAddress,
			topics: [TRANSFER_TOPIC],
			fromBlock: `0x${fromBlock.toString(16)}`,
			toBlock: `0x${toBlock.toString(16)}`,
		})
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e)
		const earliest = parsePrunedEarliestBlock(msg)
		if (earliest == null) throw e
		const clampedFrom = fromBlock < earliest ? earliest : fromBlock
		if (clampedFrom > toBlock) return []
		logs = await getLogs(provider, {
			address: contractAddress,
			topics: [TRANSFER_TOPIC],
			fromBlock: `0x${clampedFrom.toString(16)}`,
			toBlock: `0x${toBlock.toString(16)}`,
		})
	}
	if (logs.length === 0) return []
	const blockNumbers = [
		...new Set(logs.map((l) => parseInt(l.blockNumber, 16))),
	]
	const blockTimestamps = await getBlockTimestampsBatched(
		provider,
		blockNumbers,
	)
	return logs
		.map((l) => {
			const blockNum = parseInt(l.blockNumber, 16)
			const ts = blockTimestamps.get(blockNum) ?? 0
			return parseTransferLog(l, chainId, ts)
		})
		.filter((t): t is NormalizedTransferEvent => t !== null)
}

async function fetchTransferLogsViaSqd(
	chainId: number,
	contractAddress: `0x${string}`,
	fromBlock: bigint,
	toBlock: bigint,
): Promise<NormalizedTransferEvent[]> {
	const slug = SQD_DATASETS_BY_CHAIN_ID[chainId as ChainId]?.slug ?? null
	if (!slug) throw new Error(`SQD unsupported for chain ${chainId}`)
	const addr = contractAddress.toLowerCase()
	const events: NormalizedTransferEvent[] = []
	for await (const block of streamSqdEvm(chainId, {
		type: 'evm',
		fromBlock: Number(fromBlock),
		toBlock: Number(toBlock),
		fields: {
			block: { number: true, timestamp: true },
			log: {
				address: true,
				topics: true,
				data: true,
				transactionHash: true,
				logIndex: true,
				blockNumber: true,
			},
		},
		logs: [{ address: [addr], topic0: [ERC20_TRANSFER_TOPIC] }],
		finalizedOnly: true,
	})) {
		const tsMs = (block.header.timestamp ?? 0) * 1000
		for (const log of block.logs ?? []) {
			if (log.address?.toLowerCase() !== addr) continue
			const parsed = parseTransferLog(
				{
					...log,
					blockNumber: log.blockNumber ?? block.header.number,
				},
				chainId,
				tsMs,
			)
			if (parsed) events.push(parsed)
		}
	}
	return events
}

const USDC_CHAINS: ChainContract[] = (
	erc20InstancesByCoinId.get(CoinId.USDC) ?? []
).map((t) => ({ chainId: t.$id.$network.chainId, contractAddress: t.$id.address }))

/** Resolve fromBlock/toBlock for a chain for the given time range (ms). */
async function resolveBlockRange(
	chainId: number,
	startMs: number,
	endMs: number,
): Promise<{ fromBlock: bigint; toBlock: bigint } | null> {
	const rpcUrl = getEffectiveRpcUrl(chainId)
	if (!rpcUrl) return null
	const provider = createProviderForChain(chainId)
	let fromBlock: bigint
	try {
		fromBlock = await getBlockNumberByTimestamp(provider, startMs)
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e)
		const earliest = parsePrunedEarliestBlock(msg)
		if (earliest == null) throw e
		fromBlock = earliest
	}
	let toBlock: bigint
	try {
		toBlock = await getBlockNumberByTimestamp(provider, endMs)
	} catch (e) {
		const earliest = parsePrunedEarliestBlock(
			e instanceof Error ? e.message : String(e),
		)
		if (earliest == null) throw e
		;({ number: toBlock } = await getBlockByNumber(provider, 'latest'))
	}
	if (fromBlock > toBlock) return { fromBlock: toBlock, toBlock: fromBlock }
	return { fromBlock, toBlock }
}

export type NormalizedTransferEventWithSource = NormalizedTransferEvent & {
	$source: DataSource
}

/**
 * Fetch normalized USDC Transfer events for the given period. Uses SQD Portal
 * when the chain is supported, else Voltaire eth_getLogs. Chains without RPC
 * are skipped. Falls back to Voltaire when SQD fails.
 */
export async function fetchTransferEventsForPeriod(
	period: string,
): Promise<NormalizedTransferEventWithSource[]> {
	const periodDef =
		TIME_PERIODS.find((p) => p.value === period) ?? TIME_PERIODS[3]
	const { start, end } = periodToRange(periodDef.ms)
	const chainsWithRpc = USDC_CHAINS.filter((c) => getEffectiveRpcUrl(c.chainId))
	const ranges = await Promise.all(
		chainsWithRpc.map(async (c) => ({
			chainId: c.chainId,
			contractAddress: c.contractAddress as `0x${string}`,
			range: await resolveBlockRange(c.chainId, start, end),
		})),
	)
	const withRange = ranges.filter(
		(r): r is typeof r & { range: { fromBlock: bigint; toBlock: bigint } } =>
			r.range != null,
	)
	const results = await Promise.all(
		withRange.map(
			async (r): Promise<NormalizedTransferEventWithSource[]> => {
				const useSqd = !!SQD_DATASETS_BY_CHAIN_ID[r.chainId as ChainId]?.slug
				if (useSqd) {
					try {
						const events = await fetchTransferLogsViaSqd(
							r.chainId,
							r.contractAddress,
							r.range.fromBlock,
							r.range.toBlock,
						)
						return events.map((e) => ({ ...e, $source: DataSource.Sqd }))
					} catch {
						// fall through to Voltaire
					}
				}
				const rpcUrl = getEffectiveRpcUrl(r.chainId)!
				const events = await fetchTransferLogsForChain(
					r.chainId,
					r.contractAddress,
					r.range.fromBlock,
					r.range.toBlock,
					rpcUrl,
				)
				return events.map((e) => ({ ...e, $source: DataSource.Voltaire }))
			},
		),
	)
	return results
		.flat()
		.slice(0, TRANSFER_EVENTS_MAX_TOTAL) as NormalizedTransferEventWithSource[]
}
