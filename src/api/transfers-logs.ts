/**
 * Fetch USDC Transfer events via Voltaire eth_getLogs for a time period.
 * Used by the transfers page to build the graph from JSON-RPC (primary source).
 */

import { ercTokens } from '$/constants/coins'
import { rpcUrls } from '$/constants/rpc-endpoints'
import {
	createHttpProvider,
	getBlockByNumber,
	getBlockNumberByTimestamp,
	getLogs,
	TRANSFER_TOPIC,
	type VoltaireProvider,
} from '$/api/voltaire'
import { TIME_PERIODS, periodToRange } from '$/api/transfers-indexer'
import { TRANSFER_EVENTS_MAX_TOTAL } from '$/constants/query-limits'

export type NormalizedTransferEvent = {
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
	const from = `0x${log.topics[1].slice(-40)}` as `0x${string}`
	const to = `0x${log.topics[2].slice(-40)}` as `0x${string}`
	const amount = BigInt(log.data)
	if (amount === 0n) return null
	return {
		fromAddress: from.toLowerCase(),
		toAddress: to.toLowerCase(),
		amount: amount.toString(),
		timestamp: blockTimestampMs,
		chainId,
		blockNumber: parseInt(log.blockNumber, 16),
		logIndex: parseInt(log.logIndex, 16),
	}
}

async function fetchTransferLogsForChain(
	chainId: number,
	contractAddress: `0x${string}`,
	fromBlock: bigint,
	toBlock: bigint,
	rpcUrl: string,
): Promise<NormalizedTransferEvent[]> {
	const provider = createHttpProvider(rpcUrl)
	const logs = await getLogs(provider, {
		address: contractAddress,
		topics: [TRANSFER_TOPIC],
		fromBlock: `0x${fromBlock.toString(16)}`,
		toBlock: `0x${toBlock.toString(16)}`,
	})
	if (logs.length === 0) return []
	const blockNumbers = [
		...new Set(logs.map((l) => parseInt(l.blockNumber, 16))),
	]
	const blockTimestamps = new Map<number, number>()
	await Promise.all(
		blockNumbers.map(async (num) => {
			const { timestamp } = await getBlockByNumber(provider, BigInt(num))
			blockTimestamps.set(num, timestamp)
		}),
	)
	return logs
		.map((l) => {
			const blockNum = parseInt(l.blockNumber, 16)
			const ts = blockTimestamps.get(blockNum) ?? 0
			return parseTransferLog(l, chainId, ts)
		})
		.filter((t): t is NormalizedTransferEvent => t !== null)
}

export type ChainContract = { chainId: number; contractAddress: string }

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
	const fromBlock = await getBlockNumberByTimestamp(provider, startMs)
	const toBlock = await getBlockNumberByTimestamp(provider, endMs)
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
				(
					r,
				): r is typeof r & { range: { fromBlock: bigint; toBlock: bigint } } =>
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
