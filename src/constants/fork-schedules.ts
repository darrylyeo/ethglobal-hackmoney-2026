/**
 * Fork schedule mappings derived from schedules.json. Chains with execution and/or
 * consensus fork data. Ref: Spec 113, Spec 115.
 */

import type { ChainForkSchedule, EraAtBlock, ForkActivation } from '$/data/fork-schedules/types.ts'
import schedulesData from '$/data/fork-schedules/schedules.json'

const schedules = schedulesData as { chains: Record<string, ChainForkSchedule> }

export const SLOTS_PER_EPOCH = 32

const chainEntries = Object.entries(schedules.chains).map(([id, c]) => [
	Number(id),
	c,
] as const)

export const FORK_SCHEDULE_BY_CHAIN_ID: Partial<Record<number, ChainForkSchedule>> =
	Object.fromEntries(chainEntries)

export const FORK_SCHEDULE_CHAIN_IDS = new Set<number>(
	chainEntries.map(([id]) => id),
)

const consensusChainIds = chainEntries
	.filter(([, c]) => c.forks.some((f) => f.kind === 'consensus'))
	.map(([id]) => id)
export const CONSENSUS_SCHEDULE_CHAIN_IDS = new Set<number>(consensusChainIds)

/** Mainnet merge block (Paris); Geth config uses TTD only so not in sync output. */
const MAINNET_MERGE_BLOCK = 15_537_394

const mergeBlockEntries = chainEntries
	.map(([id, c]) => {
		const parisOrMerge = c.forks.find(
			(f) =>
				(f.name === 'Paris' || f.name === 'Merge' || f.name === 'MergeNetsplit')
				&& f.activation.block != null,
		)
		const block =
			parisOrMerge?.activation.block ??
			(id === 1 && c.forks.some((f) => f.name === 'Bellatrix' && f.kind === 'consensus')
				? MAINNET_MERGE_BLOCK
				: undefined)
		return block != null ? ([id, block] as const) : null
	})
	.filter((e): e is [number, number] => e != null)
export const MERGE_BLOCK_BY_CHAIN_ID: Partial<Record<number, number>> =
	Object.fromEntries(mergeBlockEntries)

const bellatrixEpochEntries = chainEntries
	.map(([id, c]) => {
		const bellatrix = c.forks.find(
			(f) => f.name === 'Bellatrix' && f.activation.epoch != null,
		)
		return bellatrix ? ([id, bellatrix.activation.epoch] as const) : null
	})
	.filter((e): e is [number, number] => e != null)
export const BELLATRIX_EPOCH_BY_CHAIN_ID: Partial<Record<number, number>> =
	Object.fromEntries(bellatrixEpochEntries)

/** Base URL for beacon chain epoch explorer (beaconcha.in); epoch page = base/epoch/{n}. */
export const BEACON_EPOCH_EXPLORER_BY_CHAIN_ID: Partial<Record<number, string>> = {
	1: 'https://beaconcha.in',
	11155111: 'https://sepolia.beaconcha.in',
	17000: 'https://holesky.beaconcha.in',
}

export function getEraAtBlock(
	chainId: number,
	blockNumber: number,
): EraAtBlock | null {
	const chain = FORK_SCHEDULE_BY_CHAIN_ID[chainId]
	if (!chain) return null
	const blockForks = chain.forks.filter(
		(f): f is ForkActivation & { activation: { block: number } } =>
			f.activation.block !== undefined,
	)
	if (blockForks.length === 0) return null
	const sorted = [...blockForks].sort(
		(a, b) => a.activation.block - b.activation.block,
	)
	let last: (typeof sorted)[0] | null = null
	for (const f of sorted) {
		if (f.activation.block <= blockNumber) last = f
		else break
	}
	if (!last) {
		const first = sorted[0]
		return {
			eraId: 'Genesis',
			label: 'Genesis',
			startBlock: 0,
			endBlock: first.activation.block - 1,
		}
	}
	const idx = sorted.indexOf(last)
	const next = sorted[idx + 1]
	return {
		eraId: last.name,
		label: last.name,
		startBlock: last.activation.block,
		endBlock:
			next?.activation.block != null ? next.activation.block - 1 : undefined,
	}
}

export function getCurrentEpoch(
	chainId: number,
	blockNumber: number,
): number | null {
	const mergeBlock = MERGE_BLOCK_BY_CHAIN_ID[chainId]
	const bellatrixEpoch = BELLATRIX_EPOCH_BY_CHAIN_ID[chainId]
	if (
		mergeBlock == null ||
		bellatrixEpoch == null ||
		blockNumber < mergeBlock
	)
		return null
	return (
		bellatrixEpoch +
		Math.floor((blockNumber - mergeBlock) / SLOTS_PER_EPOCH)
	)
}

export type { EraAtBlock }
