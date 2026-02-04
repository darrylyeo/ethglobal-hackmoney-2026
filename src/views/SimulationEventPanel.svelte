<script lang="ts">
	import type { TevmSimulationDecodedEvent } from '$/data/TevmSimulationResult'

	let {
		events = [],
		rawLogs = [],
		contractFilter = $bindable(''),
		selectorFilter = $bindable(''),
	}: {
		events: TevmSimulationDecodedEvent[]
		rawLogs?: { address: string; topics: string[]; data: string }[]
		contractFilter?: string
		selectorFilter?: string
	} = $props()

	let showRaw = $state(false)
	const list = $derived(showRaw ? rawLogs : events)
	const filteredList = $derived(
		showRaw
			? rawLogs.filter(
					(log) =>
						(!contractFilter || log.address.toLowerCase().includes(contractFilter.toLowerCase())) &&
						(!selectorFilter || (log.topics[0] ?? '').toLowerCase().includes(selectorFilter.toLowerCase())),
				)
			: events.filter(
					(ev) =>
						(!contractFilter || ev.address.toLowerCase().includes(contractFilter.toLowerCase())) &&
						(!selectorFilter || (ev.topics[0] ?? '').toLowerCase().includes(selectorFilter.toLowerCase())),
				),
	)

	const formatAddress = (addr: string) =>
		addr.length > 14 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr
</script>

<div data-simulation-events data-column="gap-2">
	<header data-row="gap-2 align-center justify-between">
		<h3>Events</h3>
		<div data-row="gap-2 align-center">
			<button
				type="button"
				onclick={() => (showRaw = !showRaw)}
			>
				{showRaw ? 'Decoded' : 'Raw'}
			</button>
			<label for="events-contract" class="sr-only">Filter by contract</label>
			<input
				id="events-contract"
				type="text"
				placeholder="Contract"
				bind:value={contractFilter}
				data-input
			/>
			<label for="events-selector" class="sr-only">Filter by selector</label>
			<input
				id="events-selector"
				type="text"
				placeholder="Topic/selector"
				bind:value={selectorFilter}
				data-input
			/>
		</div>
	</header>
	{#if filteredList.length === 0}
		<p data-muted>No events.</p>
	{:else}
		<ul data-column="gap-2" style="list-style: none; padding: 0;">
			{#each filteredList as ev, i (showRaw ? ev.address + ev.data : ev.address + ev.topics.join('') + i)}
				<li data-event data-card="secondary" data-column="gap-1">
					<div data-row="gap-2 align-center">
						<code>{formatAddress(ev.address)}</code>
						{#if !showRaw && (ev as TevmSimulationDecodedEvent).signature}
							<span data-muted>{(ev as TevmSimulationDecodedEvent).signature}</span>
						{/if}
					</div>
					{#if ev.topics?.length}
						<div data-column="gap-0">
							<span data-muted>Topics</span>
							{#each ev.topics as topic}
								<code style="word-break: break-all;">{topic}</code>
							{/each}
						</div>
					{/if}
					{#if ev.data}
						<div data-column="gap-0">
							<span data-muted>Data</span>
							<code style="word-break: break-all;">{ev.data}</code>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	[data-input] {
		max-width: 8rem;
	}
</style>
