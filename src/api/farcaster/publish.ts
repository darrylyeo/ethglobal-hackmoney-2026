/**
 * Publish cast API. Stub implementation; Hub/Neynar integration when available.
 */

export type PublishCastParams = {
	fid: number
	text: string
	parentFid?: number
	parentHash?: `0x${string}`
	parentUrl?: string
	embeds?: Array<{ url?: string }>
}

export type PublishCastResult = {
	hash: `0x${string}`
}

/** Stub: returns mock hash. Replace with Hub/Neynar publish when integrating. */
export const publishCast = async (
	_params: PublishCastParams,
): Promise<PublishCastResult> => {
	await Promise.resolve()
	const mockHash = `0x${Array.from({ length: 64 }, () =>
		Math.floor(Math.random() * 16)
			.toString(16),
	).join('')}` as `0x${string}`
	return { hash: mockHash }
}
