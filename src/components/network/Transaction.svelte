<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction'
	import type { Trace as TraceType } from '$/data/Trace'
	import type { EthLog } from '$/api/voltaire'
	import ItemsList from '$/components/ItemsList.svelte'
	import Trace from '$/components/network/Trace.svelte'
	import Event from '$/components/network/Event.svelte'
	import { getTxUrl } from '$/constants/explorers'


	// Props
	let {
		data,
		chainId,
		placeholderEventIds,
		visiblePlaceholderEventIds = $bindable([] as number[]),
	}: {
		data: Map<
			ChainTransactionEntry | undefined,
			{ trace?: TraceType; events?: EthLog[] }
		>
		chainId: number
		placeholderEventIds?: Set<number | [number, number]>
		visiblePlaceholderEventIds?: number[]
	} = $props()

	const entry = $derived(
		[...data.values()][0] ?? { trace: undefined, events: [] },
	)
	const tx = $derived([...data.keys()][0])
	const events = $derived(entry.events ?? [])
	const trace = $derived(entry.trace)
	const eventsSet = $derived(new Set(events))
	const defaultPlaceholderEventIds = $derived(
		events.length
			? new Set<number | [number, number]>([
					[0, Math.max(0, events.length - 1)],
				])
			: new Set<number | [number, number]>([0]),
	)
	const placeholderKeys = $derived(
		placeholderEventIds ?? defaultPlaceholderEventIds,
	)
</script>


<details data-card="secondary radius-2 padding-4">
	<summary data-row="gap-2 align-center">
		{#if tx}
			<code id="transaction:{tx.$id.txHash}">{tx.$id.txHash.slice(0, 18)}…</code
			>
			<span>from {tx.from.slice(0, 10)}…</span>
			<span>value {tx.value}</span>
		{:else}
			<code>Loading…</code>
		{/if}
	</summary>
	<div data-column="gap-4">
		{#if tx}
			<dl data-column="gap-1">
				<dt>Hash</dt>
				<dd>
					<a
						href={getTxUrl(chainId, tx.$id.txHash)}
						target="_blank"
						rel="noopener noreferrer">{tx.$id.txHash}</a
					>
				</dd>
				<dt>Block</dt>
				<dd>{tx.blockNumber}</dd>
				<dt>From</dt>
				<dd><code>{tx.from}</code></dd>
				<dt>To</dt>
				<dd><code>{tx.to ?? '—'}</code></dd>
				<dt>Value</dt>
				<dd><code>{tx.value}</code></dd>
			</dl>
		{/if}
		{#if trace}
			<section>
				<h3>Trace</h3>
				<Trace {trace} />
			</section>
		{/if}
		<section>
			<h3>Events</h3>
			<ItemsList
				items={eventsSet}
				getKey={(e) => parseInt(e.logIndex, 16)}
				getSortValue={(e) => parseInt(e.logIndex, 16)}
				{placeholderKeys}
				bind:visiblePlaceholderEventIds
				scrollPosition="End"
			>
				{#snippet Item({ key, item, isPlaceholder })}
					<span id="event:{key}">
						{#if isPlaceholder}
							<code>Event #{key} (loading…)</code>
						{:else}
							<Event event={item} />
						{/if}
					</span>
				{/snippet}
			</ItemsList>
		</section>
	</div>
</details>
