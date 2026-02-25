<script lang="ts">
	// Types/constants


	// Context
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { uniswapPositionsCollection } from '$/collections/UniswapPositions.ts'
	import { fetchUniswapPositions } from '$/collections/UniswapPositions.ts'
	import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
	import { fetchPositions } from '$/api/uniswap.ts'
	import { networksByChainId } from '$/constants/networks.ts'


	// (Derived)
	const positionsQuery = useLiveQuery((q) =>
		q.from({ row: uniswapPositionsCollection }).select(({ row }) => ({ row })),
	)
	const connectionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: walletConnectionsCollection })
				.select(({ row }) => ({ row })),
		[],
	)
	const liveQueryEntries = [
		{ id: 'positions-liquidity-positions', label: 'Uniswap Positions', query: positionsQuery },
		{
			id: 'positions-liquidity-connections',
			label: 'Wallet Connections',
			query: connectionsQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const connectedConnections = $derived(
		(connectionsQuery.data ?? [])
			.map(({ row }) => row)
			.filter((c) => c.status === 'connected'),
	)
	const ownerChainPairs = $derived(
		[
			...new Map(
				connectedConnections.flatMap((c) => {
					const chainId = c.chainId
					if (chainId == null) return []
					return c.actors
						.filter(
							(owner): owner is `0x${string}` =>
								typeof owner === 'string' &&
								owner.startsWith('0x') &&
								owner.length === 42,
						)
						.map((owner) => [
							`${chainId}:${owner.toLowerCase()}`,
							{ chainId, owner },
						])
				}),
			).values(),
		],
	)
	$effect(() => {
		for (const { chainId, owner } of ownerChainPairs) {
			fetchUniswapPositions({ chainId, owner }, fetchPositions).catch(() => {})
		}
	})
	const allActorsLower = $derived(
		new Set(connectedConnections.flatMap((c) => c.actors.map((a) => a.toLowerCase()))),
	)
	const positions = $derived(
		(positionsQuery.data ?? [])
			.map(({ row }) => row)
			.filter((position) => allActorsLower.has(position.owner.toLowerCase()))
			.sort((a, b) => (a.chainId !== b.chainId ? a.chainId - b.chainId : a.id.localeCompare(b.id))),
	)
	// Components
	import Address from '$/views/Address.svelte'
</script>


<svelte:head>
	<title>Liquidity positions</title>
</svelte:head>


<main data-column data-sticky-container>
	<h1>Liquidity</h1>
	<p data-text="muted">Uniswap V4 positions for all connected accounts.</p>
	<p><a href="/positions/liquidity/pools">Pools</a></p>

	{#if positions.length === 0}
		<p>No liquidity positions found. Connect wallets and add liquidity via Session → Add Liquidity.</p>
	{:else}
		<section class="position-list">
			<ul data-column data-list="unstyled">
				{#each positions as pos (pos.chainId + ':' + pos.id)}
					{@const net = networksByChainId[pos.chainId]}
					<li
						data-card="padding-2 radius-4"
						data-row="gap-3 align-center wrap"
					>
						<a href="/positions/liquidity/position/{pos.chainId}/{pos.id}" class="position-id" title={pos.id}>{pos.id.slice(0, 10)}…</a>
						<span class="position-chain">{net?.name ?? pos.chainId}</span>
						<Address actorId={{ $network: { chainId: pos.chainId }, address: pos.owner }} />
						<a href="/account/{pos.owner}">Account</a>
						<a href="/session?template=AddLiquidity">Manage</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</main>


<style>
	.position-list ul {
		margin: 0;
		padding: 0;
	}
	.position-id {
		font-family: ui-monospace, monospace;
		font-size: 0.9em;
	}
	.position-chain {
		font-weight: 500;
	}
</style>
