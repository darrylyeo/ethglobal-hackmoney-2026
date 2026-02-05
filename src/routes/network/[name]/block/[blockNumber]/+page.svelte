<script lang="ts">
	import type { BlockEntry } from '$/data/Block'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction'
	import type { Network } from '$/constants/networks'
	import { networksByChainId } from '$/constants/networks'
	import { rpcUrls } from '$/constants/rpc-endpoints'
	import { createHttpProvider, getCurrentBlockNumber } from '$/api/voltaire'
	import { fetchBlock } from '$/collections/blocks'
	import { blocksCollection } from '$/collections/blocks'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'
	import Network from '$/components/network/Network.svelte'

	let {
		data,
	}: {
		data: {
			nameParam: string
			blockNumberParam: string
			blockNumber: number
			chainId: number
			config: { name: string; explorerUrl?: string }
			slug: string
			caip2: string
		}
	} = $props()

	let height = $state(0)

	const blockQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: blocksCollection })
				.where(({ row }) =>
					and(
						eq(row.$id.chainId, data.chainId),
						eq(row.$id.blockNumber, data.blockNumber),
					),
				)
				.select(({ row }) => ({ row })),
		[() => data.chainId, () => data.blockNumber],
	)
	const liveQueryEntries = $derived([
		{
			id: 'block',
			label: 'Block',
			query: blockQuery as { data: { row: unknown }[] | undefined },
		},
	])
	registerLocalLiveQueryStack(() => liveQueryEntries)

	const blockRow = $derived(blockQuery.data?.[0]?.row as BlockEntry | null)
	const network = $derived(networksByChainId[data.chainId] ?? null)
	const blocksMap = $derived(
		(() => {
			const inner = new Map<
				BlockEntry | undefined,
				Set<ChainTransactionEntry>
			>()
			if (blockRow) inner.set(blockRow, new Set())
			return inner
		})(),
	)
	const networkData = $derived(
		(() => {
			const m = new Map<
				Network | undefined,
				Map<BlockEntry | undefined, Set<ChainTransactionEntry>>
			>()
			m.set(network ?? undefined, blocksMap)
			return m
		})(),
	)
	const placeholderBlockIds = $derived(
		(() => {
			const adj = new Set<number>()
			if (data.blockNumber > 0) adj.add(data.blockNumber - 1)
			const next = data.blockNumber + 1
			if (height <= 0 || next <= height) adj.add(next)
			return new Set<number | [number, number]>(adj)
		})(),
	)

	const showContextUrl = $derived(
		`/network/${data.nameParam}#block:${data.blockNumber}`,
	)

	$effect(() => {
		fetchBlock(data.chainId, data.blockNumber).catch(() => {})
	})
	$effect(() => {
		const url = rpcUrls[data.chainId]
		if (!url) return
		getCurrentBlockNumber(createHttpProvider(url))
			.then((h) => {
				height = h
			})
			.catch(() => {})
	})
</script>


<svelte:head>
	<title>
		Block {data.blockNumberParam} · {data.config.name}
	</title>
</svelte:head>


<div data-column="gap-2">
	<p>
		<a href={showContextUrl} data-link>Show Context</a>
	</p>
	<Network data={networkData} {placeholderBlockIds} />
</div>
