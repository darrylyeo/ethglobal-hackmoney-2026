<script lang="ts">
	import { useVisibleAction } from '$/lib/useVisibleAction.ts'

	let {
		hasMore = false,
		onLoadMore,
		loading = false,
		label = 'Load more',
	}: {
		hasMore?: boolean
		onLoadMore?: () => void
		loading?: boolean
		label?: string
	} = $props()
</script>

{#if hasMore && onLoadMore}
	<div
		data-pagination
		use:useVisibleAction={onLoadMore}
	>
		<code data-text="muted">{loading ? 'Loading…' : label}</code>
	</div>
{/if}
