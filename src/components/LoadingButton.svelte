<script lang="ts">


	// Components
	import { Button } from 'bits-ui'
	import Spinner from './Spinner.svelte'


	// Props
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
	data-row="start gap-2"
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
