<script
	module
	lang="ts"
>
	import type { Snippet } from 'svelte'

	export enum FilterDisplayType {
		Select = 'Select',
		Combobox = 'Combobox',
		Options = 'Options',
		Snippet = 'Snippet',
	}

	export enum FilterOperation {
		Union = 'Union',
		Intersection = 'Intersection',
	}

	export type Filter<_Item, _FilterId extends string = string> = {
		id: _FilterId
		label: string
		icon?: string
		filterFunction?: (item: _Item) => boolean
	}

	export type FilterGroupSnippetProps<_Item, _FilterId extends string = string> = {
		group: FilterGroup<_Item, _FilterId>
		visibleFilters: Filter<_Item, _FilterId>[]
		bindValue: [() => _FilterId | '', (value: _FilterId | '') => void]
		bindValueIds: [() => _FilterId[], (values: _FilterId[]) => void]
	}

	type FilterGroupSelection<_FilterId extends string = string> = (
		| {
			exclusive: true
			defaultFilter?: _FilterId
		}
		| {
			exclusive: false
			defaultFilters?: _FilterId[]
		}
	)

	type FilterGroupBase<_Item, _FilterId extends string = string> = {
		id: string
		label: string
		operation?: FilterOperation
		filters: Filter<_Item, _FilterId>[]
	}

	export type FilterGroup<_Item, _FilterId extends string = string> = (
		| (FilterGroupBase<_Item, _FilterId> &
			FilterGroupSelection<_FilterId> & {
				displayType: FilterDisplayType.Snippet
				Snippet: Snippet<[FilterGroupSnippetProps<_Item, _FilterId>]>
			})
		| (FilterGroupBase<_Item, _FilterId> &
			FilterGroupSelection<_FilterId> & {
				displayType?: Exclude<FilterDisplayType, FilterDisplayType.Snippet>
			})
	)
</script>


<script
	lang="ts"
	generics="_Item, _FilterId extends string = string"
