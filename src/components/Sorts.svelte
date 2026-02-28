<script module lang="ts">
	export type Sort<_Item, _SortId extends string = string> = {
		id: _SortId
		label: string
		compare: (a: _Item, b: _Item) => number
	}
</script>


<script lang="ts" generics="_Item, _SortId extends string = string">
	// Types/constants
	import type { SvelteHTMLElements } from 'svelte/elements'


	// Props
	let {
		items,
		sortOptions,
		activeSortId = $bindable('' as _SortId | ''),
		sortedItems = $bindable(items),
		defaultSortId,
		setSortById = $bindable(),
		...restProps
	}: SvelteHTMLElements['div'] & {
		items: _Item[]
		sortOptions: Sort<_Item, _SortId>[]
		activeSortId?: _SortId | ''
		sortedItems?: _Item[]
		defaultSortId?: _SortId
		setSortById?: (sortId: _SortId | '') => void
	} = $props()

	// (Derived)
	const effectiveSortId = $derived(
		(activeSortId === '' ? (defaultSortId ?? sortOptions[0]?.id) : activeSortId) ?? ''
	)
	const sortById = $derived(
		new Map(sortOptions.map((s) => [s.id, s]))
	)


	// Functions
	const sortItems = (sortId: _SortId | '') => {
		const sort = sortId && sortById.get(sortId)
		return sort ? [...items].sort(sort.compare) : items
	}


	// Actions
	const _setSortById = (sortId: _SortId | '') => {
		activeSortId = sortId
	}
	setSortById = _setSortById
	$effect(() => {
		sortedItems = sortItems(effectiveSortId as _SortId | '')
	})


	// Components
	import Select from '$/components/Select.svelte'
</script>


{#if sortOptions.length > 1}
	<div class="sorts" data-card="padding-5 radius-4" data-row="gap-6 wrap" {...restProps}>
		<fieldset data-sort-group data-column="gap-1">
			<legend>Sort</legend>

			<Select
				items={sortOptions}
				bind:value={
					() => sortById.get(effectiveSortId) ?? undefined,
					(sort: Sort<_Item, _SortId> | undefined) => {
						activeSortId = (sort?.id ?? '') as _SortId | ''
					}
				}
				getItemId={(s) => s.id}
				getItemLabel={(s) => s.label}
				ariaLabel="Sort by"
			/>
		</fieldset>
	</div>
{/if}


<style>
	.sorts {
		align-items: start;

		> [data-sort-group] {
			gap: 0.33em;
			border: none;

			> legend {
				display: contents;
				text-transform: uppercase;
				letter-spacing: 0.05em;
				font-size: 0.75em;
				color: var(--text-secondary);
			}
		}
	}
</style>
