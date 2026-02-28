<script lang="ts">
	// Types/constants
	import type { EvmLog } from '$/api/voltaire.ts'
	import type { ChainId } from '$/constants/networks.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import type { Trace as TraceType } from '$/data/Trace.ts'
	import {
		ensureEvmFunctionSignatures,
		evmSelectorsCollection,
		normalizeEvmSelector4,
	} from '$/collections/EvmSelectors.ts'
	import { fetchNetworkTransaction } from '$/collections/NetworkTransactions.ts'
	import {
		fetchTransactionTrace,
		transactionTracesCollection,
	} from '$/collections/TransactionTraces.ts'
	import { formatWei, formatGas, formatGwei } from '$/lib/format.ts'
	import { getTxPath } from '$/lib/network-paths.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { EntityType } from '$/data/$EntityType.ts'

	const TX_TYPE_LABELS: Record<number, string> = {
		0: 'Legacy',
		1: 'EIP-2930',
		2: 'EIP-1559',
		3: 'EIP-4844',
	}


	// Props
	let {
		data,
		layout = EntityLayout.PageSection,
	}: {
		data: Map<ChainTransactionEntry | undefined, { trace?: TraceType; events?: EvmLog[] }>
		layout?: EntityLayout
	} = $props()

	// (Derived)
	const entry = $derived(
		[...data.values()][0] ?? { trace: undefined, events: [] }
	)
	const events = $derived(
		entry.events ?? []
	)
	const tx = $derived(
		[...data.keys()][0]
	)
	const inputSelector = $derived(
		tx?.input && tx.input.length >= 10
			? (`0x${tx.input.slice(2, 10).toLowerCase().padStart(8, '0')}` as `0x${string}`)
			: null
	)


	// Context
	const traceQuery = useLiveQuery(
		(q) =>
			tx
				? q
					.from({ row: transactionTracesCollection })
					.where(({ row }) =>
						and(
							eq(row.$id.$network.chainId, tx.$id.$network.chainId),
							eq(row.$id.txHash, tx.$id.txHash),
						),
					)
					.select(({ row }) => ({ row }))
				: q
					.from({ row: transactionTracesCollection })
					.where(({ row }) => eq(row.$id.$network.chainId, -1))
					.select(({ row }) => ({ row })),
		[() => tx?.$id.$network.chainId ?? -1, () => tx?.$id.txHash ?? ''],
	)
	const normalizedSelector = $derived(
		inputSelector ? normalizeEvmSelector4(inputSelector) : null
	)
	const functionSigQuery = useLiveQuery(
		(q) =>
			normalizedSelector
				? q
					.from({ row: evmSelectorsCollection })
					.where(({ row }) => eq(row.$id.hex, normalizedSelector))
					.select(({ row }) => ({ row }))
				: q
					.from({ row: evmSelectorsCollection })
					.where(({ row }) => eq(row.$id.hex, '0x' as `0x${string}`))
					.select(({ row }) => ({ row })),
		[() => normalizedSelector],
	)

	// (Derived)
	const functionSignatures = $derived(
		functionSigQuery.data?.[0]?.row?.signatures ?? []
	)
	const traceRecord = $derived(
		traceQuery.data?.[0]?.row
	)
	const trace = $derived(
		traceRecord && !traceRecord.unavailable
			? traceRecord.trace
			: entry.trace
	)
	const eventsSet = $derived(
		new Set(events)
	)


	// State
	let hasFetched = $state(
		false
	)
	let hasFetchedTrace = $state(
		false
	)


	// Actions
	$effect(() => {
		if (inputSelector) void ensureEvmFunctionSignatures(inputSelector).catch(() => {})
	})
	const onToggle = (e: Event) => {
		const details = e.currentTarget as HTMLDetailsElement
		if (!details.open || !tx) return
		if (!hasFetched && tx.status == null) {
			hasFetched = true
			fetchNetworkTransaction(tx.$id.$network.chainId, tx.$id.txHash).catch(
				() => {},
			)
		}
		if (!hasFetchedTrace) {
			hasFetchedTrace = true
			fetchTransactionTrace(tx.$id.$network.chainId, tx.$id.txHash, {
				blockNumber: tx.blockNumber,
			}).catch(() => {})
		}
	}
	$effect(() => {
		if (layout !== EntityLayout.ContentOnly || !tx) return
		if (!hasFetched && tx.status == null) {
			hasFetched = true
			fetchNetworkTransaction(tx.$id.$network.chainId, tx.$id.txHash).catch(
				() => {},
			)
		}
		if (!hasFetchedTrace) {
			hasFetchedTrace = true
			fetchTransactionTrace(tx.$id.$network.chainId, tx.$id.txHash, {
				blockNumber: tx.blockNumber,
			}).catch(() => {})
		}
	})

	// Components
	import Collapsible from '$/components/Collapsible.svelte'
	import EntityView from '$/components/EntityView.svelte'
	import CollapsibleList from '$/components/CollapsibleList.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'
	import Address from '$/views/Address.svelte'
	import EventView from '$/views/network/Event.svelte'
	import EvmTransactionId from '$/views/EvmTransactionId.svelte'
	import NetworkName from '$/views/NetworkName.svelte'
	import Trace from '$/views/network/Trace.svelte'
</script>


