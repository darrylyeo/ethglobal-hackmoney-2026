/**
 * Per-chain EVM precompiles. Data from shemnon/precompiles (deno task precompiles:sync).
 * Chains without a schedule in synced data get the standard set. Structure mirrors src/constants/forks.
 */

import type { Precompile, PrecompileEntry } from '$/constants/precompiles/types.ts'
import { standardPrecompiles } from '$/constants/precompiles/standard.ts'
import {
	syncedChainIds,
	syncedPrecompilesByChainId,
} from '$/data/precompiles/load.ts'

function normalizeAddress(addr: `0x${string}`): string {
	return addr.slice(2).toLowerCase().padStart(40, '0')
}

/** Precompiles for a chain: from synced shemnon data or standard set. Deduped and sorted by address. */
export function getPrecompilesForChain(chainId: number): PrecompileEntry[] {
	const list =
		syncedPrecompilesByChainId.get(chainId) ?? [...standardPrecompiles]
	const seen = new Set<string>()
	const out: PrecompileEntry[] = []
	for (const p of list) {
		const key = normalizeAddress(p.address)
		if (seen.has(key)) continue
		seen.add(key)
		out.push(p)
	}
	return out.sort((a, b) => (BigInt(a.address) < BigInt(b.address) ? -1 : 1))
}

/** Chain IDs that have precompile data (synced or fallback to standard). */
export const precompileChainIds = syncedChainIds

/** All precompiles as flat array with $id (all chains that have a schedule in synced data). */
export const precompiles: readonly Precompile[] = [...syncedChainIds].flatMap(
	(chainId) =>
		(syncedPrecompilesByChainId.get(chainId) ?? []).map((p) => ({
			$id: { chainId, address: p.address },
			name: p.name,
		})),
) as readonly Precompile[]

/** Address → name map for a chain's precompiles. */
export function getPrecompileAddressToName(chainId: number): Map<string, string> {
	return new Map(
		getPrecompilesForChain(chainId).map((p) => [
			normalizeAddress(p.address),
			p.name,
		]),
	)
}

export type { Precompile, PrecompileEntry } from '$/constants/precompiles/types.ts'
export type { Precompile$Id } from '$/constants/precompiles/types.ts'
