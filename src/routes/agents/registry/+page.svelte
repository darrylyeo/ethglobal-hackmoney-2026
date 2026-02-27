<script lang="ts">
	// Types/constants
	import type { Filter, FilterGroup } from '$/components/Filters.svelte'
	import type { Sort } from '$/components/Sorts.svelte'
	import { FilterDisplayType, FilterOperation } from '$/components/Filters.svelte'
	import { ipfsUriToHttp } from '$/api/eip-8004.ts'
	import { serviceRegistries } from '$/constants/service-registries.ts'
	import { eip8004ServicesCollection } from '$/collections/Eip8004Services.ts'
	import type { Eip8004Service } from '$/data/Eip8004Service.ts'
	import { eip8004ServiceIdToString } from '$/data/Eip8004Service.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { networksByChainId } from '$/constants/networks.ts'

	enum ServiceSort {
		Name = 'name',
		Chain = 'chain',
	}

	// Context
	import { resolve } from '$app/paths'

	// (Derived)
	const entriesQuery = useLiveQuery((q) =>
		q
			.from({ row: eip8004ServicesCollection })
			.select(({ row }) => ({ row })),
	)
	const views = $derived(
		(entriesQuery.data ?? [])
			.map(({ row: service }) => service as Eip8004Service)
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
					filterFunction: (e: Eip8004Service) => e.$id.chainId === c,
				})),
			],
		},
	] as FilterGroup<Eip8004Service, string>[])

	const primaryRegistry = $derived(serviceRegistries[0])
	const sortOptions: Sort<Eip8004Service, ServiceSort>[] = [
		{
			id: ServiceSort.Name,
			label: 'Name',
			compare: (a, b) =>
				(a.name ?? a.$id.identityId).localeCompare(b.name ?? b.$id.identityId),
		},
		{
			id: ServiceSort.Chain,
			label: 'Chain',
			compare: (a, b) => a.$id.chainId - b.$id.chainId || a.$id.identityId.localeCompare(b.$id.identityId),
		},
	]

	// State
	let activeFilters = $state<Set<Filter<Eip8004Service, string>>>(new Set())
	let searchQuery = $state('')
	let displayCount = $state(0)

	// (Derived)
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
	const getKey = (s: Eip8004Service) => eip8004ServiceIdToString(s.$id)

	// Components
	import RefinableList from '$/components/RefinableList.svelte'
</script>

<svelte:head>
	<title>{primaryRegistry?.label ?? 'Service'} registry – Agents</title>
</svelte:head>

<main data-column="gap-4">
	<h1>{primaryRegistry?.label ?? 'Service'} registry</h1>
	<p data-text="muted">
		Explore EIP-8004 services from the
		<a
			href="https://eips.ethereum.org/EIPS/eip-8004"
			target="_blank"
			rel="noopener noreferrer"
			data-link
		>
			EIP-8004
		</a>
		Identity Registry. Reference them in agent chat with <code>@Service:…</code>.
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
			{(eip8004ServicesCollection.utils.lastError as unknown as { message?: string })?.message ?? 'Unknown error'}
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
		</div>
		<p>{displayCount} of {views.length} services</p>
		<RefinableList
			items={searchFiltered}
			{filterGroups}
			defaultFilterIds={new Set<string>()}
			{sortOptions}
			defaultSortId={ServiceSort.Name}
			{getKey}
			bind:activeFilters
			bind:displayCount
			placeholderKeys={new Set<string>()}
			data-column="gap-1"
			role="list"
		>
				{#snippet Empty()}
					<p data-text="muted">
						No services in registry. Data is read from chain (Identity Registry + agentURI); add chains in
						<code>eip-8004-registry</code>.
					</p>
				{/snippet}
				{#snippet Item({ key: _k, item: service, isPlaceholder })}
					{#if !isPlaceholder && service != null}
						<div data-row="align-center gap-2">
							{#if service.image}
								<img
									src={ipfsUriToHttp(service.image)}
									alt=""
									width="32"
									height="32"
									style="border-radius: 50%; object-fit: cover;"
								/>
							{/if}
							<span data-row="wrap align-center gap-1">
								<a
									href={resolve(
										`/agents/registry/${encodeURIComponent(eip8004ServiceIdToString(service.$id))}`,
									)}
									data-link
								>
									<strong>{service.name ?? service.$id.identityId}</strong>
								</a>
								{#if service.name && service.$id.identityId !== service.name}
									<span data-text="muted">{service.$id.identityId}</span>
								{/if}
								<span data-text="muted">
									{networksByChainId[service.$id.chainId]?.name ?? service.$id.chainId}
								</span>
							</span>
						</div>
					{/if}
				{/snippet}
		</RefinableList>
	{/if}
</main>
