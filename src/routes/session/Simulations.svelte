<script lang="ts">
	// Types/constants
	import type { SessionActionTransactionSimulation } from '$/data/SessionActionTransactionSimulation.ts'
	import { sessionActionTransactionSimulationsCollection } from '$/collections/SessionActionTransactionSimulations.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import { SvelteSet } from 'svelte/reactivity'


	// Props
	let {
		sessionId,
		indexInSequence,
	}: {
		sessionId: string
		indexInSequence: number
	} = $props()


	// (Derived)
	const simulationsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: sessionActionTransactionSimulationsCollection })
				.where(({ row }) =>
					and(eq(row.sessionId, sessionId), eq(row.indexInSequence, indexInSequence)),
				)
				.select(({ row }) => ({ row })),
		[() => sessionId, () => indexInSequence],
	)
	const items = $derived(
		new SvelteSet(
			(simulationsQuery.data?.map(({ row: simulation }) => simulation) ?? []) as SessionActionTransactionSimulation[],
		),
	)


	// Components
	import ItemsList from '$/components/ItemsList.svelte'
	import Simulation from './Simulation.svelte'
</script>


<details data-card data-column>
	<summary>
		<h4>Simulations</h4>
	</summary>

	<ItemsList
		items={items}
		getKey={(item) => item.id}
		getSortValue={(item) => -item.createdAt}
		placeholderKeys={new Set()}
	>
		{#snippet Item({ key, item, isPlaceholder })}
			{#if isPlaceholder}
				<div data-placeholder>…</div>
			{:else if item}
				<Simulation simulation={item} />
			{/if}
		{/snippet}
	</ItemsList>
</details>
