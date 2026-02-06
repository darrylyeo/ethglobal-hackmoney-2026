<script lang="ts">
	// Types/constants
	import type { IntentDragPayload } from '$/lib/intents/types'


	// Functions
	import { setIntentDragData } from '$/lib/intents/drag'
	import {
		startIntentDragPreview,
		updateIntentDragTarget,
	} from '$/state/intent-drag-preview.svelte'


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


	// Actions
	const toElement = (event: DragEvent) =>
		event.currentTarget instanceof HTMLElement ? event.currentTarget : null
	const ondragstart = (e: DragEvent) => {
		e.dataTransfer?.setData('text/plain', draggableText)
		if (link) e.dataTransfer?.setData('text/uri-list', link)
		if (intent) {
			setIntentDragData(e, intent)
			const element = toElement(e)
			if (element) startIntentDragPreview({ payload: intent, element })
		}
	}
	const ondragover = (e: DragEvent) => {
		if (!intent) return
		e.preventDefault()
		const element = toElement(e)
		if (element) updateIntentDragTarget({ payload: intent, element })
	}
	const ondrop = (e: DragEvent) => {
		if (!intent) return
		e.preventDefault()
		const element = toElement(e)
		if (element) updateIntentDragTarget({ payload: intent, element })
	}
</script>

{#if link}
	<a
		class={className}
		href={link}
		draggable={true}
		{ondragstart}
		{ondragover}
		{ondrop}
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
		draggable={true}
		{ondragstart}
		{ondragover}
		{ondrop}
		{...rest}
	>
		{#if children}
			{@render children()}
		{/if}
	</span>
{/if}
