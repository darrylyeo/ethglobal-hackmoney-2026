<script context="module" lang="ts">
	import type { Snippet } from 'svelte'
	import type { Attachment } from 'svelte/attachments'
	import type { ItemState } from './item-state.svelte.ts'
	import type { AreaOptions } from './area-state.svelte.ts'
	import { createReorder, type ContentSnippet } from './reorder.svelte.ts'
	import ListHost from './ListHost.svelte'

	export type ReorderProps<T> = {
		content: ContentSnippet<T>
		children: Snippet<
			[
				attach: (options?: AreaOptions<T>) => Attachment<HTMLElement>,
				area: Snippet<[array: T[]]>,
			]
		>
	}
</script>


</script>

{#snippet area(array: unknown[])}
	<ListHost array={array} content={content} createGetState={createGetState} />
{/snippet}

{@render children(attach, area)}
