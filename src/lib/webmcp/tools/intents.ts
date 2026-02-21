import { goto } from '$app/navigation'
import { buildSessionPath, createSession } from '$/lib/session/sessions.ts'
import { resolveIntentForDrag } from '$/lib/intents.ts'
import type { IntentEntityRef } from '$/constants/intents.ts'

import type {
	resolveIntentSchema,
	createSessionFromIntentSchema,
} from '$/lib/webmcp/schemas.ts'

type ResolveIntentInput = (typeof resolveIntentSchema) extends { properties: infer P }
	? { [K in keyof P]: unknown }
	: never
type CreateSessionFromIntentInput = (typeof createSessionFromIntentSchema) extends {
	properties: infer P
}
	? { [K in keyof P]: unknown }
	: never

const toEntityRef = (raw: { entityType: unknown; entityId: unknown }): IntentEntityRef => {
	const id = raw.entityId
	return {
		type: raw.entityType as IntentEntityRef['type'],
		id: (typeof id === 'object' && id != null ? id : { id: String(id) }) as Record<string, unknown>,
	}
}

export const executeResolveIntent = async (input: ResolveIntentInput) => {
	const source = toEntityRef(input.sourceEntityRef as { entityType: unknown; entityId: unknown })
	const target = toEntityRef(input.targetEntityRef as { entityType: unknown; entityId: unknown })
	return resolveIntentForDrag(source, target)
}

export const executeCreateSessionFromIntent = async (input: CreateSessionFromIntentInput) => {
	const source = toEntityRef(input.sourceEntityRef as { entityType: unknown; entityId: unknown })
	const target = toEntityRef(input.targetEntityRef as { entityType: unknown; entityId: unknown })
	const optionIndex = (input.optionIndex as number) ?? 0
	const resolution = resolveIntentForDrag(source, target)
	if (!resolution.matched || resolution.options.length === 0)
		return { error: 'No matching intent or no options' }
	const option = resolution.options[optionIndex]
	if (!option) return { error: `Option index ${optionIndex} out of range (${resolution.options.length} options)` }
	const session = createSession({
		actions: option.sessionTemplate.actions,
		name: option.sessionTemplate.name,
	})
	await goto(buildSessionPath(session.id), { replaceState: false })
	return { sessionId: session.id, path: buildSessionPath(session.id) }
}
