<script lang="ts">
	// Types/constants
	import type { Network } from '$/constants/networks.ts'
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import { networksByChainId } from '$/constants/networks.ts'


	// Components
	import EntityList from '$/components/EntityList.svelte'
	import Block from '$/views/network/Block.svelte'


	// Props
	let {
		data,
		placeholderBlockIds,
		visiblePlaceholderBlockIds = $bindable([] as number[]),
		isCompact = false,
	}: {
		data: Map<
			Network | undefined,
			Map<BlockEntry | undefined, Set<ChainTransactionEntry>>
		>
		placeholderBlockIds?: Set<number | [number, number]>
		visiblePlaceholderBlockIds?: number[]
		isCompact?: boolean
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
	const blocksTotal = $derived(
		(() => {
			const ids = defaultPlaceholderBlockIds
			const range = [...ids].find((k): k is [number, number] =>
				Array.isArray(k),
			)
			return range != null ? range[1] + 1 : (ids.size > 0 ? 1 : 0)
		})(),
	)
</script>


{#if isCompact}
	<EntityList
		title="Blocks"
		detailsProps={{
			open: true,
			'data-card': 'radius-2 padding-4',
		}}
		loaded={blocksSet.size}
		total={blocksTotal > 0 ? blocksTotal : undefined}
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
					<Block data={blockData} chainId={item.$id.$network.chainId} />
				{/if}
			</span>
		{/snippet}
	</EntityList>
{:else}
	<details data-card="radius-2 padding-4" open id={network ? `network:${network.id}` : undefined}>
		<summary>
			{#if network}
				<div data-row>
					<div data-row>
						<div data-column>
							<h2>{network.name}</h2>
						</div>

						<span data-tag>{network.type}</span>
					</div>

					<span data-text="annotation">EVM Network</span>
				</div>
			{:else}
				<code>Loading network…</code>
			{/if}
		</summary>

		<div data-column="gap-4">
			{#if network}
				<dl>
					<div>
						<dt>Chain ID</dt>
						<dd><code>{network.chainId}</code></dd>
					</div>
					<div>
						<dt>Chain Agnostic ID</dt>
						<dd><code>eip155:{network.chainId}</code></dd>
					</div>
					<div>
						<dt>Type</dt>
						<dd>{network.type}</dd>
					</div>
					{#if network?.nativeCurrency}
						<div>
							<dt>Currency</dt>
							<dd>{network.nativeCurrency.symbol}</dd>
						</div>
					{/if}
				</dl>
			{/if}

			<EntityList
				title="Blocks"
				detailsProps={{
					open: true,
					'data-card': '',
				}}
				loaded={blocksSet.size}
				total={blocksTotal > 0 ? blocksTotal : undefined}
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
						<Block data={blockData} chainId={item.$id.$network.chainId} />
					{/if}
				</span>
			{/snippet}
			</EntityList>
		</div>
	</details>
{/if}
