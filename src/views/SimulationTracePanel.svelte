<script lang="ts">
	import type { TevmSimulationTraceCall } from '$/data/TevmSimulationResult.ts'

	import Tree from '$/components/Tree.svelte'


	let {
		trace = [],
		contractFilter = $bindable(''),
		selectorFilter = $bindable(''),
	}: {
		trace: TevmSimulationTraceCall[]
		contractFilter?: string
		selectorFilter?: string
	} = $props()

	const formatAddress = (addr: string) =>
		addr.length > 14 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr

	function matchesFilter(call: TevmSimulationTraceCall): boolean {
		return (
			(!contractFilter ||
				call.to.toLowerCase().includes(contractFilter.toLowerCase())) &&
			(!selectorFilter ||
				(call.selector ?? call.data?.slice(0, 10) ?? '')
					.toLowerCase()
					.includes(selectorFilter.toLowerCase()))
		)
	}

	function isHiddenCall(
		call: TevmSimulationTraceCall,
		getIsHidden: (c: TevmSimulationTraceCall, getIsHidden: typeof isHiddenCall) => boolean,
	): boolean {
		return (
			!matchesFilter(call) &&
			((call.children ?? []).every((c) => getIsHidden(c, getIsHidden)) ?? true)
		)
	}

	const hasVisible = $derived(
		trace.some((call) => !isHiddenCall(call, isHiddenCall))
	)
</script>


<div data-simulation-trace data-column>
	<header data-row="align-center justify-between">
		<h3>Trace</h3>
		<div data-row="align-center">
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

	{#if trace.length === 0}
		<p data-text="muted">No trace entries.</p>
	{:else if !hasVisible}
		<p data-text="muted">No matching entries.</p>
	{:else}
		<Tree
			items={trace}
			getKey={(c) => c.to + c.data + (c.gasUsed ?? '')}
			getChildren={(c) => c.children}
			getIsOpen={() => true}
			getIsHidden={isHiddenCall}
			listTag="ul"
			listAttrs={{ 'data-column': '', style: 'list-style: none; padding: 0;' }}
			detailsAttrs={{}}
			summaryAttrs={{}}
		>
			{#snippet Content({ node }: { node: TevmSimulationTraceCall })}
				<div data-trace-call data-column="gap-0">
					<div data-row="align-center wrap">
						<span data-text="muted">to</span>
						<code>{formatAddress(node.to)}</code>
						{#if node.selector}
							<span data-text="muted">selector</span>
							<code>{node.selector}</code>
						{/if}

						<span data-text="muted">gas</span>
						<code>{node.gasUsed}</code>
						{#if node.value !== '0'}
							<span data-text="muted">value</span>
							<code>{node.value}</code>
						{/if}
					</div>

					{#if node.revert}
						<p data-error>{node.revert}</p>
					{/if}
				</div>
			{/snippet}
		</Tree>
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
	:global([data-simulation-trace] li ul) {
		padding-left: 1rem;
	}
</style>
