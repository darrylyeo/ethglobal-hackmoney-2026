import { SvelteMap } from 'svelte/reactivity'
import type { ItemState } from './item-state.svelte.ts'

export type AreaOptions<T> = {
	axis?: 'x' | 'y'
	class?: string
	condition?: (item: T) => boolean
	onDrop?: (item: T) => void
	get?: (areaState: AreaState<T>) => void
}

export const ARRAY = Symbol('reorder.array')
export const SPLICE_ARRAY = Symbol('reorder.splice-array')

export class AreaState<T> {
	node: HTMLElement
	#optionsFn: () => AreaOptions<T>
	get options(): AreaOptions<T> {
		return this.#optionsFn()
	}
	class = $derived(this.options.class?.split(' ') ?? [])
	isTarget = $state(false)
	isOrigin = $state(false)
	items = new SvelteMap<T, ItemState<T>>()

	get array(): T[] {
		return this[SPLICE_ARRAY]?.() ?? this[ARRAY]?.() ?? []
	}

	#array = $state<(() => T[]) | undefined>(undefined)
	#spliceArray = $state<(() => T[]) | undefined>(undefined)

	get [ARRAY](): (() => T[]) | undefined {
		return this.#array
	}
	set [ARRAY](v: (() => T[]) | undefined) {
		this.#array = v
	}
	get [SPLICE_ARRAY](): (() => T[]) | undefined {
		return this.#spliceArray
	}
	set [SPLICE_ARRAY](v: (() => T[]) | undefined) {
		this.#spliceArray = v
	}

	constructor(node: HTMLElement, options: () => AreaOptions<T>) {
		this.node = node
		this.#optionsFn = options
	}
}
