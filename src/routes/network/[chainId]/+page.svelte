<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import type { Entity } from '$/data/$EntityType.ts'
	import { networksCollection } from '$/collections/Networks.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'


	// (Derived)
	const chainIdParam = $derived(page.params.chainId ?? '')
	const route = $derived(parseNetworkNameParam(chainIdParam))
	const chainId = $derived((route?.chainId ?? 0) as ChainId)


	// State
	const networkQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: networksCollection })
				.where(({ row }) => eq(row.$id.chainId, chainId))
				.select(({ row }) => ({ row })),
		[() => chainId],
	)
	registerLocalLiveQueryStack(() => [
		{
			id: 'network',
			label: 'Network',
			query: networkQuery as { data: { row: unknown }[] | undefined },
		},
	])


	// Components
	import Network from '$/views/network/Network.svelte'
	import NetworkName from '$/views/NetworkName.svelte'
</script>

<svelte:head>
	<title>
		{route
			? `${route.network.name} · Network`
			: 'Network'}
	</title>
</svelte:head>

<main data-column>
	{#if !route}
		<h1>Network not found</h1>
		<p>The network "{chainIdParam}" could not be resolved.</p>
	{:else}
		<Network
			networkId={{ chainId }}
			entity={
				networkQuery.data?.[0]?.row && route
					? ({
						...networkQuery.data[0].row,
						network: route.network,
					} as Entity<EntityType.Network> & { network: typeof route.network })
					: undefined
			}
			idSerialized={chainIdParam}
			href={resolve(`/network/${chainIdParam}`)}
			label={route.network.name}
			metadata={[
				{ term: 'Chain ID', detail: String(chainId) },
				{ term: 'CAIP-2', detail: `eip155:${chainId}` },
				...(
					route.network.nativeCurrency
						? [{ term: 'Currency', detail: route.network.nativeCurrency.symbol }]
						: []
				),
			]}
		>
			{#snippet Title()}
				<NetworkName networkId={{ chainId }} />
			{/snippet}
			{#snippet AfterTitle({ entity })}
				{#if entity && 'network' in entity && (entity as { network?: { type: string } }).network?.type}
					{@const net = (entity as { network: { type: string } }).network}
					<span data-tag={net.type}>{net.type}</span>
				{/if}
			{/snippet}
		</Network>
	{/if}
</main>
