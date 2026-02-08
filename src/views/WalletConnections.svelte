<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources.ts'
	import { WalletConnectionTransport } from '$/data/WalletConnection.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
	import { walletsCollection } from '$/collections/Wallets.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Props
	let {
		selectedActor = null as `0x${string}` | null,
		filterAddresses = $bindable([] as `0x${string}`[]),
		availableAccounts = [],
	}: {
		selectedActor?: `0x${string}` | null
		filterAddresses?: `0x${string}`[]
		availableAccounts?: `0x${string}`[]
	} = $props()


	// State
	const connectionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: walletConnectionsCollection })
				.where(({ row }) => eq(row.$source, DataSource.Local))
				.select(({ row }) => ({ row })),
		[],
	)
	const walletsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: walletsCollection })
				.where(({ row }) => eq(row.$source, DataSource.Local))
				.select(({ row }) => ({ row })),
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
			: selectedActor
				? [selectedActor]
				: [],
	)
	const walletsByRdns = $derived(
		new Map((walletsQuery.data ?? []).map((r) => [r.row.$id.rdns, r.row])),
	)
	const connections = $derived(
		actors.length === 0
			? []
			: (connectionsQuery.data ?? [])
					.map((r) => r.row)
					.filter((c) =>
						c.actors.some((a) =>
							actors.some(
								(addr) => a.toLowerCase() === addr.toLowerCase(),
							),
						),
					),
	)
	const singleAddress = $derived(
		actors.length === 1 ? actors[0] : null,
	)


	// Components
	import Boundary from '$/components/Boundary.svelte'
	import Combobox from '$/components/Combobox.svelte'
	import TruncatedValue, {
		TruncatedValueFormat,
	} from '$/components/TruncatedValue.svelte'
</script>


{#if actors.length > 0}
	<details class="wallet-connections" data-card data-scroll-container open>
		<summary class="section-summary">
			<div data-row="gap-2 align-center">
				<h3 data-row-item="flexible" class="section-heading">
					Wallet connections{#if singleAddress}
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
					data-row="gap-2 wrap align-center"
					onclick={(e) => e.stopPropagation()}
					onkeydown={(e) => e.stopPropagation()}
				>
					<Combobox
						type="multiple"
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
		</summary>
		<Boundary>
			{#if connections.length === 0}
				<p data-muted>No wallet connections for this account.</p>
			{:else}
				<ul
					data-columns="width-4 gap-2"
					data-list="unstyled"
					class="connections-list"
				>
					{#each connections as conn (conn.$id.wallet$id.rdns)}
						{@const wallet =
							conn.transport === WalletConnectionTransport.None
								? null
								: walletsByRdns.get(conn.$id.wallet$id.rdns)}
						<li
							class="connection-item"
							data-columns-item
							data-card="padding-2 radius-4"
							data-tag={conn.status}
							data-row="gap-3 align-center"
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
	</details>
{/if}


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
