<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import type { BlockEntry } from '$/data/Block.ts'
	import type { ChainTransactionEntry } from '$/data/ChainTransaction.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'
	import { rpcUrls } from '$/constants/rpc-endpoints.ts'


	// Context
	import { page } from '$app/state'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Functions
	import { createHttpProvider } from '$/api/voltaire.ts'
	import { BlockStream } from '@tevm/voltaire/block'


	// State
	import { blocksCollection, ensureBlocksForPlaceholders } from '$/collections/blocks.ts'


	// Components
	import NetworkView from '$/components/network/Network.svelte'


	// (Derived)
	const nameParam = $derived(page.params.name ?? '')
	const parsed = $derived(parseNetworkNameParam(nameParam))
	const chainId = $derived(parsed?.chainId ?? (0 as ChainId))
	const config = $derived(parsed?.config ?? { name: '', type: '' })
	const slug = $derived(parsed?.slug ?? '')
	const caip2 = $derived(parsed?.caip2 ?? '')


	// State
	let height = $state(0)
	let visiblePlaceholderBlockIds = $state<number[]>([])


	// (Derived)
	const blocksQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: blocksCollection })
				.where(({ row }) => eq(row.$id.chainId, chainId))
				.select(({ row }) => ({ row })),
		[() => chainId],
	)
	registerLocalLiveQueryStack(() => [
		{
			id: 'blocks',
			label: 'Blocks',
			query: blocksQuery as { data: { row: unknown }[] | undefined },
		},
	])

	const blocksMap = $derived(
		(() => {
			const inner = new Map<
				BlockEntry | undefined,
				Set<ChainTransactionEntry>
			>()
			for (const row of (blocksQuery.data ?? []).map((r) => r.row as BlockEntry))
				inner.set(row, new Set())
			return inner
		})(),
	)
	const networkData = $derived(
		new Map([[networksByChainId[chainId] ?? undefined, blocksMap]]),
	)
	const placeholderBlockIds = $derived(
		height > 0
			? new Set<number | [number, number]>([[0, height]])
			: new Set<number | [number, number]>([0]),
	)

	$effect(() => {
		const url = rpcUrls[chainId]
		if (!url) return
		const provider = createHttpProvider(url)
		const stream = BlockStream({
			provider: provider as Parameters<typeof BlockStream>[0]['provider'],
		})
		const controller = new AbortController()
		;(async () => {
			try {
				for await (const event of stream.watch({
					signal: controller.signal,
					include: 'header',
					pollingInterval: 12_000,
				}))
					height = Number(event.metadata.chainHead)
			} catch {
				// aborted or stream error
			}
		})()
		return () => controller.abort()
	})

	$effect(() => {
		if (height <= 0) return
		const lo = Math.max(0, height - 10)
		ensureBlocksForPlaceholders(
			chainId,
			Array.from({ length: height - lo + 1 }, (_, j) => lo + j),
		)
	})

	$effect(() => {
		ensureBlocksForPlaceholders(chainId, visiblePlaceholderBlockIds)
	})
</script>


<svelte:head>
	<title>{parsed ? `${config.name} · Network` : 'Network'}</title>
</svelte:head>


<main data-column="gap-2">
	{#if !parsed}
		<h1>Network not found</h1>
		<p>The network "{nameParam}" could not be resolved.</p>
	{:else}
		<header data-column="gap-2">
			<div data-row="wrap gap-4 align-center">
				<div data-column="gap-1">
					<h1>{config.name}</h1>
					<code data-text="vertical" data-text="font-monospace">{caip2}</code>
					{#if config.type}
						<span data-tag={config.type}>{config.type}</span>
					{/if}
				</div>
				<span data-text="annotation">Network</span>
			</div>
			<p data-text="annotation">Chain ID {chainId}</p>
		</header>

		<nav class="network-actions" data-row="wrap gap-2">
			{#if config.explorerUrl}
				<a
					href={(config.explorerUrl ? `${config.explorerUrl}/blocks` : null) ?? ''}
					target="_blank"
					rel="noopener noreferrer"
					class="action-link"
				>
					Blocks
				</a>
				<a
					href={config.explorerUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="action-link"
				>
					Explorer
				</a>
			{/if}
		</nav>

		<NetworkView
			data={networkData}
			{placeholderBlockIds}
			bind:visiblePlaceholderBlockIds
		/>
	{/if}
</main>


<style>
	[data-tag='Testnet'] {
		opacity: 0.8;
		font-size: 0.85em;
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
