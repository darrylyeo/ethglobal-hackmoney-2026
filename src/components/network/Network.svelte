<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { Network } from '$/constants/networks'
	import type { BlockEntry } from '$/data/Block'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction'
	import ItemsList from '$/components/ItemsList.svelte'
	import Block from '$/components/network/Block.svelte'

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
		visiblePlaceholderBlockIds?: number[]
	} = $props()

	const innerMap = $derived([...data.values()][0] ?? new Map())
	const network = $derived([...data.keys()][0])
	const blocksSet = $derived(
		new Set([...innerMap.keys()].filter((b): b is BlockEntry => b != null)),
	)
	const defaultPlaceholderBlockIds = $derived(
		placeholderBlockIds ?? new Set<number | [number, number]>([0]),
	)
</script>


<details data-card="secondary radius-2 padding-4" open>
	<summary data-row="gap-2 align-center">
		{#if network}
			<code id="network:{network.id}">{network.name}</code>
			<span>Chain ID {network.id}</span>
			<span>{network.type}</span>
		{:else}
			<code>Loading network…</code>
		{/if}
	</summary>
	<div data-column="gap-4">
		{#if network}
			<dl data-column="gap-1">
				<dt>Name</dt>
				<dd>{network.name}</dd>
				<dt>Chain ID</dt>
				<dd><code>{network.id}</code></dd>
				<dt>Type</dt>
				<dd>{network.type}</dd>
			</dl>
		{/if}
		<section>
			<h2>Blocks</h2>
			<ItemsList
				items={blocksSet}
				getKey={(b) => b.$id.blockNumber}
				getSortValue={(b) => -Number(b.number)}
				placeholderKeys={defaultPlaceholderBlockIds}
				bind:visiblePlaceholderBlockIds
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
