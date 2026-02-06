/**
 * Builds an LlmProvider from a configured LlmConnection (OpenAI, Anthropic, Zen, Hosted).
 * Uses Vercel AI SDK for OpenAI and Anthropic.
 */

import {
	zenClientGenerateWithKey,
	zenAvailability,
} from '$/api/llm/zen.ts'
import { OPENCODE_ZEN_DEFAULT_FREE_MODEL_ID } from '$/constants/opencode-zen.ts'
import type { LlmConnection } from '$/data/LlmConnection.ts'
import { LlmConnectionProvider } from '$/data/LlmConnection.ts'
import type { LlmProvider, LlmGenerateInput, LlmAvailability } from '$/lib/llmProvider.ts'
import { createHostedLlmProvider } from '$/lib/llmProvider.ts'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini'
const ANTHROPIC_DEFAULT_MODEL = 'claude-3-5-sonnet-20241022'
const GOOGLE_DEFAULT_MODEL = 'gemini-1.5-flash'

const effectiveModelId = (
	connection: LlmConnection,
	overrideModelId?: string | null,
) =>
	overrideModelId?.trim() ||
	connection.defaultModelId?.trim() ||
	(connection.provider === LlmConnectionProvider.Zen
		? OPENCODE_ZEN_DEFAULT_FREE_MODEL_ID
		: connection.provider === LlmConnectionProvider.OpenAI
			? OPENAI_DEFAULT_MODEL
			: connection.provider === LlmConnectionProvider.Anthropic
				? ANTHROPIC_DEFAULT_MODEL
				: connection.provider === LlmConnectionProvider.Google
					? GOOGLE_DEFAULT_MODEL
					: '')

export const createLlmProviderFromConnection = (
	connection: LlmConnection,
	modelIdOverride?: string | null,
): LlmProvider => {
	const modelId = effectiveModelId(connection, modelIdOverride)

	if (connection.provider === LlmConnectionProvider.OpenAI) {
		const apiKey = connection.apiKey?.trim()
		return {
			availability: async (): Promise<LlmAvailability> =>
				apiKey ? 'available' : 'unavailable',
			generate: async (input: LlmGenerateInput) => {
				if (!apiKey) throw new Error('OpenAI API key not set')
				const openai = createOpenAI({ apiKey, })
				const { text } = await generateText({
					model: openai(modelId || OPENAI_DEFAULT_MODEL),
					system: input.systemPrompt,
					prompt: input.userPrompt,
				})
				return { text, providerId: modelId || OPENAI_DEFAULT_MODEL }
			},
		}
	}

	if (connection.provider === LlmConnectionProvider.Anthropic) {
		const apiKey = connection.apiKey?.trim()
		return {
			availability: async (): Promise<LlmAvailability> =>
				apiKey ? 'available' : 'unavailable',
			generate: async (input: LlmGenerateInput) => {
				if (!apiKey) throw new Error('Anthropic API key not set')
				const anthropic = createAnthropic({ apiKey, })
				const { text } = await generateText({
					model: anthropic(modelId || ANTHROPIC_DEFAULT_MODEL),
					system: input.systemPrompt,
					prompt: input.userPrompt,
				})
				return { text, providerId: modelId || ANTHROPIC_DEFAULT_MODEL }
			},
		}
	}

	if (connection.provider === LlmConnectionProvider.Google) {
		const apiKey = connection.apiKey?.trim()
		return {
			availability: async (): Promise<LlmAvailability> =>
				apiKey ? 'available' : 'unavailable',
			generate: async (input: LlmGenerateInput) => {
				if (!apiKey) throw new Error('Google API key not set')
				const google = createGoogleGenerativeAI({ apiKey, })
				const { text } = await generateText({
					model: google(modelId || GOOGLE_DEFAULT_MODEL),
					system: input.systemPrompt,
					prompt: input.userPrompt,
				})
				return { text, providerId: modelId || GOOGLE_DEFAULT_MODEL }
			},
		}
	}

	if (connection.provider === LlmConnectionProvider.Zen) {
		const apiKey =
			connection.apiKey?.trim() ||
			(typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_OPENCODE_API_KEY != null
				? String(import.meta.env.PUBLIC_OPENCODE_API_KEY)
				: undefined)
		return {
			availability: async (): Promise<LlmAvailability> =>
				zenAvailability(apiKey).available ? 'available' : 'unavailable',
			generate: async (input: LlmGenerateInput) => {
				if (!apiKey) throw new Error('OpenCode Zen API key not set')
				const result = await zenClientGenerateWithKey(apiKey, {
					systemPrompt: input.systemPrompt,
					userPrompt: input.userPrompt,
					modelId: modelId || undefined,
				})
				return { text: result.text, providerId: result.providerId }
			},
		}
	}

	if (connection.provider === LlmConnectionProvider.Hosted) {
		const endpoint = connection.endpoint?.trim()
		if (!endpoint) throw new Error('Hosted connection missing endpoint')
		return createHostedLlmProvider({
			endpoint,
			apiKey: connection.apiKey?.trim(),
		})
	}

	return {
		availability: async () => 'unavailable',
		generate: async () => {
			throw new Error(`Unsupported LLM provider: ${connection.provider}`)
		},
	}
}

export const getDefaultModelIdForProvider = (provider: LlmConnection['provider']) =>
	provider === LlmConnectionProvider.Zen
		? OPENCODE_ZEN_DEFAULT_FREE_MODEL_ID
		: provider === LlmConnectionProvider.OpenAI
			? OPENAI_DEFAULT_MODEL
			: provider === LlmConnectionProvider.Anthropic
				? ANTHROPIC_DEFAULT_MODEL
				: provider === LlmConnectionProvider.Google
					? GOOGLE_DEFAULT_MODEL
					: null

export const getModelsForConnection = (connection: LlmConnection): { id: string, label: string, }[] => {
	if (connection.provider === LlmConnectionProvider.Zen)
		return [
			...[
				{ id: 'gpt-5-nano', label: 'GPT 5 Nano' },
				{ id: 'minimax-m2.1-free', label: 'MiniMax M2.1 Free' },
				{ id: 'glm-4.7-free', label: 'GLM 4.7 Free' },
				{ id: 'kimi-k2.5-free', label: 'Kimi K2.5 Free' },
				{ id: 'big-pickle', label: 'Big Pickle', },
			],
		]
	if (connection.provider === LlmConnectionProvider.OpenAI)
		return [
			{ id: 'gpt-4o-mini', label: 'GPT-4o mini' },
			{ id: 'gpt-4o', label: 'GPT-4o' },
			{ id: 'gpt-4-turbo', label: 'GPT-4 Turbo', },
		]
	if (connection.provider === LlmConnectionProvider.Anthropic)
		return [
			{ id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
			{ id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
			{ id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', },
		]
	if (connection.provider === LlmConnectionProvider.Google)
		return [
			{ id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
			{ id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', },
		]
	return []
}
