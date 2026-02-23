/**
 * Per-chain forks. Single `forks` array; all derived mappings and helpers exported from here.
 */

import type { ChainForkSchedule, Fork } from '$/constants/forks/types.ts'

export const forks = [
	...(await import('$/constants/forks/1.ts')).forks.map(({ forkId, ...rest }) => ({
		$id: { chainId: 1, forkId },
		...rest,
		name: forkId,
	})),
	...(await import('$/constants/forks/10.ts')).forks.map(({ forkId, ...rest }) => ({
		$id: { chainId: 10, forkId },
		...rest,
		name: forkId,
	})),
	...(await import('$/constants/forks/8453.ts')).forks.map(({ forkId, ...rest }) => ({
		$id: { chainId: 8453, forkId },
		...rest,
		name: forkId,
	})),
	...(await import('$/constants/forks/17000.ts')).forks.map(({ forkId, ...rest }) => ({
		$id: { chainId: 17000, forkId },
		...rest,
		name: forkId,
	})),
	...(await import('$/constants/forks/84532.ts')).forks.map(({ forkId, ...rest }) => ({
		$id: { chainId: 84532, forkId },
		...rest,
		name: forkId,
	})),
	...(await import('$/constants/forks/11155111.ts')).forks.map(({ forkId, ...rest }) => ({
		$id: { chainId: 11155111, forkId },
		...rest,
		name: forkId,
	})),
	...(await import('$/constants/forks/11155420.ts')).forks.map(({ forkId, ...rest }) => ({
		$id: { chainId: 11155420, forkId },
		...rest,
		name: forkId,
	})),
] as const satisfies readonly Fork[]

export const slotsPerEpoch = 32

export const forkChainIds = new Set(forks.map((f) => f.$id.chainId))

const byChainId = [...forkChainIds].map((chainId) => {
	const chainForks = forks.filter((f) => f.$id.chainId === chainId)
	const mergeBlock =
		chainId === 1
			? chainForks.find((f) => f.$id.forkId === 'Paris')?.activation.block
			: chainId === 11155111
				? chainForks.find((f) => f.$id.forkId === 'MergeNetsplit')?.activation.block
				: undefined
	const bellatrixEpoch =
		chainId === 1
			? chainForks.find((f) => f.$id.forkId === 'Bellatrix')?.activation.epoch
			: undefined
	return { chainId, chainForks, mergeBlock, bellatrixEpoch, hasConsensus: chainId === 1 }
})

export const forkByChainId: Partial<Record<number, ChainForkSchedule>> =
	Object.fromEntries(
		byChainId.map(({ chainId, chainForks }) => [chainId, { chainId, forks: chainForks }]),
	)

export const consensusChainIds = new Set(
	byChainId.filter((s) => s.hasConsensus).map((s) => s.chainId),
)

export const mergeBlockByChainId: Partial<Record<number, number>> =
	Object.fromEntries(
		byChainId
			.filter((s) => s.mergeBlock != null)
			.map((s) => [s.chainId, s.mergeBlock!]),
	)

export const bellatrixEpochByChainId: Partial<Record<number, number>> =
	Object.fromEntries(
		byChainId
			.filter((s) => s.bellatrixEpoch != null)
			.map((s) => [s.chainId, s.bellatrixEpoch!]),
	)

export const beaconEpochExplorerByChainId: Partial<Record<number, string>> = {
	1: 'https://beaconcha.in',
	11155111: 'https://sepolia.beaconcha.in',
	17000: 'https://holesky.beaconcha.in',
}

/** Mainnet forks that have upgrade info (links/eipNumbers), newest first. */
export const mainnetForksWithUpgrades = (
	forkByChainId[1]?.forks ?? []
).filter((f) => f.links != null || (f.eipNumbers?.length ?? 0) > 0).sort(
	(a, b) =>
		(b.activation.block ?? b.activation.timestamp ?? b.activation.epoch ?? 0) -
		(a.activation.block ?? a.activation.timestamp ?? a.activation.epoch ?? 0),
)

export function getEraAtBlock(
	chainId: number,
	blockNumber: number,
): EraAtBlock | null {
	const chain = forkByChainId[chainId]
	if (!chain) return null
	const blockForks = chain.forks.filter(
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

export function getCurrentEpoch(
	chainId: number,
	blockNumber: number,
): number | null {
	const mergeBlock = mergeBlockByChainId[chainId]
	const bellatrixEpoch = bellatrixEpochByChainId[chainId]
	if (
		mergeBlock == null ||
		bellatrixEpoch == null ||
		blockNumber < mergeBlock
	)
		return null
	return (
		bellatrixEpoch +
		Math.floor((blockNumber - mergeBlock) / slotsPerEpoch)
	)
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

export const EIPS_OFFICIAL_BASE = 'https://eips.ethereum.org/EIPS/eip-'

export type EraAtBlock = {
	eraId: string
	label: string
	startBlock?: number
	endBlock?: number
}

export type { Fork } from '$/constants/forks/types.ts'
