/**
 * Fetch USDC Transfer events via Voltaire eth_getLogs for a time period.
 * Used by the transfers page to build the graph from JSON-RPC (primary source).
 */

import {
	type VoltaireProvider,
	createHttpProvider,
	getBlockByNumber,
	getBlockNumberByTimestamp,
	getLogs,
	TRANSFER_TOPIC,
} from '$/api/voltaire.ts'
import { normalizeAddress } from '$/lib/address.ts'
import { type ChainContract, TIME_PERIODS, periodToRange } from '$/api/transfers-indexer.ts'
import { ercTokens } from '$/constants/coins.ts'
import { TRANSFER_EVENTS_MAX_TOTAL } from '$/constants/query-limits.ts'
import { rpcUrls } from '$/constants/rpc-endpoints.ts'

export type NormalizedTransferEvent = {
	transactionHash: string
	fromAddress: string
	toAddress: string
	amount: string
	timestamp: number
	chainId: number
	blockNumber: number
	logIndex: number
}

function parseTransferLog(
	log: {
		topics: string[]
		data: string
		blockNumber: string
		transactionHash: string
		logIndex: string
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
	return {
		transactionHash: log.transactionHash,
		fromAddress: fromChecksummed,
		toAddress: toChecksummed,
		amount: amount.toString(),
		timestamp: blockTimestampMs,
		chainId,
		blockNumber: parseInt(log.blockNumber, 16),
		logIndex: parseInt(log.logIndex, 16),
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

const USDC_CHAINS: ChainContract[] = ercTokens.map((t) => ({
	chainId: t.chainId,
	contractAddress: t.address,
}))

/** Resolve fromBlock/toBlock for a chain for the given time range (ms). */
async function resolveBlockRange(
	chainId: number,
	startMs: number,
	endMs: number,
): Promise<{ fromBlock: bigint; toBlock: bigint } | null> {
	const rpcUrl = rpcUrls[chainId]
	if (!rpcUrl) return null
	const provider = createHttpProvider(rpcUrl)
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

/**
 * Fetch normalized USDC Transfer events for the given period from all supported
 * chains via eth_getLogs (Voltaire). Chains without RPC are skipped.
 */
export async function fetchTransferEventsForPeriod(
	period: string,
): Promise<NormalizedTransferEvent[]> {
	const periodDef =
		TIME_PERIODS.find((p) => p.value === period) ?? TIME_PERIODS[3]
	const { start, end } = periodToRange(periodDef.ms)
	const chainsWithRpc = USDC_CHAINS.filter((c) => rpcUrls[c.chainId])
	const ranges = await Promise.all(
		chainsWithRpc.map(async (c) => ({
			chainId: c.chainId,
			contractAddress: c.contractAddress as `0x${string}`,
			range: await resolveBlockRange(c.chainId, start, end),
		})),
	)
	const results = await Promise.allSettled(
		ranges
			.filter(
				(r): r is typeof r & {
					range: { fromBlock: bigint; toBlock: bigint }
				} =>
					r.range != null,
			)
			.map((r) => {
				const rpcUrl = rpcUrls[r.chainId]!
				return fetchTransferLogsForChain(
					r.chainId,
					r.contractAddress,
					r.range.fromBlock,
					r.range.toBlock,
					rpcUrl,
				)
			}),
	)
	return results
		.filter(
			(r): r is PromiseFulfilledResult<NormalizedTransferEvent[]> =>
				r.status === 'fulfilled',
		)
		.flatMap((r) => r.value)
		.slice(0, TRANSFER_EVENTS_MAX_TOTAL)
}
