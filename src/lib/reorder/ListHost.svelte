<script module lang="ts">
	import type { Snippet } from 'svelte'
	import type { ItemState } from './item-state.svelte.ts'
	import type { AreaState } from './area-state.svelte.ts'
	import { getAreaFromElement, setAreaArray, type ContentSnippet } from './reorder.svelte.ts'

	export type ListHostProps<T> = {
		array: T[]
		content: ContentSnippet<T>
		createGetState: (
			anchor: HTMLElement,
			array: T[],
			areaState: AreaState<T>,
		) => (value: T, index: number) => ItemState<T>
	}
</script>


<script lang="ts" generics="T">
	import { tick } from 'svelte'

	let {
		array,
		content,
		createGetState,
	}: ListHostProps<T> = $props()

	let hostEl = $state<HTMLDivElement | null>(null)

	let areaState = $state<AreaState<T> | undefined>(undefined)
	let getState = $state<((value: T, index: number) => ItemState<T>) | undefined>(undefined)

	$effect(() => {
		const el = hostEl
		if (!el?.parentElement) return
		const parent = el.parentElement
		if (!parent) return
		const apply = () => {
			const area = getAreaFromElement(parent) as AreaState<T> | undefined
			if (!area) return
			setAreaArray(area, array)
			areaState = area
			const get = createGetState(el, array, area)
			getState = get
			array.forEach((item, i) => get(item, i))
		}
		apply()
		if (!areaState) {
			tick().then(apply)
		}
	})
</script>


<div bind:this={hostEl}>
	{#if areaState && getState}
		{#each array as item, i (item)}
			{@const state = areaState.items.get(item)}
			{#if state}
				{@render content(item, state)}
			{/if}
		{/each}
	{/if}
</div>
