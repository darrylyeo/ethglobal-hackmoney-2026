import type { EntityType } from '$/data/$EntityType.ts'
import type { IntentDragPayload } from '$/constants/intents.ts'
import { draggable } from '$/components/Draggable.svelte'
import { intentEntityTypes } from './registry.ts'
import type { Attachment } from 'svelte/attachments'

export const entityIntent = (
	type: EntityType,
	id: Record<string, unknown>,
	source?: string,
): IntentDragPayload | undefined => (
	intentEntityTypes.has(type)
		? {
				entity: { type, id },
				context: source ? { source } : undefined,
			}
		: undefined
)

export const intentDraggable = (options: {
	type: EntityType
	id: Record<string, unknown>
	text: string
	source?: string
	href?: string
	enabled?: boolean
}): Attachment<HTMLElement> => (
	draggable({
		text: options.text,
		href: options.href,
		intent: entityIntent(options.type, options.id, options.source),
		enabled: options.enabled,
	})
)
