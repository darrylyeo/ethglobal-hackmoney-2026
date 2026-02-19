export type FarcasterChannel$Id = { id: string }

export type FarcasterChannel = {
	$id: FarcasterChannel$Id
	name: string
	url?: string
	description?: string
	imageUrl?: string
	followerCount?: number
	memberCount?: number
}
