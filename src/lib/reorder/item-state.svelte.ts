import { untrack } from 'svelte'
import type { AreaState } from './area-state.svelte.ts'
import { getPosition } from './utils.svelte.ts'

export type HandleOptions = {
	clickable?: boolean
	cursor?: string
}

type SetElement = (element?: HTMLElement) => () => void

export const HANDLE = Symbol('reorder.handle')
export const ANCHOR = Symbol('reorder.anchor')
export const POSITION = Symbol('reorder.position')

interface ItemStateConstruct<T> {
	anchor?: HTMLElement
	array: () => T[]
	index?: number
	value?: T
	areasMap?: WeakMap<HTMLElement, AreaState<unknown>>
	handle?: (
		itemState: ItemState<T>,
		setHandleElement: SetElement,
	) => (node: HTMLElement, options?: HandleOptions) => void | { destroy(): void; update?(o: HandleOptions): void }
	anchorAction?: (
		itemState: ItemState<T>,
		setAnchorElement: SetElement,
	) => (node: HTMLElement) => void | { destroy(): void }
	positioning?: boolean
	dragging?: boolean
}

export class ItemState<T> {
	dragging = $state(false)
	positioning = $state(false)
	draggedIs = $state<undefined | 'before' | 'after'>(undefined)

	handle = (node: HTMLElement, _?: HandleOptions) => {
		setTimeout(() => setDraggedElement(node), 1)
	}
	anchor = (node: HTMLElement) => {
		setTimeout(() => setDraggedElement(node), 2)
	}

	#handleElement = $state<HTMLElement | undefined>(undefined)
	#anchorElement = $state<HTMLElement | undefined>(undefined)

	get [HANDLE](): HTMLElement | undefined {
		return this.#handleElement
	}
	get [ANCHOR](): HTMLElement | undefined {
		return this.#anchorElement
	}

	position = $derived.by(() => {
		const result =
			Number.isNaN(this.#position.x) ?
				getPosition(this.#anchorElement ?? this.#handleElement)
			:	this.#position
		return result
	})
	#position = $state({ x: NaN, y: NaN, h: NaN, w: NaN })

	updatePosition() {
		this.#position = getPosition(this.#anchorElement ?? this.#handleElement)
		return this.#position
	}

	get [POSITION]() {
		return this.#position
	}
	set [POSITION](value: { x: number; y: number; h: number; w: number }) {
		this.#position = value
	}

	area = $state() as AreaState<T>
	index = $state(0)
	#array: () => T[]
	get array(): T[] {
		return this.#array()
	}
	value = $state(undefined!) as T

	destroy() {
		this.area.items.delete(this.value)
	}

	constructor(o: ItemStateConstruct<T>, area?: AreaState<T>) {
		this.area = area!
		this.index = o.index ?? 0
		this.#array = o.array
		this.value = (o.value ?? (o.index !== undefined ? o.array()[o.index] : undefined!)) as T
		this.positioning = o.positioning ?? false
		this.dragging = o.dragging ?? false
		this.handle =
			o.handle?.(
				this,
				(el) => {
					this.#handleElement = el
					return () => {
						if (this.#handleElement === el) this.#handleElement = undefined
					}
				},
			) ?? this.handle
		this.anchor =
			o.anchorAction?.(
				this,
				(el) => {
					this.#anchorElement = el
					return () => {
						if (this.#anchorElement === el) this.#anchorElement = undefined
					}
				},
			) ?? this.anchor
	}
}

let draggedElement: HTMLElement | null = null
export function setDraggedElement(el: HTMLElement | null) {
	draggedElement = el
}
export function getDraggedElement(): HTMLElement | null {
	return draggedElement
}
