// Part 1: generic Llm provider abstraction

import { env } from '$env/dynamic/public'
import { zenClientAvailability, zenClientGenerate } from '$/api/llm/zen.ts'

export type LlmAvailability = 'available' | 'downloading' | 'unavailable'

export type LlmGenerateInput = {
	systemPrompt: string
	userPrompt: string
	onProgress?: (progress: number) => void,
}

export type LlmGenerateOutput = {
	text: string
	providerId: string,
}

export type LlmGenerateWithToolsOutput = LlmGenerateOutput & {
	toolCalls?: { id: string, name: string, arguments: string }[]
	toolResults?: { toolCallId: string, result: unknown }[],
}

export type RequestUserInteraction = (
	callback: () => Promise<unknown>,
) => Promise<unknown>

import type { EIP1193Provider } from '$/lib/wallet.ts'

export type LlmGenerateWithToolsOptions = {
	toolNames: string[]
	requestUserInteraction?: RequestUserInteraction
	getPaymentProvider?: () => EIP1193Provider | null
}

export type LlmProvider = {
	availability: () => Promise<LlmAvailability>
	generate: (input: LlmGenerateInput) => Promise<LlmGenerateOutput>
	generateWithTools?: (
		input: LlmGenerateInput,
		options: LlmGenerateWithToolsOptions,
	) => Promise<LlmGenerateWithToolsOutput>
	cancel?: () => void,
}

const PROMPT_OPTIONS = {
	expectedInputs: [
		{ type: 'text', languages: ['en'] as const },
	],
	expectedOutputs: [
		{ type: 'text', languages: ['en'] as const },
	],
}

const getPromptApi = () =>
	typeof globalThis === 'undefined'
		? null
		: (globalThis.ai?.languageModel ?? null)

export const createPromptApiLlmProvider = (
	onProgress?: (progress: number) => void,
): LlmProvider => {
	let controller: AbortController | null = null
	let session: LanguageModelSession | null = null
	const reset = () => {
		controller = null
		session?.destroy()
		session = null
	}

	return {
		availability: async () => {
			const languageModel = getPromptApi()
			return languageModel
				? await languageModel.availability(PROMPT_OPTIONS)
				: 'unavailable'
		},
		generate: async (input) => {
			const languageModel = getPromptApi()
			if (!languageModel) throw new Error('Prompt API is unavailable.')
			controller = new AbortController()
			session = await languageModel.create({
				...PROMPT_OPTIONS,
				monitor: (monitor) => {
					monitor.addEventListener('downloadprogress', (event) => {
						if (typeof event.loaded === 'number') input.onProgress?.(event.loaded)
					})
				},
				initialPrompts: [
					{ role: 'system', content: input.systemPrompt },
				],
				signal: controller.signal,
			})
			try {
				const text = await session.prompt([
					{ role: 'user', content: input.userPrompt },
				])
				return { text, providerId: 'prompt-api' }
			} finally {
				reset()
			}
		},
		cancel: () => {
			controller?.abort()
			reset()
		},
	}
}

const getHostedLlmConfig = () =>
	env.PUBLIC_LLM_ENDPOINT
		? {
				endpoint: env.PUBLIC_LLM_ENDPOINT,
				apiKey: env.PUBLIC_LLM_API_KEY,
			}
		: null

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null

export const createHostedLlmProvider = (config: {
	endpoint: string
	apiKey?: string,
}): LlmProvider => ({
	availability: async () => 'available',
	generate: async (input) => {
		const response = await fetch(config.endpoint, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				...(config.apiKey
					? { authorization: `Bearer ${config.apiKey}` }
					: {}),
			},
			body: JSON.stringify({
				systemPrompt: input.systemPrompt,
				userPrompt: input.userPrompt,
			}),
		})
		if (!response.ok) {
			throw new Error(`Hosted Llm failed (${response.status})`)
		}
		const body = await response.json()
		return {
			providerId: 'hosted',
			text: isRecord(body) && typeof body.text === 'string' ? body.text : '',
		}
	},
})

