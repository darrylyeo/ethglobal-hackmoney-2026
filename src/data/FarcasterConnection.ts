export enum FarcasterConnectionTransport {
	Siwf = 'siwf',
	Watch = 'watch',
}

export type FarcasterConnection$Id = { fid: number }

export type FarcasterConnectionBase = {
	$id: FarcasterConnection$Id
	transport: FarcasterConnectionTransport
	username?: string
	displayName?: string
	pfpUrl?: string
	bio?: string
	selected: boolean
	connectedAt: number
}

export type FarcasterConnectionSiwf = FarcasterConnectionBase & {
	transport: FarcasterConnectionTransport.Siwf
	signedAt: number
}

export type FarcasterConnectionWatch = FarcasterConnectionBase & {
	transport: FarcasterConnectionTransport.Watch
}

export type FarcasterConnectionRow =
	| FarcasterConnectionSiwf
	| FarcasterConnectionWatch
