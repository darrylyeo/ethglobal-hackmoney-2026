<script lang="ts">
	// Types/constants
	import type { Actor$Id } from '$/data/Actor.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
	import { walletsCollection } from '$/collections/Wallets.ts'
	import { WalletConnectionTransport } from '$/data/WalletConnection.ts'
	import { stringify } from 'devalue'
	import { useWalletSubscriptions } from '$/state/wallet.svelte.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Props
	let {
		actorId = null as Actor$Id | null,
		filterAddresses = $bindable([] as `0x${string}`[]),
		availableAccounts = [],
	}: {
		actorId?: Actor$Id | null
		filterAddresses?: `0x${string}`[]
		availableAccounts?: `0x${string}`[]
	} = $props()


	// Context
	useWalletSubscriptions()
	const connectionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: walletConnectionsCollection })
				.select(({ row }) => ({ row })),
		[],
	)
	const walletsQuery = useLiveQuery(
		(q) =>
			q.from({ row: walletsCollection }).select(({ row }) => ({ row })),
		[],
	)
	registerLocalLiveQueryStack(() => [
		{ id: 'wallet-connections', label: 'Wallet Connections', query: connectionsQuery },
		{ id: 'wallets', label: 'Wallets', query: walletsQuery },
	])


	// (Derived)
	const actors = $derived(
		filterAddresses.length > 0
			? filterAddresses
			: actorId
				? [actorId.address]
				: [],
	)
	const walletsByRdns = $derived(
		new Map((walletsQuery.data ?? []).map(({ row: wallet }) => [wallet.$id.rdns, wallet])),
	)
	const connections = $derived(
		actors.length === 0
			? []
			: (connectionsQuery.data ?? [])
					.map(({ row: wallet }) => wallet)
					.filter((c) =>
						c.actors.some((a) =>
							actors.some((addr) => a === addr),
						),
					),
	)
	const singleAddress = $derived(actors.length === 1 ? actors[0] : null)


	// Components
	import Collapsible from '$/components/Collapsible.svelte'
	import Boundary from '$/components/Boundary.svelte'
	import ComboboxMultiple from '$/components/ComboboxMultiple.svelte'
	import TruncatedValue, {
		TruncatedValueFormat,
	} from '$/components/TruncatedValue.svelte'
</script>


{#snippet SectionSummary({ title }: { title: string })}
	<div class="section-summary">
		<div data-row>
			<h3 data-row-item="flexible" class="section-heading">
				{title}{#if singleAddress}
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
				data-row="wrap"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
			>
				<ComboboxMultiple
					items={availableAccounts}
					bind:value={filterAddresses}
					placeholder="Account"
					ariaLabel="Filter by account"
					getItemId={(addr) => addr}
					getItemLabel={(addr) =>
						`${addr.slice(0, 6)}…${addr.slice(-4)}`}
				/>
			</div>
		{/if}
	</div>
{/snippet}
<Collapsible
	title="Wallet connections"
	Summary={SectionSummary}
	detailsProps={{
		class: 'wallet-connections',
		'data-card': '',
		'data-scroll-container': 'block',
		open: true,
	}}
>
	<Boundary>
			{#if connections.length === 0}
				<p data-text="muted">No wallet connections for this account.</p>
			{:else}
				<ul
					data-columns="width-4 gap-2"
					data-list="unstyled"
					class="connections-list"
				>
					{#each connections as conn (stringify(conn.$id))}
						{@const wallet =
							conn.transport === WalletConnectionTransport.None
								? null
								: walletsByRdns.get(conn.$id.wallet$id.rdns)}
						<li
							class="connection-item"
							data-columns-item
							data-card
							data-tag={conn.status}
							data-row="gap-3"
						>
							<span class="connection-name" data-row-item="flexible">
								{conn.transport === WalletConnectionTransport.None
									? 'Watching'
									: (wallet?.name ?? conn.$id.wallet$id.rdns)}
							</span>
							<span class="connection-status">{conn.status}</span>
							{#if conn.selected}
								<span class="connection-badge">Selected</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</Boundary>
</Collapsible>


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

	.connection-name {
		font-weight: 500;
	}

	.connection-status {
		font-size: 0.85em;
		opacity: 0.8;
	}

	.connection-badge {
		font-size: 0.75em;
		opacity: 0.9;
	}
</style>
