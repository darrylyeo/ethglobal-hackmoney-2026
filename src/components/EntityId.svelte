<script lang="ts">
	// Types/constants
	import type { IntentDragPayload } from '$/lib/intents/types'

	// Functions
	import { setIntentDragData } from '$/lib/intents/drag'

	// Props
	let {
		link,
		draggableText,
		className,
		intent,
		children,
	}: {
		link?: string
		draggableText: string
		className: string
		intent?: IntentDragPayload
		children?: import('svelte').Snippet
	} = $props()

	// Actions
	const ondragstart = (e: DragEvent) => {
		e.dataTransfer?.setData('text/plain', draggableText)
		if (link) e.dataTransfer?.setData('text/uri-list', link)
		if (intent) setIntentDragData(e, intent)
	}
</script>

{#if link}
	<a class={className} href={link} draggable={true} {ondragstart}>
		<span data-text="font-monospace">
			{#if children}
				{@render children()}
			{/if}
		</span>
	</a>
{:else}
	<span
		class={className}
		data-text="font-monospace"
		role="term"
		draggable={true}
		{ondragstart}
	>
		{#if children}
			{@render children()}
		{/if}
	</span>
{/if}
