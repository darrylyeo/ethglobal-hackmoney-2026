/**
 * Fork helpers: consensus schedule, era at block, current epoch, slugs, etc.
 * Source of truth: constants/forks (forks array, forksByChainId) + tanstack db.
 */

import type { ConsensusSchedule, EraAtBlock, Fork } from '$/constants/forks/types.ts'
import { ForkScheduleKind } from '$/constants/forks/types.ts'
import {
	forks,
	forksByChainId,
	slotsPerEpoch,
} from '$/constants/forks/index.ts'
import { getOpcodesForExecutionFork } from '$/constants/opcodes/fork-opcodes.ts'
import type { EvmOpcode } from '$/constants/opcodes/types.ts'

export type { ConsensusSchedule, EraAtBlock }

/** Consensus schedule from fork data: execution fork with consensusSpecs link → merge block; matching consensus fork (by link path) → merge epoch. */
export function getConsensusSchedule(chainId: number): ConsensusSchedule | null {
	const chainForks = forksByChainId[chainId]
	if (!chainForks) return null
	const mergeExecution = chainForks.find(
		(f) =>
			f.kind !== ForkScheduleKind.Consensus &&
			f.activation.block != null &&
			f.links?.consensusSpecs != null,
	)
	if (!mergeExecution?.activation.block) return null
	const specPath = mergeExecution.links!.consensusSpecs!.replace(/\/$/, '').split('/').pop() ?? ''
	const mergeConsensus = chainForks.find(
		(f) =>
			f.consensusProtocol != null &&
			f.activation.epoch != null &&
			specPath.length > 0 &&
			f.$id.forkId.toLowerCase() === specPath.toLowerCase(),
	)
	if (mergeConsensus?.activation.epoch == null) return null
	return {
		mergeBlock: mergeExecution.activation.block,
		mergeEpoch: mergeConsensus.activation.epoch,
	}
}

export function getCurrentEpoch(
	chainId: number,
	blockNumber: number,
): number | null {
	const schedule = getConsensusSchedule(chainId)
	if (!schedule || blockNumber < schedule.mergeBlock) return null
	return (
		schedule.mergeEpoch +
		Math.floor((blockNumber - schedule.mergeBlock) / slotsPerEpoch)
	)
}

export function getEraAtBlock(
	chainId: number,
	blockNumber: number,
): EraAtBlock | null {
	const chainForks = forksByChainId[chainId]
	if (!chainForks) return null
	const blockForks = chainForks.filter(
		(f): f is Fork & { activation: { block: number } } =>
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

const executionActivationValue = (f: Fork) =>
	f.activation.block ?? f.activation.timestamp ?? f.activation.epoch ?? 0

const executionForkActiveAt = (
	f: Fork,
	blockNumber: number,
	blockTimestampMs: number | undefined,
): boolean => {
	if (f.activation.block != null) return f.activation.block <= blockNumber
	if (f.activation.timestamp != null)
		return (
			blockTimestampMs != null &&
			f.activation.timestamp <= Math.floor(blockTimestampMs / 1000)
		)
	if (f.activation.epoch != null) return f.activation.epoch <= blockNumber
	return false
}

/** Execution fork at block (excludes consensus-only forks). Supports block- and timestamp-based activation; pass blockTimestamp (ms) when chain uses timestamp-based forks. */
export function getExecutionEraAtBlock(
	chainId: number,
	blockNumber: number,
	blockTimestampMs?: number,
): EraAtBlock | null {
	const chainForks = forksByChainId[chainId]
	if (!chainForks) return null
	const executionForks = chainForks.filter(
		(f) => f.kind !== ForkScheduleKind.Consensus,
	)
	if (executionForks.length === 0) return null
	const hasTimestampFork = executionForks.some(
		(f) => f.activation.timestamp !== undefined,
	)
	if (hasTimestampFork && blockTimestampMs == null) return null
	const sorted = [...executionForks].sort(
		(a, b) =>
			executionActivationValue(a) - executionActivationValue(b),
	)
	let last: (typeof sorted)[0] | null = null
	for (const f of sorted) {
		if (executionForkActiveAt(f, blockNumber, blockTimestampMs)) last = f
		else break
	}
	if (!last) {
		const first = sorted[0]
		const endBlock =
			first.activation.block != null ? first.activation.block - 1 : undefined
		return {
			eraId: 'Genesis',
			label: 'Genesis',
			startBlock: 0,
			endBlock,
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

export function getOpcodesForEra(
	chainId: number,
	blockNumber: number,
): EvmOpcode[] | null {
	const era = getExecutionEraAtBlock(chainId, blockNumber)
	if (!era) return null
	return getOpcodesForExecutionFork(era.label)
}

/** Activation timestamps in Fork are Unix seconds. Use for display. */
export const dateFromUnixSeconds = (
	t: number | undefined | null,
): Date | null => (t != null ? new Date(t * 1000) : null)

/** URL-safe slug from fork/era name (e.g. "Gray Glacier" → "gray-glacier"). */
export function getForkSlugByEraName(eraName: string): string | null {
	const n = eraName.toLowerCase().replace(/\s+/g, '')
	const f = forks.find(
		(x) => x.name.toLowerCase().replace(/\s+/g, '') === n,
	)
	return f != null ? f.name.toLowerCase().replace(/\s+/g, '-') : null
}

/** Mainnet forks that have upgrade info (links/eipNumbers), newest first. */
export const mainnetForksWithUpgrades = (
	(forksByChainId[1] ?? []) as Fork[]
).filter((f) => f.links != null || (f.eipNumbers?.length ?? 0) > 0).sort(
	(a, b) =>
		(b.activation.block ?? b.activation.timestamp ?? b.activation.epoch ?? 0) -
		(a.activation.block ?? a.activation.timestamp ?? a.activation.epoch ?? 0),
)
