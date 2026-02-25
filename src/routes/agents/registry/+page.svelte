<script lang="ts">
	// Types/constants
	import type { Filter, FilterGroup } from '$/components/Filters.svelte'
	import type { Sort } from '$/components/Sorts.svelte'
	import { FilterDisplayType, FilterOperation } from '$/components/Filters.svelte'
	import { ipfsUriToHttp } from '$/api/eip-8004.ts'
	import { agentRegistries } from '$/constants/agent-registries.ts'
	import { eip8004AgentsCollection } from '$/collections/Eip8004Agents.ts'
	import type { Eip8004Agent } from '$/data/Eip8004Agent.ts'
	import { eip8004AgentIdToString } from '$/data/Eip8004Agent.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { networksByChainId } from '$/constants/networks.ts'

	// Context
	import { resolve } from '$app/paths'

	// (Derived)
	const entriesQuery = useLiveQuery((q) =>
		q
			.from({ row: eip8004AgentsCollection })
			.select(({ row }) => ({ row })),
	)
	const views = $derived(
		(entriesQuery.data ?? [])
			.map(({ row: agent }) => agent as Eip8004Agent)
			.filter(Boolean),
	)
	const chainIds = $derived([...new Set(views.map((e) => e.$id.chainId))].sort())
	const filterGroups = $derived([
		{
			id: 'chain',
			label: 'Chain',
			displayType: FilterDisplayType.Select,
			operation: FilterOperation.Intersection,
			exclusive: true as const,
			defaultFilter: '',
			filters: [
				{ id: '', label: 'All', filterFunction: () => true },
				...chainIds.map((c) => ({
					id: String(c),
					label: networksByChainId[c]?.name ?? String(c),
					filterFunction: (e: Eip8004Agent) => e.$id.chainId === c,
				})),
			],
		},
	] as FilterGroup<Eip8004Agent, string>[])

	const primaryRegistry = $derived(agentRegistries[0])
	const sortOptions: Sort<Eip8004Agent, 'name' | 'chain'>[] = [
		{
			id: 'name',
			label: 'Name',
			compare: (a, b) =>
				(a.name ?? a.$id.identityId).localeCompare(b.name ?? b.$id.identityId),
		},
		{
			id: 'chain',
			label: 'Chain',
			compare: (a, b) => a.$id.chainId - b.$id.chainId || a.$id.identityId.localeCompare(b.$id.identityId),
		},
	]

	// State
	let activeFilters = $state<Set<Filter<Eip8004Agent, string>>>(new Set())
	let filteredItems = $state<Eip8004Agent[]>([])
	let sortedItems = $state<Eip8004Agent[]>([])
	let searchQuery = $state('')

	// (Derived)
	const hasFilterGroups = $derived(filterGroups.length > 0)
	const searchLower = $derived(searchQuery.trim().toLowerCase())
	const searchFiltered = $derived(
		searchLower
			? views.filter(
					(e) =>
						(e.name ?? '').toLowerCase().includes(searchLower) ||
						(e.description ?? '').toLowerCase().includes(searchLower) ||
						e.$id.identityId.toLowerCase().includes(searchLower),
				)
			: views,
	)
	const itemsToSort = $derived(
		hasFilterGroups ? filteredItems : searchFiltered,
	)
	const displayItems = $derived(
		sortOptions.length > 1 ? sortedItems : itemsToSort,
	)

	// Components
	import Filters from '$/components/Filters.svelte'
	import Sorts from '$/components/Sorts.svelte'
</script>

<svelte:head>
	<title>{primaryRegistry?.label ?? 'Agent'} registry – Agents</title>
</svelte:head>

<main data-column="gap-4">
	<h1>{primaryRegistry?.label ?? 'Agent'} registry</h1>
	<p data-text="muted">
		Explore agents from the
		<a
			href="https://eips.ethereum.org/EIPS/eip-8004"
			target="_blank"
			rel="noopener noreferrer"
			data-link
		>
			EIP-8004 Trustless Agent
		</a>
		Identity Registry. Reference them in agent chat with <code>@Agent:…</code>.
		Learn more:
		<a
			href="https://8004.org"
			target="_blank"
			rel="noopener noreferrer"
			data-link
		>8004.org</a>,
		<a
			href="https://ai.ethereum.foundation"
			target="_blank"
			rel="noopener noreferrer"
			data-link
		>ai.ethereum.foundation</a>.
	</p>

	{#if entriesQuery.isLoading && views.length === 0}
		<p>Loading…</p>
	{:else if entriesQuery.isError}
		<p>
			Failed to load:
			{(eip8004AgentsCollection.utils.lastError as unknown as { message?: string })?.message ?? 'Unknown error'}
		</p>
	{:else}
		<div data-row="gap-4 wrap">
			<label data-row="align-center">
				<span>Search</span>
				<input
					type="search"
					bind:value={searchQuery}
					placeholder="Name, description, identity…"
				/>
			</label>
			{#if filterGroups.length > 0}
				<Filters
					items={searchFiltered}
					{filterGroups}
					bind:activeFilters
					bind:filteredItems
				/>
			{/if}
			{#if sortOptions.length > 1}
				<Sorts
					items={itemsToSort}
					sortOptions={sortOptions}
					defaultSortId="name"
					bind:sortedItems
				/>
			{/if}
		</div>
		<p>{displayItems.length} of {views.length} agents</p>
		{#if displayItems.length === 0}
			<p data-text="muted">
				No agents in registry. Data is read from chain (Identity Registry + agentURI); add chains in
				<code>eip-8004-registry</code>.
			</p>
		{:else}
			<ul data-column="gap-1" role="list">
				{#each displayItems as agent (eip8004AgentIdToString(agent.$id))}
					<li data-row="align-center gap-2">
						{#if agent.image}
							<img
								src={ipfsUriToHttp(agent.image)}
								alt=""
								width="32"
								height="32"
								style="border-radius: 50%; object-fit: cover;"
							/>
						{/if}
						<span data-row="wrap align-center gap-1">
							<a
								href={resolve(
									`/agents/registry/${encodeURIComponent(eip8004AgentIdToString(agent.$id))}`,
								)}
								data-link
							>
								<strong>{agent.name ?? agent.$id.identityId}</strong>
							</a>
							{#if agent.name && agent.$id.identityId !== agent.name}
								<span data-text="muted">{agent.$id.identityId}</span>
							{/if}
							<span data-text="muted">
								{networksByChainId[agent.$id.chainId]?.name ?? agent.$id.chainId}
							</span>
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</main>
