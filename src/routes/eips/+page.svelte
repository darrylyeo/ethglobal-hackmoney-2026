<script lang="ts">
	// Types/constants
	import type { Filter, FilterGroup } from '$/components/Filters.svelte'
	import type { Sort } from '$/components/Sorts.svelte'
	import type { ProposalEntry } from '$/data/ProposalEntry.ts'
	import { FilterDisplayType, FilterOperation } from '$/components/Filters.svelte'
	import { proposalsCollection } from '$/collections/Proposals.ts'
	import { ProposalType } from '$/data/ProposalEntry.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'

	const sortOptions: Sort<ProposalEntry, 'number-asc' | 'number-desc' | 'title-az' | 'title-za' | 'status' | 'category' | 'type'>[] = [
		{ id: 'number-asc', label: 'Number ↑', compare: (a, b) => a.number - b.number },
		{ id: 'number-desc', label: 'Number ↓', compare: (a, b) => b.number - a.number },
		{
			id: 'title-az',
			label: 'Title A–Z',
			compare: (a, b) => a.title.localeCompare(b.title),
		},
		{
			id: 'title-za',
			label: 'Title Z–A',
			compare: (a, b) => b.title.localeCompare(a.title),
		},
		{
			id: 'status',
			label: 'Status',
			compare: (a, b) =>
				a.status.localeCompare(b.status) || a.number - b.number,
		},
		{
			id: 'category',
			label: 'Category',
			compare: (a, b) =>
				a.category.localeCompare(b.category) || a.number - b.number,
		},
		{
			id: 'type',
			label: 'Type (EIP then ERC)',
			compare: (a, b) =>
				a.type.localeCompare(b.type) || a.number - b.number,
		},
	]


	// Context
	import { resolve } from '$app/paths'
	const entriesQuery = useLiveQuery((q) =>
		q
			.from({ row: proposalsCollection })
			.select(({ row }) => ({ row })),
	)


	// (Derived)
	const views = $derived((entriesQuery.data ?? []).map((r) => r.row as ProposalEntry))
	const statuses = $derived([...new Set(views.map((e) => e.status))].sort())
	const categories = $derived([...new Set(views.map((e) => e.category))].sort())
	const filterGroups = $derived([
		{
			id: 'kind',
			label: 'Kind',
			displayType: FilterDisplayType.Select,
			operation: FilterOperation.Intersection,
			exclusive: true as const,
			defaultFilter: 'all',
			filters: [
				{
					id: 'all',
					label: 'All',
					filterFunction: () => true,
				},
				{
					id: 'eip',
					label: 'EIP only',
					filterFunction: (e: ProposalEntry) => e.type === ProposalType.Eip,
				},
				{
					id: 'erc',
					label: 'ERC only',
					filterFunction: (e: ProposalEntry) => e.type === ProposalType.Erc,
				},
			],
		},
		...(statuses.length > 0
			? [
					{
						id: 'status',
						label: 'Status',
						displayType: FilterDisplayType.Select,
						operation: FilterOperation.Intersection,
						exclusive: true as const,
						defaultFilter: '',
						filters: [
							{ id: '', label: 'All', filterFunction: () => true },
							...statuses.map((s) => ({
								id: s,
								label: s,
								filterFunction: (e: ProposalEntry) => e.status === s,
							})),
						],
					} as FilterGroup<ProposalEntry, string>,
				]
			: []),
		...(categories.length > 0
			? [
					{
						id: 'category',
						label: 'Category',
						displayType: FilterDisplayType.Select,
						operation: FilterOperation.Intersection,
						exclusive: true as const,
						defaultFilter: '',
						filters: [
							{ id: '', label: 'All', filterFunction: () => true },
							...categories.map((t) => ({
								id: t,
								label: t,
								filterFunction: (e: ProposalEntry) => e.category === t,
							})),
						],
					} as FilterGroup<ProposalEntry, string>,
				]
			: []),
	] as FilterGroup<ProposalEntry, string>[])


	// State
	let activeFilters = $state<Set<Filter<ProposalEntry, string>>>(new Set())
	let filteredItems = $state<ProposalEntry[]>([])
	let sortedItems = $state<ProposalEntry[]>([])


	// (Derived)
	const hasFilterGroups = $derived(filterGroups.length > 0)
	const itemsToSort = $derived(hasFilterGroups ? filteredItems : views)
	const displayItems = $derived(
		sortOptions.length > 1 ? sortedItems : itemsToSort,
	)


	// Components
	import Filters from '$/components/Filters.svelte'
	import Sorts from '$/components/Sorts.svelte'
</script>

<svelte:head>
	<title>EIPs / ERCs</title>
</svelte:head>

<main data-column="gap-4">
	<h1>EIPs / ERCs</h1>
	<p>
		<a href="https://eips.ethereum.org/" target="_blank" rel="noopener noreferrer">
			Official status page
		</a>
		— data from
		<a href="https://github.com/ethereum/EIPs" target="_blank" rel="noopener noreferrer">ethereum/EIPs</a>
		and
		<a href="https://github.com/ethereum/ercs" target="_blank" rel="noopener noreferrer">ethereum/ercs</a>
		. <a href="/eips/forks">Fork upgrades</a> (included EIPs per upgrade).
	</p>

	{#if entriesQuery.isLoading && views.length === 0}
		<p>Loading…</p>
	{:else if entriesQuery.isError}
		<p>
			Failed to load:
			{(proposalsCollection.utils.lastError as unknown as { message?: string })?.message ?? 'Unknown error'}
		</p>
	{:else}
		{#if filterGroups.length > 0 || sortOptions.length > 1}
			<div data-row="gap-4 wrap">
				{#if filterGroups.length > 0}
					<Filters
						items={views}
						{filterGroups}
						bind:activeFilters
						bind:filteredItems
					/>
				{/if}
				{#if sortOptions.length > 1}
					<Sorts
						items={itemsToSort}
						sortOptions={sortOptions}
						defaultSortId="number-asc"
						bind:sortedItems
					/>
				{/if}
			</div>
		{/if}
		<p>{displayItems.length} of {views.length} entries</p>
		<ul data-column="gap-1" role="list">
			{#each displayItems as entry (entry.number)}
				<li>
					<a href={resolve(`/eips/${entry.number}`)} data-link>
						<strong>EIP-{entry.number}</strong>
						{#if entry.type === ProposalType.Erc}
							<span>(ERC)</span>
						{/if}
						— {entry.title}
					</a>
					<span>{entry.status}</span>
					<span>{entry.category}</span>
					<a
						href={entry.url}
						target="_blank"
						rel="noopener noreferrer"
						data-link
					>
						Official
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</main>
