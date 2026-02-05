<script lang="ts">
	// Types/constants
	import type { Snippet } from 'svelte'


	// Props
	let {
		title,
		description,
		Params,
		Protocol,
		Preview,
		onSubmit,
	}: {
		title: string
		description?: string
		Params?: Snippet
		Protocol?: Snippet
		Preview?: Snippet
		onSubmit?: (event: SubmitEvent) => void
	} = $props()
</script>


<form data-session-action data-card data-column="gap-3" onsubmit={onSubmit}>
	<header data-row="gap-2 align-center justify-between">
		<div data-column="gap-1">
			<h2>{title}</h2>
			{#if description}
				<p data-muted>{description}</p>
			{/if}
		</div>
	</header>

	<div data-grid="columns-auto column-min-16 gap-6">
		<section data-column="gap-3">
			{@render Params?.()}
		</section>
		<section data-column="gap-3">
			{@render Protocol?.()}
		</section>
		<section data-column="gap-3">
			{@render Preview?.()}
		</section>
	</div>
</form>
