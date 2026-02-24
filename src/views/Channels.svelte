<script lang="ts">
	// Types/constants
	import type { Actor$Id } from '$/data/Actor.ts'
	import { stateChannelsCollection } from '$/collections/StateChannels.ts'
	import { formatSmallestToDecimal } from '$/lib/format.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'


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
	const query = useLiveQuery((q) =>
		q.from({ row: stateChannelsCollection }).select(({ row }) => ({ row })),
	)
	registerLocalLiveQueryStack(() => [
		{ id: 'yellow-channels', label: 'Yellow Channels', query },
	])


	// (Derived)
	const actors = $derived(
		filterAddresses.length > 0
			? filterAddresses
			: actorId
				? [actorId.address]
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
								row.participant0 === a ||
								row.participant1 === a,
						),
					)
					.sort((a, b) => b.updatedAt - a.updatedAt),
	)
	const singleAddress = $derived(actors.length === 1 ? actors[0] : null)


	// Components
	import Collapsible from '$/components/Collapsible.svelte'
	import Boundary from '$/components/Boundary.svelte'
	import ComboboxMultiple from '$/components/ComboboxMultiple.svelte'
	import TruncatedValue, {
		TruncatedValueFormat,
	} from '$/components/TruncatedValue.svelte'
	import Address from '$/views/Address.svelte'
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
	title="Channels"
	Summary={SectionSummary}
	detailsProps={{
		class: 'channels',
		'data-card': '',
		'data-scroll-container': 'block',
		open: true,
	}}
>
	<Boundary>
		{#if channels.length === 0}
			<p data-text="muted">No channels for this account.</p>
		{:else}
			<ul
				data-columns="width-4 gap-2"
				data-list="unstyled"
				class="channels-list"
			>
				{#each channels as ch (ch.id)}
					{@const isParticipant0 = actors.some(
						(a) => ch.participant0 === a,
					)}
					{@const participantAddr = isParticipant0
						? ch.participant1
						: ch.participant0}
					{@const balance = isParticipant0 ? ch.balance0 : ch.balance1}
					<li
						data-columns-item
						data-card
						data-row="gap-3 wrap"
						data-status={ch.status}
					>
						<span class="channel-id" title={ch.id}>{ch.id.slice(0, 10)}…</span>
						<Address actorId={{ $network: { chainId: ch.chainId }, address: participantAddr }} />
						<span>{formatSmallestToDecimal(balance, 6)} USDC</span>
						<span data-status>{ch.status}</span>
						<a href="/positions/channels">View all</a>
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

	.channels-list {
		margin: 0;
		padding: 0;
	}

	.channel-id {
		font-family: ui-monospace, monospace;
		font-size: 0.9em;
	}
</style>
