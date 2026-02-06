import type { EntityRef } from '$/data/EntityRef'

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
	providerConfig?: { connectionId?: string, modelId?: string }
	status: AgentChatTurnStatus
	error?: string
	createdAt: number
	promptVersion: string
}
