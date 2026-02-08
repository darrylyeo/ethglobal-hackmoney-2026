<script lang="ts">
	// Types/constants
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { yellowChannelsCollection } from '$/collections/yellow-channels.ts'
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
	const query = useLiveQuery((q) =>
		q.from({ row: yellowChannelsCollection }).select(({ row }) => ({ row })),
	)
	registerLocalLiveQueryStack(() => [
		{ id: 'yellow-channels', label: 'Yellow Channels', query },
	])


	// (Derived)
	const actors = $derived(
		filterAddresses.length > 0
			? filterAddresses
			: selectedActor
				? [selectedActor]
				: [],
	)
	const channels = $derived(
		actors.length === 0
			? []
			: (query.data ?? [])
					.map((r) => r.row)
					.filter((row) =>
						actors.some(
							(a) =>
								row.participant0.toLowerCase() === a.toLowerCase() ||
								row.participant1.toLowerCase() === a.toLowerCase(),
						),
					)
					.sort((a, b) => b.updatedAt - a.updatedAt),
	)
	const singleAddress = $derived(
		actors.length === 1 ? actors[0] : null,
	)


	// Components
	import Address from '$/components/Address.svelte'
	import Boundary from '$/components/Boundary.svelte'
	import Combobox from '$/components/Combobox.svelte'
	import TruncatedValue, {
		TruncatedValueFormat,
	} from '$/components/TruncatedValue.svelte'
</script>


{#if actors.length > 0}
	<details class="channels" data-card data-scroll-container open>
		<summary class="section-summary">
			<div data-row="gap-2 align-center">
				<h3 data-row-item="flexible" class="section-heading">
					Channels{#if singleAddress}
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
			{#if channels.length === 0}
				<p data-muted>No channels for this account.</p>
			{:else}
				<ul
					data-columns="width-4 gap-2"
					data-list="unstyled"
					class="channels-list"
				>
					{#each channels as ch (ch.id)}
						{@const isParticipant0 = actors.some(
							(a) =>
								ch.participant0.toLowerCase() === a.toLowerCase(),
						)}
						{@const participantAddr = isParticipant0
							? ch.participant1
							: ch.participant0}
						{@const balance = isParticipant0 ? ch.balance0 : ch.balance1}
						<li
							data-columns-item
							data-card="padding-2 radius-4"
							data-row="gap-3 align-center wrap"
							data-status={ch.status}
						>
							<span class="channel-id" title={ch.id}>{ch.id.slice(0, 10)}…</span>
							<Address network={ch.chainId} address={participantAddr} />
							<span>{formatSmallestToDecimal(balance, 6)} USDC</span>
							<span data-status>{ch.status}</span>
							<a href="/positions/channels">View all</a>
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

	.channels-list {
		margin: 0;
		padding: 0;
	}

	.channel-id {
		font-family: ui-monospace, monospace;
		font-size: 0.9em;
	}
</style>
