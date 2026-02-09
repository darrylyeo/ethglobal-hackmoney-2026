<script lang="ts">
	import type { TevmSimulationTraceCall } from '$/data/TevmSimulationResult.ts'

	let {
		trace = [],
		contractFilter = $bindable(''),
		selectorFilter = $bindable(''),
	}: {
		trace: TevmSimulationTraceCall[]
		contractFilter?: string
		selectorFilter?: string
	} = $props()

	const filteredTrace = $derived(
		trace.filter(
			(call) =>
				(!contractFilter ||
					call.to.toLowerCase().includes(contractFilter.toLowerCase())) &&
				(!selectorFilter ||
					(call.selector ?? call.data?.slice(0, 10) ?? '')
						.toLowerCase()
						.includes(selectorFilter.toLowerCase())),
		),
	)

	const formatAddress = (addr: string) =>
		addr.length > 14 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr
</script>


<div data-simulation-trace data-column="gap-2">
	<header data-row="gap-2 align-center justify-between">
		<h3>Trace</h3>
		<div data-row="gap-2 align-center">
			<label for="trace-contract" class="sr-only">Filter by contract</label>
			<input
				id="trace-contract"
				type="text"
				placeholder="Contract"
				bind:value={contractFilter}
				data-input
			/>
			<label for="trace-selector" class="sr-only">Filter by selector</label>
			<input
				id="trace-selector"
				type="text"
				placeholder="Selector"
				bind:value={selectorFilter}
				data-input
			/>
		</div>
	</header>
	{#if filteredTrace.length === 0}
		<p data-text="muted">No trace entries.</p>
	{:else}
		<ul data-column="gap-2" style="list-style: none; padding: 0;">
			{#each filteredTrace as call (call.to + call.data + call.gasUsed)}
				<li data-trace-call data-column="gap-0">
					<div data-row="gap-2 align-center wrap">
						<span data-text="muted">to</span>
						<code>{formatAddress(call.to)}</code>
						{#if call.selector}
							<span data-text="muted">selector</span>
							<code>{call.selector}</code>
						{/if}
						<span data-text="muted">gas</span>
						<code>{call.gasUsed}</code>
						{#if call.value !== '0'}
							<span data-text="muted">value</span>
							<code>{call.value}</code>
						{/if}
					</div>
					{#if call.revert}
						<p data-error>{call.revert}</p>
					{/if}
					{#if call.children?.length}
						<ul
							data-column="gap-2"
							style="list-style: none; padding-left: 1rem;"
						>
							{#each call.children as child (child.to + child.data)}
								<li data-trace-call data-column="gap-0">
									<div data-row="gap-2 align-center wrap">
										<code>{formatAddress(child.to)}</code>
										<code>{child.gasUsed}</code>
									</div>
									{#if child.revert}
										<p data-error>{child.revert}</p>
									{/if}
								</li>
							{/each}
						</ul>
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
