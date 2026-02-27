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


	// (Derived)
	const linksSet = $derived(new Set(links))
	const getKey = (link: { $id: { sourceFid: number; targetFid: number } }) =>
		`${link.$id.sourceFid}-${link.$id.targetFid}`


	// Components
	import Collapsible from '$/components/Collapsible.svelte'
	import EntityView from '$/components/EntityView.svelte'
	import ItemsList from '$/components/ItemsList.svelte'
	import PaginationPlaceholder from '$/components/PaginationPlaceholder.svelte'
</script>

<Collapsible title={title} annotation={String(links.length)}>
	<div data-column>
		<ItemsList
			items={linksSet}
			{getKey}
			getSortValue={(link) => getFid(link)}
			placeholderKeys={new Set<string>()}
		>
			{#snippet Empty()}
				<p data-text="muted">No links.</p>
			{/snippet}
			{#snippet Item({ key: _k, item: link, isPlaceholder })}
				{#if !isPlaceholder && link != null}
					{@const fid = getFid(link)}
					{@const user = userByFid.get(fid)}
					<EntityView
						entityType={EntityType.FarcasterUser}
						entity={user}
						titleHref={`/farcaster/user/${fid}`}
						label={user?.username ? `@${user.username}` : `@${fid}`}
					/>
				{/if}
			{/snippet}
		</ItemsList>
		<PaginationPlaceholder
			{hasMore}
			{onLoadMore}
			{isLoading}
			label={loadMoreLabel}
		/>
	</div>
</Collapsible>
