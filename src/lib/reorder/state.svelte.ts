import { SvelteMap } from 'svelte/reactivity'

export type Orientation = 'x' | 'y'

export type ListOptions<T> = {
	orientation?: Orientation
	getArray: () => T[]
	condition?: (item: T) => boolean
	onDrop?: (item: T) => void
	getArea?: (area: AreaState<T>) => void
}

export type HandleOptions = {
	clickable?: boolean
	cursor?: string
}

declare global {
	interface HTMLElement {
		__reorderArea?: AreaState<unknown>
		__reorderItem?: ItemState<unknown>
	}
}

export class AreaState<T> {
	node: HTMLElement
	#optionsFn: () => ListOptions<T>
	get options(): ListOptions<T> {
		return this.#optionsFn()
	}
	isTarget = $state(false)
	items = new SvelteMap<T, ItemState<T>>()

	#arrayFn = $state<(() => T[]) | undefined>(undefined)
	get array(): T[] {
		return this.#arrayFn?.() ?? []
	}
	set array(fn: (() => T[]) | undefined) {
		this.#arrayFn = fn
	}

	constructor(node: HTMLElement, options: () => ListOptions<T>) {
		this.node = node
		this.#optionsFn = options
	}
}

export class ItemState<T> {
	area: AreaState<T>
	value: T
	index = $state(0)
	#anchorEl = $state<HTMLElement | undefined>(undefined)
	#handleEl = $state<HTMLElement | undefined>(undefined)
	positioning = $state(false)
	draggedIs = $state<undefined | 'before' | 'after'>(undefined)
	#position = $state({ x: NaN, y: NaN, h: NaN, w: NaN })

	get anchor(): HTMLElement | undefined {
		return this.#anchorEl
	}
	set anchor(el: HTMLElement | undefined) {
		this.#anchorEl = el
	}
	get handle(): HTMLElement | undefined {
		return this.#handleEl
	}
	set handle(el: HTMLElement | undefined) {
		this.#handleEl = el
	}
	get position(): { x: number; y: number; h: number; w: number } {
		return this.#position
	}
	set position(v: { x: number; y: number; h: number; w: number }) {
		this.#position = v
	}

	get array(): T[] {
		return this.area.array
	}

	constructor(area: AreaState<T>, value: T, index: number) {
		this.area = area
		this.value = value
		this.index = index
	}

	updatePosition(
		getPosition: (el: HTMLElement | undefined) => { x: number; y: number; h: number; w: number },
	) {
		this.#position = getPosition(this.#anchorEl ?? this.#handleEl)
		return this.#position
	}
}
