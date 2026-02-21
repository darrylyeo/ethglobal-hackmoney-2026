import type { EntityRef } from '$/data/EntityRef.ts'
import type { WalletConnection$Id } from '$/data/WalletConnection.ts'

export type AgentChatToolCall = {
	id: string
	name: string
	arguments: string
}

export type AgentChatToolResult = {
	toolCallId: string
	result: unknown
}

export type AgentChatTurnStatus =
	| 'pending'
	| 'generating'
	| 'complete'
	| 'error'
	| 'cancelled'

export type AgentChatTurn = {
	id: string
	treeId: string
	parentId: string | null
	userPrompt: string
	entityRefs: EntityRef[]
	assistantText: string | null
	providerId: string | null
	providerConfig?: { connectionId?: string, modelId?: string, }
	status: AgentChatTurnStatus
	error?: string
	createdAt: number
	promptVersion: string
	toolCalls?: AgentChatToolCall[]
	toolResults?: AgentChatToolResult[]
	paymentWalletConnection$id?: WalletConnection$Id | null
}
