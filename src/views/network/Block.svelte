<script lang="ts">
	// Types/constants
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import { fetchBlockTransactions } from '$/collections/Blocks.ts'
	import {
		averageTransactionsPerBlockByChainId,
		DEFAULT_AVERAGE_TRANSACTIONS_PER_BLOCK,
		type ChainId,
	} from '$/constants/networks.ts'
	import { TimestampFormat } from '$/components/Timestamp.svelte'
	import { getEraAtBlock } from '$/data/fork-schedules/era.ts'
	import { formatGas, formatGwei } from '$/lib/format.ts'


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
	const era = $derived(
		block != null ? getEraAtBlock(chainId, block.$id.blockNumber) : null,
	)
	const transactionsSet = $derived(
		[...data.values()][0] ?? new Set<ChainTransactionEntry>(),
	)
	const count = $derived(
		block?.transactionCount
		?? (
			averageTransactionsPerBlockByChainId[chainId]?.value
			?? DEFAULT_AVERAGE_TRANSACTIONS_PER_BLOCK
		),
	)


	// State
	let hasFetchedTransactions = $state(false)


	// Actions
	const onToggle = (e: Event) => {
		const details = e.currentTarget as HTMLDetailsElement
		if (!details.open || hasFetchedTransactions || !block) return
		hasFetchedTransactions = true
		if (transactionsSet.size > 0) return
		fetchBlockTransactions(chainId, block.$id.blockNumber).catch(() => {})
	}


	// Components
	import EntityList from '$/components/EntityList.svelte'
	import Timestamp from '$/components/Timestamp.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'
	import Address from '$/views/Address.svelte'
	import Transaction from '$/views/network/Transaction.svelte'
</script>


<details
	data-card="radius-2 padding-4"
	id={block
		? `block:${block.$id.blockNumber}`
		: undefined}
	ontoggle={onToggle}
>
	<summary data-row="gap-2 align-center">
		{#if block}
			<code>#{block.$id.blockNumber}</code>
			<Timestamp timestamp={block.timestamp} format={TimestampFormat.Relative} />
			<span>{block.transactionCount ?? count} txs</span>
			{#if block.gasUsed != null
				&& block.gasLimit != null
				&& block.gasLimit > 0n}
				<span>{(Number(block.gasUsed * 100n / block.gasLimit))}% gas</span>
			{/if}
		{:else}
			<code>Loading block…</code>
		{/if}
	</summary>

	<div data-column="gap-4">
		{#if block}
			<dl>
				{#if era}
					<div>
						<dt>Part of</dt>
						<dd>
							{era.label}
							{#if era.startBlock != null && era.endBlock != null}
								<span data-text="annotation"> (blocks {era.startBlock.toLocaleString()} – {era.endBlock.toLocaleString()})</span>
							{/if}
						</dd>
					</div>
				{/if}
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
		{/if}

		<EntityList
			title="Transactions"
			loaded={transactionsSet.size}
			total={block
				? (block.transactionCount ?? count)
				: undefined}
			items={transactionsSet}
			getKey={(tx) => tx.transactionIndex ?? 0}
			getSortValue={(tx) => tx.transactionIndex ?? 0}
			placeholderKeys={
				placeholderTransactionIds
				?? new Set<number | [number, number]>([[0, Math.max(0, count - 1)]])
			}
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
		</EntityList>
	</div>
</details>
