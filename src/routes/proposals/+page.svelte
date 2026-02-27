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

	enum ProposalSort {
		NumberAsc = 'number-asc',
		NumberDesc = 'number-desc',
		TitleAz = 'title-az',
		TitleZa = 'title-za',
		Status = 'status',
	}

	type ProposalListItem = {
		realm: ProposalRealm
		entry: ProposalEntry | CaipEntry
	}

	const sortOptions: Sort<ProposalListItem, ProposalSort>[] = [
		{
			id: ProposalSort.NumberAsc,
			label: 'Number ↑',
			compare: (a, b) => a.entry.number - b.entry.number,
		},
		{
			id: ProposalSort.NumberDesc,
			label: 'Number ↓',
			compare: (a, b) => b.entry.number - a.entry.number,
		},
		{
			id: ProposalSort.TitleAz,
			label: 'Title A–Z',
			compare: (a, b) => a.entry.title.localeCompare(b.entry.title),
		},
		{
			id: ProposalSort.TitleZa,
			label: 'Title Z–A',
			compare: (a, b) => b.entry.title.localeCompare(a.entry.title),
		},
		{
			id: ProposalSort.Status,
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
	const proposalViews = $derived(
		(proposalsQuery.data ?? []).map((r) =>
			({ realm: ProposalRealm.Ethereum, entry: r.row as ProposalEntry }),
		),
	)
	const caipViews = $derived(
		(caipsQuery.data ?? []).map((r) =>
			({ realm: ProposalRealm.ChainAgnostic, entry: r.row as CaipEntry }),
		),
	)
	const views = $derived([...proposalViews, ...caipViews])
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
	let searchValue = $state('')

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
	const getItemKey = (item: ProposalListItem) => item.realm + '-' + item.entry.number

	// State (bound from RefinableItemsList)
	let displayCount = $state(0)

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import RefinableItemsList from '$/components/RefinableItemsList.svelte'
	import SearchableText from '$/components/SearchableText.svelte'
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
		<p>{displayCount} of {views.length} entries</p>
		<RefinableItemsList
			items={views}
			{filterGroups}
			defaultFilterIds={new Set<string>()}
			{sortOptions}
			defaultSortId={ProposalSort.NumberAsc}
			bind:activeFilters
			bind:displayCount
			getKey={getItemKey}
			bind:searchQuery={searchValue}
			searchPlaceholder="Search proposals"
			placeholderKeys={new Set<string>()}
			data-column="gap-4"
			role="list"
		>
			{#snippet Empty()}
				<p data-text="muted">No proposals match.</p>
			{/snippet}
			{#snippet Item({ key: _k, item, isPlaceholder, searchQuery, matches })}
				{#if !isPlaceholder && item != null}
					{#if item.realm === ProposalRealm.Ethereum}
						{@const entry = item.entry as ProposalEntry}
						<EntityView
							entityType={EntityType.Proposal}
							entity={entry}
							titleHref={getProposalPath(ProposalRealm.Ethereum, entry)}
							label={`${entry.type === ProposalType.Erc ? 'ERC' : 'EIP'}-${entry.number} ${entry.title}`}
							layout={EntityLayout.PageSection}
							metadata={[
								{ term: 'Status', detail: entry.status },
								{ term: 'Category', detail: entry.category },
							]}
							annotation={entry.type === ProposalType.Erc ? 'ERC' : 'EIP'}
						>
							{#snippet Title()}
								<strong>
									{#if searchQuery != null}
										<SearchableText
											text={`${entry.type === ProposalType.Erc ? 'ERC' : 'EIP'}-${entry.number}`}
											query={searchQuery}
											{matches}
										/>
									{:else}
										{entry.type === ProposalType.Erc ? 'ERC' : 'EIP'}-{entry.number}
									{/if}
								</strong>
								{' '}
								{#if searchQuery != null}
									<SearchableText text={entry.title} query={searchQuery} {matches} />
								{:else}
									{entry.title}
								{/if}
							{/snippet}
							<Proposal {entry} />
						</EntityView>
					{:else}
						{@const entry = item.entry as CaipEntry}
						<EntityView
							entityType={EntityType.Caip}
							entity={entry}
							titleHref={getProposalPath(ProposalRealm.ChainAgnostic, entry)}
							label={`CAIP-${entry.number} ${entry.title}`}
							layout={EntityLayout.PageSection}
							metadata={[
								{ term: 'Status', detail: entry.status },
								{ term: 'Type', detail: entry.type },
							]}
							annotation="CAIP"
						>
							{#snippet Title()}
								<strong>
									{#if searchQuery != null}
										<SearchableText
											text={`CAIP-${entry.number}`}
											query={searchQuery}
											{matches}
										/>
									{:else}
										CAIP-{entry.number}
									{/if}
								</strong>
								{' '}
								{#if searchQuery != null}
									<SearchableText text={entry.title} query={searchQuery} {matches} />
								{:else}
									{entry.title}
								{/if}
							{/snippet}
							<Caip {entry} />
						</EntityView>
					{/if}
				{/if}
			{/snippet}
		</RefinableItemsList>
	{/if}
</main>
