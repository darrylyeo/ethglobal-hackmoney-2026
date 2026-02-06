/**
 * OpenCode Zen free models and endpoint mapping.
 * @see https://opencode.ai/docs/zen/
 */

const ZEN_BASE = 'https://opencode.ai/zen/v1'

export type ZenEndpointKind = 'responses' | 'messages' | 'chat/completions'

export type OpenCodeZenFreeModel = {
	id: string
	label: string
	endpoint: string
	kind: ZenEndpointKind
}

export const OPENCODE_ZEN_FREE_MODELS: OpenCodeZenFreeModel[] = [
	{ id: 'gpt-5-nano', label: 'GPT 5 Nano', endpoint: `${ZEN_BASE}/responses`, kind: 'responses' },
	{ id: 'minimax-m2.1-free', label: 'MiniMax M2.1 Free', endpoint: `${ZEN_BASE}/messages`, kind: 'messages' },
	{ id: 'glm-4.7-free', label: 'GLM 4.7 Free', endpoint: `${ZEN_BASE}/chat/completions`, kind: 'chat/completions' },
	{ id: 'kimi-k2.5-free', label: 'Kimi K2.5 Free', endpoint: `${ZEN_BASE}/chat/completions`, kind: 'chat/completions' },
	{ id: 'big-pickle', label: 'Big Pickle', endpoint: `${ZEN_BASE}/chat/completions`, kind: 'chat/completions' },
]

export const OPENCODE_ZEN_DEFAULT_FREE_MODEL_ID = OPENCODE_ZEN_FREE_MODELS[0].id

export const getZenFreeModel = (modelId: string) =>
	OPENCODE_ZEN_FREE_MODELS.find((m) => m.id === modelId) ?? OPENCODE_ZEN_FREE_MODELS[0]
