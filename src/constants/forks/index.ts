/**
 * Per-chain fork data. Single `forks` array and derived registry only.
 * Helpers (getConsensusSchedule, getExecutionEraAtBlock, etc.) live in lib/forks.ts.
 */

import type { Fork, ForkEntry } from '$/constants/forks/types.ts'

export const forks = (
	(
		[
			[1, (await import('$/constants/forks/1.ts')).forks],
			[10, (await import('$/constants/forks/10.ts')).forks],
			[8453, (await import('$/constants/forks/8453.ts')).forks],
			[17000, (await import('$/constants/forks/17000.ts')).forks],
			[84532, (await import('$/constants/forks/84532.ts')).forks],
			[11155111, (await import('$/constants/forks/11155111.ts')).forks],
			[11155420, (await import('$/constants/forks/11155420.ts')).forks],
		] as [number, readonly ForkEntry<string>[]][]
	)
		.flatMap(([chainId, chainForks]) => (
			chainForks.map(({ forkId, ...rest }) => ({
				$id: { chainId, forkId },
				...rest,
				name: forkId,
			}))
		))
)

export const slotsPerEpoch = 32

export const forksByChainId = Object.groupBy(forks, (f) => f.$id.chainId)

export const beaconEpochExplorerByChainId: Partial<Record<number, string>> = {
	1: 'https://beaconcha.in',
	11155111: 'https://sepolia.beaconcha.in',
	17000: 'https://holesky.beaconcha.in',
}

export const EIPS_OFFICIAL_BASE = 'https://eips.ethereum.org/EIPS/eip-'

export type { Fork } from '$/constants/forks/types.ts'