const createZenLlmProvider = (): LlmProvider => ({
	availability: async () => {
		const status = zenClientAvailability()
		return status.available ? 'available' : 'unavailable'
	},
	generate: async (input) => {
		const result = await zenClientGenerate({
			systemPrompt: input.systemPrompt,
			userPrompt: input.userPrompt,
		})
		return {
			providerId: result.providerId,
			text: result.text,
		}
	},
})

export const createLlmProvider = (
	options: {
		onProgress?: (progress: number) => void
		connectionId?: string | null
		modelId?: string | null
		getPaymentProvider?: () => EIP1193Provider | null
	} = {},
): LlmProvider => {
	const promptProvider = createPromptApiLlmProvider(options.onProgress)
	const hostedConfig = getHostedLlmConfig()
	const hostedProvider = hostedConfig
		? createHostedLlmProvider(hostedConfig)
		: null
	const zenProvider = createZenLlmProvider()

	const pickProvider = async (): Promise<LlmProvider> => {
		const promptAvailability = await promptProvider.availability()
		if (promptAvailability !== 'unavailable') return promptProvider
		if (hostedProvider) return hostedProvider
		const zenAvailability = await zenProvider.availability()
		return zenAvailability === 'available' ? zenProvider : promptProvider
	}

	const connectionProvider = async (): Promise<LlmProvider | null> => {
		if (options.connectionId == null || options.connectionId === '') return null
		const { LLM_ZEN_DEFAULT_CONNECTION_ID } = await import(
			'$/constants/opencode-zen.ts'
		)
		const { llmConnectionsCollection } = await import('$/collections/LlmConnections.ts')
		let connection = llmConnectionsCollection.state.get(options.connectionId)
		if (
			!connection &&
			options.connectionId === LLM_ZEN_DEFAULT_CONNECTION_ID &&
			env.PUBLIC_OPENCODE_API_KEY
		) {
			connection = {
				id: ZEN_DEFAULT_CONNECTION_ID,
				provider: 'zen',
				label: 'OpenCode Zen',
				apiKey: String(env.PUBLIC_OPENCODE_API_KEY),
				createdAt: 0,
				updatedAt: 0,
			}
		}
		if (!connection) return null
		const { createLlmProviderFromConnection } = await import(
			'$/api/llm/connection-provider.ts'
		)
		return createLlmProviderFromConnection(connection, options.modelId)
	}

	return {
		availability: async () => {
			const conn = await connectionProvider()
			if (conn) return conn.availability()
			const promptAvailability = await promptProvider.availability()
			if (promptAvailability !== 'unavailable') return promptAvailability
			if (hostedProvider) return hostedProvider.availability()
			return zenProvider.availability()
		},
		generate: async (input) => {
			const conn = await connectionProvider()
			if (conn) return conn.generate(input)
			return (await pickProvider()).generate(input)
		},
		generateWithTools: async (input, options) => {
			const conn = await connectionProvider()
			if (conn?.generateWithTools)
				return conn.generateWithTools(input, options)
			const out = await (conn ?? (await pickProvider())).generate(input)
			return { ...out, toolCalls: [], toolResults: [] }
		},
		cancel: () => {
			promptProvider.cancel?.()
			hostedProvider?.cancel?.()
		},
	}
}

// Part 2: transaction/simulation explanation feature

export type ExplainAvailability = LlmAvailability

export type ExplainContext = {
	kind: 'simulation' | 'execution'
	sessionId: string
	simulationId?: string
	executionId?: string
	chainId?: number
	status: 'success' | 'revert' | 'error'
	summary: string
	gas: {
		used?: string
		estimated?: string,
	}
	errors?: {
		revertReason?: string
		errorSelector?: string,
	}
	traceSummary?: string
	eventSummary?: string
	txHash?: `0x${string}`,
}

export type ExplainInput = {
	context: ExplainContext
	language: 'en'
	maxTokens?: number,
}

export type ExplainOutput = {
	provider: string
	text: string,
}

export type ExplainProvider = {
	availability: () => Promise<ExplainAvailability>
	explain: (input: ExplainInput) => Promise<ExplainOutput>
	cancel?: () => void,
}

export const EXPLAIN_SYSTEM_PROMPT =
	'You explain transaction results concisely and factually. Focus on outcomes, gas usage, and any errors. Avoid speculation.'

