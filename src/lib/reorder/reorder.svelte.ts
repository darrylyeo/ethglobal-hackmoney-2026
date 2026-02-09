import { mount, unmount, tick, untrack } from 'svelte'
import { on } from 'svelte/events'
import type { Snippet } from 'svelte'
import Drag from './Drag.svelte'
import { enterArea, targeting } from './reactivity.svelte.ts'
import { current, lastSplice, dragReactivity } from './reactivity.svelte.ts'
import { ItemState, ANCHOR, HANDLE, POSITION, type HandleOptions } from './item-state.svelte.ts'
import { AreaState, ARRAY, SPLICE_ARRAY, type AreaOptions } from './area-state.svelte.ts'
import { sameParent, trackPosition } from './utils.svelte.ts'

export type ContentSnippet<T> = Snippet<[item: T, state: ItemState<T>]>

export type AreaRenderOptions<T> = {
	view: T[]
	startIndex?: number
	modify?: T[]
}

type InternalAreaRenderOptions<T> = AreaRenderOptions<T> & {
	splice: T[]
}

declare global {
	interface HTMLElement {
		__reorderArea?: AreaState<unknown>
	}
}

export function createReorder<T>(itemSnippet: ContentSnippet<T>) {
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

	function getState(opts: {
		anchor: HTMLElement
		options: InternalAreaRenderOptions<T>
		value: T
		index: number
		areaState: AreaState<T>
		content: () => ContentSnippet<T>
	}): ItemState<T> {
		const { anchor, options: listOptions, index, areaState, content, value } = opts
		let v = areaState.items.get(value)
		if (v) return v

		const positioningEffect = (itemState: ItemState<T>) => () => {
			itemState.positioning = reorderState.reordering === itemState.value
			itemState.draggedIs =
				reorderState.reordering && current.area === itemState.area ?
					current.index === itemState.index - 1 ? 'before'
					: current.index === itemState.index + 1 ? 'after'
					: undefined
				: undefined
		}

		let cleanPosition: (() => void) | undefined
		const positionEffect = (itemState: ItemState<T>) => () => {
			const node = itemState[ANCHOR] ?? itemState[HANDLE]
			if (node && cleanPosition) cleanPosition()
			untrack(() => {
				if (!node) return
				cleanPosition = trackPosition(
					node,
					() => !!reorderState.reordering && itemState.area.isTarget,
					(pos) => {
						itemState[POSITION] = pos
					},
				)
			})
			return cleanPosition
		}

		const itemState = new ItemState<T>(
			{
				anchor,
				array: () => listOptions.splice,
				index,
				areasMap: areasMap as WeakMap<HTMLElement, AreaState<unknown>>,
				value,
				positioning: current.area === areaState && current.index === index,
				anchorAction: (is, setElement) => (node: HTMLElement) => {
					const removeElement = setElement(node)
					$effect(positioningEffect(is))
					$effect(positionEffect(is))
					return { destroy() { removeElement() } }
				},
				handle: (is, setElement) => (node: HTMLElement, options: HandleOptions = {}) => {
					const opts = $state(options)
					const removeElement = setElement(node)
					$effect(positioningEffect(is))
					$effect(positionEffect(is))
					$effect(() => {
						node.style.cursor = opts.cursor ?? 'grab'
					})

					let dragInstance: ReturnType<typeof mount> | null = null
					function startDrag(e: PointerEvent) {
						const parent = sameParent(node, anchor)
						if (!parent) return
						const rect = parent.getBoundingClientRect()
						current.area = is.area as AreaState<unknown>
						current.index = is.index
						current.item = is.value
						lastSplice.area = is.area as AreaState<unknown>
						lastSplice.index = is.index

						const offset = { x: e.clientX - rect.left, y: e.clientY - rect.top }
						const mousePosition = { x: e.clientX, y: e.clientY }

						reorderState.reordering = is.value
						targeting.targetable = true
						dragInstance = mount(Drag, {
							target: document.body,
							props: {
								children: content() as ContentSnippet<unknown>,
								args: [
									is.value,
									new ItemState<T>({ dragging: true, array: () => is.array, index: is.index }, is.area) as ItemState<unknown>,
								],
								position: mousePosition,
								offset,
								min: { width: rect.width, height: rect.height },
								origin: { array: listOptions.splice, index, area: is.area },
								stop(ev?: Event) {
									ev?.preventDefault()
									if (dragInstance) {
										unmount(dragInstance, { outro: false })
										dragInstance = null
									}
									targeting.targetable = false
									current.area?.options?.onDrop?.(is.value)
									reorderState.reordering = null
									is.positioning = false
								},
							},
						})
					}

					$effect(() =>
						on(node, 'pointerdown', (e: PointerEvent) => {
							e.preventDefault()
							if (!opts.clickable) {
								node.addEventListener(
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
							const cleanUp = on(node, 'pointerup', () => {
								cleanMove()
								cleanUp()
							})
						}),
					)

					return {
						destroy() {
							removeElement()
						},
						update(o: HandleOptions) {
							opts.cursor = o.cursor
							opts.clickable = o.clickable
						},
					}
				},
			},
			areaState,
		)

		areaState.items.set(value, itemState)
		return itemState
	}

	function attach(options?: AreaOptions<T>) {
		return (element: HTMLElement) => {
			const opts = $state(options ?? {}) as AreaOptions<T>
			let state = areasMap.get(element)
			if (!state) {
				state = new AreaState<T>(element, () => opts)
				areasMap.set(element, state)
			}
			element.__reorderArea = state as AreaState<unknown>

			if (opts.class) {
				element.dataset.areaClass = opts.class
			}
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
					element.dataset.areaCondition = String(!!opts.condition(reorderState.reordering))
				} else {
					element.dataset.areaCondition = 'true'
				}
			})
			if (opts.get) opts.get(state)

			return () => {
				delete element.__reorderArea
				areasMap.delete(element)
			}
		}
	}

	function createGetState(
		anchor: HTMLElement,
		array: T[],
		areaState: AreaState<T>,
	) {
		const listOptions: InternalAreaRenderOptions<T> = {
			view: array,
			splice: array,
			modify: array,
		}
		return (value: T, index: number) =>
			untrack(() =>
				getState({
					anchor,
					value,
					options: listOptions,
					index,
					areaState,
					content: getContent,
				}),
			)
	}

	return { attach, createGetState, areasMap }
}

export function getAreaFromElement(el: HTMLElement): AreaState<unknown> | undefined {
	return el.__reorderArea
}

export function setAreaArray<T>(areaState: AreaState<T>, array: T[]) {
	areaState[ARRAY] = () => array
	areaState[SPLICE_ARRAY] = () => array
}
