<script lang="ts">
	// Types/constants
	import type { Network$Id } from '$/data/Network.ts'
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import { forksByChainId } from '$/constants/forks/index.ts'
	import { getExecutionEraAtBlock } from '$/lib/forks.ts'


	// Props
	let {
		blocksMap,
		networkId,
		placeholderBlockIds = new Set<number | [number, number]>([0]),
		visiblePlaceholderBlockIds = $bindable([] as number[]),
		detailsProps = {},
	}: {
		blocksMap: Map<BlockEntry | undefined, Set<ChainTransactionEntry>>
		networkId: Network$Id
		placeholderBlockIds?: Set<number | [number, number]>
		visiblePlaceholderBlockIds?: number[]
		detailsProps?: Record<string, unknown>
	} = $props()

	// (Derived)
	const chainId = $derived(
		networkId.chainId
	)

	// (Derived)
	const blocksSet = $derived(
		new Set([...blocksMap.keys()].filter((b): b is BlockEntry => b != null)),
	)
	const hasFork = $derived(
		chainId in forksByChainId
	)
	const getGroupKey = $derived(
		hasFork
			? (b: BlockEntry) =>
					getExecutionEraAtBlock(
						chainId,
						b.$id.blockNumber,
						b.timestamp,
					)?.eraId ?? 'Unknown'
			: undefined,
	)
	const getGroupLabel = $derived(
		hasFork ? (eraId: string) => eraId : undefined
	)
	const getGroupKeyForPlaceholder = $derived(
		hasFork
			? (key: number) =>
					getExecutionEraAtBlock(chainId, key)?.eraId ?? 'Unknown'
			: undefined,
	)
	const total = $derived.by(() => {
		const range = [...placeholderBlockIds].find((k): k is [number, number] =>
			Array.isArray(k),
		)
		return range != null
			? range[1] + 1
			: placeholderBlockIds.size > 0
				? 1
				: 0
	})


	// Components
	import Block from '$/views/network/Block.svelte'
	import CollapsibleList from '$/components/CollapsibleList.svelte'
</script>


<CollapsibleList
	title="Execution"
	detailsProps={{ open: true, ...detailsProps }}
	loaded={blocksSet.size}
	total={total > 0 ? total : undefined}
	items={blocksSet}
	getKey={(b) => b.$id.blockNumber}
	getSortValue={(b) => -Number(b.number)}
	getGroupKey={getGroupKey}
	getGroupLabel={getGroupLabel}
	getGroupKeyForPlaceholder={getGroupKeyForPlaceholder}
	placeholderKeys={placeholderBlockIds}
	bind:visiblePlaceholderKeys={visiblePlaceholderBlockIds}
	scrollPosition="Start"
>
	{#snippet Empty()}
		<p data-text="muted">No blocks.</p>
	{/snippet}

	{#snippet Item({ key, item, isPlaceholder })}
		<span id="block:{key}">
			{#if isPlaceholder}
				<code>Block #{key} (loading…)</code>
			{:else}
				{@const blockData = new Map<
					BlockEntry | undefined,
					Set<ChainTransactionEntry>
				>([[item, blocksMap.get(item) ?? new Set()]])}
				{@const networkId = item.$id.$network}
				<Block data={blockData} {networkId} />
			{/if}
		</span>
	{/snippet}
</CollapsibleList>
