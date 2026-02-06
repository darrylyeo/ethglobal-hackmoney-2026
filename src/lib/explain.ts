// Part 1: generic Llm provider abstraction

export type LlmAvailability = 'available' | 'downloading' | 'unavailable'

export type LlmGenerateInput = {
	systemPrompt: string
	userPrompt: string
	onProgress?: (progress: number) => void
}

export type LlmGenerateOutput = {
	text: string
	providerId: string
}

export type LlmProvider = {
	availability: () => Promise<LlmAvailability>
	generate: (input: LlmGenerateInput) => Promise<LlmGenerateOutput>
	cancel?: () => void
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
	typeof import.meta === 'undefined' || !import.meta.env
		? null
		: import.meta.env.PUBLIC_LLM_ENDPOINT
			? {
					endpoint: import.meta.env.PUBLIC_LLM_ENDPOINT,
					apiKey: import.meta.env.PUBLIC_LLM_API_KEY,
				}
			: null

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null

export const createHostedLlmProvider = (config: {
	endpoint: string
	apiKey?: string
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

const ZEN_LLM_PATH = '/api/llm/zen'

const createZenLlmProvider = (): LlmProvider => ({
	availability: async () => {
		try {
			const res = await fetch(ZEN_LLM_PATH, { method: 'GET' })
			if (!res.ok) return 'unavailable'
			const data = await res.json()
			return isRecord(data) && data.available === true ? 'available' : 'unavailable'
		} catch {
			return 'unavailable'
		}
	},
	generate: async (input) => {
		const response = await fetch(ZEN_LLM_PATH, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				systemPrompt: input.systemPrompt,
				userPrompt: input.userPrompt,
			}),
		})
		if (!response.ok) {
			throw new Error(`OpenCode Zen failed (${response.status})`)
		}
		const body = await response.json()
		return {
			providerId: isRecord(body) && typeof body.providerId === 'string' ? body.providerId : 'zen',
			text: isRecord(body) && typeof body.text === 'string' ? body.text : '',
		}
	},
})

export const createLlmProvider = (
	options: { onProgress?: (progress: number) => void } = {},
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

	return {
		availability: async () => {
			const promptAvailability = await promptProvider.availability()
			if (promptAvailability !== 'unavailable') return promptAvailability
			if (hostedProvider) return hostedProvider.availability()
			return zenProvider.availability()
		},
		generate: async (input) => (await pickProvider()).generate(input),
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
		estimated?: string
	}
	errors?: {
		revertReason?: string
		errorSelector?: string
	}
	traceSummary?: string
	eventSummary?: string
	txHash?: `0x${string}`
}

export type ExplainInput = {
	context: ExplainContext
	language: 'en'
	maxTokens?: number
}

export type ExplainOutput = {
	provider: string
	text: string
}

export type ExplainProvider = {
	availability: () => Promise<ExplainAvailability>
	explain: (input: ExplainInput) => Promise<ExplainOutput>
	cancel?: () => void
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

// Dialogue-backed explain: creates a DialogueTurn for the explanation
import type { EntityRef } from '$/data/EntityRef'
import { EntityType } from '$/data/$EntityType'
import { DataSource } from '$/constants/data-sources'
import { dialogueTreesCollection } from '$/collections/dialogue-trees'
import { dialogueTurnsCollection } from '$/collections/dialogue-turns'

export const submitExplainTurn = (options: {
	context: ExplainContext
	sessionId: string
	onProgress?: (progress: number) => void
}) => {
	const treeId = `explain-${options.sessionId}`

	if (!dialogueTreesCollection.state.has(treeId)) {
		dialogueTreesCollection.insert({
			id: treeId,
			name: `Explain: ${options.sessionId.slice(0, 8)}`,
			pinned: false,
			systemPrompt: EXPLAIN_SYSTEM_PROMPT,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			$source: DataSource.Llm,
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
					entityType: EntityType.TransactionSession,
					entityId: options.context.sessionId,
					displayLabel: `@session:${options.context.sessionId.slice(0, 8)}`,
				}]
				: []
		),
	]

	dialogueTurnsCollection.insert({
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
		$source: DataSource.Llm,
	})

	const provider = createExplainProvider({ onProgress: options.onProgress })

	const promise = provider.explain({
		context: options.context,
		language: 'en',
	}).then((output) => {
		dialogueTurnsCollection.update(turnId, (draft) => {
			draft.assistantText = output.text
			draft.providerId = output.provider
			draft.status = 'complete'
		})
		dialogueTreesCollection.update(treeId, (draft) => {
			draft.updatedAt = Date.now()
		})
	}).catch((error) => {
		dialogueTurnsCollection.update(turnId, (draft) => {
			draft.status = 'error'
			draft.error = error instanceof Error ? error.message : String(error)
		})
	})

	return { turnId, treeId, cancel: provider.cancel, promise }
}
