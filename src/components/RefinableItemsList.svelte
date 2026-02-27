<script
	lang="ts"
	generics="
		_Item,
		_Key extends string | number = string | number,
		_GroupKey extends string | number = string | number,
		_FilterId extends string = string,
		_SortId extends string = string
	"
>
	// Types/constants
	import type { Filter, FilterGroup } from '$/components/Filters.svelte'
	import type { Sort } from '$/components/Sorts.svelte'
	import type { ItemsListPagination } from '$/components/ItemsList.types.ts'
	import type { Match } from '$/lib/fuzzyMatch.ts'
	import type { Snippet } from 'svelte'
	import { SvelteMap, SvelteSet } from 'svelte/reactivity'


	// Props
	let {
		items,
		filterGroups = [],
		defaultFilterIds = new Set<_FilterId>(),
		sortOptions,
		defaultSortId,
		getKey,
		getSortValue,
		getGroupKey,
		getGroupLabel,
		getGroupKeyForPlaceholder,
		placeholderKeys = new Set<_Key | [number, number]>(),
		visiblePlaceholderKeys = $bindable([] as _Key[]),
		scrollPosition = 'Auto',
		pagination,
		searchQuery = $bindable(''),
		searchPlaceholder,
		searchInputRef = $bindable(null as HTMLInputElement | null),
		matchesForItem = $bindable(new SvelteMap<_Item, SvelteSet<Match>>()),
		activeFilters = $bindable(new Set<Filter<_Item, _FilterId>>()),
		displayCount = $bindable(0),
		filter,
		Item,
		GroupHeader,
		Empty,
		...rootProps
	}: {
		items: _Item[]
		filterGroups?: FilterGroup<_Item, _FilterId>[]
		defaultFilterIds?: Set<_FilterId>
		sortOptions?: Sort<_Item, _SortId>[]
		defaultSortId?: _SortId
		getKey: (item: _Item) => _Key
		getSortValue?: (item: _Item) => number | string
		getGroupKey?: (item: _Item) => _GroupKey
		getGroupLabel?: (groupKey: _GroupKey) => string
		getGroupKeyForPlaceholder?: (key: _Key) => _GroupKey
		placeholderKeys?: Set<_Key | [number, number]>
		visiblePlaceholderKeys?: _Key[]
		scrollPosition?: 'Start' | 'End' | 'Auto'
		pagination?: ItemsListPagination
		searchQuery?: string
		searchPlaceholder?: string
		searchInputRef?: HTMLInputElement | null
		matchesForItem?: SvelteMap<_Item, SvelteSet<Match>>
		activeFilters?: Set<Filter<_Item, _FilterId>>
		displayCount?: number
		filter?: (item: _Item) => boolean
		GroupHeader?: Snippet<[{ groupKey: _GroupKey }]>
		Empty?: Snippet<[]>
		Item: Snippet<
			[
				& {
					key: _Key
				}
				& (
					| {
							item: _Item
							isPlaceholder: false
							searchQuery?: string
							matches?: SvelteSet<Match>
						}
					| {
						item?: never
						isPlaceholder: true
						searchQuery?: string
						matches?: SvelteSet<Match>
					}
				),
			]
		>
		[key: string]: unknown
	} = $props()


	// State
	let filteredItems = $state<_Item[]>([])
	let sortedItems = $state<_Item[]>([])
	let hasAppliedDefaultFilters = $state(false)

	// (Derived)
	const hasFilterGroups = $derived(
		filterGroups.length > 0 && filterGroups.some((g) => g.filters.length > 1),
	)
	const hasSortOptions = $derived((sortOptions?.length ?? 0) > 1)
	const itemsToSort = $derived(
		(filter ? (hasFilterGroups ? filteredItems : items).filter(filter) : (hasFilterGroups ? filteredItems : items)),
	)
	const displayItems = $derived(hasSortOptions ? sortedItems : itemsToSort)
	const itemsSet = $derived(new SvelteSet(displayItems))
	const orderMap = $derived(new Map(displayItems.map((item, i) => [getKey(item), i])))

	// Actions
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
	$effect(() => {
		if (defaultFilterIds.size > 0 && filterGroups.length > 0) {
			const matching = filterGroups.flatMap((g) =>
				g.filters.filter((f) => defaultFilterIds.has(f.id as _FilterId)),
			)
			if (matching.length > 0) activeFilters = new Set(matching)
		}
	})
	$effect(() => {
		displayCount = displayItems.length
	})

	// Functions
	function handleKeydown(e: KeyboardEvent) {
		const input = searchInputRef
		if (
			!input ||
			e.ctrlKey ||
			e.metaKey ||
			e.altKey ||
			e.key.length !== 1 ||
			!/^[a-zA-Z]$/.test(e.key) ||
			input.contains(e.target as Node)
		)
			return
		e.preventDefault()
		input.focus()
		searchQuery = searchQuery + e.key
	}

	// Components
	import Filters from '$/components/Filters.svelte'
	import List from '$/components/List.svelte'
	import Sorts from '$/components/Sorts.svelte'
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	data-refinable-items-list
	data-sticky-container
	role="group"
	aria-label="Refinable list"
	onkeydown={handleKeydown}
>
	{#if searchPlaceholder != null || hasFilterGroups || hasSortOptions}
		<div
			data-sticky
			data-row="gap-4 wrap"
			role="group"
			aria-label="Search, filters and sorts"
		>
			{#if searchPlaceholder != null}
				<label data-row="align-center">
					<input
						type="search"
						bind:value={searchQuery}
						bind:this={searchInputRef}
						placeholder={searchPlaceholder}
						aria-label="Filter list"
					/>
				</label>
			{/if}
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
					{defaultSortId}
					bind:sortedItems
				/>
			{/if}
		</div>
	{/if}
	<ItemsList
		items={itemsSet}
		{getKey}
		getSortValue={getSortValue ?? ((item: _Item) => orderMap.get(getKey(item)) ?? Infinity)}
		{getGroupKey}
		{getGroupLabel}
		{getGroupKeyForPlaceholder}
		{placeholderKeys}
		bind:visiblePlaceholderKeys
		{scrollPosition}
		{pagination}
		bind:searchQuery
		bind:matchesForItem
		{Item}
		{GroupHeader}
		{Empty}
		{...rootProps}
	/>
</div>
