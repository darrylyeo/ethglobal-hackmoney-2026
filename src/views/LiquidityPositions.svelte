<script lang="ts">
	// Types/constants
	import { fetchPositions } from '$/api/uniswap.ts'
	import { fetchUniswapPositions, uniswapPositionsCollection } from '$/collections/UniswapPositions.ts'
	import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'


	// Props
	let {
		selectedActor = undefined as `0x${string}` | undefined,
		filterAddresses = $bindable([] as `0x${string}`[]),
		availableAccounts = [],
	}: {
		selectedActor?: `0x${string}` | undefined
		filterAddresses?: `0x${string}`[]
		availableAccounts?: `0x${string}`[]
	} = $props()


	// Context
	const query = useLiveQuery((q) =>
		q.from({ row: uniswapPositionsCollection }).select(({ row }) => ({ row })),
	)
	const connectionsQuery = useLiveQuery((q) =>
		q.from({ row: walletConnectionsCollection }).select(({ row }) => ({ row })),
	)
	registerLocalLiveQueryStack(() => [
		{ id: 'uniswap-positions', label: 'Uniswap Positions', query },
		{
			id: 'liquidity-wallet-connections',
			label: 'Wallet Connections',
			query: connectionsQuery,
		},
	])


	// (Derived)
	const actors = $derived(
		filterAddresses.length > 0
			? filterAddresses
			: selectedActor
				? [selectedActor]
				: [],
	)
	const positions = $derived(
		actors.length === 0
			? []
			: (query.data ?? [])
					.map((r) => r.row)
					.filter((row) =>
						actors.some((a) => row.owner === a),
					)
					.sort((a, b) =>
						a.chainId !== b.chainId
							? a.chainId - b.chainId
							: a.id.localeCompare(b.id),
					),
	)
	const singleAddress = $derived(actors.length === 1 ? actors[0] : undefined)
	const ownerChainPairs = $derived(
		[
			...new Map(
				(connectionsQuery.data ?? [])
					.map((r) => r.row)
					.filter((c) => c.status === 'connected' && c.chainId != null)
					.flatMap((c) =>
						c.actors
							.filter((actor) =>
								actors.some((a) => a === actor),
							)
							.map((owner) => [
								`${c.chainId}:${owner}`,
								{ chainId: c.chainId!, owner },
							]),
					),
			).values(),
		],
	)


	// Actions
	$effect(() => {
		for (const { chainId, owner } of ownerChainPairs) {
			void fetchUniswapPositions({ chainId, owner }, fetchPositions).catch(() => {})
		}
	})


	// Components
	import Boundary from '$/components/Boundary.svelte'
	import ComboboxMultiple from '$/components/ComboboxMultiple.svelte'
	import TruncatedValue, {
		TruncatedValueFormat,
	} from '$/components/TruncatedValue.svelte'
</script>


	<details class="liquidity-positions" data-card data-scroll-container="block" open>
		<summary class="section-summary">
			<div data-row="gap-2">
				<h3 data-row-item="flexible" class="section-heading">
					Liquidity positions{#if singleAddress}
						{' '}for <TruncatedValue
							value={singleAddress}
							startLength={6}
							endLength={4}
							format={TruncatedValueFormat.Abbr}
						/>
					{/if}
				</h3>
			</div>
			{#if availableAccounts.length > 0}
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<div
					class="section-filters"
					role="group"
					aria-label="Filters"
					data-row="gap-2 wrap"
					onclick={(e) => e.stopPropagation()}
					onkeydown={(e) => e.stopPropagation()}
				>
					<ComboboxMultiple
						items={availableAccounts}
						bind:value={filterAddresses}
						getItemId={(addr) => addr}
						getItemLabel={(addr) =>
							`${addr.slice(0, 6)}…${addr.slice(-4)}`}
						placeholder="Account"
						ariaLabel="Filter by account"
					/>
				</div>
			{/if}
		</summary>
		<Boundary>
			{#if positions.length === 0}
				<p data-text="muted">No liquidity positions for this account.</p>
			{:else}
				<ul
					data-columns="width-4 gap-2"
					data-list="unstyled"
					class="positions-list"
				>
					{#each positions as pos (pos.id)}
						{@const net = networksByChainId[pos.chainId]}
						<li
							data-columns-item
							data-card="padding-2"
							data-row="gap-3 wrap"
						>
							<span class="position-id" title={pos.id}>{pos.id.slice(0, 10)}…</span>
							<span>{net?.name ?? pos.chainId}</span>
							<a href="/positions/liquidity">View all</a>
							<a href="/session?template=AddLiquidity">Manage</a>
						</li>
					{/each}
				</ul>
			{/if}
		</Boundary>
	</details>


<style>
	.section-summary {
		list-style: none;
		cursor: pointer;
	}

	.section-summary::-webkit-details-marker {
		display: none;
	}

	.section-heading {
		font-size: 1rem;
		margin: 0;
	}

	.positions-list {
		margin: 0;
		padding: 0;
	}

	.position-id {
		font-family: ui-monospace, monospace;
		font-size: 0.9em;
	}
</style>
