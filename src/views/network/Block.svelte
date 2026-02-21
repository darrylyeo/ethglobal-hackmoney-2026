<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { TimestampFormat } from '$/components/Timestamp.svelte'
	import { fetchBlockTransactions } from '$/collections/Blocks.ts'
	import {
		averageTransactionsPerBlockByChainId,
		DEFAULT_AVERAGE_TRANSACTIONS_PER_BLOCK,
	} from '$/constants/networks.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { getEraAtBlock } from '$/constants/fork-schedules.ts'
	import { formatGas, formatGwei } from '$/lib/format.ts'
	import { formatRelativeTime } from '$/lib/formatRelativeTime.ts'
	import { getBlockPath, getForksPagePath } from '$/lib/network-paths.ts'
	import { getForkSlugByEraName } from '$/constants/fork-upgrades.ts'


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
	const forkSlug = $derived(era ? getForkSlugByEraName(era.label) : null)
	const forkPageHref = $derived(
		era && forkSlug
			? getForksPagePath(chainId) + `#NetworkFork:${forkSlug}`
			: '',
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
	const summaryMetadata = $derived(
		block
			? (() => {
				const relative = formatRelativeTime(
					Date.now() - block.timestamp * 1000,
				)
				const txs = `${block.transactionCount ?? count} txs`
				const gasPct =
					block.gasUsed != null
					&& block.gasLimit != null
					&& block.gasLimit > 0n
						? `${Number(block.gasUsed * 100n / block.gasLimit)}% gas`
						: null
				return [
					{
						term: '',
						detail: [relative, txs, gasPct].filter(Boolean).join(' · '),
					},
				]
			})()
			: [],
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
	import EntityView from '$/components/EntityView.svelte'
	import Timestamp from '$/components/Timestamp.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'
	import Address from '$/views/Address.svelte'
	import Transaction from '$/views/network/Transaction.svelte'
</script>


<EntityView
	entityType={EntityType.Block}
	entity={block ?? undefined}
	entityId={block?.$id}
	idSerialized={block ? `block:${block.$id.blockNumber}` : 'block:loading'}
	href={block ? getBlockPath(chainId, block.$id.blockNumber) : '#'}
	label={block ? `Block ${block.$id.blockNumber}` : 'Loading block…'}
	layout={EntityLayout.PageSection}
	open={false}
	ontoggle={onToggle}
	detailsProps={{ 'data-card': 'radius-2 padding-4' }}
	metadata={summaryMetadata}
>
	{#snippet Title()}
		{#if block}
			<code>#{block.$id.blockNumber}</code>
		{:else}
			<code>Loading block…</code>
		{/if}
	{/snippet}
	{#snippet children()}
		{#if block}
			<dl>
				{#if era}
					<div>
						<dt>Part of</dt>
						<dd>
							{#if forkPageHref}
								<a href={forkPageHref} data-link>{era.label}</a>
							{:else}
								{era.label}
							{/if}
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
					<dd><Address network={{ chainId }} address={block.miner} /></dd>
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
	{/snippet}
</EntityView>
