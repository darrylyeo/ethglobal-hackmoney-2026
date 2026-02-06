import type { EntityRef } from '$/data/EntityRef'

export type DialogueTurnStatus =
	| 'pending'
	| 'generating'
	| 'complete'
	| 'error'
	| 'cancelled'

export type DialogueTurn = {
	id: string
	treeId: string
	parentId: string | null
	userPrompt: string
	entityRefs: EntityRef[]
	assistantText: string | null
	providerId: string | null
	providerConfig?: { model?: string }
	status: DialogueTurnStatus
	error?: string
	createdAt: number
	promptVersion: string
}
