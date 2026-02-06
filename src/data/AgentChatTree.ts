export type AgentChatTree = {
	id: string
	name: string | null
	pinned: boolean
	systemPrompt: string
	defaultConnectionId?: string | null
	defaultModelId?: string | null
	createdAt: number
	updatedAt: number
}
