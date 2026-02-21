<script lang="ts">
	// Types/constants
	import type { CaipEntry } from '$/data/CaipEntry.ts'
	import type { Filter, FilterGroup } from '$/components/Filters.svelte'
	import type { Sort } from '$/components/Sorts.svelte'
	import type { ProposalEntry } from '$/data/ProposalEntry.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { FilterDisplayType, FilterOperation } from '$/components/Filters.svelte'
	import { caipsCollection } from '$/collections/Caips.ts'
	import { proposalsCollection } from '$/collections/Proposals.ts'
	import { ProposalType } from '$/data/ProposalEntry.ts'
	import { getProposalPath, ProposalRealm } from '$/lib/proposal-paths.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'

	type ProposalListItem = {
		realm: ProposalRealm
		entry: ProposalEntry | CaipEntry
	}

	const sortOptions: Sort<ProposalListItem, 'number-asc' | 'number-desc' | 'title-az' | 'title-za' | 'status'>[] = [
		{
			id: 'number-asc',
			label: 'Number ↑',
			compare: (a, b) => a.entry.number - b.entry.number,
		},
		{
			id: 'number-desc',
			label: 'Number ↓',
			compare: (a, b) => b.entry.number - a.entry.number,
		},
		{
			id: 'title-az',
			label: 'Title A–Z',
			compare: (a, b) => a.entry.title.localeCompare(b.entry.title),
		},
		{
			id: 'title-za',
			label: 'Title Z–A',
			compare: (a, b) => b.entry.title.localeCompare(a.entry.title),
		},
		{
			id: 'status',
			label: 'Status',
			compare: (a, b) =>
				a.entry.status.localeCompare(b.entry.status) || a.entry.number - b.entry.number,
		},
	]

	// Context
	import { page } from '$app/stores'
	import { resolve } from '$app/paths'
	const proposalsQuery = useLiveQuery((q) =>
		q
			.from({ row: proposalsCollection })
			.select(({ row }) => ({ row })),
	)
	const caipsQuery = useLiveQuery((q) =>
		q
			.from({ row: caipsCollection })
			.select(({ row }) => ({ row })),
	)

	// (Derived)
	const proposalRows = $derived(
		(proposalsQuery.data ?? []).map((r) =>
			({ realm: ProposalRealm.Ethereum, entry: r.row as ProposalEntry }),
		),
	)
	const caipRows = $derived(
		(caipsQuery.data ?? []).map((r) =>
			({ realm: ProposalRealm.ChainAgnostic, entry: r.row as CaipEntry }),
		),
	)
	const views = $derived([...proposalRows, ...caipRows])
	const statuses = $derived([...new Set(views.map((i) => i.entry.status))].sort())
	const filterGroups = $derived([
		{
			id: 'realm',
			label: 'Realm',
			displayType: FilterDisplayType.Select,
			operation: FilterOperation.Intersection,
			exclusive: true as const,
			defaultFilter: 'all',
			filters: [
				{ id: 'all', label: 'All', filterFunction: () => true },
				{
					id: ProposalRealm.Ethereum,
					label: 'Ethereum (EIP/ERC)',
					filterFunction: (i: ProposalListItem) => i.realm === ProposalRealm.Ethereum,
				},
				{
					id: ProposalRealm.ChainAgnostic,
					label: 'Chain-agnostic (CAIP)',
					filterFunction: (i: ProposalListItem) => i.realm === ProposalRealm.ChainAgnostic,
				},
			],
		},
		{
			id: 'kind',
			label: 'Kind (Ethereum)',
			displayType: FilterDisplayType.Select,
			operation: FilterOperation.Intersection,
			exclusive: true as const,
			defaultFilter: 'all',
			filters: [
				{ id: 'all', label: 'All', filterFunction: () => true },
				{
					id: 'eip',
					label: 'EIP only',
					filterFunction: (i: ProposalListItem) =>
						i.realm === ProposalRealm.ChainAgnostic || (i.entry as ProposalEntry).type === ProposalType.Eip,
				},
				{
					id: 'erc',
					label: 'ERC only',
					filterFunction: (i: ProposalListItem) =>
						i.realm === ProposalRealm.ChainAgnostic || (i.entry as ProposalEntry).type === ProposalType.Erc,
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
								filterFunction: (i: ProposalListItem) => i.entry.status === s,
							})),
						],
					} as FilterGroup<ProposalListItem, string>,
				]
			: []),
	] as FilterGroup<ProposalListItem, string>[])

	// State
	let activeFilters = $state<Set<Filter<ProposalListItem, string>>>(new Set())
	let filteredItems = $state<ProposalListItem[]>([])
	let sortedItems = $state<ProposalListItem[]>([])

	$effect(() => {
		const kind = $page.url.searchParams.get('kind')
		const realmParam = $page.url.searchParams.get('realm')
		const kg = filterGroups.find((g) => g.id === 'kind')
		const rg = filterGroups.find((g) => g.id === 'realm')
		const updates: Filter<ProposalListItem, string>[] = []
		if (rg && (realmParam === ProposalRealm.Ethereum || realmParam === ProposalRealm.ChainAgnostic)) {
			const f = rg.filters.find((x) => x.id === realmParam)
			if (f) updates.push(f)
		}
		if (kg && (kind === 'eip' || kind === 'erc')) {
			const f = kg.filters.find((x) => x.id === kind)
			if (f) updates.push(f)
		}
		if (updates.length === 0) return
		const rest = [...activeFilters].filter(
			(f) =>
				!['all', 'eip', 'erc'].includes(f.id) &&
				!['all', ProposalRealm.Ethereum, ProposalRealm.ChainAgnostic].includes(f.id),
		)
		activeFilters = new Set([...rest, ...updates])
	})

	// (Derived)
	const hasFilterGroups = $derived(filterGroups.length > 0)
	const itemsToSort = $derived(hasFilterGroups ? filteredItems : views)
	const displayItems = $derived(
		sortOptions.length > 1 ? sortedItems : itemsToSort,
	)

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Filters from '$/components/Filters.svelte'
	import Sorts from '$/components/Sorts.svelte'
	import Caip from '$/views/Caip.svelte'
	import Proposal from '$/views/Proposal.svelte'
