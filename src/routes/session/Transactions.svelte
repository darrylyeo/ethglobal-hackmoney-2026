<script lang="ts">
	// Types/constants
	import type { SessionActionTransaction } from '$/data/SessionActionTransaction.ts'
	import { sessionActionTransactionsCollection } from '$/collections/SessionActionTransactions.ts'
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
	const transactionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: sessionActionTransactionsCollection })
				.where(({ row }) =>
					and(eq(row.sessionId, sessionId), eq(row.indexInSequence, indexInSequence)),
				)
				.select(({ row }) => ({ row })),
		[() => sessionId, () => indexInSequence],
	)
	const items = $derived(
		new SvelteSet(
			(transactionsQuery.data?.map((d) => d.row) ?? []) as SessionActionTransaction[],
		),
	)


	// Components
	import ItemsList from '$/components/ItemsList.svelte'
	import Transaction from './Transaction.svelte'
</script>


<details data-card data-column open={items.size > 0}>
	<summary>
		<h4>Submitted Transactions</h4>
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
				<Transaction transaction={item} />
			{/if}
		{/snippet}
	</ItemsList>
</details>
