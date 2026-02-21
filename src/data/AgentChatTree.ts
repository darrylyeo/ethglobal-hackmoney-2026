import type { WalletConnection$Id } from '$/data/WalletConnection.ts'

export type AgentChatTree = {
	id: string
	name: string | null
	pinned: boolean
	systemPrompt: string
	defaultConnectionId?: string | null
	defaultModelId?: string | null
	paymentWalletConnection$id?: WalletConnection$Id | null
	createdAt: number
	updatedAt: number
}
