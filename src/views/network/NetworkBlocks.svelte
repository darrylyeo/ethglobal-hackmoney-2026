<script lang="ts">
	// Types/constants
	import type { Network$Id } from '$/data/Network.ts'
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import { forkChainIds, getEraAtBlock } from '$/constants/forks/index.ts'


	// Props
	let {
		blocksMap,
		networkId: networkIdProp,
		chainId: chainIdProp,
		placeholderBlockIds = new Set<number | [number, number]>([0]),
		visiblePlaceholderBlockIds = $bindable([] as number[]),
		detailsProps = {},
	}: {
		blocksMap: Map<BlockEntry | undefined, Set<ChainTransactionEntry>>
		networkId?: Network$Id
		chainId?: number
		placeholderBlockIds?: Set<number | [number, number]>
		visiblePlaceholderBlockIds?: number[]
		detailsProps?: Record<string, unknown>
	} = $props()


	// (Derived)
	const chainId = $derived(
		networkIdProp?.chainId ?? chainIdProp ?? 0,
	)


	// (Derived)
	const blocksSet = $derived(
		new Set([...blocksMap.keys()].filter((b): b is BlockEntry => b != null)),
	)
	const hasFork = $derived(forkChainIds.has(chainId))
	const getGroupKey = $derived(
		hasFork
			? (b: BlockEntry) => getEraAtBlock(chainId, b.$id.blockNumber)?.eraId ?? 'Unknown'
			: undefined,
	)
	const getGroupLabel = $derived(forkSchedule ? (eraId: string) => eraId : undefined)
	const getGroupKeyForPlaceholder = $derived(
		hasFork ? (key: number) => getEraAtBlock(chainId, key)?.eraId ?? 'Unknown' : undefined,
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
	import ItemsListCollapsible from '$/components/ItemsListCollapsible.svelte'
</script>

<ItemsListCollapsible
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
	{#snippet Item({ key, item, isPlaceholder })}
		<span id="block:{key}">
			{#if isPlaceholder}
				<code>Block #{key} (loading…)</code>
			{:else}
				{@const blockData = new Map<
					BlockEntry | undefined,
					Set<ChainTransactionEntry>
				>([[item, blocksMap.get(item) ?? new Set()]])}
				<Block data={blockData} networkId={item.$id.$network} />
			{/if}
		</span>
	{/snippet}
</ItemsListCollapsible>
