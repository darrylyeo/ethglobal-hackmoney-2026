<script lang="ts">
	// Types/constants
	import { networksByChainId } from '$/constants/networks.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { uniswapPositionsCollection } from '$/collections/UniswapPositions.ts'
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
	const query = useLiveQuery((q) =>
		q.from({ row: uniswapPositionsCollection }).select(({ row }) => ({ row })),
	)
	registerLocalLiveQueryStack(() => [
		{ id: 'uniswap-positions', label: 'Uniswap Positions', query },
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
						actors.some(
							(a) => row.owner.toLowerCase() === a.toLowerCase(),
						),
					)
					.sort((a, b) =>
						a.chainId !== b.chainId
							? a.chainId - b.chainId
							: a.id.localeCompare(b.id),
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
	<details class="liquidity-positions" data-card data-scroll-container="block" open>
		<summary class="section-summary">
			<div data-row="gap-2 align-center">
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
			{#if positions.length === 0}
				<p data-muted>No liquidity positions for this account.</p>
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
							data-card="padding-2 radius-4"
							data-row="gap-3 align-center wrap"
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

	.positions-list {
		margin: 0;
		padding: 0;
	}

	.position-id {
		font-family: ui-monospace, monospace;
		font-size: 0.9em;
	}
</style>
