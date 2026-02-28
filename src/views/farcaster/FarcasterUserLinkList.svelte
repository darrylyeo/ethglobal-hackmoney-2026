<script lang="ts">
	// Types/constants
	import type { WithSource } from '$/constants/data-sources.ts'
	import type { FarcasterUser } from '$/data/FarcasterUser.ts'
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
		userByFid: Map<number, WithSource<FarcasterUser>>
		hasMore: boolean
		onLoadMore: () => void
		isLoading: boolean
		loadMoreLabel: string
	} = $props()

	// (Derived)
	const getKey = (link: { $id: { sourceFid: number; targetFid: number } }) =>
		`${link.$id.sourceFid}-${link.$id.targetFid}`


	// Components
	import Collapsible from '$/components/Collapsible.svelte'
	import EntityView from '$/components/EntityView.svelte'
	import RefinableList from '$/components/RefinableList.svelte'
	import SearchableText from '$/components/SearchableText.svelte'
</script>


<Collapsible title={title} annotation={String(links.length)}>
	<div data-column>
		<RefinableList
			items={links}
			filterGroups={[]}
			defaultFilterIds={new Set<string>()}
			sortOptions={[
				{
					id: 'fid',
					label: 'By user',
					compare: (a, b) => getFid(a) - getFid(b),
				},
			]}
			defaultSortId="fid"
			{getKey}
			getSortValue={(link) => getFid(link)}
			placeholderKeys={new Set<string>()}
			pagination={
				hasMore ?
					{
						hasMore: true,
						onLoadMore,
						loading: isLoading,
						label: loadMoreLabel,
					}
				:	undefined
			}
		>
			{#snippet Item({ key: _k, item: link, isPlaceholder, searchQuery: q, matches })}
				{#if !isPlaceholder && link != null}
					{@const fid = getFid(link)}
					{@const user = userByFid.get(fid)}
					{@const label = user?.username ? `@${user.username}` : `@${fid}`}
					<EntityView
						entityType={EntityType.FarcasterUser}
						entity={user}
						titleHref={`/farcaster/user/${fid}`}
						label={label}
					>
						{#snippet Title()}
							{#if q != null && q !== ''}
								<SearchableText text={label} query={q} {matches} />
							{:else}
								{label}
							{/if}
						{/snippet}
					</EntityView>
				{/if}
			{/snippet}

			{#snippet Empty()}
				<p data-text="muted">No links.</p>
			{/snippet}
		</RefinableList>
	</div>
</Collapsible>
