<script lang="ts">
	// Context
	import { provideHeadingLevel } from '$/svelte/heading-context.ts'
	provideHeadingLevel()


	// Props
	let { children }: { children?: import('svelte').Snippet } = $props()
</script>


{#if children}
	{@render children()}
{/if}
