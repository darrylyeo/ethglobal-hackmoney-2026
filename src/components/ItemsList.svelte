<script lang="ts" generics="_Item, Key = string | number">
	// Types/constants
	import type { Snippet } from 'svelte'


	// Props
	let {
		items,
		getKey,
		getSortValue,
		getGroupKey,
		getGroupLabel,
		placeholderKeys,
		visiblePlaceholderKeys = $bindable([] as Key[]),
		scrollPosition = 'Auto',
		Item,
		...rootProps
	}: {
		items: Set<_Item>
		getKey: (item: _Item) => Key
		getSortValue: (item: _Item) => number | string
		getGroupKey?: (item: _Item) => Key
		getGroupLabel?: (groupKey: Key) => string
		placeholderKeys: Set<Key | [number, number]>
		visiblePlaceholderKeys?: Key[]
		scrollPosition?: 'Start' | 'End' | 'Auto'
		Item: Snippet<
			[
				{
					key: Key
				} & (
					| { item: _Item; isPlaceholder: true }
					| { item?: never; isPlaceholder: false }
				),
			]
		>
		[key: string]: unknown
	} = $props()


	// (Derived)
	const expandedPlaceholderKeys = $derived(
		(() => {
			const out = new Set<Key>()
			for (const el of placeholderKeys)
				if (Array.isArray(el)) {
					const [lo, hi] = el
					for (let i = lo; i <= hi; i++) out.add(i as Key)
				} else out.add(el)
			return out
		})(),
	)
	const sortedItems = $derived(
		[...items].sort((a, b) => {
			const va = getSortValue(a)
			const vb = getSortValue(b)
			return va < vb ? -1 : va > vb ? 1 : 0
		}),
	)
	const grouped = $derived(
		getGroupKey && getGroupLabel
			? Map.groupBy(sortedItems, getGroupKey)
			: (null as Map<Key, _Item[]> | null),
	)
	type Row =
		| { type: 'group'; groupKey: Key }
		| { type: 'item'; key: Key; item: _Item; isPlaceholder: true }
		| { type: 'placeholder'; key: Key; isPlaceholder: false }
	const itemRows = $derived(
		grouped
			? [...grouped.entries()].flatMap(([groupKey, groupItems]): Row[] => [
					{ type: 'group', groupKey },
					...groupItems.map((item) => ({
						type: 'item' as const,
						key: getKey(item),
						item,
						isPlaceholder: true as const,
					})),
				])
			: sortedItems.map(
					(item): Row => ({
						type: 'item',
						key: getKey(item),
						item,
						isPlaceholder: true,
					}),
				),
	)
	const placeholderRows = $derived(
		visiblePlaceholderKeys
			.filter((key) => expandedPlaceholderKeys.has(key))
			.map((key): Row => ({ type: 'placeholder', key, isPlaceholder: false })),
	)
	const allRows = $derived([...itemRows, ...placeholderRows])
	const listKey = $derived((row: Row) =>
		row.type === 'group' ? `group:${row.groupKey}` : row.key,
	)
</script>


<!--
  scrollPosition: 'Start' | 'End' | 'Auto'
  Preserves scroll position across layout shifts via CSS overflow-anchor.
  - Start: anchor at first item (overflow-anchor: auto on first row) — prepended content keeps scroll.
  - End: anchor at last item — appended content keeps scroll.
  - Auto: no explicit anchor; browser default.
-->
<ul
	data-items-list
	data-scroll-position={scrollPosition.toLowerCase()}
	{...rootProps}
>
	{#each allRows as row (listKey(row))}
		{#if row.type === 'group'}
			<li data-items-list-row data-group-label>
				{getGroupLabel!(row.groupKey)}
			</li>
		{:else if row.type === 'placeholder'}
			{@const payload = { key: row.key, isPlaceholder: false as const }}
			<li data-items-list-row data-placeholder>
				{Item(payload)}
			</li>
		{:else}
			{@const payload = {
				key: row.key,
				item: row.item,
				isPlaceholder: true as const,
			}}
			<li data-items-list-row>
				{Item(payload)}
			</li>
		{/if}
	{/each}
</ul>



<style>
	ul[data-scroll-position='start'] > li:first-child {
		overflow-anchor: auto;
	}
	ul[data-scroll-position='end'] > li:last-child {
		overflow-anchor: auto;
	}
</style>
