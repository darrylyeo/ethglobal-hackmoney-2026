/**
 * OpenCode Zen LLM. Server: pass apiKey. Client: set PUBLIC_OPENCODE_API_KEY
 * and use zenClientAvailability / zenClientGenerate (via proxy when CORS blocked).
 * @see https://opencode.ai/docs/zen/
 */

import { PUBLIC_OPENCODE_API_KEY } from '$env/static/public'
import {
	defaultZenFreeModelId,
	getZenFreeModel,
	ZenEndpointKind,
} from '$/constants/opencode-zen.ts'
import { proxyFetch } from '$/lib/proxyFetch.ts'

export type ZenAvailability = { available: boolean }

export type ZenGenerateInput = {
	apiKey: string
	systemPrompt: string
	userPrompt: string
	modelId?: string
}

export type ZenGenerateOutput = { text: string, providerId: string }

export type ZenClientGenerateInput = {
	systemPrompt: string
	userPrompt: string
	modelId?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null

const extractTextFromChatCompletions = (body: unknown): string => {
	if (!isRecord(body) || !Array.isArray(body.choices) || body.choices.length === 0)
		return ''
	const first = body.choices[0]
	return isRecord(first) && isRecord(first.message) && typeof first.message.content === 'string'
		? first.message.content
		: ''
}

const extractTextFromResponses = (body: unknown): string => {
	if (!isRecord(body)) return ''
	const output = body.output
	if (Array.isArray(output) && output.length > 0) {
		const part = output[0]
		if (isRecord(part) && typeof part.content === 'string') return part.content
	}
	if (Array.isArray(body.choices) && body.choices.length > 0) {
		const c = body.choices[0]
		if (isRecord(c) && isRecord(c.message) && typeof c.message.content === 'string')
			return c.message.content
	}
	return ''
}

const extractTextFromMessages = (body: unknown): string => {
	if (!isRecord(body) || !Array.isArray(body.content) || body.content.length === 0) return ''
	const first = body.content[0]
	return isRecord(first) && typeof first.text === 'string' ? first.text : ''
}

export const zenAvailability = (apiKey: string | undefined): ZenAvailability =>
	apiKey && typeof apiKey === 'string' ? { available: true } : { available: false }

export const zenGenerate = async (
	input: ZenGenerateInput,
): Promise<ZenGenerateOutput> => {
	const modelId =
		typeof input.modelId === 'string' && input.modelId.length > 0
			? input.modelId
			: defaultZenFreeModelId
	const model = getZenFreeModel(modelId)
	const headers: Record<string, string> = {
		'content-type': 'application/json',
		authorization: `Bearer ${input.apiKey}`,
	}

	if (model.kind === ZenEndpointKind.ChatCompletions) {
		const res = await fetch(model.endpoint, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				model: model.id,
				messages: [
					{ role: 'system', content: input.systemPrompt },
					{ role: 'user', content: input.userPrompt },
				],
			}),
		})
		if (!res.ok) throw new Error(`Zen chat/completions failed (${res.status})`)
		const body = await res.json()
		return {
			text: extractTextFromChatCompletions(body) || '',
			providerId: model.id,
		}
	}

	if (model.kind === 'messages') {
		const res = await fetch(model.endpoint, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				model: model.id,
				max_tokens: 4096,
				system: input.systemPrompt,
				messages: [{ role: 'user', content: input.userPrompt }],
			}),
		})
		if (!res.ok) throw new Error(`Zen messages failed (${res.status})`)
		const body = await res.json()
		return {
			text: extractTextFromMessages(body) || '',
			providerId: model.id,
		}
	}

	const res = await fetch(model.endpoint, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			model: model.id,
			messages: [
				{ role: 'system', content: input.systemPrompt },
				{ role: 'user', content: input.userPrompt },
			],
		}),
	})
	if (!res.ok) throw new Error(`Zen responses failed (${res.status})`)
	const body = await res.json()
	return {
		text: extractTextFromResponses(body) || '',
		providerId: model.id,
	}
}

const getZenClientKey = (): string | undefined =>
	PUBLIC_OPENCODE_API_KEY != null ? String(PUBLIC_OPENCODE_API_KEY) : undefined

export const zenClientAvailability = (): ZenAvailability =>
	getZenClientKey() ? { available: true } : { available: false }

export const zenClientGenerateWithKey = async (
	apiKey: string,
	input: ZenClientGenerateInput,
): Promise<ZenGenerateOutput> => {
	const modelId =
		typeof input.modelId === 'string' && input.modelId.length > 0
			? input.modelId
			: defaultZenFreeModelId
	const model = getZenFreeModel(modelId)
	const headers: Record<string, string> = {
		'content-type': 'application/json',
		authorization: `Bearer ${apiKey}`,
	}

	const doFetch = (body: unknown) =>
		proxyFetch(model.endpoint, {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		})

	if (model.kind === 'chat/completions') {
		const res = await doFetch({
			model: model.id,
			messages: [
				{ role: 'system', content: input.systemPrompt },
				{ role: 'user', content: input.userPrompt },
			],
		})
		if (!res.ok) throw new Error(`Zen chat/completions failed (${res.status})`)
		const body = await res.json()
		return {
			text: extractTextFromChatCompletions(body) || '',
			providerId: model.id,
		}
	}

	if (model.kind === ZenEndpointKind.Messages) {
		const res = await doFetch({
			model: model.id,
			max_tokens: 4096,
			system: input.systemPrompt,
			messages: [{ role: 'user', content: input.userPrompt }],
		})
		if (!res.ok) throw new Error(`Zen messages failed (${res.status})`)
		const body = await res.json()
		return {
			text: extractTextFromMessages(body) || '',
			providerId: model.id,
		}
	}

	const res = await doFetch({
		model: model.id,
		messages: [
			{ role: 'system', content: input.systemPrompt },
			{ role: 'user', content: input.userPrompt },
		],
	})
	if (!res.ok) throw new Error(`Zen responses failed (${res.status})`)
	const body = await res.json()
	return {
		text: extractTextFromResponses(body) || '',
		providerId: model.id,
	}
}

export const zenClientGenerate = async (
	input: ZenClientGenerateInput,
): Promise<ZenGenerateOutput> => {
	const apiKey = getZenClientKey()
	if (!apiKey) throw new Error('OpenCode Zen not configured (PUBLIC_OPENCODE_API_KEY)')
	return zenClientGenerateWithKey(apiKey, input)
}
