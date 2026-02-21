/**
 * Builds an LlmProvider from a configured LlmConnection (OpenAI, Anthropic, Zen, Hosted).
 * Uses Vercel AI SDK for OpenAI and Anthropic.
 */

import { env } from '$env/dynamic/public'
import {
	zenClientGenerateWithKey,
	zenAvailability,
} from '$/api/llm/zen.ts'
import {
	defaultZenFreeModelId,
	zenFreeModelOptions,
} from '$/constants/opencode-zen.ts'
import type { LlmConnection } from '$/data/LlmConnection.ts'
import { LlmConnectionProvider } from '$/data/LlmConnection.ts'
import type {
	LlmProvider,
	LlmGenerateInput,
	LlmAvailability,
	LlmGenerateWithToolsOutput,
} from '$/lib/llmProvider.ts'
import { createHostedLlmProvider } from '$/lib/llmProvider.ts'
import { buildAISdkToolsFromWebmcp, TOOLS_FOR_CHAT } from '$/lib/webmcp/tools-for-llm.ts'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, stepCountIs } from 'ai'
import type {
	LlmGenerateWithToolsOptions,
} from '$/lib/llmProvider.ts'

const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini'
const ANTHROPIC_DEFAULT_MODEL = 'claude-3-5-sonnet-20241022'
const GOOGLE_DEFAULT_MODEL = 'gemini-1.5-flash'

const MAX_TOOL_STEPS = 10

function mapGenerateTextResultToOutput(
	result: { text: string, toolCalls?: unknown[], toolResults?: unknown[] },
	providerId: string,
): LlmGenerateWithToolsOutput {
	const toolCalls = (result.toolCalls ?? []).map((tc: { toolCallId?: string, toolName?: string, input?: unknown }) => ({
		id: tc.toolCallId ?? '',
		name: tc.toolName ?? '',
		arguments: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input ?? {}),
	}))
	const toolResults = (result.toolResults ?? []).map((tr: { toolCallId?: string, output?: unknown }) => ({
		toolCallId: tr.toolCallId ?? '',
		result: tr.output,
	}))
	return {
		text: result.text,
		providerId,
		toolCalls,
		toolResults,
	}
}

