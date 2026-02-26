<script lang="ts">
	// Types/constants
	import type { FarcasterUserRow } from '$/collections/FarcasterUsers.ts'
	import { EntityType } from '$/data/$EntityType.ts'


	// Props
	let {
		title,
		links,
		getFid,
		userByFid,
		hasMore,
		onLoadMore,
		isLoading,
		loadMoreLabel,
	}: {
		title: string
		links: Array<{ $id: { sourceFid: number; targetFid: number } }>
		getFid: (link: { $id: { sourceFid: number; targetFid: number } }) => number
		userByFid: Map<number, FarcasterUserRow>
		hasMore: boolean
		onLoadMore: () => void
		isLoading: boolean
		loadMoreLabel: string
	} = $props()


	// Components
	import Collapsible from '$/components/Collapsible.svelte'
	import EntityView from '$/components/EntityView.svelte'
	import PaginationPlaceholder from '$/components/PaginationPlaceholder.svelte'
</script>

<Collapsible title={title} annotation={String(links.length)}>
	<div data-column>
		{#each links as link}
			{@const fid = getFid(link)}
			{@const user = userByFid.get(fid)}
			<EntityView
				entityType={EntityType.FarcasterUser}
				entity={user}
				href="/farcaster/user/{fid}"
				label={user?.username ? `@${user.username}` : `@${fid}`}
			/>
		{/each}
	</div>
	<PaginationPlaceholder
		{hasMore}
		{onLoadMore}
		{isLoading}
		label={loadMoreLabel}
	/>
</Collapsible>
