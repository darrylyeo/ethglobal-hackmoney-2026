<script lang="ts">
	// Types/constants
	import type { Snippet } from 'svelte'
	import { provideHeadingLevel } from '$/svelte/heading-context.ts'


	// Context
	provideHeadingLevel()


	// Props
	let { children }: { children?: Snippet } = $props()
</script>


{#if children}
	{@render children()}
{/if}
