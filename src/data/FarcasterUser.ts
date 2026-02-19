export type FarcasterUser$Id = { fid: number }

export type FarcasterUser = {
	$id: FarcasterUser$Id
	username?: string
	displayName?: string
	pfpUrl?: string
	bio?: string
	verifiedAddress?: `0x${string}`
}
