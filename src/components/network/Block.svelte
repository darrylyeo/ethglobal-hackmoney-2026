<script lang="ts">
	// Types/constants
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import type { ChainId } from '$/constants/networks.ts'


	// Functions
	import { getAverageTransactionsPerBlock } from '$/constants/networks.ts'
	import { getBlockUrl } from '$/constants/explorers.ts'
	import { formatGas, formatGwei } from '$/lib/format.ts'
	import { fetchBlockTransactions } from '$/collections/blocks.ts'
	import { TimestampFormat } from '$/components/Timestamp.svelte'


	// Components
	import Address from '$/components/Address.svelte'
	import Timestamp from '$/components/Timestamp.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'
	import ItemsList from '$/components/ItemsList.svelte'
	import Transaction from '$/components/network/Transaction.svelte'


	// Props
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


	// (Derived)
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


	// State
	let hasFetchedTransactions = $state(false)


	// Actions
	const onToggle = (e: Event) => {
		const details = e.currentTarget as HTMLDetailsElement
		if (!details.open || hasFetchedTransactions || !block) return
		if (transactionsSet.size > 0) {
			hasFetchedTransactions = true
			return
		}
		hasFetchedTransactions = true
		fetchBlockTransactions(chainId, block.$id.blockNumber).catch(() => {})
	}
</script>


<details data-card="radius-2 padding-4" id={block ? `block:${block.$id.blockNumber}` : undefined} ontoggle={onToggle}>
	<summary data-row="gap-2 align-center">
		{#if block}
			<code>#{block.$id.blockNumber}</code>
			<Timestamp timestamp={block.timestamp} format={TimestampFormat.Relative} />
			<span>{block.transactionCount ?? count} txs</span>
			{#if block.gasUsed != null && block.gasLimit != null && block.gasLimit > 0n}
				<span>{(Number(block.gasUsed * 100n / block.gasLimit))}% gas</span>
			{/if}
		{:else}
			<code>Loading block…</code>
		{/if}
	</summary>

	<div data-column="gap-4">
		{#if block}
			<dl>
				<dt>Number</dt>
				<dd><code>{block.number.toString()}</code></dd>

				{#if block.hash}
					<dt>Hash</dt>
					<dd><TruncatedValue value={block.hash} /></dd>
				{/if}

				{#if block.parentHash}
					<dt>Parent Hash</dt>
					<dd><TruncatedValue value={block.parentHash} /></dd>
				{/if}

				<dt>Timestamp</dt>
				<dd><Timestamp timestamp={block.timestamp} format={TimestampFormat.Both} /></dd>

				{#if block.miner}
					<dt>Miner</dt>
					<dd><Address network={chainId} address={block.miner} /></dd>
				{/if}

				<dt>Transactions</dt>
				<dd>{block.transactionCount ?? count}</dd>

				{#if block.gasUsed != null}
					<dt>Gas Used</dt>
					<dd>{formatGas(block.gasUsed)}</dd>
				{/if}

				{#if block.gasLimit != null}
					<dt>Gas Limit</dt>
					<dd>{formatGas(block.gasLimit)}</dd>
				{/if}

				{#if block.baseFeePerGas != null}
					<dt>Base Fee</dt>
					<dd>{formatGwei(block.baseFeePerGas)} Gwei</dd>
				{/if}
			</dl>

			<a
				href={getBlockUrl(chainId, block.$id.blockNumber)}
				target="_blank"
				rel="noopener noreferrer"
			>
				View on explorer ↗
			</a>
		{/if}

		<section>
			<h3>Transactions ({transactionsSet.size})</h3>
			<ItemsList
				items={transactionsSet}
				getKey={(tx) => tx.transactionIndex ?? 0}
				getSortValue={(tx) => tx.transactionIndex ?? 0}
				{placeholderKeys}
				bind:visiblePlaceholderKeys={visiblePlaceholderTransactionIds}
				scrollPosition="End"
			>
				{#snippet Item({ key, item, isPlaceholder })}
					<span id="transaction:{key}">
						{#if isPlaceholder}
							<code>Transaction #{key} (loading…)</code>
						{:else}
							<Transaction
								data={new Map([[item, { events: item.logs }]])}
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
