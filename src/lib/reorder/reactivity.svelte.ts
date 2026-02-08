import { tick, untrack } from 'svelte'
import type { ItemState } from './item-state.svelte.ts'
import type { AreaState } from './area-state.svelte.ts'

export const current = $state({
	index: 0,
	area: null as AreaState<unknown> | null,
	item: undefined as unknown,
})

export const lastSplice = {
	area: null as AreaState<unknown> | null,
	index: -1,
}

export const targeting = $state({
	positionTrigger: true,
	position: { x: NaN, y: NaN, h: NaN, w: NaN },
	targetable: false,
	enteredArea: false,
})

export function resetDragTargeting() {
	targeting.positionTrigger = true
	targeting.position = { x: NaN, y: NaN, h: NaN, w: NaN }
	targeting.targetable = false
	targeting.enteredArea = false
}

export function enterArea(getArea: () => AreaState<unknown>) {
	current.area = getArea()
	targeting.enteredArea = true
}

function distance(
	a: {
		x: number
		y: number
	},
	b: {
		x: number
		y: number
	},
): number {
	return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

const targetItem = $derived.by(() => {
	if (!targeting.targetable) return undefined
	let closest: ItemState<unknown> | undefined
	let closestDistance = Infinity

	// consume
	void targeting.position.y
	void targeting.positionTrigger

	if (Number.isNaN(targeting.position.x)) return undefined

	void current.area
	void current.area?.items?.size

	untrack(() => {
		for (const [, item] of current.area?.items ?? []) {
			if (Number.isNaN(item.position.x)) continue
			const d = distance(targeting.position, item.position)
			if (!closest || d < closestDistance) {
				closest = item
				closestDistance = d
			}
		}
	})
	return closest
})

const targetIndex = $derived(targetItem?.index ?? 0)

function put(area: AreaState<unknown>, index: number, item: unknown) {
	if (
		!lastSplice.area ||
		(current.area === lastSplice.area && lastSplice.index === index)
	) {
		return
	}
	const arr = lastSplice.area.array
	arr.splice(current.index, 1)
	area.array.splice(index, 0, item as never)
	if (lastSplice.area !== area) {
		lastSplice.area.items.delete(item as never)
	}
	lastSplice.area = area
	lastSplice.index = index
	current.area = area
	current.index = index
}

export function dragReactivity(enabled: () => boolean) {
	let ticked = false
	function untick() {
		if (!ticked) return
		ticked = false
		current.area?.items.forEach((i) => i.updatePosition())
	}

	let trigger = $state(false)
	$effect(() => {
		if (!enabled()) return
		void trigger
		if (!current.area || targetIndex === -1 || !targeting.targetable) return
		const isSelf =
			(targetItem &&
				targetItem.area === lastSplice.area &&
				targetIndex === lastSplice.index) ||
			targetItem?.value === current.item
		if (isSelf) return

		untrack(() => {
			if (ticked) return
			ticked = true
			requestAnimationFrame(untick)

			const last =
				targeting.enteredArea &&
				targetIndex === current.area!.items.size - 1
			put(
				current.area!,
				last ? targetIndex + 1 : targetIndex,
				current.item,
			)
			if (last) {
				tick().then(() => {
					untick()
					targeting.targetable = targeting.targetable
					trigger = !trigger
				})
			}
		})
	})
}
