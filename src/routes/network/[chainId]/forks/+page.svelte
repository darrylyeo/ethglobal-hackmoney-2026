<script lang="ts">
	// Types/constants
	import type { Entity } from '$/data/$EntityType.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { networksCollection } from '$/collections/Networks.ts'
	import { ChainId } from '$/constants/networks.ts'
	import { forksByChainId } from '$/constants/forks/index.ts'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'

	// (Derived)
	const chainIdParam = $derived(
		(page.params as { chainId?: string }).chainId ?? ''
	)
	const route = $derived(
		parseNetworkNameParam(chainIdParam)
	)
	const chainId = $derived(
		route?.chainId ?? 0
	)
	const networkId = $derived(
		route ? { chainId: route.chainId } : undefined
	)
	const network = $derived(
		route?.network
	)
	const scheduleForks = $derived(
		forksByChainId[chainId] ?? null
	)
	const isMainnet = $derived(
		chainId === ChainId.Ethereum
	)
	const showForkList = $derived(
		isMainnet || (scheduleForks != null && scheduleForks.length > 0)
	)

	const networkQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: networksCollection })
				.where(({ row }) => eq(row.$id.chainId, chainId))
				.select(({ row }) => ({ row })),
		[() => chainId],
	)

	const networkEntity = $derived(
		network && route ?
			(networkQuery.data?.[0]?.row ?
				({
					...networkQuery.data[0].row,
					network: route.network,
				} as Entity<EntityType.Network> & { network: typeof route.network })
				: { ...network, $id: { chainId: network.chainId } })
			: undefined
	)

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Heading from '$/components/Heading.svelte'
	import ContractsList from '$/views/network/ContractsList.svelte'
	import NetworkForks from '$/views/network/NetworkForks.svelte'
	import NetworkName from '$/views/NetworkName.svelte'
</script>


<svelte:head>
	<title>Fork upgrades · {network?.name ?? 'Network'}</title>
</svelte:head>


<main data-column>
	{#if !route}
		<Heading>Network not found</Heading>
		<p>
			The network "{chainIdParam}" could not be resolved.
		</p>
	{:else if !showForkList}
		<header data-column>
			<Heading>Fork upgrades</Heading>
			<p data-text="annotation">
				Fork schedule is not available for this network.
				<a
					href={resolve(`/network/${ChainId.Ethereum}/forks`)}
					data-link
				>
					View Ethereum mainnet fork upgrades
				</a>.
			</p>
		</header>

		<p>
			<a
				href={resolve(`/network/${chainIdParam}`)}
				data-link
			>
				Back to {network?.name ?? 'network'}
			</a>
		</p>
	{:else}
		<EntityView
			entityType={EntityType.Network}
			entity={networkEntity}
			titleHref={resolve(`/network/${chainIdParam}`)}
			label={network?.name ?? ''}
			metadata={[
				{ term: 'Chain ID', detail: String(chainId) },
				{ term: 'CAIP-2', detail: `eip155:${chainId}` },
				...(
					network && 'nativeCurrency' in network && network.nativeCurrency ?
						[{ term: 'Currency', detail: network.nativeCurrency.symbol }]
						: []
				),
			]}
		>
			{#snippet Title()}
				<NetworkName {networkId} />
			{/snippet}

			{#snippet AfterTitle({ entity })}
				{#if entity && 'network' in entity && entity.network?.type}
					<span data-tag={entity.network.type}>{entity.network.type}</span>
				{/if}
			{/snippet}

			{#snippet children()}
				<p>
					<a
						href={resolve(`/network/${chainIdParam}/contracts`)}
						data-link
					>
						Contracts
					</a>
					<a
						href={resolve('/proposals')}
						data-link
					>
						Proposals (EIPs / ERCs)
					</a>
				</p>

				<ContractsList {networkId} />
				<nav
					data-row="wrap"
					aria-label="External resources"
				>
					<a
						href="https://ethereum.org/ethereum-forks/"
						target="_blank"
						rel="noopener noreferrer"
						data-tag
					>
						ethereum.org timeline
					</a>

					<a
						href="https://github.com/ethereum/execution-specs/tree/master/network-upgrades/mainnet-upgrades"
						target="_blank"
						rel="noopener noreferrer"
						data-tag
					>
						execution-specs
					</a>

					<a
						href="https://forkcast.org"
						target="_blank"
						rel="noopener noreferrer"
						data-tag
					>
						Forkcast
					</a>
				</nav>

				<NetworkForks
					{networkId}
					detailsProps={{ 'data-card': '' }}
				/>
			{/snippet}
		</EntityView>
	{/if}
</main>
