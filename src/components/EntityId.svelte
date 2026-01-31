<script lang="ts">
	// Props
	let {
		link,
		draggableText,
		className,
		children,
	}: {
		link?: string
		draggableText: string
		className: string
		children?: import('svelte').Snippet
	} = $props()


	// Actions
	const ondragstart = (e: DragEvent) => {
		e.dataTransfer?.setData('text/plain', draggableText)
		if (link) e.dataTransfer?.setData('text/uri-list', link)
	}
</script>


{#if link}
	<a
		class={className}
		href={link}
		draggable={true}
		{ondragstart}
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
	>
		{#if children}
			{@render children()}
		{/if}
	</span>
{/if}
