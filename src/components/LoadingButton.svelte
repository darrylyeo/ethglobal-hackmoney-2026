<script lang="ts">
	// Components
	import { Button } from 'bits-ui'
	import Spinner from './Spinner.svelte'

	let {
		loading = false,
		loadingText,
		children,
		disabled,
		...props
	}: {
		loading?: boolean
		loadingText?: string
		children: import('svelte').Snippet
		disabled?: boolean
		[key: string]: unknown
	} = $props()
</script>

<Button.Root
	{...props}
	class="loading-button"
	disabled={loading || disabled}
	aria-busy={loading || undefined}
>
	{#if loading}
		<Spinner size="1em" />
		<span>{loadingText ?? 'Loading…'}</span>
	{:else}
		{@render children()}
	{/if}
</Button.Root>

<style>
	:global(.loading-button) {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
	}
</style>
