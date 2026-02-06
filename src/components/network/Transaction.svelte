<script lang="ts">


	// Types/constants
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import type { Trace as TraceType } from '$/data/Trace.ts'
	import type { EvmLog } from '$/api/voltaire.ts'
	import type { ChainId } from '$/constants/networks.ts'


	// Functions
	import { getTxUrl } from '$/constants/explorers.ts'
	import { formatWei, formatGas, formatGwei } from '$/lib/format.ts'
	import { fetchChainTransaction } from '$/collections/chain-transactions.ts'


	// Components
	import Address from '$/components/Address.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'
	import ItemsList from '$/components/ItemsList.svelte'
	import Trace from '$/components/network/Trace.svelte'
	import EventView from '$/components/network/Event.svelte'


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


	// Actions
	const onToggle = (e: Event) => {
		const details = e.currentTarget as HTMLDetailsElement
		if (!details.open || hasFetched || !tx) return
		if (tx.status != null) {
			hasFetched = true
			return
		}
		hasFetched = true
		fetchChainTransaction(tx.$id.chainId, tx.$id.txHash).catch(() => {})
	}
</script>


<details data-card="radius-2 padding-4" id={tx ? `transaction:${tx.$id.txHash}` : undefined} ontoggle={onToggle}>
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
				<dd><Address network={tx.$id.chainId} address={tx.from as `0x${string}`} /></dd>

				<dt>To</dt>
				<dd>
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
		{/if}

		{#if trace}
			<section>
				<h3>Trace</h3>
				<Trace {trace} {chainId} />
			</section>
		{/if}

		<section>
			<h3>Events ({eventsSet.size})</h3>
			<ItemsList
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
			</ItemsList>
		</section>
	</div>
</details>
