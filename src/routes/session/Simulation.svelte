<script lang="ts">
	// Types/constants
	import type { SessionActionTransactionSimulation } from '$/data/SessionActionTransactionSimulation.ts'
	import type { TevmSimulationResult } from '$/data/TevmSimulationResult.ts'
	import { SessionActionSimulationStatus } from '$/data/SessionActionTransactionSimulation.ts'
	import { TevmSimulationSummaryStatus } from '$/data/TevmSimulationResult.ts'


	// Props
	let {
		simulation,
	}: {
		simulation: SessionActionTransactionSimulation
	} = $props()


	// (Derived)
	const steps = $derived(
		simulation.result != null
		&& typeof simulation.result === 'object'
		&& 'steps' in simulation.result
		&& Array.isArray((simulation.result as { steps: unknown }).steps)
			? (simulation.result as { steps: TevmSimulationResult[] }).steps
			: (simulation.result as TevmSimulationResult | null) != null
				? [simulation.result as TevmSimulationResult]
				: [],
	)
</script>

<article
	data-card
	data-column="gap-2 padding-2"
	data-simulation
	data-e2e-simulation-status={simulation.status}
>
	<div data-row="align-center">
		<span
			data-tag
			data-variant={simulation.status === SessionActionSimulationStatus.Success
			? 'success'
			: 'error'}
		>
			{simulation.status}
		</span>
		<time datetime={new Date(simulation.createdAt).toISOString()}>
			{new Date(simulation.createdAt).toLocaleString(undefined, {
				dateStyle: 'short',
				timeStyle: 'short',
			})}
		</time>
	</div>
	<p data-text="muted">
		Params: {simulation.paramsHash.length > 12
			? `${simulation.paramsHash.slice(0, 8)}…`
			: simulation.paramsHash || '—'}
	</p>
	{#if simulation.error && steps.length === 0}
		<p data-error>{simulation.error}</p>
	{:else if steps.length > 0}
		<ol class="simulation-steps" data-column>
			{#each steps as step, i}
				<li data-row="align-center" class="simulation-step">
					<span
						data-tag
						data-variant={step.summaryStatus === TevmSimulationSummaryStatus.Success
						? 'success'
						: 'error'}
					>
						{step.summaryStatus}
					</span>
					<span>Step {i + 1}</span>
					<span data-text="muted">Gas: {step.gasTotals.used}</span>
					{#if step.revertReason}
						<code class="revert-reason" title={step.revertReason}>
							{step.revertReason.slice(0, 42)}{step.revertReason.length > 42
								? '…'
								: ''}
						</code>
					{/if}
				</li>
			{/each}
		</ol>
		{#if simulation.error}
			<p data-error>{simulation.error}</p>
		{/if}
	{:else if simulation.result != null}
		<p data-text="muted">Result attached</p>
	{/if}
</article>

<style>
	.simulation-steps {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.simulation-step {
		font-size: 0.9em;
	}
	.revert-reason {
		word-break: break-all;
		font-size: 0.85em;
		max-inline-size: 24ch;
	}
</style>
