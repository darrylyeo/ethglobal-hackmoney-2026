import type { ConnectedWallet } from '$/collections/wallet-connections.ts'

export const SESSION_CONTEXT_KEY = 'session-context'

export type SessionContext = {
	connectedWallets: ConnectedWallet[]
	selectedActor: `0x${string}` | null
	selectedChainId: number | null
	isTestnet: boolean
}
