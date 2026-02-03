export type ExplainAvailability = 'available' | 'downloading' | 'unavailable'

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
	provider: 'prompt-api' | 'hosted'
	text: string
}

export type ExplainRecord = ExplainOutput & {
	createdAt: string
	promptVersion: string
}

export type ExplainProvider = {
	availability: () => Promise<ExplainAvailability>
	explain: (input: ExplainInput) => Promise<ExplainOutput>
	cancel?: () => void
}

const PROMPT_VERSION = '2026-02-03'
const SYSTEM_PROMPT =
	'You explain transaction results concisely and factually. Focus on outcomes, gas usage, and any errors. Avoid speculation.'
const PROMPT_OPTIONS = {
	expectedInputs: [
		{
			type: 'text',
			languages: ['en'],
		},
	],
	expectedOutputs: [
		{
			type: 'text',
			languages: ['en'],
		},
	],
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
	typeof value === 'object' && value !== null
)
const buildExplainPrompt = (context: ExplainContext) => (
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
)

const getPromptApi = () => (
	typeof globalThis === 'undefined' ? null : globalThis.ai?.languageModel ?? null
)
const getHostedConfig = () => (
	typeof import.meta === 'undefined' || !import.meta.env ?
		null
	: import.meta.env.PUBLIC_EXPLAIN_LLM_ENDPOINT ?
		{
			endpoint: import.meta.env.PUBLIC_EXPLAIN_LLM_ENDPOINT,
			apiKey: import.meta.env.PUBLIC_EXPLAIN_LLM_API_KEY,
		}
	: null
)

const createPromptApiProvider = (
	onProgress?: (progress: number) => void,
): ExplainProvider => {
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
		explain: async (input) => {
			const languageModel = getPromptApi()
			if (!languageModel) throw new Error('Prompt API is unavailable.')
			controller = new AbortController()
			session = await languageModel.create({
				...PROMPT_OPTIONS,
				monitor: (monitor) => {
					monitor.addEventListener('downloadprogress', (event) => {
						if (typeof event.loaded === 'number') onProgress?.(event.loaded)
					})
				},
				initialPrompts: [
					{
						role: 'system',
						content: SYSTEM_PROMPT,
					},
				],
				signal: controller.signal,
			})
			// TODO: Tune max token usage once prompt budgets are finalized.
			try {
				const text = await session.prompt([
					{
						role: 'user',
						content: buildExplainPrompt(input.context),
					},
				])
				return {
					provider: 'prompt-api',
					text,
				}
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

const createHostedProvider = (
	config: {
		endpoint: string
		apiKey?: string
	},
) => {
	const provider: ExplainProvider = {
		availability: async () => 'available',
		explain: async (input) => {
			const response = await fetch(config.endpoint, {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
				},
				body: JSON.stringify(input),
			})
			if (!response.ok) {
				throw new Error(`Hosted explain failed (${response.status})`)
			}
			const body = await response.json()
			return {
				provider: 'hosted',
				text: isRecord(body) && typeof body.text === 'string' ? body.text : '',
			}
		},
	}
	return provider
}

export const createExplainProvider = (
	options: { onProgress?: (progress: number) => void } = {},
): ExplainProvider => {
	const promptProvider = createPromptApiProvider(options.onProgress)
	const hostedConfig = getHostedConfig()
	const hostedProvider = hostedConfig ? createHostedProvider(hostedConfig) : null

	const pickProvider = async () => {
		const availability = await promptProvider.availability()
		return availability === 'unavailable' && hostedProvider ? hostedProvider : promptProvider
	}

	return {
		availability: async () => {
			const availability = await promptProvider.availability()
			return availability === 'unavailable' && hostedProvider
				? hostedProvider.availability()
				: availability
		},
		explain: async (input) => (
			(await pickProvider()).explain(input)
		),
		cancel: () => {
			promptProvider.cancel?.()
			hostedProvider?.cancel?.()
		},
	}
}

export const createExplainRecord = (output: ExplainOutput): ExplainRecord => ({
	...output,
	createdAt: new Date().toISOString(),
	promptVersion: PROMPT_VERSION,
})
