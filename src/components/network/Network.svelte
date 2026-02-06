<script lang="ts">


	// Types/constants
	import type { Network } from '$/constants/networks.ts'
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import { networkConfigsByChainId } from '$/constants/networks.ts'


	// Components
	import ItemsList from '$/components/ItemsList.svelte'
	import Block from '$/components/network/Block.svelte'


	// Props
	let {
		data,
		placeholderBlockIds,
		visiblePlaceholderBlockIds = $bindable([] as number[]),
	}: {
		data: Map<
			Network | undefined,
			Map<BlockEntry | undefined, Set<ChainTransactionEntry>>
		>
		placeholderBlockIds?: Set<number | [number, number]>
		visiblePlaceholderBlockIds?: number[],
	} = $props()


	// (Derived)
	const network = $derived([...data.keys()][0])
	const innerMap = $derived([...data.values()][0] ?? new Map())
	const blocksSet = $derived(
		new Set([...innerMap.keys()].filter((b): b is BlockEntry => b != null)),
	)
	const defaultPlaceholderBlockIds = $derived(
		placeholderBlockIds ?? new Set<number | [number, number]>([0]),
	)
</script>


<details data-card="radius-2 padding-4" open id={network ? `network:${network.id}` : undefined}>
	<summary data-row="gap-2 align-center">
		{#if network}
			<strong>{network.name}</strong>
			<code>eip155:{network.id}</code>
			<span data-tag>{network.type}</span>
		{:else}
			<code>Loading network…</code>
		{/if}
	</summary>

	<div data-column="gap-4">
		{#if network}
			{@const config = networkConfigsByChainId[network.id]}
			<dl data-row="wrap gap-4">
				<div>
					<dt>Chain ID</dt>
					<dd><code>{network.id}</code></dd>
				</div>
				<div>
					<dt>Type</dt>
					<dd>{network.type}</dd>
				</div>
				{#if config?.nativeCurrency}
					<div>
						<dt>Currency</dt>
						<dd>{config.nativeCurrency.symbol}</dd>
					</div>
				{/if}
			</dl>
		{/if}

		<section>
			<h2>Blocks ({blocksSet.size})</h2>
			<ItemsList
				items={blocksSet}
				getKey={(b) => b.$id.blockNumber}
				getSortValue={(b) => -Number(b.number)}
				placeholderKeys={defaultPlaceholderBlockIds}
				bind:visiblePlaceholderKeys={visiblePlaceholderBlockIds}
				scrollPosition="Start"
			>
				{#snippet Item({ key, item, isPlaceholder })}
					<span id="block:{key}">
						{#if isPlaceholder}
							<code>Block #{key} (loading…)</code>
						{:else}
							{@const blockData = new Map<
								BlockEntry | undefined,
								Set<ChainTransactionEntry>
							>([[item, innerMap.get(item) ?? new Set()]])}
							<Block data={blockData} chainId={item.$id.chainId} />
						{/if}
					</span>
				{/snippet}
			</ItemsList>
		</section>
	</div>
</details>
