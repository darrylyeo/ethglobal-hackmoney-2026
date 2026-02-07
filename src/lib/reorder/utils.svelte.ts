import { observeMove } from './observe-move.ts'

export function sameParent(
	node: HTMLElement,
	reference: HTMLElement,
): HTMLElement | undefined {
	if (node.parentElement === reference.parentElement) return node
	let parent = node.parentElement
	while (parent?.parentElement && parent.parentElement !== reference.parentElement) {
		parent = parent.parentElement
	}
	return parent ?? undefined
}

export function getPosition(node: HTMLElement | undefined): {
	x: number
	y: number
	h: number
	w: number
} {
	if (!node) return { x: NaN, y: NaN, h: NaN, w: NaN }
	const rect = node.getBoundingClientRect()
	return { x: rect.left, y: rect.top, h: rect.height, w: rect.width }
}

export function trackPosition(
	node: HTMLElement,
	isEnabled: () => boolean,
	setPosition: (position: { x: number; y: number; h: number; w: number }) => void
): () => void {
	const update = () => {
		if (isEnabled()) setPosition(getPosition(node))
	}
	$effect(update)
	const ro = new ResizeObserver(update)
	const cleanup = observeMove(node, isEnabled, update)
	ro.observe(node)
	update()
	return () => {
		ro.unobserve(node)
		ro.disconnect()
		cleanup()
	}
}
