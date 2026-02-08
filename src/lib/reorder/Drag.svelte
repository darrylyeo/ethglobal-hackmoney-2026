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


<script lang="ts" generics="T">
	import { on } from 'svelte/events'
	import { targeting } from './reactivity.svelte.ts'

	let {
		children,
		args,
		position,
		offset,
		min,
		origin,
		stop,
	}: DragProps<T> = $props()

	let x = $state(position.x - offset.x)
	let y = $state(position.y - offset.y)

	$effect(() => {
		const cleanMove = on(document, 'pointermove', (e: PointerEvent) => {
			x = e.clientX - offset.x
			y = e.clientY - offset.y
			targeting.position = { x: e.clientX, y: e.clientY, h: 0, w: 0 }
		})
		const cleanUp = on(document, 'pointerup', (e: PointerEvent) => {
			cleanMove()
			cleanUp()
			stop(e)
		})
		return () => {
			cleanMove()
			cleanUp()
		}
	})
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
