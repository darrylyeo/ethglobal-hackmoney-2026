<script lang="ts">
	// Types/constants
	import type { SessionActionTransaction } from '$/data/SessionActionTransaction.ts'
	import { getTxUrl } from '$/constants/explorers.ts'


	// Props
	let { transaction }: { transaction: SessionActionTransaction } = $props()


	// (Derived)
	const dateLabel = $derived(
		new Date(transaction.createdAt).toLocaleString(undefined, {
			dateStyle: 'short',
			timeStyle: 'short',
		}),
	)
	const txUrl = $derived(getTxUrl(transaction.chainId, transaction.txHash))
	const txShort = $derived(
		transaction.txHash.length > 14
			? `${transaction.txHash.slice(0, 10)}…${transaction.txHash.slice(-8)}`
			: transaction.txHash,
	)
</script>

<article data-card data-column="gap-1 padding-2" data-transaction>
	<div data-row="gap-2 align-center">
		{#if txUrl}
			<a href={txUrl} target="_blank" rel="noopener noreferrer" data-text="muted">
				{txShort}
			</a>
		{:else}
			<span data-text="muted">{txShort}</span>
		{/if}
		<span data-text="muted">chain {transaction.chainId}</span>
		<time datetime={new Date(transaction.createdAt).toISOString()}>{dateLabel}</time>
	</div>
</article>