>
	// Types/constants
	import type { SvelteHTMLElements } from 'svelte/elements'


	// Props
	let {
		items,
		filterGroups,
		activeFilters = $bindable(new Set<Filter<_Item, _FilterId>>()),
		filteredItems = $bindable(items),
		toggleFilter = $bindable(),
		toggleFilterById = $bindable(),
		...restProps
	}: SvelteHTMLElements['form'] & {
		items: _Item[]
		filterGroups: FilterGroup<_Item, _FilterId>[]
		activeFilters?: Set<Filter<_Item, _FilterId>>
		filteredItems: _Item[]
		toggleFilter?: typeof _toggleFilter
		toggleFilterById?: typeof _toggleFilterById
	} = $props()


	// Functions
	const isDefined = <_T>(value: _T | undefined): value is _T => value !== undefined
	const getFiltersByIds = (
		filterById: Map<string, Filter<_Item, _FilterId>>,
		filterIds: string[],
	) => (
		filterIds
			.map((filterId) => filterById.get(filterId))
			.filter(isDefined)
	)
	const getGroupValueIds = (
		filters: Set<Filter<_Item, _FilterId>>,
		groupFilters: Set<Filter<_Item, _FilterId>>,
	) => (
		[...filters].filter((filter) => groupFilters.has(filter)).map((filter) => filter.id)
	)
	const getGroupValues = (
		filters: Set<Filter<_Item, _FilterId>>,
		groupFilters: Set<Filter<_Item, _FilterId>>,
	) => (
		[...filters].filter((filter) => groupFilters.has(filter))
	)
	const setGroupValueIds = (
		groupFilters: Set<Filter<_Item, _FilterId>>,
		filterById: Map<string, Filter<_Item, _FilterId>>,
		filterIds: _FilterId[],
	) => {
		activeFilters = activeFilters.difference(groupFilters).union(new Set(getFiltersByIds(filterById, filterIds)))
	}
	const setGroupValue = (
		groupFilters: Set<Filter<_Item, _FilterId>>,
		filterById: Map<string, Filter<_Item, _FilterId>>,
		filterId: _FilterId | '',
	) => {
		activeFilters = (
			filterId === '' ?
				activeFilters.difference(groupFilters)
			:
				activeFilters.difference(groupFilters).union(new Set(getFiltersByIds(filterById, [filterId])))
		)
	}
	const setGroupValues = (
		groupFilters: Set<Filter<_Item, _FilterId>>,
		values: Filter<_Item, _FilterId>[],
	) => {
		activeFilters = activeFilters.difference(groupFilters).union(new Set(values))
	}
	const setSingleGroupValue = (
		groupFilters: Set<Filter<_Item, _FilterId>>,
		value: Filter<_Item, _FilterId> | undefined,
	) => {
		activeFilters = (
			value === undefined
				? activeFilters.difference(groupFilters)
				: activeFilters.difference(groupFilters).union(new Set([value]))
		)
	}
	const filterItems = (filters: Set<Filter<_Item, _FilterId>>) => {
		if (filters.size === 0) return items

		const filtersByGroup = new Map<string, Set<Filter<_Item, _FilterId>>>()

		for (const filter of filters) {
			const group = filterGroups.find((entry) => entry.filters.includes(filter))
			if (!group) continue
			const groupFilters = filtersByGroup.get(group.id)
			filtersByGroup.set(
				group.id,
				groupFilters ? groupFilters.union(new Set([filter])) : new Set([filter]),
			)
		}

		return items.filter((item) => (
			[...filtersByGroup.entries()].every(([groupId, groupFilters]) => {
				const group = filterGroups.find((entry) => entry.id === groupId)
				if (!group) return true
				const operation = group.operation ?? FilterOperation.Intersection
				return (
					operation === FilterOperation.Union ?
						[...groupFilters].some((filter) => filter.filterFunction?.(item) ?? true)
					:
						[...groupFilters].every((filter) => filter.filterFunction?.(item) ?? true)
				)
			})
		))
	}


	// Actions
	$effect(() => {
		filteredItems = filterItems(activeFilters)
	})
	const _toggleFilter = (filter: Filter<_Item, _FilterId>, forceExclusive = false) => {
		const group = filterGroups.find((entry) => entry.filters.includes(filter))
		if (!activeFilters.has(filter)) {
			activeFilters = (
				group && (forceExclusive || group.exclusive) ?
					activeFilters.difference(new Set(group.filters))
				:
					activeFilters
			)
			activeFilters = activeFilters.union(new Set([filter]))
			return
		}
		activeFilters = activeFilters.difference(new Set([filter]))
	}
	toggleFilter = _toggleFilter

	const _toggleFilterById = (filterId: _FilterId, forceExclusive = false) => {
		const filter = filterGroups
			.flatMap((group) => group.filters)
			.find((entry) => entry.id === filterId)
		if (!filter) return
		toggleFilter(filter, forceExclusive)
	}
	toggleFilterById = _toggleFilterById


	// Components
	import Combobox from '$/components/Combobox.svelte'
	import ComboboxMultiple from '$/components/ComboboxMultiple.svelte'
	import Select from '$/components/Select.svelte'
	import SelectMultiple from '$/components/SelectMultiple.svelte'
</script>


<form
	class="filters"
	data-card="padding-5 radius-4"
	data-row="gap-6 wrap"
	{...restProps}
