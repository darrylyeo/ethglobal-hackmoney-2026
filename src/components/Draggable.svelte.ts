import type { Attachment } from 'svelte/attachments'
import type { IntentDragPayload } from '$/lib/intents/types'
import { setIntentDragData } from '$/lib/intents/drag'
import {
	startIntentDragPreview,
	updateIntentDragTarget,
} from '$/state/intent-drag-preview.svelte'

export type DraggableOptions = {
	text: string
	href?: string
	intent?: IntentDragPayload
	enabled?: boolean
}

const toElement = (e: DragEvent): HTMLElement | null =>
	e.currentTarget instanceof HTMLElement ? e.currentTarget : null

export const draggable: (options: DraggableOptions) => Attachment<HTMLElement> = (
	options,
) => (element) => {
	const { text, href, intent, enabled = true } = options
	if (!enabled) return
	const controller = new AbortController()
	element.draggable = true
	const ondragstart = (e: DragEvent) => {
		e.dataTransfer?.setData('text/plain', text)
		if (href) e.dataTransfer?.setData('text/uri-list', href)
		if (intent) {
			setIntentDragData(e, intent)
			const el = toElement(e)
			if (el) startIntentDragPreview({ payload: intent, element: el })
		}
	}
	const ondragover = (e: DragEvent) => {
		if (!intent) return
		e.preventDefault()
		const el = toElement(e)
		if (el) updateIntentDragTarget({ payload: intent, element: el })
	}
	const ondrop = (e: DragEvent) => {
		if (!intent) return
		e.preventDefault()
		const el = toElement(e)
		if (el) updateIntentDragTarget({ payload: intent, element: el })
	}
	element.addEventListener('dragstart', ondragstart, { signal: controller.signal })
	element.addEventListener('dragover', ondragover, { signal: controller.signal })
	element.addEventListener('drop', ondrop, { signal: controller.signal })
	controller.signal.addEventListener('abort', () => {
		element.draggable = false
	}, { once: true })
	return () => controller.abort()
}
