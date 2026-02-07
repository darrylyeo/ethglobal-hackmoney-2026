<script context="module" lang="ts">
	import { untrack } from 'svelte'
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


</script>

<div bind:this={hostEl}>
	{#if areaState && getState}
		{#each array as item, i (item)}
			{@const state = untrack(() => getState!(item, i))}
			{@render content(item, state)}
		{/each}
	{/if}
</div>