const effectiveModelId = (
	connection: LlmConnection,
	overrideModelId?: string | null,
) =>
	overrideModelId?.trim() ||
	connection.defaultModelId?.trim() ||
	(connection.provider === LlmConnectionProvider.Zen
		? defaultZenFreeModelId
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
		const openai = createOpenAI({ apiKey: apiKey ?? '', })
		const theModel = modelId || OPENAI_DEFAULT_MODEL
		return {
			availability: async (): Promise<LlmAvailability> =>
				apiKey ? 'available' : 'unavailable',
			generate: async (input: LlmGenerateInput) => {
				if (!apiKey) throw new Error('OpenAI API key not set')
				const { text } = await generateText({
					model: openai(theModel),
					system: input.systemPrompt,
					prompt: input.userPrompt,
				})
				return { text, providerId: theModel }
			},
			generateWithTools: async (input: LlmGenerateInput, options: LlmGenerateWithToolsOptions) => {
				if (!apiKey) throw new Error('OpenAI API key not set')
				const toolNames = options.toolNames.length > 0 ? options.toolNames : [...TOOLS_FOR_CHAT]
				const tools = buildAISdkToolsFromWebmcp(
					toolNames,
					options.requestUserInteraction,
				)
				const result = await generateText({
					model: openai(theModel),
					system: input.systemPrompt,
					prompt: input.userPrompt,
					tools,
					stopWhen: stepCountIs(MAX_TOOL_STEPS),
				})
				return mapGenerateTextResultToOutput(
					{
						text: result.text,
						toolCalls: [...(result.toolCalls ?? [])],
						toolResults: [...(result.toolResults ?? [])],
					},
					theModel,
				)
			},
		}
	}

	if (connection.provider === LlmConnectionProvider.Anthropic) {
		const apiKey = connection.apiKey?.trim()
		const anthropic = createAnthropic({ apiKey: apiKey ?? '', })
		const theModel = modelId || ANTHROPIC_DEFAULT_MODEL
		return {
			availability: async (): Promise<LlmAvailability> =>
				apiKey ? 'available' : 'unavailable',
			generate: async (input: LlmGenerateInput) => {
				if (!apiKey) throw new Error('Anthropic API key not set')
				const { text } = await generateText({
					model: anthropic(theModel),
					system: input.systemPrompt,
					prompt: input.userPrompt,
				})
				return { text, providerId: theModel }
			},
			generateWithTools: async (input: LlmGenerateInput, options: LlmGenerateWithToolsOptions) => {
				if (!apiKey) throw new Error('Anthropic API key not set')
				const toolNames = options.toolNames.length > 0 ? options.toolNames : [...TOOLS_FOR_CHAT]
				const tools = buildAISdkToolsFromWebmcp(
					toolNames,
					options.requestUserInteraction,
				)
				const result = await generateText({
					model: anthropic(theModel),
					system: input.systemPrompt,
					prompt: input.userPrompt,
					tools,
					stopWhen: stepCountIs(MAX_TOOL_STEPS),
				})
				return mapGenerateTextResultToOutput(
					{
						text: result.text,
						toolCalls: [...(result.toolCalls ?? [])],
						toolResults: [...(result.toolResults ?? [])],
					},
					theModel,
				)
			},
		}
	}

	if (connection.provider === LlmConnectionProvider.Google) {
		const apiKey = connection.apiKey?.trim()
		const google = createGoogleGenerativeAI({ apiKey: apiKey ?? '', })
		const theModel = modelId || GOOGLE_DEFAULT_MODEL
		return {
			availability: async (): Promise<LlmAvailability> =>
				apiKey ? 'available' : 'unavailable',
			generate: async (input: LlmGenerateInput) => {
				if (!apiKey) throw new Error('Google API key not set')
				const { text } = await generateText({
					model: google(theModel),
					system: input.systemPrompt,
					prompt: input.userPrompt,
				})
				return { text, providerId: theModel }
			},
			generateWithTools: async (input: LlmGenerateInput, options: LlmGenerateWithToolsOptions) => {
				if (!apiKey) throw new Error('Google API key not set')
				const toolNames = options.toolNames.length > 0 ? options.toolNames : [...TOOLS_FOR_CHAT]
				const tools = buildAISdkToolsFromWebmcp(
					toolNames,
					options.requestUserInteraction,
				)
				const result = await generateText({
					model: google(theModel),
					system: input.systemPrompt,
					prompt: input.userPrompt,
					tools,
					stopWhen: stepCountIs(MAX_TOOL_STEPS),
				})
				return mapGenerateTextResultToOutput(
					{
						text: result.text,
						toolCalls: [...(result.toolCalls ?? [])],
						toolResults: [...(result.toolResults ?? [])],
					},
					theModel,
				)
			},
		}
	}

	if (connection.provider === LlmConnectionProvider.Zen) {
		const apiKey =
			connection.apiKey?.trim() ||
			(env.PUBLIC_OPENCODE_API_KEY != null ? String(env.PUBLIC_OPENCODE_API_KEY) : undefined)
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
		? defaultZenFreeModelId
		: provider === LlmConnectionProvider.OpenAI
			? OPENAI_DEFAULT_MODEL
			: provider === LlmConnectionProvider.Anthropic
				? ANTHROPIC_DEFAULT_MODEL
				: provider === LlmConnectionProvider.Google
					? GOOGLE_DEFAULT_MODEL
					: null

export const getModelsForConnection = (connection: LlmConnection): { id: string, label: string, }[] => {
	if (connection.provider === LlmConnectionProvider.Zen)
		return [...zenFreeModelOptions]
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