<EntityView
		entityType={EntityType.Transaction}
		entity={tx ?? undefined}
		titleHref={tx ? getTxPath(tx.$id.$network.chainId, tx.$id.txHash) : '#'}
		{...(tx == null ? { idSerialized: 'transaction:loading' } : {})}
		label={tx ? `Tx ${tx.$id.txHash.slice(0, 10)}…` : 'Loading…'}
		layout={layout}
		annotation="Transaction"
		showWatchButton={false}
		open={false}
		ontoggle={onToggle}
		detailsProps={layout === EntityLayout.ContentOnly ? {} : { 'data-card': '' }}
	>
	{#snippet Title()}
		{#if tx}
			<span data-row="inline">
				<EvmTransactionId txHash={tx.$id.txHash} chainId={tx.$id.$network.chainId} isVertical />
				<NetworkName networkId={tx.$id.$network} showIcon={false} />
			</span>
		{:else}
			<code>Loading…</code>
		{/if}
	{/snippet}

	{#snippet children()}
		{#if tx}
			{@const chainIdForTx = tx.$id.$network.chainId}

			<dl>
				<dt>Hash</dt>
				<dd>
					<a href={getTxPath(tx.$id.$network.chainId, tx.$id.txHash)}>
						<TruncatedValue value={tx.$id.txHash} />
					</a>
				</dd>

				{#if tx.status != null}
					<dt>Status</dt>
					<dd>{tx.status === 1 ? 'Success' : 'Failed'}</dd>
				{/if}

				<dt>Block</dt>
				<dd>{tx.blockNumber}</dd>

				{#if tx.type != null}
					<dt>Type</dt>
					<dd>{TX_TYPE_LABELS[tx.type] ?? `Type ${tx.type}`}</dd>
				{/if}

				{#if tx.nonce != null}
					<dt>Nonce</dt>
					<dd>{tx.nonce}</dd>
				{/if}

				<dt>From</dt>
				<dd><Address actorId={{ $network: tx.$id.$network, address: tx.from as `0x${string}` }} /></dd>

				<dt>To</dt>
				<dd>
					{#if tx.contractAddress}
						<Address actorId={{ $network: tx.$id.$network, address: tx.contractAddress as `0x${string}` }} /> (contract created)
					{:else if tx.to}
						<Address actorId={{ $network: tx.$id.$network, address: tx.to as `0x${string}` }} />
					{:else}
						Contract creation
					{/if}
				</dd>

				<dt>Value</dt>
				<dd>
					{#if tx.value === '0x0' || tx.value === '0x'}
						0 ETH
					{:else}
						{formatWei(tx.value)} ETH
					{/if}
				</dd>

				{#if tx.gas != null}
					<dt>Gas Limit</dt>
					<dd>{formatGas(tx.gas)}</dd>
				{/if}

				{#if tx.gasUsed != null}
					<dt>Gas Used</dt>
					<dd>{formatGas(tx.gasUsed)}</dd>
				{/if}

				{#if tx.gasPrice != null}
					<dt>Gas Price</dt>
					<dd>{formatGwei(tx.gasPrice)} Gwei</dd>
				{/if}

				{#if tx.effectiveGasPrice != null}
					<dt>Effective Gas Price</dt>
					<dd>{formatGwei(tx.effectiveGasPrice)} Gwei</dd>
				{/if}

				{#if tx.input && tx.input !== '0x'}
					<dt>Input Data</dt>
					<dd>
						{#if functionSignatures.length > 0}
							<code data-row="wrap gap-1">
								{#each functionSignatures as sig}
									<span>{sig}</span>
								{/each}
							</code>

							<span> · </span>
						{/if}

						<TruncatedValue value={tx.input} startLength={10} endLength={0} />
						<span>({Math.max(0, (tx.input.length - 2) / 2)} bytes)</span>
					</dd>
				{/if}
			</dl>
		{/if}

		<Collapsible
			title="Detailed: Events"
			detailsProps={{ 'data-card': 'padding-2' }}
		>
			<CollapsibleList
				title="Events"
				loaded={eventsSet.size}
				total={events.length || undefined}
				items={eventsSet}
				getKey={(e) => parseInt(e.logIndex, 16)}
				getSortValue={(e) => parseInt(e.logIndex, 16)}
				placeholderKeys={
					events.length
						? new Set<number | [number, number]>([[0, Math.max(0, events.length - 1)]])
						: new Set<number | [number, number]>([0])
				}
				visiblePlaceholderKeys={[]}
				scrollPosition="End"
			>
				{#snippet Empty()}
					<p data-text="muted">No events.</p>
				{/snippet}

				{#snippet Item({ key, item, isPlaceholder })}
					<span id="event:{key}">
						{#if isPlaceholder}
							<code>Event #{key} (loading…)</code>
						{:else}
							<EventView event={item} chainId={chainIdForTx} />
						{/if}
					</span>
				{/snippet}
			</CollapsibleList>
		</Collapsible>

		<Collapsible
			title="Exhaustive: Trace"
			detailsProps={{ 'data-card': 'padding-2' }}
		>
			{#if trace}
				<Trace {trace} chainId={chainIdForTx} />
			{:else if traceRecord?.unavailable === true}
				<p data-text="muted">Trace unavailable (RPC does not support debug_traceTransaction)</p>
			{:else}
				<p data-text="muted">Open transaction to load trace…</p>
			{/if}
		</Collapsible>
	{/snippet}
</EntityView>
