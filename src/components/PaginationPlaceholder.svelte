<script lang="ts">
	// Functions
	import { useVisibleAction } from '$/lib/useVisibleAction.ts'


	// Props
	let {
		hasMore = false,
		onLoadMore,
		isLoading = false,
		label = 'Load more',
	}: {
		hasMore?: boolean
		onLoadMore?: () => void
		isLoading?: boolean
		label?: string
	} = $props()
</script>

{#if hasMore
	&& onLoadMore}
	<div
		data-pagination
		use:useVisibleAction={onLoadMore}
	>
		<code data-text="muted">{isLoading
			? 'Loading…'
			: label}</code>
	</div>
{/if}
