<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { BlockEntry } from '$/data/Block'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction'
	import type { ChainId } from '$/constants/networks'
	import { getAverageTransactionsPerBlock } from '$/constants/networks'
	import ItemsList from '$/components/ItemsList.svelte'
	import Transaction from '$/components/network/Transaction.svelte'
	import { getBlockUrl } from '$/constants/explorers'

	let {
		data,
		chainId,
		placeholderTransactionIds,
		visiblePlaceholderTransactionIds = $bindable([] as number[]),
	}: {
		data: Map<BlockEntry | undefined, Set<ChainTransactionEntry>>
		chainId: ChainId
		placeholderTransactionIds?: Set<number | [number, number]>
		visiblePlaceholderTransactionIds?: number[]
	} = $props()

	const block = $derived([...data.keys()][0])
	const transactionsSet = $derived(
		[...data.values()][0] ?? new Set<ChainTransactionEntry>(),
	)
	const count = $derived(
		block?.transactionCount ?? getAverageTransactionsPerBlock(chainId),
	)
	const defaultPlaceholderIds = $derived(
		new Set<number | [number, number]>([[0, Math.max(0, count - 1)]]),
	)
	const placeholderKeys = $derived(
		placeholderTransactionIds ?? defaultPlaceholderIds,
	)
</script>


<details data-card="radius-2 padding-4">
	<summary data-row="gap-2 align-center">
		{#if block}
			<code id="block:{block.$id.blockNumber}">#{block.$id.blockNumber}</code>
			<time datetime={new Date(block.timestamp).toISOString()}>
				{new Date(block.timestamp).toISOString()}
			</time>
			<span>{block.transactionCount ?? count} txs</span>
		{:else}
			<code>Loading block…</code>
		{/if}
	</summary>
	<div data-column="gap-4">
		{#if block}
			<dl data-column="gap-1">
				<dt>Number</dt>
				<dd><code>{block.number.toString()}</code></dd>
				<dt>Timestamp</dt>
				<dd>{new Date(block.timestamp).toISOString()}</dd>
				<dt>Transactions</dt>
				<dd>{block.transactionCount ?? count}</dd>
			</dl>
			<a
				href={getBlockUrl(chainId, block.$id.blockNumber)}
				target="_blank"
				rel="noopener noreferrer"
			>
				View on explorer
			</a>
		{/if}
		<section>
			<h3>Transactions</h3>
			<ItemsList
				items={transactionsSet}
				getKey={(tx) => tx.$id.txHash}
				getSortValue={(tx) => tx.blockNumber}
				{placeholderKeys}
				bind:visiblePlaceholderTransactionIds
				scrollPosition="End"
			>
				{#snippet Item({ key, item, isPlaceholder })}
					<span id="transaction:{key}">
						{#if isPlaceholder}
							<code>Transaction placeholder {key}</code>
						{:else}
							{@const txData = new Map<
								ChainTransactionEntry | undefined,
								{ trace?: never; events: typeof item.logs }
							>([[item, { events: item.logs }]])}
							<Transaction
								data={txData}
								{chainId}
								visiblePlaceholderEventIds={[]}
							/>
						{/if}
					</span>
				{/snippet}
			</ItemsList>
		</section>
	</div>
</details>
