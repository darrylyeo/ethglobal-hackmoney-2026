<script module lang="ts">
	import type { ItemState } from './item-state.svelte.ts'
	import type { AreaState } from './area-state.svelte.ts'
	import type { Snippet } from 'svelte'

	export type DragProps<T> = {
		children: Snippet<[T, ItemState<T>]>
		args: [T, ItemState<T>]
		position: { x: number; y: number }
		offset: { x: number; y: number }
		min: { width: number; height: number }
		origin: { array: T[]; index: number; area: AreaState<T> }
		stop: (e?: Event) => void
	}
</script>

<script lang="ts">
	let {
		position,
		offset,
		min,
		origin,
		args,
		children,
		stop,
	} = $props<{
		children: Snippet<[unknown, ItemState<unknown>]>
		args: [unknown, import('./item-state.svelte.ts').ItemState<unknown>]
		position: { x: number; y: number }
		offset: { x: number; y: number }
		min: { width: number; height: number }
		origin: { array: unknown[]; index: number; area: AreaState<unknown> }
		stop: (e?: Event) => void
	}>()

	const x = $derived(position.x - offset.x)
	const y = $derived(position.y - offset.y)
</script>


<div
	class="reorder-drag-ghost"
	style:width="{min.width}px"
	style:min-height="{min.height}px"
	style:left="{x}px"
	style:top="{y}px"
	role="presentation"
	aria-hidden="true"
>
	{@render children(args[0], args[1])}
</div>


<style>
	.reorder-drag-ghost {
		position: fixed;
		z-index: 9999;
		pointer-events: none;
	}
</style>
