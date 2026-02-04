<script lang="ts">
	// Types/constants
	import type { Snippet } from 'svelte'

	// Props
	let {
		title,
		Context,
		Actions,
	}: {
		title: string
		Context?: Snippet
		Actions?: Snippet
	} = $props()
</script>


<main
	id="main"
	data-session
	data-column="gap-4"
	data-sticky-container
>
	<section data-scroll-item data-column="gap-2">
		<h1>{title}</h1>
		{#if Context}
			<div data-column="gap-2">
				{@render Context()}
			</div>
		{/if}
	</section>

	<section data-scroll-item data-column="gap-4">
		{@render Actions?.()}
	</section>
</main>
