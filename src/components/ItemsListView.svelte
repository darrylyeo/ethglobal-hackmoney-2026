<script
	lang="ts"
	generics="
		_Item,
		_Key extends string | number = string | number,
		_GroupKey extends string | number = string | number
	"
>
	// Types/constants
	import type { ItemsListPagination } from '$/components/ItemsList.types.ts'
	import type { Snippet } from 'svelte'


	// Props
	let {
		title,
		Title,
		loaded,
		total,
		detailsProps = {},
		summaryProps = {},
		items,
		getKey,
		getSortValue,
		getGroupKey,
		getGroupLabel,
		getGroupKeyForPlaceholder,
		placeholderKeys,
		visiblePlaceholderKeys = $bindable([] as _Key[]),
		scrollPosition = 'Auto',
		pagination,
		Item,
		GroupHeader,
	}: {
		title: string
		Title?: Snippet<[{ title: string; countText: string }]>
		loaded: number
		total?: number
		detailsProps?: Record<string, unknown>
		summaryProps?: Record<string, unknown>
		items: Set<_Item>
		getKey: (item: _Item) => _Key
		getSortValue: (item: _Item) => number | string
		getGroupKey?: (item: _Item) => _GroupKey
		getGroupLabel?: (groupKey: _GroupKey) => string
		getGroupKeyForPlaceholder?: (key: _Key) => _GroupKey
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
	} = $props()


	// (Derived)
	const countText = $derived(
		total != null ?
			`${loaded}/${total}`
		: String(loaded),
	)


	// Components
	import ItemsList from '$/components/ItemsList.svelte'
</script>


<details data-scroll-container="block snap-block" {...detailsProps}>
	<summary {...summaryProps}>
		{#if Title}
			{@render Title({ title, countText })}
		{:else}
			<h3>{title} ({countText})</h3>
		{/if}
	</summary>
	<ItemsList
		{items}
		{getKey}
		{getSortValue}
		{getGroupKey}
		{getGroupLabel}
		{getGroupKeyForPlaceholder}
		{placeholderKeys}
		bind:visiblePlaceholderKeys
		{scrollPosition}
		{pagination}
		{Item}
		{GroupHeader}
	/>
</details>
