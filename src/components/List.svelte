<script module lang="ts">
	export type { ListPagination } from '$/components/List.svelte.ts'
</script>


<script
	lang="ts"
	generics="
		_Item,
		_Key extends string | number = string | number,
		_GroupKey extends string | number = string | number
	"
>
	// Types/constants
	import type { ListPagination } from '$/components/List.svelte.ts'
	import type { Match } from '$/lib/fuzzyMatch.ts'
	import type { Snippet } from 'svelte'
	import { useVisibleAction } from '$/lib/useVisibleAction.ts'
	import { createViewTransition } from '$/lib/viewTransition.ts'
	import { untrack } from 'svelte'
	import { SvelteMap, SvelteSet } from 'svelte/reactivity'


	// Props
	let {
		items = $bindable(new SvelteSet()),
		getKey,
		getSortValue,
		getIsHidden,
		getGroupKey,
		getGroupLabel,
		getGroupKeyForPlaceholder,
		placeholderKeys,
		visiblePlaceholderKeys = $bindable([] as _Key[]),
		scrollPosition = 'Auto',
		pagination,
		searchQuery = $bindable(''),
		matchesForItem = $bindable(
			new SvelteMap<_Item, SvelteSet<Match>>()
		),
		GroupHeader,
		Item,
		Empty,
		...rootProps
	}: {
		items: Set<_Item>
		getKey: (item: _Item) => _Key
		getSortValue: (item: _Item) => number | string
		getIsHidden?: (item: _Item) => boolean
		getGroupKey?: (item: _Item) => _GroupKey
		getGroupLabel?: (groupKey: _GroupKey) => string
		getGroupKeyForPlaceholder?: (key: _Key) => _GroupKey
		placeholderKeys: Set<_Key | [number, number]>
		visiblePlaceholderKeys?: _Key[]
		scrollPosition?: 'Start' | 'End' | 'Auto'
		pagination?: ListPagination
		searchQuery?: string
		matchesForItem?: SvelteMap<_Item, SvelteSet<Match>>
		GroupHeader?: Snippet<[{ groupKey: _GroupKey }]>
		Item: Snippet<
			[
				{
					key: _Key
				} & (
					| {
							item: _Item
							isPlaceholder: false
							searchQuery?: string
							matches?: SvelteSet<Match>
						}
					| { item?: never; isPlaceholder: true }
				),
			]
		>
		Empty?: Snippet<[]>
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
	const viewTransitionName = (key: _Key): string => (
		'list-item-' + String(key).replace(/^\d/, '_$&').replace(/[^a-zA-Z0-9_-]/g, '_')
	)

	// (Derived)
	const sortedItems = $derived(
		[...items].sort((itemA, itemB) => {
			const sortValueA = getSortValue(itemA)
			const sortValueB = getSortValue(itemB)
			return sortValueA < sortValueB ?
				-1
			: sortValueA > sortValueB ?
				1
			:
				0
		})
	)
	const searchQueryNormalized = $derived(
		searchQuery.trim().toLowerCase()
	)
	const hasSearch = $derived(
		!!searchQueryNormalized
	)
	$effect(() => {
		const query = searchQueryNormalized
		const _itemsSize = items.size
		if (!query) {
			untrack(() => matchesForItem.clear())
			return
		}
		untrack(() => {
			for (const item of sortedItems) {
				if (!matchesForItem.has(item)) matchesForItem.set(item, new SvelteSet())
			}
		})
	})
	const itemsToShow = $derived(
		sortedItems
	)
	const matchOrder = $derived(
		hasSearch ?
			(() => {
					const score = (ms: SvelteSet<Match> | undefined) => {
						if (!ms?.size) return { total: 0, spans: 0, minStart: Infinity, spread: Infinity }
						const arr = [...ms]
						const total = arr.reduce((s, m) => s + (m.end - m.start), 0)
						const minStart = Math.min(...arr.map((m) => m.start))
						const maxEnd = Math.max(...arr.map((m) => m.end))
						return {
							total,
							spans: ms.size,
							minStart,
							spread: maxEnd - minStart,
						}
					}
					return [...sortedItems].sort((a, b) => {
						const sa = score(matchesForItem.get(a))
						const sb = score(matchesForItem.get(b))
						if (sb.total !== sa.total) return sb.total - sa.total
						if (sa.spans !== sb.spans) return sa.spans - sb.spans
						if (sa.minStart !== sb.minStart) return sa.minStart - sb.minStart
						if (sa.spread !== sb.spread) return sa.spread - sb.spread
						return getSortValue(a) < getSortValue(b) ?
								-1
							: getSortValue(a) > getSortValue(b) ?
								1
							:
								0
					})
				})()
			:
				[]
	)

	// State: order applied inside view transition so reorder animates
	let committedMatchOrder = $state<_Item[]>([])
	const viewTransition = createViewTransition()
	$effect(() => {
		const next = matchOrder
		viewTransition.schedule(() => {
			committedMatchOrder = next
		})
	})

	const groupEntries = $derived(
		getGroupKey && getGroupLabel ?
			[...Map.groupBy(itemsToShow, getGroupKey!).entries()]
		:
			null
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
		:
			itemsToShow.map((item) => ({
				type: 'item' as const,
				key: getKey(item),
				item,
				isPlaceholder: false as const,
			}))
	)
	const placeholderRows = $derived(
		visiblePlaceholderKeys
			.filter((key) => isPlaceholderKey(key))
			.map((key) => ({
				type: 'placeholder' as const,
				key,
				isPlaceholder: true as const,
			}))
	)
	const isEmpty = $derived(
		itemRows.length === 0 && placeholderRows.length === 0
	)
	const allRows = $derived.by(() => {
		if (
			getGroupKey &&
			getGroupLabel &&
			getGroupKeyForPlaceholder &&
			groupEntries
		) {
			const placeholderByGroup = new Map<_GroupKey, _Key[]>()
			for (const key of placeholderRows) {
				const g = getGroupKeyForPlaceholder(key.key)
				const arr = placeholderByGroup.get(g) ?? []
				arr.push(key.key)
				placeholderByGroup.set(g, arr)
			}
			const groupKeys = new Set<_GroupKey>([
				...groupEntries.map(([k]) => k),
				...placeholderByGroup.keys(),
			])
			const maxBlockInGroup = (g: _GroupKey) => (
				Math.max(
					...(groupEntries.find(([k]) => k === g)?.[1]?.map((i) => -Number(getSortValue(i))) ?? []),
					...(placeholderByGroup.get(g)?.map((k) => Number(k)) ?? []),
				)
			)
			const groupOrder = [...groupKeys].sort(
				(ga, gb) => maxBlockInGroup(gb) - maxBlockInGroup(ga),
			)
			return [
				...groupOrder.flatMap((groupKey) => [
					{ type: 'group' as const, groupKey },
					...(groupEntries.find(([k]) => k === groupKey)?.[1]?.map((item) => ({
						type: 'item' as const,
						key: getKey(item),
						item,
						isPlaceholder: false as const,
					})) ?? []),
					...(
						(placeholderByGroup.get(groupKey) ?? [])
							.sort((a, b) => Number(b) - Number(a))
							.map((key) => ({
								type: 'placeholder' as const,
								key,
								isPlaceholder: true as const,
							}))
					),
				]),
				...(
					pagination?.hasMore ?
						[{ type: 'pagination' as const, key: '__pagination__' }]
					: []
				),
			]
		}
		return [
			...itemRows,
			...placeholderRows,
			...(
				pagination?.hasMore ?
					[{ type: 'pagination' as const, key: '__pagination__' }]
				: []
			),
		]
	})
</script>


{#if isEmpty && Empty}
	<div data-empty>
		{@render Empty()}
	</div>
{:else}
	<ul
		class="items-list anchor-{scrollPosition.toLowerCase()}"
		class:many-items={allRows.length > 200}
		data-list="unstyled"
		data-sticky-container
		{...rootProps}
	>
		{#each allRows.slice(0, 100) as item (item.type === 'group' ?
			`group:${item.groupKey}`
		:
			item.key)}
			{#if item.type === 'group'}
				<li data-list-item data-sticky data-scroll-item="snap-block-start">
					{#if GroupHeader}
						{@render GroupHeader({ groupKey: item.groupKey })}
					{:else}
						{getGroupLabel!(item.groupKey)}
					{/if}
				</li>
			{:else if item.type === 'placeholder'}
				<li data-list-item data-placeholder data-scroll-item="snap-block-start">
					{@render Item({ key: item.key, isPlaceholder: true as const })}
				</li>
			{:else if item.type === 'pagination'}
				<li
					data-list-item
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
							:
								(pagination?.label ?? 'Load more')}
						</code>
					{/if}
				</li>
			{:else}
				{@const hasNoSearchMatches = hasSearch && (matchesForItem.get(item.item)?.size ?? 0) === 0}

				{@const isHidden = getIsHidden ? getIsHidden(item.item) : false}

				{@const visualOrder = hasSearch ? committedMatchOrder.indexOf(item.item) + 1 : undefined}

				<li
					data-list-item
					data-scroll-item="snap-block-start"
					style={visualOrder != null ? `order: ${visualOrder}` : undefined}
					style:view-transition-name={viewTransitionName(item.key)}
					{...(isHidden || hasNoSearchMatches) && {
						hidden: true,
						inert: true,
					}}
				>
					{@render Item({
						key: item.key,
						item: item.item,
						isPlaceholder: false as const,
						searchQuery,
						matches: matchesForItem.get(item.item),
					})}
				</li>
			{/if}
		{/each}
	</ul>
{/if}


<style>
	.items-list {
		&.anchor-start > li:first-child,
		&.anchor-start > [data-list-item]:first-child {
			overflow-anchor: auto;
		}
		&.anchor-end > li:last-child,
		&.anchor-end > [data-list-item]:last-child {
			overflow-anchor: auto;
		}
		&.many-items > li,
		&.many-items > [data-list-item] {
			content-visibility: auto;
			contain-intrinsic-block-size: 0 60px;
		}
	}
</style>
