/**
 * OpenCode Zen LLM proxy. Requires OPENCODE_ZEN_API_KEY server env.
 * GET: returns 200 { available: true } when key is set, else 503.
 * POST: body { systemPrompt, userPrompt, modelId? }; calls Zen and returns { text, providerId }.
 * @see https://opencode.ai/docs/zen/
 */

import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'
import {
	getZenFreeModel,
	OPENCODE_ZEN_DEFAULT_FREE_MODEL_ID,
} from '$/constants/opencode-zen'

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
	return typeof body.choices?.[0]?.message?.content === 'string'
		? body.choices[0].message.content
		: ''
}

const extractTextFromMessages = (body: unknown): string => {
	if (!isRecord(body) || !Array.isArray(body.content) || body.content.length === 0) return ''
	const first = body.content[0]
	return isRecord(first) && typeof first.text === 'string' ? first.text : ''
}

const callZen = async (options: {
	apiKey: string
	modelId: string
	systemPrompt: string
	userPrompt: string
}): Promise<{ text: string; providerId: string }> => {
	const model = getZenFreeModel(options.modelId)
	const headers: Record<string, string> = {
		'content-type': 'application/json',
		authorization: `Bearer ${options.apiKey}`,
	}

	if (model.kind === 'chat/completions') {
		const res = await fetch(model.endpoint, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				model: model.id,
				messages: [
					{ role: 'system', content: options.systemPrompt },
					{ role: 'user', content: options.userPrompt },
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
				system: options.systemPrompt,
				messages: [{ role: 'user', content: options.userPrompt }],
			}),
		})
		if (!res.ok) throw new Error(`Zen messages failed (${res.status})`)
		const body = await res.json()
		return {
			text: extractTextFromMessages(body) || '',
			providerId: model.id,
		}
	}

	// responses (OpenAI-style)
	const res = await fetch(model.endpoint, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			model: model.id,
			messages: [
				{ role: 'system', content: options.systemPrompt },
				{ role: 'user', content: options.userPrompt },
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

export const GET: RequestHandler = async () => {
	const apiKey = env.OPENCODE_ZEN_API_KEY
	if (!apiKey || typeof apiKey !== 'string') {
		return json({ available: false }, { status: 503 })
	}
	return json({ available: true })
}

export const POST: RequestHandler = async ({ request }) => {
	const apiKey = env.OPENCODE_ZEN_API_KEY
	if (!apiKey || typeof apiKey !== 'string') {
		return json({ error: 'OpenCode Zen not configured (OPENCODE_ZEN_API_KEY)' }, { status: 503 })
	}
	let body: { systemPrompt?: string; userPrompt?: string; modelId?: string }
	try {
		body = await request.json()
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 })
	}
	const systemPrompt = typeof body.systemPrompt === 'string' ? body.systemPrompt : ''
	const userPrompt = typeof body.userPrompt === 'string' ? body.userPrompt : ''
	const modelId =
		typeof body.modelId === 'string' && body.modelId.length > 0
			? body.modelId
			: OPENCODE_ZEN_DEFAULT_FREE_MODEL_ID
	if (!systemPrompt.trim() && !userPrompt.trim()) {
		return json({ error: 'systemPrompt and userPrompt required' }, { status: 400 })
	}
	try {
		const result = await callZen({
			apiKey,
			modelId,
			systemPrompt: systemPrompt || 'You are a helpful assistant.',
			userPrompt: userPrompt || '',
		})
		return json(result)
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)
		return json({ error: message }, { status: 502 })
	}
}
