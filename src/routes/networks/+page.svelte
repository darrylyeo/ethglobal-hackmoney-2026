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

	const mainnetFilter = $derived(
		filterGroups[0].filters[0]
	)
	const testnetFilter = $derived(
		filterGroups[0].filters[1]
	)

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

	const defaultFilterIds = $derived(
		new Set<NetworkEnvironment>([networkEnvironmentState.current]),
	)


	// State
	let activeFilters = $state(
		new Set<Filter<NetworkItem, NetworkEnvironment>>()
	)
	let displayCount = $state(
		0
	)


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
	import NetworkView from '$/views/network/Network.svelte'
	import { NetworkLayout } from '$/views/network/Network.svelte'
	import RefinableList from '$/components/RefinableList.svelte'
</script>


<svelte:head>
	<title>Networks</title>
</svelte:head>


<main data-column>
	<section data-column>
		<h1><a href={resolve('/networks')}>Networks</a></h1>
		<RefinableList
			items={[...networks]}
			{filterGroups}
			defaultFilterIds={defaultFilterIds}
			{sortOptions}
			defaultSortId="mainnetChain"
			getKey={(n) => n.chainId}
			getSortValue={(n) => getMainnetChainId(n)}
			placeholderKeys={new Set()}
			bind:activeFilters
			bind:displayCount
			data-column
			role="list"
			aria-label="Networks environment"
		>
			{#snippet Item({ key, item: network, isPlaceholder })}
				{#if isPlaceholder}
					<span data-placeholder>…</span>
				{:else if network}
					<NetworkView
						networkId={{ chainId: network.chainId }}
						network={network}
						layout={NetworkLayout.Summary}
					/>
				{/if}
			{/snippet}

			{#snippet Empty()}
				<p data-text="muted">No networks.</p>
			{/snippet}
		</RefinableList>
	</section>
</main>
