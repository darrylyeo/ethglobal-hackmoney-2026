<script lang="ts">
	// Types/constants
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import { FORK_SCHEDULE_CHAIN_IDS, getEraAtBlock } from '$/constants/fork-schedules.ts'


	// Props
	let {
		blocksMap,
		chainId,
		placeholderBlockIds = new Set<number | [number, number]>([0]),
		visiblePlaceholderBlockIds = $bindable([] as number[]),
		detailsProps = {},
	}: {
		blocksMap: Map<BlockEntry | undefined, Set<ChainTransactionEntry>>
		chainId: number
		placeholderBlockIds?: Set<number | [number, number]>
		visiblePlaceholderBlockIds?: number[]
		detailsProps?: Record<string, unknown>
	} = $props()


	// (Derived)
	const blocksSet = $derived(
		new Set([...blocksMap.keys()].filter((b): b is BlockEntry => b != null)),
	)
	const forkSchedule = $derived(FORK_SCHEDULE_CHAIN_IDS.has(chainId))
	const getGroupKey = $derived(
		forkSchedule
			? (b: BlockEntry) => getEraAtBlock(chainId, b.$id.blockNumber)?.eraId ?? 'Unknown'
			: undefined,
	)
	const getGroupLabel = $derived(forkSchedule ? (eraId: string) => eraId : undefined)
	const getGroupKeyForPlaceholder = $derived(
		forkSchedule ? (key: number) => getEraAtBlock(chainId, key)?.eraId ?? 'Unknown' : undefined,
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
	const totalDisplay = $derived(total > 0 ? total : undefined)


	// Components
	import EntityList from '$/components/EntityList.svelte'
	import Block from '$/views/network/Block.svelte'
</script>

<EntityList
	title="Execution"
	detailsProps={{ open: true, ...detailsProps }}
	loaded={blocksSet.size}
	total={totalDisplay}
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
				<Block data={blockData} chainId={item.$id.$network.chainId} />
			{/if}
		</span>
	{/snippet}
</EntityList>
