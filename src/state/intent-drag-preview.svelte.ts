import type { IntentDragPayload } from '$/lib/intents/types'

export type IntentDragEndpoint = {
	payload: IntentDragPayload
	element: HTMLElement
	rect: DOMRect
}

export type IntentDragPreviewState = {
	status: 'idle' | 'dragging' | 'selected'
	source: IntentDragEndpoint | null
	target: IntentDragEndpoint | null
	selectedRouteId: string | null
}

export const intentDragPreviewState = $state<IntentDragPreviewState>({
	status: 'idle',
	source: null,
	target: null,
	selectedRouteId: null,
})

const toEndpoint = (
	payload: IntentDragPayload,
	element: HTMLElement,
): IntentDragEndpoint => ({
	payload,
	element,
	rect: element.getBoundingClientRect(),
})

export const startIntentDragPreview = (args: {
	payload: IntentDragPayload
	element: HTMLElement
}) => {
	intentDragPreviewState.status = 'dragging'
	intentDragPreviewState.source = toEndpoint(args.payload, args.element)
	intentDragPreviewState.target = null
	intentDragPreviewState.selectedRouteId = null
}

export const updateIntentDragTarget = (args: {
	payload: IntentDragPayload
	element: HTMLElement
}) => {
	if (intentDragPreviewState.status === 'idle') return
	if (!intentDragPreviewState.source) return
	if (intentDragPreviewState.source.element === args.element) {
		intentDragPreviewState.target = null
		return
	}
	intentDragPreviewState.target = toEndpoint(args.payload, args.element)
}

export const finalizeIntentDragPreview = () => {
	if (!intentDragPreviewState.source || !intentDragPreviewState.target) {
		intentDragPreviewState.status = 'idle'
		intentDragPreviewState.source = null
		intentDragPreviewState.target = null
		intentDragPreviewState.selectedRouteId = null
		return
	}
	intentDragPreviewState.status = 'selected'
}

export const clearIntentDragPreview = () => {
	intentDragPreviewState.status = 'idle'
	intentDragPreviewState.source = null
	intentDragPreviewState.target = null
	intentDragPreviewState.selectedRouteId = null
}

export const selectIntentDragRoute = (routeId: string | null) => {
	intentDragPreviewState.selectedRouteId = routeId
}
