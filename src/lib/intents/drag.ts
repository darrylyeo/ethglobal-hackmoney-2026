import type { IntentDragPayload } from '$/constants/intents.ts'
import { toInteropName } from '$/constants/interop.ts'

export const INTENT_MIME = 'application/x-entity-intent'

const getChainId = (id: Record<string, unknown>): number | null => {
	const n = id.network ?? id.chainId
	return typeof n === 'number' && Number.isFinite(n) ? n : null
}

const getAddress = (id: Record<string, unknown>): `0x${string}` | null => {
	const a = id.address
	return typeof a === 'string' && /^0x[a-fA-F0-9]{40}$/.test(a)
		? (a.toLowerCase() as `0x${string}`)
		: null
}

const withInteropAddress = (payload: IntentDragPayload): IntentDragPayload => {
	const { entity } = payload
	const id = { ...entity.id }
	const chainId = getChainId(id)
	const address = getAddress(id)
	if (chainId !== null && address !== null && id.interopAddress === undefined) {
		id.interopAddress = toInteropName(chainId, address)
	}
	return { ...payload, entity: { ...entity, id } }
}

export const setIntentDragData = (
	event: DragEvent,
	payload: IntentDragPayload,
) => {
	const enriched = withInteropAddress(payload)
	const data = JSON.stringify(enriched)
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

