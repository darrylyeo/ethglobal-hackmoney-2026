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
			return sortValueA < sortValueB ? -1 : sortValueA > sortValueB ? 1 : 0
		}),
	)
	const hasGrouping = $derived(Boolean(getGroupKey && getGroupLabel))
	const groupEntries = $derived(
		hasGrouping ? [...Map.groupBy(sortedItems, getGroupKey!).entries()] : null,
	)
	const itemRows = $derived(
		groupEntries
			? groupEntries.flatMap(([groupKey, groupItems]) => [
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
	const allRows = $derived([...itemRows, ...placeholderRows])
</script>


<!-- scrollPosition: Start/End = overflow-anchor on first/last li; Auto = browser default -->
<ul
	class="items-list"
	data-sticky-container
	data-scroll-position={scrollPosition.toLowerCase()}
	{...rootProps}
>
	{#each allRows as row (row.type === 'group' ? `group:${row.groupKey}` : row.key)}
		{#if row.type === 'group'}
			<li data-sticky>
				{#if GroupHeader}
					{@render GroupHeader({ groupKey: row.groupKey })}
				{:else}
					{getGroupLabel!(row.groupKey)}
				{/if}
			</li>
		{:else if row.type === 'placeholder'}
			<li data-placeholder>
				{@render Item({ key: row.key, isPlaceholder: true as const })}
			</li>
		{:else}
			<li>
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
		&[data-scroll-position='start'] > li:first-child {
			overflow-anchor: auto;
		}
		&[data-scroll-position='end'] > li:last-child {
			overflow-anchor: auto;
		}
	}
</style>