</script>

<svelte:head>
	<title>Proposals</title>
</svelte:head>

<main data-column="gap-4">
	<h1>Proposals</h1>
	<p>
		<a href="https://eips.ethereum.org/" target="_blank" rel="noopener noreferrer">
			Official status page
		</a>
		— data from
		<a href="https://github.com/ethereum/EIPs" target="_blank" rel="noopener noreferrer">ethereum/EIPs</a>
		and
		<a href="https://github.com/ethereum/ercs" target="_blank" rel="noopener noreferrer">ethereum/ercs</a>
		. <a href={resolve('/network/1/forks')}>Fork upgrades</a> (included EIPs per upgrade).
		<a href="https://chainagnostic.org/CAIPs/" target="_blank" rel="noopener noreferrer">CAIPs</a> (chain-agnostic).
	</p>

	{#if proposalsQuery.isLoading && caipsQuery.isLoading && views.length === 0}
		<p>Loading…</p>
	{:else if proposalsQuery.isError && caipsQuery.isError}
		<p>
			Failed to load proposals and CAIPs.
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
		<ul data-column="gap-4" role="list">
			{#each displayItems as item (item.realm + '-' + item.entry.number)}
				<li>
					{#if item.realm === ProposalRealm.Ethereum}
						{@const entry = item.entry as ProposalEntry}
						<EntityView
							entityType={EntityType.Proposal}
							entity={entry}
							entityId={{ id: String(entry.number) }}
							idSerialized={String(entry.number)}
							href={getProposalPath(ProposalRealm.Ethereum, entry)}
							label={`${entry.type === ProposalType.Erc ? 'ERC' : 'EIP'}-${entry.number} ${entry.title}`}
							layout={EntityLayout.PageSection}
							metadata={[
								{ term: 'Status', detail: entry.status },
								{ term: 'Category', detail: entry.category },
							]}
							annotation={entry.type === ProposalType.Erc ? 'ERC' : 'EIP'}
						>
							{#snippet Title()}
								<strong>{entry.type === ProposalType.Erc ? 'ERC' : 'EIP'}-{entry.number}</strong>
								{entry.title}
							{/snippet}
							<Proposal {entry} />
						</EntityView>
					{:else}
						{@const entry = item.entry as CaipEntry}
						<EntityView
							entityType={EntityType.Caip}
							entity={entry}
							entityId={{ id: String(entry.number) }}
							idSerialized={String(entry.number)}
							href={getProposalPath(ProposalRealm.ChainAgnostic, entry)}
							label={`CAIP-${entry.number} ${entry.title}`}
							layout={EntityLayout.PageSection}
							metadata={[
								{ term: 'Status', detail: entry.status },
								{ term: 'Type', detail: entry.type },
							]}
							annotation="CAIP"
						>
							{#snippet Title()}
								<strong>CAIP-{entry.number}</strong>
								{entry.title}
							{/snippet}
							<Caip {entry} />
						</EntityView>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</main>
