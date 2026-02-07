<script lang="ts">


	// Types/constants
	import type { EntityType } from '$/data/$EntityType.ts'


	// Props
	let {
		link,
		draggableText,
		className,
		entityType,
		entityId,
		source,
		children,
		...rest
	}: {
		link?: string
		draggableText: string
		className: string
		entityType?: EntityType
		entityId?: Record<string, unknown>
		source?: string
		children?: import('svelte').Snippet
		[key: string]: unknown
	} = $props()


	// Functions
	import { entityIntent } from '$/lib/intents/intentDraggable.svelte.ts'
	import { draggable } from '$/components/Draggable.svelte.ts'


	// (Derived)
	const intent = $derived(
		entityType && entityId ? entityIntent(entityType, entityId, source) : undefined,
	)
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
