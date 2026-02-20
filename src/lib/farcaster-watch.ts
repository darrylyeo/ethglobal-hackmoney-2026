/**
 * Parse and classify Farcaster watch input: FID, @username, or ENS.
 * resolveFidFromWatchInput resolves any valid input to fid + optional profile.
 */

import {
	PatternType,
	patternByPatternType,
} from '$/constants/patterns.ts'
import { ChainId } from '$/constants/networks.ts'
import { rpcUrls } from '$/constants/rpc-endpoints.ts'
import { createHttpProvider } from '$/api/voltaire.ts'
import { resolveEnsForward } from '$/api/identity-resolve.ts'
import { ENS_REGISTRY_MAINNET } from '$/constants/identity-resolver.ts'
import { getFidByAddress } from '$/api/farcaster/index.ts'
import { fetchUserByUsername } from '$/api/farcaster/neynar.ts'
import { ensureFarcasterUser } from '$/collections/FarcasterUsers.ts'

/** Farcaster fname: 1-16 chars, alphanumeric + hyphen + underscore. */
const FARCASTER_USERNAME_PATTERN = /^@?[a-z0-9][a-z0-9_-]{0,15}$/i

export type ParsedFarcasterWatchInput =
	| { kind: 'fid'; fid: number }
	| { kind: 'username'; username: string }
	| { kind: 'ens'; ens: string }
	| null

export const parseFarcasterWatchInput = (
	raw: string,
): ParsedFarcasterWatchInput => {
	const trimmed = raw.trim()
	if (!trimmed) return null

	const fid = Number.parseInt(trimmed, 10)
	if (/^\d+$/.test(trimmed) && !Number.isNaN(fid) && fid >= 1)
		return { kind: 'fid', fid }

	if (patternByPatternType[PatternType.EnsName].pattern.test(trimmed))
		return { kind: 'ens', ens: trimmed.toLowerCase() }

	const username = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed
	if (FARCASTER_USERNAME_PATTERN.test(username))
		return { kind: 'username', username }

	return null
}

export type ResolvedFarcasterWatch = {
	fid: number
	profile?: { username?: string; displayName?: string; pfpUrl?: string }
}

/** Resolve watch input (FID, @username, ENS) to fid + optional profile. Throws if invalid or not found. */
export const resolveFidFromWatchInput = async (
	raw: string,
): Promise<ResolvedFarcasterWatch> => {
	const parsed = parseFarcasterWatchInput(raw)
	if (!parsed) throw new Error('Invalid input: enter FID, @username, or ENS')

	if (parsed.kind === 'fid') {
		const user = await ensureFarcasterUser(parsed.fid)
		return {
			fid: parsed.fid,
			profile: {
				username: user.username,
				displayName: user.displayName,
				pfpUrl: user.pfpUrl,
			},
		}
	}

	if (parsed.kind === 'username') {
		const user = await fetchUserByUsername(parsed.username)
		if (!user) throw new Error(`User @${parsed.username} not found`)
		return {
			fid: user.fid,
			profile: {
				username: user.username,
				displayName: user.displayName,
				pfpUrl: user.pfpUrl,
			},
		}
	}

	const url = rpcUrls[ChainId.Ethereum]
	if (!url) throw new Error('ENS resolution requires Ethereum RPC')
	const provider = createHttpProvider(url)
	const { address } = await resolveEnsForward(
		provider,
		ENS_REGISTRY_MAINNET,
		parsed.ens,
	)
	if (!address) throw new Error(`ENS ${parsed.ens} has no address`)
	const fid = await getFidByAddress(address)
	if (!fid) throw new Error(`Address for ${parsed.ens} has no Farcaster account`)
	const user = await ensureFarcasterUser(fid)
	return {
		fid,
		profile: {
			username: user.username,
			displayName: user.displayName,
			pfpUrl: user.pfpUrl,
		},
	}
}
