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

	// Components
	import ItemsList from '$/components/ItemsList.svelte'

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
		placeholderKeys,
		visiblePlaceholderKeys = $bindable([] as _Key[]),
		scrollPosition = 'Auto',
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
	} = $props()

	// (Derived)
	const countText = $derived(
		total != null ? `${loaded}/${total}` : String(loaded),
	)
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
		{placeholderKeys}
		bind:visiblePlaceholderKeys
		{scrollPosition}
		{Item}
		{GroupHeader}
	/>
</details>
