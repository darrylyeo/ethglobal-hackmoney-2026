<script lang="ts">
	// Types/constants
	import type { Snippet } from 'svelte'
	import type { EntityType } from '$/data/$EntityType.ts'
	import { draggable } from '$/components/Draggable.svelte.ts'
	import { entityIntent } from '$/lib/intents/intentDraggable.svelte.ts'


	// Props
	let {
		link,
		draggableText,
		className,
		entityType,
		entity,
		entityId,
		source,
		children,
		...rest
	}: {
		link?: string
		draggableText: string
		className: string
		entityType?: EntityType
		entity?: { $id: Record<string, unknown> }
		entityId?: Record<string, unknown>
		source?: string
		children?: Snippet
		[key: string]: unknown
	} = $props()

	const effectiveEntityId = $derived(entity?.$id ?? entityId)

	// (Derived)
	const intent = $derived(
		entityType && effectiveEntityId
			? entityIntent(entityType, effectiveEntityId, source)
			: undefined,
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
