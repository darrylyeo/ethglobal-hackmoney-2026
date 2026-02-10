import { mount, unmount, untrack } from 'svelte'
import { on } from 'svelte/events'
import type { Attachment } from 'svelte/attachments'
import type { Snippet } from 'svelte'
import Drag from './Drag.svelte'
import { enterArea, targeting } from './reactivity.svelte.ts'
import { current, lastSplice, dragReactivity } from './reactivity.svelte.ts'
import { AreaState, ItemState, type ListOptions, type HandleOptions } from './state.svelte.ts'
import { sameParent } from './utils.svelte.ts'
import { getPosition, trackPosition } from './utils.svelte.ts'

export type ContentSnippet<T> = Snippet<[item: T, state: ItemState<T>]>

export function createReorder<T>(getContent: () => ContentSnippet<T>) {
	const areasMap = new WeakMap<HTMLElement, AreaState<T>>()
	let currentItem = $state<T | null>(null)
	const reorderState = {
		get reordering() {
			return currentItem
		},
		set reordering(item: T | null) {
			currentItem = item
		},
	}

	dragReactivity(() => !!reorderState.reordering)

	function getOrCreateItemState(
		area: AreaState<T>,
		value: T,
		index: number,
		anchor?: HTMLElement,
	): ItemState<T> {
		let state = area.items.get(value)
		if (state) {
			if (anchor !== undefined) {
				state.anchor = anchor
				state.index = index
			}
			return state
		}
		state = new ItemState(area, value, index)
		if (anchor !== undefined) state.anchor = anchor
		area.items.set(value, state)

		$effect(() => {
			state!.positioning = reorderState.reordering === state!.value
			state!.draggedIs =
				reorderState.reordering && current.area === state!.area ?
					current.index === state!.index - 1 ? 'before'
					: current.index === state!.index + 1 ? 'after'
					: undefined
				: undefined
		})

		let cleanPosition: (() => void) | undefined
		$effect(() => {
			const node = state!.anchor ?? state!.handle
			if (node && cleanPosition) cleanPosition()
			untrack(() => {
				if (!node) return
				cleanPosition = trackPosition(
					node,
					() => !!reorderState.reordering && state!.area.isTarget,
					(pos) => {
						state!.position = pos
					},
				)
			})
			return cleanPosition
		})

		return state
	}

	function list(options: ListOptions<T>): Attachment<HTMLElement> {
		return (element) => {
			const opts = $state(options)
			let state = areasMap.get(element)
			if (!state) {
				state = new AreaState(element, () => opts)
				areasMap.set(element, state)
			}
			state.array = () => opts.getArray()
			element.__reorderArea = state as AreaState<unknown>
			opts.getArea?.(state)

			$effect(() =>
				on(element, 'pointerenter', () => {
					if (!reorderState.reordering) return
					enterArea(() => state as AreaState<unknown>)
				}),
			)
			$effect(() => {
				if (!reorderState.reordering) {
					delete element.dataset.areaCondition
				} else if (opts.condition) {
					element.dataset.areaCondition = String(
						!!opts.condition(reorderState.reordering),
					)
				} else {
					element.dataset.areaCondition = 'true'
				}
			})

			return () => {
				delete element.__reorderArea
				areasMap.delete(element)
			}
		}
	}

	function item(value: T, index: number): Attachment<HTMLElement> {
		return (element) => {
			let parent: HTMLElement | null = element.parentElement
			while (parent && !parent.__reorderArea) parent = parent.parentElement
			const area = parent?.__reorderArea as AreaState<T> | undefined
			if (!area) return () => {}

			const state = untrack(() =>
				getOrCreateItemState(area, value, index, element),
			)
			element.__reorderItem = state as ItemState<unknown>

			return () => {
				delete element.__reorderItem
				area.items.delete(value)
			}
		}
	}

	function handle(options: HandleOptions = {}): Attachment<HTMLElement> {
		return (element) => {
			const opts = $state(options)
			let parent: HTMLElement | null = element.parentElement
			while (parent && !parent.__reorderItem) parent = parent.parentElement
			const itemState = parent?.__reorderItem as ItemState<T> | undefined
			if (!itemState) return () => {}

			itemState.handle = element

			$effect(() => {
				element.style.cursor = opts.cursor ?? 'grab'
			})

			function startDrag(e: PointerEvent) {
				const anchor = itemState.anchor ?? element
				const parentEl = sameParent(element, anchor)
				if (!parentEl) return
				const rect = parentEl.getBoundingClientRect()
				current.area = itemState.area as AreaState<unknown>
				current.index = itemState.index
				current.item = itemState.value
				lastSplice.area = itemState.area as AreaState<unknown>
				lastSplice.index = itemState.index

				const offset = {
					x: e.clientX - rect.left,
					y: e.clientY - rect.top,
				}
				reorderState.reordering = itemState.value
				targeting.targetable = true

				const dragInstance = mount(Drag, {
					target: document.body,
					props: {
						children: getContent() as ContentSnippet<unknown>,
						args: [
							itemState.value,
							itemState as ItemState<unknown>,
						],
						position: { x: e.clientX, y: e.clientY },
						offset,
						min: { width: rect.width, height: rect.height },
						origin: {
							array: itemState.array,
							index: itemState.index,
							area: itemState.area,
						},
						stop(ev?: Event) {
							ev?.preventDefault()
							if (dragInstance) {
								unmount(dragInstance, { outro: false })
							}
							targeting.targetable = false
							itemState.area.options?.onDrop?.(itemState.value)
							reorderState.reordering = null
							itemState.positioning = false
						},
					},
				})
			}

			$effect(() =>
				on(element, 'pointerdown', (e: PointerEvent) => {
					e.preventDefault()
					if (!opts.clickable) {
						element.addEventListener(
							'click',
							(e) => {
								e.preventDefault()
								e.stopPropagation()
							},
							{ once: true, capture: true },
						)
						return startDrag(e)
					}
					const cleanMove = on(document, 'pointermove', () => {
						cleanMove()
						cleanUp()
						startDrag(e)
					})
					const cleanUp = on(element, 'pointerup', () => {
						cleanMove()
						cleanUp()
					})
				}),
			)

			return () => {
				if (itemState.handle === element) itemState.handle = undefined
			}
		}
	}

	function getState(
		area: AreaState<T> | null | undefined,
		value: T,
		index: number,
	): ItemState<T> | undefined {
		if (!area) return undefined
		return untrack(() => getOrCreateItemState(area, value, index))
	}

	return { list, item, handle, getState }
}
