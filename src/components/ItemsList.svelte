<script
	lang="ts"
	generics="
		_Item,
		_Key extends PropertyKey = PropertyKey,
		_GroupKey extends PropertyKey = PropertyKey
	"
>
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
		visiblePlaceholderKeys = $bindable([] as _Key[]),
		scrollPosition = 'Auto',
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
		GroupHeader?: Snippet<[{ groupKey: _GroupKey }]>
		Item: Snippet<
			[
				{
					key: _Key
				} & (
					| { item: _Item; isPlaceholder: true }
					| { item?: never; isPlaceholder: false }
				),
			]
		>
		[key: string]: unknown
	} = $props()


	// (Derived)
	const allRows = $derived(
		(() => {
			const expanded = new Set(
				[...placeholderKeys].flatMap((el) =>
					Array.isArray(el)
						? Array.from(
								{ length: el[1] - el[0] + 1 },
								(_, i) => (el[0] + i) as _Key,
							)
						: [el],
				),
			)
			const sorted = [...items].sort((a, b) => {
				const va = getSortValue(a)
				const vb = getSortValue(b)
				return va < vb ? -1 : va > vb ? 1 : 0
			})
			const grouped =
				getGroupKey && getGroupLabel
					? Map.groupBy(sorted, getGroupKey)
					: null
			return [
				...(grouped
					? [...grouped.entries()].flatMap(([groupKey, groupItems]) => [
							{ type: 'group' as const, groupKey },
							...groupItems.map((item) => ({
								type: 'item' as const,
								key: getKey(item),
								item,
								isPlaceholder: true as const,
							})),
						])
					: sorted.map((item) => ({
							type: 'item' as const,
							key: getKey(item),
							item,
							isPlaceholder: true as const,
						}))),
				...visiblePlaceholderKeys
					.filter((key) => expanded.has(key))
					.map((key) => ({
						type: 'placeholder' as const,
						key,
						isPlaceholder: false as const,
					})),
			]
		})(),
	)
</script>


<!-- scrollPosition: Start/End = overflow-anchor on first/last li; Auto = browser default -->
<ul
	data-items-list
	data-sticky-container
	data-scroll-position={scrollPosition.toLowerCase()}
	{...rootProps}
>
	{#each allRows as row (row.type === 'group' ? `group:${row.groupKey}` : row.key)}
		{#if row.type === 'group'}
			<li data-items-list-row data-group-label data-sticky>
				{#if GroupHeader}
					{@render GroupHeader({ groupKey: row.groupKey })}
				{:else}
					{getGroupLabel!(row.groupKey)}
				{/if}
			</li>
		{:else if row.type === 'placeholder'}
			<li data-items-list-row data-placeholder>
				{@render Item({ key: row.key, isPlaceholder: false as const })}
			</li>
		{:else}
			<li data-items-list-row>
				{@render Item({
					key: row.key,
					item: row.item,
					isPlaceholder: true as const,
				})}
			</li>
		{/if}
	{/each}
</ul>



<style>
	ul[data-items-list] {
		&[data-scroll-position='start'] > li:first-child {
			overflow-anchor: auto;
		}
		&[data-scroll-position='end'] > li:last-child {
			overflow-anchor: auto;
		}
	}
</style>
