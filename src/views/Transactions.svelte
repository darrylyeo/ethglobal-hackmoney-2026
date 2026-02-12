<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import {
		ensureTransactionsForAddresses,
		bridgeTransactionsCollection,
	} from '$/collections/BridgeTransactions.ts'
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


	// Functions
	import { formatSmallestToDecimal } from '$/lib/format.ts'


	// State
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// (Derived)
	const actors = $derived(
		filterAddresses.length > 0
			? filterAddresses
			: selectedActor
				? [selectedActor]
				: [],
	)
	const query = useLiveQuery(
		(q) =>
			q.from({ row: bridgeTransactionsCollection }).select(({ row }) => ({ row })),
		[],
	)
	registerLocalLiveQueryStack(() => [
		{ id: 'transactions', label: 'Transactions', query },
	])
	const transactions = $derived(
		actors.length === 0
			? []
			: (query.data ?? [])
					.map((r) => r.row)
					.filter((row) =>
						actors.some(
							(a) => row.$id.address.toLowerCase() === a.toLowerCase(),
						),
					)
					.sort((a, b) => b.$id.createdAt - a.$id.createdAt),
	)
	const singleAddress = $derived(
		actors.length === 1 ? actors[0] : null,
	)


	// Actions
	$effect(() => {
		if (actors.length > 0) ensureTransactionsForAddresses(actors)
	})


	// Components
	import Boundary from '$/components/Boundary.svelte'
	import ComboboxMultiple from '$/components/ComboboxMultiple.svelte'
	import TruncatedValue, {
		TruncatedValueFormat,
	} from '$/components/TruncatedValue.svelte'
</script>


	<details class="transactions" data-card data-scroll-container="block" open>
		<summary class="section-summary">
			<div data-row="gap-2">
				<h3 data-row-item="flexible" class="section-heading">
					Transactions{#if singleAddress}
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
			{#if transactions.length === 0}
				<p data-text="muted">No indexed transactions for this account.</p>
			{:else}
				<ul
					data-columns="width-4 gap-2"
					data-list="unstyled"
					class="tx-list"
				>
					{#each transactions as tx (tx.$id.sourceTxHash + tx.$id.createdAt)}
						{@const fromNet = networksByChainId[tx.fromChainId]}
						{@const toNet = networksByChainId[tx.toChainId]}
						<li
							class="tx-item"
							data-columns-item
							data-card="padding-2"
							data-tag={tx.status}
							data-row="gap-3"
						>
							<span class="tx-chains">
								{fromNet?.name ?? tx.fromChainId} → {toNet?.name ?? tx.toChainId}
							</span>
							<span class="tx-amount" data-row-item="flexible">
								{formatSmallestToDecimal(tx.fromAmount, 6, 2)} →
								{formatSmallestToDecimal(tx.toAmount, 6, 2)}
							</span>
							<span class="tx-status">{tx.status}</span>
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

	.tx-chains {
		font-weight: 500;
	}

	.tx-status {
		font-size: 0.85em;
		opacity: 0.8;
	}
</style>
