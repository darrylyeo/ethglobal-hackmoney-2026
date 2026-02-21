<script lang="ts">
	// Types/constants
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import type { Network } from '$/constants/networks.ts'


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
	const blocksMap = $derived([...data.values()][0] ?? new Map())
	const blocksSet = $derived(
		new Set([...blocksMap.keys()].filter((b): b is BlockEntry => b != null)),
	)
	const placeholderIds = $derived(
		placeholderBlockIds ?? new Set<number | [number, number]>([0]),
	)
	const blocksTotal = $derived.by(() => {
		const range = [...placeholderIds].find((k): k is [number, number] =>
			Array.isArray(k),
		)
		return range != null
			? range[1] + 1
			: placeholderIds.size > 0
				? 1
				: 0
	})
	const totalDisplay = $derived(blocksTotal > 0 ? blocksTotal : undefined)


	// Components
	import EntityList from '$/components/EntityList.svelte'
	import Block from '$/views/network/Block.svelte'
</script>


{#if isCompact}
	<EntityList
		title="Blocks"
		detailsProps={{
			open: true,
			'data-card': 'radius-2 padding-4',
		}}
		loaded={blocksSet.size}
		total={totalDisplay}
		items={blocksSet}
		getKey={(b) => b.$id.blockNumber}
		getSortValue={(b) => -Number(b.number)}
		placeholderKeys={placeholderIds}
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
					>([[item, blocksMap.get(item) ?? new Set()]])}
					<Block data={blockData} chainId={item.$id.$network.chainId} />
				{/if}
			</span>
		{/snippet}
	</EntityList>
{:else}
	<details data-card="radius-2 padding-4" open id={network ? `network:${network.chainId}` : undefined}>
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
					{#if network.nativeCurrency}
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
				placeholderKeys={placeholderIds}
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
						>([[item, blocksMap.get(item) ?? new Set()]])}
						<Block data={blockData} chainId={item.$id.$network.chainId} />
					{/if}
				</span>
			{/snippet}
			</EntityList>
		</div>
	</details>
{/if}
