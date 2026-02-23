import type { FarcasterUser$Id } from '$/data/FarcasterUser.ts'

export type CastHash = `0x${string}`

export type FarcasterCast$Id = {
	fid: number
	hash: CastHash
}

export type FarcasterCast = {
	$id: FarcasterCast$Id
	text: string
	parentFid?: number
	parentHash?: CastHash
	parentUrl?: string
	/** Unix time in milliseconds (normalized at collection boundary). */
	timestamp: number
	mentions?: number[]
	embeds?: Array<{ url?: string; castId?: FarcasterCast$Id }>
	likeCount?: number
	recastCount?: number
}
