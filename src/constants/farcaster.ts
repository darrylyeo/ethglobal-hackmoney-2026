/** Farcaster Client API (api.farcaster.xyz) – channels, discover. No API key for read. */
export const FARCASTER_CLIENT_API_URL = 'https://api.farcaster.xyz'

/** Farcaster Auth Relay for Sign in with Farcaster (SIWF). Default public relay by Merkle. */
export const FARCASTER_CONNECT_URL = 'https://relay.farcaster.xyz'

/** Optional Neynar Snapchain Hub. Requires PUBLIC_NEYNAR_API_KEY. */
export const FARCASTER_NEYNAR_HUB_URL = 'https://snapchain-api.neynar.com'

/** Neynar REST API for cast lookup by hash. Requires PUBLIC_NEYNAR_API_KEY. */
export const FARCASTER_NEYNAR_API_URL = 'https://api.neynar.com'

export enum FarcasterHubNode {
	StandardCrypto = 'StandardCrypto',
}

export const FARCASTER_HUB_NODES = [
	{
		id: FarcasterHubNode.StandardCrypto,
		url: 'https://hub.farcaster.standardcrypto.vc:2281',
	},
] as const satisfies readonly { id: FarcasterHubNode; url: string }[]

export const farcasterHubNodeUrlById = Object.fromEntries(
	FARCASTER_HUB_NODES.map((e) => [e.id, e.url]),
) as Record<FarcasterHubNode, string>

export const castUrl = (fid: number, hash: `0x${string}`) =>
	`/farcaster/cast/${fid}/${hash}`

export const castHashUrl = (hash: `0x${string}`) =>
	`/farcaster/cast/${hash}`
