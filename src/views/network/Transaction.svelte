<script lang="ts">
	// Types/constants
	import type { EvmLog } from '$/api/voltaire.ts'
	import type { ChainId } from '$/constants/networks.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import type { Trace as TraceType } from '$/data/Trace.ts'
	import {
		ensureFunctionSignatures,
		selectorSignaturesCollection,
	} from '$/collections/SelectorSignatures.ts'
	import { fetchNetworkTransaction } from '$/collections/NetworkTransactions.ts'
	import {
		fetchTransactionTrace,
		transactionTracesCollection,
	} from '$/collections/TransactionTraces.ts'
	import { SelectorKind } from '$/data/SelectorSignature.ts'
	import { CoinId, coinById } from '$/constants/coins.ts'
	import { formatWei, formatGas, formatGwei } from '$/lib/format.ts'
	import { getTxPath } from '$/lib/network-paths.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'

	const TX_TYPE_LABELS: Record<number, string> = {
		0: 'Legacy',
		1: 'EIP-2930',
		2: 'EIP-1559',
		3: 'EIP-4844',
	}


	// Props
	let {
		data,
		chainId,
		placeholderEventIds,
		visiblePlaceholderEventIds = $bindable([] as number[]),
	}: {
		data: Map<ChainTransactionEntry | undefined, { trace?: TraceType; events?: EvmLog[] }>
		chainId: ChainId
		placeholderEventIds?: Set<number | [number, number]>
		visiblePlaceholderEventIds?: number[]
	} = $props()


	// (Derived)
	const entry = $derived(
		[...data.values()][0] ?? { trace: undefined, events: [] },
	)
	const events = $derived(entry.events ?? [])
	const tx = $derived([...data.keys()][0])
	const inputSelector = $derived(
		tx?.input && tx.input.length >= 10
			? (`0x${tx.input.slice(2, 10).toLowerCase().padStart(8, '0')}` as `0x${string}`)
			: null,
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
	const functionSigQuery = useLiveQuery(
		(q) =>
			inputSelector
				? q
					.from({ row: selectorSignaturesCollection })
					.where(({ row }) =>
						and(
							eq(row.$id.kind, SelectorKind.Function),
							eq(row.$id.hex, inputSelector),
						),
					)
					.select(({ row }) => ({ row }))
				: q
					.from({ row: selectorSignaturesCollection })
					.where(({ row }) => eq(row.$id.kind, '' as typeof SelectorKind.Function))
					.select(({ row }) => ({ row })),
		[() => inputSelector],
	)


	// (Derived)
	const functionSignatures = $derived(functionSigQuery.data?.[0]?.row?.signatures ?? [])
	const traceRow = $derived(traceQuery.data?.[0]?.row)
	const trace = $derived(
		traceRow && !traceRow.unavailable
			? traceRow.trace
			: entry.trace,
	)
	const eventsSet = $derived(new Set(events))


	// State
	let arrowRects = $state<{ from: DOMRect; to: DOMRect; card: DOMRect } | null>(null)
	let cardRef = $state<HTMLElement | null>(null)
	let fromRef = $state<HTMLElement | null>(null)
	let hasFetched = $state(false)
	let hasFetchedTrace = $state(false)
	let isOpen = $state(false)
	let toRef = $state<HTMLElement | null>(null)


	// Actions
	const ethIconSrc = $derived(coinById[CoinId.ETH]?.icon)
	$effect(() => {
		if (inputSelector) void ensureFunctionSignatures(inputSelector).catch(() => {})
	})
	const measureRects = () => {
		if (!fromRef || !toRef || !cardRef || !isOpen) {
			arrowRects = null
			return
		}
		const cardRect = cardRef.getBoundingClientRect()
		const fromRect = fromRef.getBoundingClientRect()
		const toRect = toRef.getBoundingClientRect()
		arrowRects = {
			from: new DOMRect(
				fromRect.left - cardRect.left,
				fromRect.top - cardRect.top,
				fromRect.width,
				fromRect.height,
			),
			to: new DOMRect(
				toRect.left - cardRect.left,
				toRect.top - cardRect.top,
				toRect.width,
				toRect.height,
			),
			card: cardRect,
		}
	}

	$effect(() => {
		if (!isOpen) { arrowRects = null; return }
		measureRects()
	})
	const onToggle = (e: Event) => {
		const details = e.currentTarget as HTMLDetailsElement
		isOpen = details.open
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


	// Components
	import EntityList from '$/components/EntityList.svelte'
	import FlowArrow from '$/components/FlowArrow.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'
	import Address from '$/views/Address.svelte'
	import EventView from '$/views/network/Event.svelte'
	import Trace from '$/views/network/Trace.svelte'
</script>


<details data-card="radius-2 padding-4" id={tx
		? `transaction:${tx.$id.txHash}`
		: undefined} ontoggle={onToggle} bind:this={cardRef} class="transaction-card">
	<summary>
		<div data-row="wrap gap-2 align-center">
			{#if tx}
				{#if tx.status != null}
					<span data-tag={tx.status === 1 ? 'success' : 'failure'}>
						{tx.status === 1 ? '✓' : '✗'}
					</span>
				{/if}
				<TruncatedValue value={tx.$id.txHash} startLength={10} endLength={8} />
				<span>from <TruncatedValue value={tx.from} startLength={8} endLength={4} /></span>
				{#if tx.value !== '0x0' && tx.value !== '0x'}
					<span>{formatWei(tx.value)} ETH</span>
				{/if}
			{:else}
				<code>Loading…</code>
			{/if}
		</div>
	</summary>

	<div data-column="gap-4">
		{#if tx}
			<dl>
				<dt>Hash</dt>
				<dd>
					<a href={getTxPath(chainId, tx.$id.txHash)}>
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
				<dd bind:this={fromRef}><Address network={tx.$id.$network.chainId} address={tx.from as `0x${string}`} /></dd>

				<dt>To</dt>
				<dd bind:this={toRef}>
					{#if tx.contractAddress}
						<Address network={tx.$id.$network.chainId} address={tx.contractAddress as `0x${string}`} /> (contract created)
					{:else if tx.to}
						<Address network={tx.$id.$network.chainId} address={tx.to as `0x${string}`} />
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

			{#if arrowRects && (tx.to || tx.contractAddress)}
				<FlowArrow
					sourceRect={arrowRects.from}
					targetRect={arrowRects.to}
					gap={4}
					arrowHeadSize={8}
					strokeWidth={1.5}
					strokeColor="var(--color-accent)"
					flowIconSrc={tx.value !== '0x0' && tx.value !== '0x'
						? ethIconSrc
						: undefined}
					flowIconSize={16}
					relative
				/>
			{/if}
		{/if}

		<details data-card="radius-2 padding-2">
			<summary><h3>Detailed: Events</h3></summary>
			<EntityList
			title="Events"
			loaded={eventsSet.size}
			total={events.length || undefined}
			items={eventsSet}
			getKey={(e) => parseInt(e.logIndex, 16)}
			getSortValue={(e) => parseInt(e.logIndex, 16)}
			placeholderKeys={
				placeholderEventIds
				?? (
					events.length
						? new Set<number | [number, number]>([[0, Math.max(0, events.length - 1)]])
						: new Set<number | [number, number]>([0])
				)
			}
			bind:visiblePlaceholderKeys={visiblePlaceholderEventIds}
			scrollPosition="End"
		>
			{#snippet Item({ key, item, isPlaceholder })}
				<span id="event:{key}">
					{#if isPlaceholder}
						<code>Event #{key} (loading…)</code>
					{:else}
						<EventView event={item} {chainId} />
					{/if}
				</span>
			{/snippet}
		</EntityList>
		</details>

		<details data-card="radius-2 padding-2">
			<summary><h3>Exhaustive: Trace</h3></summary>
			{#if trace}
				<Trace {trace} {chainId} />
			{:else if traceRow?.unavailable === true}
				<p data-text="muted">Trace unavailable (RPC does not support debug_traceTransaction)</p>
			{:else}
				<p data-text="muted">Open transaction to load trace…</p>
			{/if}
		</details>
	</div>
</details>


<style>
	.transaction-card {
		position: relative;
	}
</style>
