export const LlmConnectionProvider = {
	OpenAI: 'openai',
	Anthropic: 'anthropic',
	Google: 'google',
	Zen: 'zen',
	Hosted: 'hosted',
} as const

export type LlmConnectionProviderType =
	(typeof LlmConnectionProvider)[keyof typeof LlmConnectionProvider]

export type LlmConnection = {
	id: string
	provider: LlmConnectionProviderType
	label: string
	apiKey?: string
	defaultModelId?: string
	endpoint?: string
	createdAt: number
	updatedAt: number
}
