<script
	lang="ts"
	generics="
		_Item,
		_Key extends string | number = string | number,
		_GroupKey extends string | number = string | number
	"
>
	// Types/constants
	import type { Snippet } from 'svelte'
	import type { ItemsListPagination } from '$/components/ItemsList.types.ts'
	import { useVisibleAction } from '$/lib/useVisibleAction.ts'

	// Props
	import { SvelteSet } from 'svelte/reactivity'

	let {
		items = $bindable(new SvelteSet()),
		getKey,
		getSortValue,
		getGroupKey,
		getGroupLabel,
		placeholderKeys,
		visiblePlaceholderKeys = $bindable([] as _Key[]),
		scrollPosition = 'Auto',
		pagination,
		Item,
		GroupHeader,
		...rootProps
	}: {
		items: Set<_Item>
		getKey: (item: _Item) => _Key
		getSortValue: (item: _Item) => number | string
		getGroupKey?: (item: _Item) => _GroupKey
		getGroupLabel?: (groupKey: _GroupKey) => string
		placeholderKeys: Set<_Key | [number, number]>
		visiblePlaceholderKeys?: _Key[]
		scrollPosition?: 'Start' | 'End' | 'Auto'
		pagination?: ItemsListPagination
		GroupHeader?: Snippet<[{ groupKey: _GroupKey }]>
		Item: Snippet<
			[
				{
					key: _Key
				} & (
					| { item: _Item; isPlaceholder: false }
					| { item?: never; isPlaceholder: true }
				),
			]
		>
		[key: string]: unknown
	} = $props()


	// Functions
	const isPlaceholderKey = (key: _Key): boolean => {
		for (const entry of placeholderKeys)
			if (
				Array.isArray(entry)
					? typeof key === 'number' && key >= entry[0] && key <= entry[1]
					: key === entry
			)
				return true
		return false
	}


	// (Derived)
	const sortedItems = $derived(
		[...items].sort((itemA, itemB) => {
			const sortValueA = getSortValue(itemA)
			const sortValueB = getSortValue(itemB)
			return sortValueA < sortValueB ?
				-1
			: sortValueA > sortValueB ?
				1
			: 0
		}),
	)
	const hasGrouping = $derived(Boolean(getGroupKey && getGroupLabel))
	const groupEntries = $derived(
		hasGrouping ?
			[...Map.groupBy(sortedItems, getGroupKey!).entries()]
		: null,
	)
	const itemRows = $derived(
		groupEntries ?
			groupEntries.flatMap(([groupKey, groupItems]) => [
				{ type: 'group' as const, groupKey },
				...groupItems.map((item) => ({
					type: 'item' as const,
					key: getKey(item),
					item,
					isPlaceholder: false as const,
				})),
			])
		: sortedItems.map((item) => ({
				type: 'item' as const,
				key: getKey(item),
				item,
				isPlaceholder: false as const,
			})),
	)
	const placeholderRows = $derived(
		visiblePlaceholderKeys
			.filter((key) => isPlaceholderKey(key))
			.map((key) => ({
				type: 'placeholder' as const,
				key,
				isPlaceholder: true as const,
			})),
	)
	const paginationRow = $derived(
		pagination?.hasMore ?
			({ type: 'pagination' as const, key: '__pagination__' })
		: null,
	)
	const allRows = $derived([
		...itemRows,
		...placeholderRows,
		...(paginationRow ?
			[paginationRow]
		: []),
	])
	const manyItems = $derived(allRows.length > 200)
</script>


<!-- scrollPosition: Start/End = overflow-anchor on first/last li; Auto = browser default -->
<ul
	class="items-list anchor-{scrollPosition.toLowerCase()}"
	class:many-items={manyItems}
	data-sticky-container
	{...rootProps}
>
	{#each allRows as row (row.type === 'group' ?
		`group:${row.groupKey}`
	: row.key)}
		{#if row.type === 'group'}
			<li data-sticky data-scroll-item="snap-block-start">
				{#if GroupHeader}
					{@render GroupHeader({ groupKey: row.groupKey })}
				{:else}
					{getGroupLabel!(row.groupKey)}
				{/if}
			</li>
		{:else if row.type === 'placeholder'}
			<li data-placeholder data-scroll-item="snap-block-start">
				{@render Item({ key: row.key, isPlaceholder: true as const })}
			</li>
		{:else if row.type === 'pagination'}
			<li
				data-pagination
				data-scroll-item="snap-block-start"
				use:useVisibleAction={pagination?.onLoadMore}
			>
				{#if pagination?.Placeholder}
					{@render pagination.Placeholder({ loading: pagination.loading ?? false })}
				{:else}
					<code data-text="muted">
						{(pagination?.loading ?? false) ?
						'Loading…'
					: (pagination?.label ?? 'Load more')}
					</code>
				{/if}
			</li>
		{:else}
			<li data-scroll-item="snap-block-start">
				{@render Item({
					key: row.key,
					item: row.item,
					isPlaceholder: false as const,
				})}
			</li>
		{/if}
	{/each}
</ul>


<style>
	.items-list {
		&.anchor-start > li:first-child {
			overflow-anchor: auto;
		}
		&.anchor-end > li:last-child {
			overflow-anchor: auto;
		}
		&.many-items > li {
			content-visibility: auto;
			contain-intrinsic-block-size: 0 60px;
		}
	}
</style>