export const EXPLAIN_PROMPT_VERSION = '2026-02-03'

export const buildExplainUserPrompt = (context: ExplainContext) =>
	[
		`Kind: ${context.kind}`,
		`Status: ${context.status}`,
		`Summary: ${context.summary}`,
		context.chainId ? `Chain: ${context.chainId}` : null,
		context.txHash ? `Tx hash: ${context.txHash}` : null,
		context.gas.used || context.gas.estimated
			? `Gas: used=${context.gas.used ?? 'unknown'}, estimated=${context.gas.estimated ?? 'unknown'}`
			: null,
		context.errors?.revertReason
			? `Revert reason: ${context.errors.revertReason}`
			: null,
		context.errors?.errorSelector
			? `Error selector: ${context.errors.errorSelector}`
			: null,
		context.traceSummary ? `Trace summary: ${context.traceSummary}` : null,
		context.eventSummary ? `Event summary: ${context.eventSummary}` : null,
		'Explain the result in 3-5 sentences.',
	]
		.filter((line): line is string => Boolean(line))
		.join('\n')

export const createExplainProvider = (
	options: { onProgress?: (progress: number) => void } = {},
): ExplainProvider => {
	const llmProvider = createLlmProvider(options)
	return {
		availability: () => llmProvider.availability(),
		explain: async (input) => {
			const output = await llmProvider.generate({
				systemPrompt: EXPLAIN_SYSTEM_PROMPT,
				userPrompt: buildExplainUserPrompt(input.context),
				onProgress: options?.onProgress,
			})
			return {
				provider: output.providerId,
				text: output.text,
			}
		},
		cancel: () => llmProvider.cancel?.(),
	}
}

// Agent-chat-backed explain: creates an AgentChatTurn for the explanation
import { agentChatTreesCollection } from '$/collections/AgentChatTrees.ts'
import { agentChatTurnsCollection } from '$/collections/AgentChatTurns.ts'
import type { EntityRef } from '$/data/EntityRef.ts'
import { EntityType } from '$/data/$EntityType.ts'

export const submitExplainTurn = (options: {
	context: ExplainContext
	sessionId: string
	onProgress?: (progress: number) => void,
}) => {
	const treeId = `explain-${options.sessionId}`

	if (!agentChatTreesCollection.state.has(treeId)) {
		agentChatTreesCollection.insert({
			id: treeId,
			name: `Explain: ${options.sessionId.slice(0, 8)}`,
			pinned: false,
			systemPrompt: EXPLAIN_SYSTEM_PROMPT,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		})
	}

	const turnId = crypto.randomUUID()
	const entityRefs: EntityRef[] = [
		...(
			options.context.txHash
				? [{
					entityType: EntityType.Transaction,
					entityId: `${options.context.chainId}:${options.context.txHash}`,
					displayLabel: `@${options.context.txHash.slice(0, 10)}…`,
				}]
				: []
		),
		...(
			options.context.sessionId
				? [{
					entityType: EntityType.Session,
					entityId: options.context.sessionId,
					displayLabel: `@session:${options.context.sessionId.slice(0, 8)}`,
				}]
				: []
		),
	]

	agentChatTurnsCollection.insert({
		id: turnId,
		treeId,
		parentId: null,
		userPrompt: buildExplainUserPrompt(options.context),
		entityRefs,
		assistantText: null,
		providerId: null,
		status: 'generating',
		createdAt: Date.now(),
		promptVersion: EXPLAIN_PROMPT_VERSION,
	})

	const provider = createExplainProvider({ onProgress: options.onProgress })

	const promise = provider.explain({
		context: options.context,
		language: 'en',
	}).then((output) => {
		agentChatTurnsCollection.update(turnId, (draft) => {
			draft.assistantText = output.text
			draft.providerId = output.provider
			draft.status = 'complete'
		})
		agentChatTreesCollection.update(treeId, (draft) => {
			draft.updatedAt = Date.now()
		})
	}).catch((error) => {
		agentChatTurnsCollection.update(turnId, (draft) => {
			draft.status = 'error'
			draft.error = error instanceof Error ? error.message : String(error)
		})
	})

	return { turnId, treeId, cancel: provider.cancel, promise }
}
