<script lang="ts">
	// Types/constants
	import type { SessionActionTransactionSimulation } from '$/data/SessionActionTransactionSimulation.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import { SvelteSet } from 'svelte/reactivity'

	import { sessionActionTransactionSimulationsCollection } from '$/collections/SessionActionTransactionSimulations.ts'
	import ItemsList from '$/components/ItemsList.svelte'
	import Simulation from './Simulation.svelte'


	// Props
	let {
		sessionId,
		actionIndex,
	}: {
		sessionId: string
		actionIndex: number
	} = $props()


	// (Derived)
	const simulationsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: sessionActionTransactionSimulationsCollection })
				.where(({ row }) =>
					and(eq(row.sessionId, sessionId), eq(row.actionIndex, actionIndex)),
				)
				.select(({ row }) => ({ row })),
		[() => sessionId, () => actionIndex],
	)
	const items = $derived(
		new SvelteSet(
			(simulationsQuery.data?.map((d) => d.row) ?? []) as SessionActionTransactionSimulation[],
		),
	)
</script>

{#if items.size > 0}
	<details data-card data-column="gap-2">
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
{/if}
