import type { IntentDragPayload } from './types'

export const INTENT_MIME = 'application/x-entity-intent'

export const setIntentDragData = (
	event: DragEvent,
	payload: IntentDragPayload,
) => {
	const data = JSON.stringify(payload)
	event.dataTransfer?.setData(INTENT_MIME, data)
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null

const isIntentDragPayload = (value: unknown): value is IntentDragPayload => {
	if (!isRecord(value)) return false
	const entity = value.entity
	if (!isRecord(entity)) return false
	return entity.type !== undefined && entity.id !== undefined
}

export const getIntentDragPayload = (
	event: DragEvent,
): IntentDragPayload | null => {
	const data = event.dataTransfer?.getData(INTENT_MIME)
	if (!data) return null
	try {
		const parsed = JSON.parse(data)
		return isIntentDragPayload(parsed) ? parsed : null
	} catch {
		return null
	}
}
