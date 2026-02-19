<script lang="ts">
	// Types/constants
	import type { FarcasterUserRow } from '$/collections/FarcasterUsers.ts'
	import EntityView from '$/components/EntityView.svelte'
	import PaginationPlaceholder from '$/components/PaginationPlaceholder.svelte'
	import { EntityType } from '$/data/$EntityType.ts'

	// Props
	let {
		title,
		links,
		getFid,
		userByFid,
		hasMore,
		onLoadMore,
		loading,
		loadMoreLabel,
	}: {
		title: string
		links: Array<{ $id: { sourceFid: number; targetFid: number } }>
		getFid: (link: { $id: { sourceFid: number; targetFid: number } }) => number
		userByFid: Map<number, FarcasterUserRow>
		hasMore: boolean
		onLoadMore: () => void
		loading: boolean
		loadMoreLabel: string
	} = $props()
</script>

<details>
	<summary>{title} ({links.length})</summary>
	<div data-column="gap-2">
		{#each links as link}
			{@const fid = getFid(link)}
			{@const user = userByFid.get(fid)}
			<EntityView
				entityType={EntityType.FarcasterUser}
				entity={user}
				idSerialized={String(fid)}
				href="/farcaster/user/{fid}"
				label={user?.username ? `@${user.username}` : `@${fid}`}
			/>
		{/each}
	</div>
	<PaginationPlaceholder
		{hasMore}
		{onLoadMore}
		{loading}
		label={loadMoreLabel}
	/>
</details>
