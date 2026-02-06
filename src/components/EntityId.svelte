<script lang="ts">
	// Types/constants
	import type { IntentDragPayload } from '$/lib/intents/types'


	// Functions
	import { draggable } from '$/components/Draggable.svelte'


	// Props
	let {
		link,
		draggableText,
		className,
		intent,
		children,
		...rest
	}: {
		link?: string
		draggableText: string
		className: string
		intent?: IntentDragPayload
		children?: import('svelte').Snippet
		[key: string]: unknown
	} = $props()
</script>

{#if link}
	<a
		class={className}
		href={link}
		{@attach draggable({ text: draggableText, href: link, intent })}
		{...rest}
	>
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
		{@attach draggable({ text: draggableText, intent })}
		{...rest}
	>
		{#if children}
			{@render children()}
		{/if}
	</span>
{/if}
