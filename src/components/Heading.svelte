<script lang="ts">
	// Context
	import { useHeadingLevel } from '$/svelte/heading-context.ts'


	// Props
	let {
		children,
		...rest
	}: {
		children?: import('svelte').Snippet
		[key: string]: unknown
	} = $props()

	// (Derived)
	const level = $derived(useHeadingLevel() || 1)
</script>


{#if level >= 1 && level <= 6}
	<svelte:element
		this={'h' + level}
		{...rest}
	>
		{#if children}
			{@render children()}
		{/if}
	</svelte:element>
{:else}
	<div
		role="heading"
		aria-level={level}
		{...rest}
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
{/if}
