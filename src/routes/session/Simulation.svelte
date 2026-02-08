<script lang="ts">
	// Types/constants
	import type { SessionActionTransactionSimulation } from '$/data/SessionActionTransactionSimulation.ts'
	import { SessionActionSimulationStatus } from '$/data/SessionActionTransactionSimulation.ts'


	// Props
	let { simulation }: { simulation: SessionActionTransactionSimulation } = $props()


	// (Derived)
	const dateLabel = $derived(
		new Date(simulation.createdAt).toLocaleString(undefined, {
			dateStyle: 'short',
			timeStyle: 'short',
		}),
	)
	const paramsShort = $derived(
		simulation.paramsHash.length > 12
			? `${simulation.paramsHash.slice(0, 8)}…`
			: simulation.paramsHash || '—',
	)
</script>

<article data-card data-column="gap-1 padding-2" data-simulation>
	<div data-row="gap-2 align-center">
		<span
			data-tag
			data-variant={simulation.status === SessionActionSimulationStatus.Success ? 'success' : 'error'}
		>
			{simulation.status}
		</span>
		<time datetime={new Date(simulation.createdAt).toISOString()}>{dateLabel}</time>
	</div>
	<p data-muted>Params: {paramsShort}</p>
	{#if simulation.error}
		<p data-error>{simulation.error}</p>
	{:else if simulation.result != null}
		<p data-muted>Result attached</p>
	{/if}
</article>
