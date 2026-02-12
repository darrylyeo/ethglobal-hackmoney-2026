<script lang="ts">
	// Components
	import { Button } from 'bits-ui'
	import Spinner from './Spinner.svelte'


	// Props
	let {
		isLoading = false,
		loadingText,
		children,
		disabled,
		...props
	}: {
		isLoading?: boolean
		loadingText?: string
		children: import('svelte').Snippet
		disabled?: boolean
		[key: string]: unknown
	} = $props()
</script>


<Button.Root
	{...props}
	data-row="start gap-2"
	class="loading-button"
	disabled={isLoading || disabled}
	aria-busy={isLoading || undefined}
>
	{#if isLoading}
		<Spinner size="1em" />
		<span>{loadingText ?? 'Loading…'}</span>
	{:else}
		{@render children()}
	{/if}
</Button.Root>
