import type { IntentDragPayload } from '$/constants/intents.ts'
import { setIntentDragData } from '$/lib/intents/drag.ts'
import {
	startIntentDragPreview,
	updateIntentDragTarget,
} from '$/state/intent-drag-preview.svelte'
import type { Attachment } from 'svelte/attachments'

export type DraggableOptions = {
	text: string
	href?: string
	intent?: IntentDragPayload
	enabled?: boolean,
}

const toElement = (e: DragEvent): HTMLElement | null =>
	e.currentTarget instanceof HTMLElement ? e.currentTarget : null

export const draggable: (options: DraggableOptions) => Attachment<HTMLElement> = (
	options,
) => (element) => {
	const { text, href, intent, enabled = true } = options
	if (!enabled) {
		element.draggable = false
		return () => {}
	}
	const controller = new AbortController()
	const { signal } = controller
	element.draggable = true
	element.addEventListener(
		'dragstart',
		(e: DragEvent) => {
			e.dataTransfer?.setData('text/plain', text)
			if (href) e.dataTransfer?.setData('text/uri-list', href)
			if (intent) {
				setIntentDragData(e, intent)
				const el = toElement(e)
				if (el) startIntentDragPreview({ payload: intent, element: el })
			}
		},
		{ signal },
	)
	if (intent) {
		const onIntentTarget = (e: DragEvent) => {
			e.preventDefault()
			const el = toElement(e)
			if (el) updateIntentDragTarget({ payload: intent, element: el })
		}
		element.addEventListener('dragover', onIntentTarget, { signal })
		element.addEventListener('drop', onIntentTarget, { signal })
	}
	signal.addEventListener('abort', () => (element.draggable = false), {
		once: true,
	})
	return () => controller.abort()
}
