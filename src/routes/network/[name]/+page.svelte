<script lang="ts">
	import type { BlockEntry } from '$/data/Block'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction'
	import type { Network } from '$/constants/networks'
	import { networksByChainId } from '$/constants/networks'
	import { rpcUrls } from '$/constants/rpc-endpoints'
	import { createHttpProvider, getCurrentBlockNumber } from '$/api/voltaire'
	import {
		blocksCollection,
		ensureBlocksForPlaceholders,
	} from '$/collections/blocks'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import { liveQueryLocalAttachmentFrom } from '$/svelte/live-query-context.svelte'
	import Network from '$/components/network/Network.svelte'


	// Props
	let {
		data,
	}: {
		data: {
			nameParam: string
			chainId: number
			config: { name: string; explorerUrl?: string; type: string }
			slug: string
			caip2: string
		}
	} = $props()


	// State
	let height = $state(0)
	let visiblePlaceholderBlockIds = $state<number[]>([])

	const blocksQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: blocksCollection })
				.where(({ row }) => eq(row.$id.chainId, data.chainId))
				.select(({ row }) => ({ row })),
		[() => data.chainId],
	)
	const liveQueryEntries = $derived([
		{
			id: 'blocks',
			label: 'Blocks',
			query: blocksQuery as { data: { row: unknown }[] | undefined },
		},
	])
	const liveQueryAttachment = liveQueryLocalAttachmentFrom(
		() => liveQueryEntries,
	)

	const network = $derived(networksByChainId[data.chainId] ?? null)
	const blockRows = $derived(
		(blocksQuery.data ?? []).map((r) => r.row as BlockEntry),
	)
	const blocksMap = $derived(
		(() => {
			const inner = new Map<
				BlockEntry | undefined,
				Set<ChainTransactionEntry>
			>()
			for (const row of blockRows) inner.set(row, new Set())
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
		height > 0
			? new Set<number | [number, number]>([[0, height]])
			: new Set<number | [number, number]>([0]),
	)

	$effect(() => {
		const url = rpcUrls[data.chainId]
		if (!url) return
		const provider = createHttpProvider(url)
		getCurrentBlockNumber(provider)
			.then((h) => {
				height = h
			})
			.catch(() => {})
	})

	$effect(() => {
		if (height <= 0) return
		const lo = Math.max(0, height - 10)
		const blockNumbers = Array.from(
			{ length: height - lo + 1 },
			(_, j) => lo + j,
		)
		ensureBlocksForPlaceholders(data.chainId, blockNumbers)
	})

	$effect(() => {
		ensureBlocksForPlaceholders(data.chainId, visiblePlaceholderBlockIds)
	})

	const explorerBlockListUrl = $derived(
		data.config.explorerUrl ? `${data.config.explorerUrl}/blocks` : null,
	)
</script>


<svelte:head>
	<title>{data.config.name} · Network</title>
</svelte:head>


<div data-column="gap-2" {@attach liveQueryAttachment}>
	<header data-column="gap-2">
		<h1>Network</h1>
		<div class="network-identity" data-row="gap-2 align-center">
			<code class="caip2">{data.caip2}</code>
			<span class="network-name">{data.config.name}</span>
			<span class="network-type" data-tag={data.config.type}>
				{data.config.type}
			</span>
		</div>
		<p class="network-meta">
			Chain ID {data.chainId}
		</p>
	</header>

	<nav class="network-actions" data-row="wrap gap-2">
		{#if data.config.explorerUrl}
			<a
				href={explorerBlockListUrl ?? ''}
				target="_blank"
				rel="noopener noreferrer"
				class="action-link"
			>
				Blocks
			</a>
			<a
				href={data.config.explorerUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="action-link"
			>
				Explorer
			</a>
		{/if}
	</nav>

	<Network
		data={networkData}
		{placeholderBlockIds}
		bind:visiblePlaceholderBlockIds
	/>
</div>



<style>
	.network-identity {
		font-size: 1rem;
	}

	.network-identity code.caip2 {
		font-family: ui-monospace, monospace;
		opacity: 0.85;
	}

	.network-name {
		font-weight: 600;
	}

	.network-type[data-tag='Testnet'] {
		opacity: 0.8;
		font-size: 0.85em;
	}

	.network-meta {
		margin: 0;
		font-size: 0.9em;
		opacity: 0.85;
	}

	.network-actions .action-link {
		font-size: 0.9em;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-subtle);
		color: inherit;
		text-decoration: none;
	}

	.network-actions .action-link:hover {
		background: var(--color-border);
	}
</style>
