<script lang="ts">
	// Types/constants
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import type { Trace as TraceType } from '$/data/Trace.ts'
	import type { EvmLog } from '$/api/voltaire.ts'
	import type { ChainId } from '$/constants/networks.ts'


	// Functions
	import { getTxUrl } from '$/constants/explorers.ts'
	import { formatWei, formatGas, formatGwei } from '$/lib/format.ts'
	import { fetchNetworkTransaction } from '$/collections/NetworkTransactions.ts'
	import { getCoinIconUrl } from '$/lib/coin-icon.ts'


	// Components
	import Address from '$/components/Address.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'
	import ItemsListView from '$/components/ItemsListView.svelte'
	import Trace from '$/components/network/Trace.svelte'
	import EventView from '$/components/network/Event.svelte'
	import FlowArrow from '$/components/FlowArrow.svelte'


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
	const tx = $derived([...data.keys()][0])
	const events = $derived(entry.events ?? [])
	const trace = $derived(entry.trace)
	const eventsSet = $derived(new Set(events))
	const defaultPlaceholderEventIds = $derived(
		events.length
			? new Set<number | [number, number]>([
					[0, Math.max(0, events.length - 1)],
				])
			: new Set<number | [number, number]>([0]),
	)
	const placeholderKeys = $derived(
		placeholderEventIds ?? defaultPlaceholderEventIds,
	)

	const TX_TYPE_LABELS: Record<number, string> = {
		0: 'Legacy',
		1: 'EIP-2930',
		2: 'EIP-1559',
		3: 'EIP-4844',
	}


	// State
	let hasFetched = $state(false)
	let isOpen = $state(false)
	let fromRef = $state<HTMLElement | null>(null)
	let toRef = $state<HTMLElement | null>(null)
	let cardRef = $state<HTMLElement | null>(null)
	let arrowRects = $state<{ from: DOMRect; to: DOMRect; card: DOMRect } | null>(null)
	let ethIconSrc = $state<string | undefined>(undefined)

	getCoinIconUrl('eth').then((url) => { ethIconSrc = url })

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


	// Actions
	const onToggle = (e: Event) => {
		const details = e.currentTarget as HTMLDetailsElement
		isOpen = details.open
		if (!details.open || hasFetched || !tx) return
		if (tx.status != null) {
			hasFetched = true
			return
		}
		hasFetched = true
		fetchNetworkTransaction(tx.$id.chainId, tx.$id.txHash).catch(() => {})
	}
</script>


<details data-card="radius-2 padding-4" id={tx ? `transaction:${tx.$id.txHash}` : undefined} ontoggle={onToggle} bind:this={cardRef} class="transaction-card">
	<summary data-row="gap-2 align-center">
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
	</summary>

	<div data-column="gap-4">
		{#if tx}
			<dl>
				<dt>Hash</dt>
				<dd>
					<a
						href={getTxUrl(chainId, tx.$id.txHash)}
						target="_blank"
						rel="noopener noreferrer"
					>
						<TruncatedValue value={tx.$id.txHash} /> ↗
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
				<dd bind:this={fromRef}><Address network={tx.$id.chainId} address={tx.from as `0x${string}`} /></dd>

				<dt>To</dt>
				<dd bind:this={toRef}>
					{#if tx.contractAddress}
						<Address network={tx.$id.chainId} address={tx.contractAddress as `0x${string}`} /> (contract created)
					{:else if tx.to}
						<Address network={tx.$id.chainId} address={tx.to as `0x${string}`} />
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
					flowIconSrc={tx.value !== '0x0' && tx.value !== '0x' ? ethIconSrc : undefined}
					flowIconSize={16}
					relative
				/>
			{/if}
		{/if}

		{#if trace}
			<section>
				<h3>Trace</h3>
				<Trace {trace} {chainId} />
			</section>
		{/if}

		<ItemsListView
			title="Events"
			loaded={eventsSet.size}
			total={events.length || undefined}
			items={eventsSet}
			getKey={(e) => parseInt(e.logIndex, 16)}
			getSortValue={(e) => parseInt(e.logIndex, 16)}
			{placeholderKeys}
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
		</ItemsListView>
	</div>
</details>


<style>
	.transaction-card {
		position: relative;
	}
</style>
