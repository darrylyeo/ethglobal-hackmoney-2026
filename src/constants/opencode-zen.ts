/**
 * OpenCode Zen free models and endpoint mapping.
 * @see https://opencode.ai/docs/zen/
 */

export enum ZenEndpointKind {
	Responses = 'responses',
	Messages = 'messages',
	ChatCompletions = 'chat/completions',
}

export type ZenFreeModel = {
	id: string
	label: string
	endpoint: string
	kind: ZenEndpointKind
}

const ZEN_BASE = 'https://opencode.ai/zen/v1'

export const zenFreeModels: readonly ZenFreeModel[] = [
	{
		id: 'gpt-5-nano',
		label: 'GPT 5 Nano',
		endpoint: `${ZEN_BASE}/responses`,
		kind: ZenEndpointKind.Responses,
	},
	{
		id: 'minimax-m2.1-free',
		label: 'MiniMax M2.1 Free',
		endpoint: `${ZEN_BASE}/messages`,
		kind: ZenEndpointKind.Messages,
	},
	{
		id: 'glm-4.7-free',
		label: 'GLM 4.7 Free',
		endpoint: `${ZEN_BASE}/chat/completions`,
		kind: ZenEndpointKind.ChatCompletions,
	},
	{
		id: 'kimi-k2.5-free',
		label: 'Kimi K2.5 Free',
		endpoint: `${ZEN_BASE}/chat/completions`,
		kind: ZenEndpointKind.ChatCompletions,
	},
	{
		id: 'big-pickle',
		label: 'Big Pickle',
		endpoint: `${ZEN_BASE}/chat/completions`,
		kind: ZenEndpointKind.ChatCompletions,
	},
]

export const zenFreeModelById: Partial<Record<string, ZenFreeModel>> =
	Object.fromEntries(zenFreeModels.map((m) => [m.id, m]))

export const defaultZenFreeModelId = zenFreeModels[0].id

/** Synthetic connection id when using Zen via PUBLIC_OPENCODE_API_KEY without a saved connection. */
export const ZEN_DEFAULT_CONNECTION_ID = 'opencode-zen'

export const zenFreeModelOptions: readonly { id: string, label: string }[] =
	zenFreeModels.map((m) => ({ id: m.id, label: m.label }))

export const getZenFreeModel = (modelId: string): ZenFreeModel =>
	zenFreeModelById[modelId] ?? zenFreeModels[0]
