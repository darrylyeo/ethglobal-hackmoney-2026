<script lang="ts">


	// Types/constants
	import { DataSource } from '$/constants/data-sources.ts'


	// Context
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'
	import { uniswapPositionsCollection } from '$/collections/uniswap-positions.ts'
	import { fetchUniswapPositions } from '$/collections/uniswap-positions.ts'
	import { walletConnectionsCollection } from '$/collections/wallet-connections.ts'
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
				.where(({ row }) => eq(row.$source, DataSource.Local))
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
			.map((r) => r.row)
			.filter((c) => c.status === 'connected'),
	)
	const ownerChainPairs = $derived(
		[
			...new Map(
				connectedConnections.flatMap((c) => {
					const chainId = c.chainId
					return chainId != null
						? c.actors.map((owner) => [
								`${chainId}:${owner.toLowerCase()}`,
								{ chainId, owner: owner as `0x${string}` },
							])
						: []
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
			.map((r) => r.row)
			.filter((row) => allActorsLower.has(row.owner.toLowerCase()))
			.sort((a, b) => (a.chainId !== b.chainId ? a.chainId - b.chainId : a.id.localeCompare(b.id))),
	)
	// Components
	import Address from '$/components/Address.svelte'
</script>


<svelte:head>
	<title>Liquidity positions</title>
</svelte:head>


<main id="main" data-column data-sticky-container>
	<h1>Liquidity</h1>
	<p data-muted>Uniswap V4 positions for all connected accounts.</p>

	{#if positions.length === 0}
		<p>No liquidity positions found. Connect wallets and add liquidity via Session → Add Liquidity.</p>
	{:else}
		<section class="position-list">
			<ul data-column="gap-2" data-list="unstyled">
				{#each positions as pos (pos.id)}
					{@const net = networksByChainId[pos.chainId]}
					<li
						data-card="padding-2 radius-4"
						data-row="gap-3 align-center wrap"
					>
						<span class="position-id" title={pos.id}>{pos.id.slice(0, 10)}…</span>
						<span class="position-chain">{net?.name ?? pos.chainId}</span>
						<Address network={pos.chainId} address={pos.owner} />
						<a href="/account/{pos.owner}">Account</a>
						<a href="/session#/AddLiquidity">Manage</a>
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
