<script lang="ts">
	// Types/constants
	import type { Entity } from '$/data/$EntityType.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { networksCollection } from '$/collections/Networks.ts'
	import { ChainId, networksByChainId } from '$/constants/networks.ts'
	import { FORK_SCHEDULE_BY_CHAIN_ID } from '$/constants/fork-schedules.ts'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'


	// (Derived)
	const chainIdParam = $derived((page.params as { chainId?: string }).chainId ?? '')
	const route = $derived(parseNetworkNameParam(chainIdParam))
	const chainId = $derived(route?.chainId ?? 0)
	const network = $derived(route?.network)
	const slug = $derived(route?.slug ?? '')
	const caip2 = $derived(route?.caip2 ?? '')
	const scheduleForks = $derived(FORK_SCHEDULE_BY_CHAIN_ID[chainId]?.forks ?? null)
	const isMainnet = $derived(chainId === ChainId.Ethereum)
	const showForkList = $derived(
		isMainnet || (scheduleForks != null && scheduleForks.length > 0),
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
		network && route
			? (networkQuery.data?.[0]?.row
				? ({
					...networkQuery.data[0].row,
					network: route.network,
					slug: route.slug,
					caip2: route.caip2,
				} as Entity<EntityType.Network> & {
					network: typeof route.network
					slug: string
					caip2: string
				})
				: { ...network, $id: { chainId: network.chainId } })
			: undefined,
	)

	const mainnetForksHref = $derived(
		resolve(
			`/network/${networksByChainId[ChainId.Ethereum]?.slug ?? ChainId.Ethereum}/forks`,
		),
	)


	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Heading from '$/components/Heading.svelte'
	import NetworkContracts from '$/views/network/NetworkContracts.svelte'
	import NetworkForkSchedule from '$/views/network/NetworkForkSchedule.svelte'
	import NetworkName from '$/views/NetworkName.svelte'
</script>

<svelte:head>
	<title>Fork upgrades · {network?.name ?? 'Network'}</title>
</svelte:head>

<main data-column="gap-2">
	{#if !route}
		<Heading>Network not found</Heading>
		<p>The network "{chainIdParam}" could not be resolved.</p>
	{:else if !showForkList}
		<header data-column="gap-2">
			<Heading>Fork upgrades</Heading>
			<p data-text="annotation">
				Fork schedule is not available for this network.
				<a href={mainnetForksHref} data-link>View Ethereum mainnet fork upgrades</a>.
			</p>
		</header>
		<p>
			<a href={resolve(`/network/${chainIdParam}`)} data-link>Back to {network?.name ?? 'network'}</a>
		</p>
	{:else}
		<EntityView
			entityType={EntityType.Network}
			entity={networkEntity}
			idSerialized={slug}
			href={resolve(`/network/${chainIdParam}`)}
			label={network?.name ?? ''}
			metadata={[
				{ term: 'Chain ID', detail: String(chainId) },
				{ term: 'CAIP-2', detail: caip2 },
				...(
					network && 'nativeCurrency' in network && network.nativeCurrency
						? [{ term: 'Currency', detail: network.nativeCurrency.symbol }]
						: []
				),
			]}
		>
			{#snippet Title()}
				<NetworkName {chainId} />
			{/snippet}
			{#snippet AfterTitle({ entity })}
				{#if entity && 'network' in entity && entity.network?.type}
					<span data-tag={entity.network.type}>{entity.network.type}</span>
				{/if}
			{/snippet}
			{#snippet children()}
				<p>
					<a href={resolve(`/network/${chainIdParam}/contracts`)} data-link>Contracts</a>
					<a href={resolve('/proposals')} data-link>Proposals (EIPs / ERCs)</a>
				</p>
				<NetworkContracts chainId={chainId} nameParam={chainIdParam} />
				<nav data-row="gap-2 wrap" aria-label="External resources">
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
				<NetworkForkSchedule
					chainId={chainId}
					nameParam={chainIdParam}
					detailsProps={{ 'data-card': 'radius-2 padding-4' }}
				/>
			{/snippet}
		</EntityView>
	{/if}
</main>