>
	{#each (
		filterGroups
			.map((group) => ({
				group,
				visibleFilters: (
					group.filters.filter((filter) => (
						filterItems(new Set([filter])).length > 0
					))
				),
			}))
			.filter(({ visibleFilters }) => visibleFilters.length > 1)
	) as { group, visibleFilters } (group.id)}
		{@const filters = new Set(visibleFilters)}

		{@const filterById = new Map(visibleFilters.map((filter) => [filter.id, filter]))}

		{@const getFilterId = (f: Filter<_Item, _FilterId>) => f.id}

		{@const getFilterLabel = (f: Filter<_Item, _FilterId>) => f.label}

		<fieldset
			data-filter-group={group.id}
			data-column="gap-1"
		>
			<legend>{group.label}</legend>

			{#if group.displayType === FilterDisplayType.Snippet}
				{@render group.Snippet({
					group,
					visibleFilters,
					bindValue: [
						() => (
							getGroupValueIds(activeFilters, filters)[0] ?? ''
						),
						(value) => setGroupValue(filters, filterById, value),
					],
					bindValueIds: [
						() => (
							getGroupValueIds(activeFilters, filters)
						),
						(values) => setGroupValueIds(filters, filterById, values),
					],
				})}
			{:else if group.exclusive}
				{#if (group.displayType ?? FilterDisplayType.Options) === FilterDisplayType.Select}
					<Select
						items={visibleFilters}
						bind:value={
							() => (
								getGroupValues(activeFilters, filters)[0] ?? undefined
							),
							(filter) => setSingleGroupValue(filters, filter)
						}
						getItemId={getFilterId}
						getItemLabel={getFilterLabel}
						ariaLabel={`Filter by ${(group.label ?? '').toLowerCase()}`}
					>
						{#snippet Item(filter)}
							{@const count = (
								(group.operation ?? FilterOperation.Intersection) === FilterOperation.Union ?
									filterItems(new Set([filter])).length
								:
									filterItems(
										activeFilters.difference(filters).union(new Set([filter])),
									).length
							)}

							{#if filter.icon}
								<span
									class="icon"
									aria-hidden="true"
								>{@html filter.icon}</span>
							{/if}

							<span class="label">{filter.label}</span>
							<span class="count">
								<span hidden>(</span>{count}<span hidden>)</span>
							</span>
						{/snippet}
					</Select>
				{:else if (group.displayType ?? FilterDisplayType.Options) === FilterDisplayType.Combobox}
					<Combobox
						items={visibleFilters}
						bind:value={
							() => (
								getGroupValues(activeFilters, filters)[0] ?? undefined
							),
							(filter) => setSingleGroupValue(filters, filter)
						}
						getItemId={getFilterId}
						getItemLabel={getFilterLabel}
						placeholder={group.label}
						ariaLabel={`Filter by ${(group.label ?? '').toLowerCase()}`}
					>
						{#snippet Item(filter)}
							{@const count = (
								(group.operation ?? FilterOperation.Intersection) === FilterOperation.Union ?
									filterItems(new Set([filter])).length
								:
									filterItems(
										activeFilters.difference(filters).union(new Set([filter])),
									).length
							)}

							{#if filter.icon}
								<span
									class="icon"
									aria-hidden="true"
								>{@html filter.icon}</span>
							{/if}

							<span class="label">{filter.label}</span>
							<span class="count">
								<span hidden>(</span>{count}<span hidden>)</span>
							</span>
						{/snippet}
					</Combobox>
				{:else}
					{@const activeFilter = [...activeFilters].find((filter) => filters.has(filter)) ?? undefined}

					<div
						class="group"
						data-column="gap-1"
					>
						{#each visibleFilters as filter (filter.id)}
							{@const count = (
								(group.operation ?? FilterOperation.Intersection) === FilterOperation.Union ?
									filterItems(new Set([filter])).length
								:
									filterItems(
										activeFilters.difference(filters).union(new Set([filter])),
									).length
							)}

							<label
								data-filter={filter.id}
								data-column="gap-3"
								class:disabled={count === 0}
							>
								<input
									type="radio"
									name={group.id}
									value={filter.id}
									defaultChecked={group.defaultFilter === filter.id}
									checked={activeFilter === filter}
									disabled={count === 0}
									onchange={() => {
										activeFilters = activeFilters.difference(filters).union(new Set([filter]))
									}}
								/>
								{#if filter.icon}
									<span
									class="icon"
									aria-hidden="true"
								>{@html filter.icon}</span>
								{/if}

								<span class="label">{filter.label}</span>
								<span class="count">
									<span hidden>(</span>{count}<span hidden>)</span>
								</span>
							</label>
						{/each}
					</div>
				{/if}
			{:else}
				{#if (group.displayType ?? FilterDisplayType.Options) === FilterDisplayType.Select}
					<SelectMultiple
						items={visibleFilters}
						bind:value={
							() => (
								getGroupValues(activeFilters, filters)
							),
							(filtersValue) => setGroupValues(filters, filtersValue)
						}
						getItemId={getFilterId}
						getItemLabel={getFilterLabel}
						ariaLabel={`Filter by ${(group.label ?? '').toLowerCase()}`}
					>
						{#snippet Item(filter)}
							{@const count = (
								(group.operation ?? FilterOperation.Intersection) === FilterOperation.Union ?
									filterItems(new Set([filter])).length
								:
									filterItems(
										activeFilters.has(filter) ?
											activeFilters
										:
											activeFilters.union(new Set([filter])),
									).length
							)}

							{#if filter.icon}
								<span
									class="icon"
									aria-hidden="true"
								>{@html filter.icon}</span>
							{/if}

							<span class="label">{filter.label}</span>
							<span class="count">
								<span hidden>(</span>{count}<span hidden>)</span>
							</span>
						{/snippet}
					</SelectMultiple>
				{:else if (group.displayType ?? FilterDisplayType.Options) === FilterDisplayType.Combobox}
					<ComboboxMultiple
						items={visibleFilters}
						bind:value={
							() => (
								getGroupValues(activeFilters, filters)
							),
							(filtersValue) => setGroupValues(filters, filtersValue)
						}
						getItemId={getFilterId}
						getItemLabel={getFilterLabel}
						placeholder={group.label}
						ariaLabel={`Filter by ${(group.label ?? '').toLowerCase()}`}
					>
						{#snippet Item(filter)}
							{@const count = (
								(group.operation ?? FilterOperation.Intersection) === FilterOperation.Union ?
									filterItems(new Set([filter])).length
								:
									filterItems(
										activeFilters.has(filter) ?
											activeFilters
										:
											activeFilters.union(new Set([filter])),
									).length
							)}

							{#if filter.icon}
								<span
									class="icon"
									aria-hidden="true"
								>{@html filter.icon}</span>
							{/if}

							<span class="label">{filter.label}</span>
							<span class="count">
								<span hidden>(</span>{count}<span hidden>)</span>
							</span>
						{/snippet}
					</ComboboxMultiple>
				{:else}
					<div
						class="group"
						data-column="gap-1"
					>
						{#each visibleFilters as filter (filter.id)}
							{@const isChecked = activeFilters.has(filter)}

							{@const count = (
								(group.operation ?? FilterOperation.Intersection) === FilterOperation.Union ?
									filterItems(new Set([filter])).length
								:
									filterItems(
										isChecked ?
											activeFilters
										:
											activeFilters.union(new Set([filter])),
									).length
							)}

							<label
								data-filter={filter.id}
								data-column="gap-3"
								class:disabled={count === 0 && !isChecked}
							>
								<input
									type="checkbox"
									defaultChecked={group.defaultFilters?.includes(filter.id)}
									checked={isChecked}
									disabled={count === 0 && !isChecked}
									onchange={({ currentTarget }) => {
										if (!(currentTarget instanceof HTMLInputElement)) return
										activeFilters = (
											currentTarget.checked ?
												activeFilters.union(new Set([filter]))
											:
												activeFilters.difference(new Set([filter]))
										)
									}}
								/>
								{#if filter.icon}
									<span
									class="icon"
									aria-hidden="true"
								>{@html filter.icon}</span>
								{/if}

								<span class="label">{filter.label}</span>
								<span class="count">
									<span hidden>(</span>{count}<span hidden>)</span>
								</span>
							</label>
						{/each}
					</div>
				{/if}
			{/if}
		</fieldset>
	{/each}

	<button type="reset">
		Clear filters
	</button>
</form>


<style>
	form {
		align-items: start;

		> [data-filter-group] {
			gap: 0.33em;
			border: none;

			> legend {
				display: contents;
				text-transform: uppercase;
				letter-spacing: 0.05em;
				font-size: 0.75em;
				color: var(--text-secondary);
			}

			[data-filter] {
				cursor: pointer;
				align-items: center;
				grid-template-columns: 1em 1fr auto;
				grid-auto-flow: column;
				transition-property: background-color, border-color, color;

				&:hover:not(.disabled) {
					background-color: rgba(255, 255, 255, 0.1);
				}

				&.disabled {
					cursor: not-allowed;
					opacity: 0.4;
				}

				&:has(input:checked) {
					background-color: var(--accent-backgroundColor);
					border-color: var(--accent);
					color: var(--accent);
				}

				input[type='radio'],
				input[type='checkbox'] {
					display: none;
				}

				.label {
					flex: 1 0 auto;
					text-align: left;
				}
			}
		}
	}

	.count {
		font-size: smaller;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background-color: var(--accent-backgroundColor);
		color: var(--accent);
		border-radius: 0.85em;
		padding: 0.3em 0.5em;
		line-height: 1;

		label:has(input:checked) & {
			background-color: var(--accent);
			color: var(--accent-backgroundColor);
		}
	}

	form:not(
		:has(
			:is(
				input[type='checkbox'],
				input[type='radio']
			):is(
				[checked]:not(:checked),
				:not([checked]):checked
			),
			select option:is(
				[selected]:not(:checked),
				:not([selected]):checked
			)
		)
	) button[type='reset'] {
		display: none;
		opacity: 0;
	}
</style>
