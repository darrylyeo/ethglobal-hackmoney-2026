<script
	lang="ts"
	generics="_Item, _FilterId extends string = string, _SortId extends string = string"
>
	// Types/constants
	import type { Filter, FilterGroup } from '$/components/Filters.svelte'
	import type { Sort } from '$/components/Sorts.svelte'

	// Components
	import Filters from '$/components/Filters.svelte'
	import Sorts from '$/components/Sorts.svelte'

	// Props
	let {
		title,
		items,
		isLoading,
		filterGroups,
		defaultFilterIds,
		sortOptions,
		defaultSortId,
		getKey,
		filter: filterFn,
		loadingMessage = 'Loading…',
		emptyMessage = 'No items found.',
		Item,
		AfterList,
	}: {
		title: string
		items: _Item[]
		isLoading: boolean
		filterGroups: FilterGroup<_Item, _FilterId>[]
		defaultFilterIds: Set<_FilterId>
		sortOptions?: Sort<_Item, _SortId>[]
		defaultSortId?: _SortId
		getKey: (item: _Item) => string
		filter?: (item: _Item) => boolean
		loadingMessage?: string
		emptyMessage?: string
		Item: import('svelte').Snippet<[{ item: _Item }]>
		AfterList?: import('svelte').Snippet
	} = $props()


	// State
	let activeFilters = $state(new Set<Filter<_Item, _FilterId>>())
	let filteredItems = $state<_Item[]>([])
	let sortedItems = $state<_Item[]>([])
	let hasAppliedDefaultFilters = $state(false)

	// (Derived)
	const hasFilterGroups = $derived(
		filterGroups.length > 0 &&
			filterGroups.some((g) => g.filters.length > 1),
	)
	const hasSortOptions = $derived((sortOptions?.length ?? 0) > 1)
	const baseItems = $derived(hasFilterGroups ? filteredItems : items)
	const itemsToSort = $derived(
		filterFn ? baseItems.filter(filterFn) : baseItems,
	)
	const displayItems = $derived(
		hasSortOptions ? sortedItems : itemsToSort,
	)

	$effect(() => {
		if (!hasFilterGroups) filteredItems = items
	})
	$effect(() => {
		if (!hasSortOptions) sortedItems = itemsToSort
	})
	$effect(() => {
		if (
			!hasAppliedDefaultFilters &&
			defaultFilterIds.size > 0 &&
			activeFilters.size === 0
		) {
			const matching = filterGroups.flatMap((g) =>
				g.filters.filter((f) => defaultFilterIds.has(f.id as _FilterId)),
			)
			if (matching.length > 0) {
				activeFilters = new Set(matching)
				hasAppliedDefaultFilters = true
			}
		}
	})
</script>

<details data-card data-scroll-container="block" open>
	<summary>
		<div data-row="gap-4 wrap">
			<h3 class="section-heading">{title} ({displayItems.length})</h3>
			{#if hasFilterGroups || hasSortOptions}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div
					role="group"
					aria-label="Filters and sorts"
					data-row="gap-2 wrap"
					onclick={(e) => e.stopPropagation()}
					onkeydown={(e) => e.stopPropagation()}
				>
					{#if hasFilterGroups}
						<Filters
							items={items}
							{filterGroups}
							bind:activeFilters
							bind:filteredItems
							onreset={(e) => {
								e.preventDefault()
								activeFilters = new Set()
							}}
						/>
					{/if}
					{#if hasSortOptions}
						<Sorts
							items={itemsToSort}
							sortOptions={sortOptions!}
							defaultSortId={defaultSortId}
							bind:sortedItems
						/>
					{/if}
				</div>
			{/if}
		</div>
	</summary>
	{#if displayItems.length === 0 && isLoading}
		<p data-text="muted">{loadingMessage}</p>
	{:else if displayItems.length === 0}
		<p data-text="muted">{emptyMessage}</p>
	{:else}
		<div data-column="gap-4">
			{#each displayItems as item (getKey(item))}
				{@render Item({ item })}
			{/each}
			{#if AfterList}
				{@render AfterList()}
			{/if}
		</div>
	{/if}
</details>

<style>
	.section-heading {
		font-size: 1rem;
		margin: 0;
	}
</style>
