import type { WalletConnection$Id } from '$/data/WalletConnection.ts'

export type AgentChatTree$Id = { id: string }

export type AgentChatTree = {
	$id: AgentChatTree$Id
	name: string | null
	pinned: boolean
	systemPrompt: string
	defaultConnectionId?: string | null
	defaultModelId?: string | null
	paymentWalletConnection$id?: WalletConnection$Id | null
	createdAt: number
	updatedAt: number
}
