<script lang="ts">
	// Types/constants
	import type { Filter, FilterGroup } from '$/components/Filters.svelte'
	import type { Sort } from '$/components/Sorts.svelte'
	import {
		mainnetChainIdByTestnetChainId,
		networks,
		NetworkType,
	} from '$/constants/networks.ts'
	import { NetworkEnvironment } from '$/constants/network-environment.ts'
	import {
		networkEnvironmentState,
		setNetworkEnvironment,
	} from '$/state/network-environment.svelte.ts'


	// Context
	import { resolve } from '$app/paths'


	// (Derived)
	const getMainnetChainId = (n: (typeof networks)[number]) =>
		n.type === NetworkType.Mainnet ?
			n.chainId
		:	mainnetChainIdByTestnetChainId.get(n.chainId) ?? n.chainId

	const filterGroups = $derived([
		{
			id: 'env',
			label: 'Environment',
			exclusive: true as const,
			defaultFilter: NetworkEnvironment.Mainnet,
			filters: [
				{
					id: NetworkEnvironment.Mainnet,
					label: 'Mainnet',
					filterFunction: (n: (typeof networks)[number]) =>
						n.type === NetworkType.Mainnet,
				},
				{
					id: NetworkEnvironment.Testnet,
					label: 'Testnet',
					filterFunction: (n: (typeof networks)[number]) =>
						n.type === NetworkType.Testnet,
				},
			],
		},
	] as FilterGroup<(typeof networks)[number], NetworkEnvironment>[])

	const mainnetFilter = $derived(filterGroups[0].filters[0])
	const testnetFilter = $derived(filterGroups[0].filters[1])

	type NetworkItem = (typeof networks)[number]
	const sortOptions: Sort<NetworkItem, 'mainnetChain' | 'chainId'>[] = [
		{
			id: 'mainnetChain',
			label: 'Mainnet chain',
			compare: (a, b) =>
				getMainnetChainId(a) - getMainnetChainId(b) || a.chainId - b.chainId,
		},
		{
			id: 'chainId',
			label: 'Chain ID',
		compare: (a, b) => a.chainId - b.chainId,
	},
	]
	const displayItems = $derived(
		sortOptions.length > 1 ? sortedItems : filteredItems,
	)


	// State
	let activeFilters = $state(new Set<Filter<NetworkItem, NetworkEnvironment>>())
	let filteredItems = $state<NetworkItem[]>([])
	let sortedItems = $state<NetworkItem[]>([])


	// Actions
	$effect(() => {
		const env = networkEnvironmentState.current
		activeFilters = new Set([
			env === NetworkEnvironment.Mainnet ? mainnetFilter : testnetFilter,
		])
	})
	$effect(() => {
		const envFilter = [...activeFilters].find(
			(f) =>
				f.id === NetworkEnvironment.Mainnet ||
				f.id === NetworkEnvironment.Testnet,
		)
		if (envFilter) setNetworkEnvironment(envFilter.id)
	})


	// Components
	import Filters from '$/components/Filters.svelte'
	import NetworksList from '$/views/NetworksList.svelte'
	import Sorts from '$/components/Sorts.svelte'
</script>


<svelte:head>
	<title>Networks</title>
</svelte:head>


<main data-column>
	<section data-column>
		<h1><a href={resolve('/networks')}>Networks</a></h1>
		<div data-row="gap-4 wrap">
			<Filters
				items={[...networks]}
				{filterGroups}
				bind:activeFilters
				bind:filteredItems
				aria-label="Networks environment"
			/>
			{#if sortOptions.length > 1}
				<Sorts
					items={filteredItems}
					{sortOptions}
					defaultSortId="mainnetChain"
					bind:sortedItems
				/>
			{/if}
		</div>
		<NetworksList networks={displayItems} />
	</section>
</main>
