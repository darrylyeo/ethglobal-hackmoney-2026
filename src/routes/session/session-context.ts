import type { ConnectedWallet } from '$/collections/WalletConnections.ts'
import type { Session } from '$/data/Session.ts'

export const SESSION_CONTEXT_KEY = 'session-context'

export type SessionContext = {
	connectedWallets: ConnectedWallet[]
	selectedActor: `0x${string}` | null
	selectedChainId: number | null
	isTestnet: boolean
	session: Session | null
	sessionId: string | null
}
