<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources'
	import type { StorkPriceRow } from '$/collections/stork-prices'

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { liveQueryLocalAttachmentFrom } from '$/svelte/live-query-context.svelte'

	// Props
	let {
		assetIds,
		chainId = null,
		title = 'Stork Prices',
	}: {
		assetIds: string[]
		chainId?: number | null
		title?: string
	} = $props()

	// Functions
	import { formatSmallestToDecimal } from '$/lib/format'
	import { formatRelativeTime } from '$/lib/formatRelativeTime'
	import {
		getBestStorkPrice,
		storkPricesCollection,
		subscribeStorkPrices,
	} from '$/collections/stork-prices'

	// State
	const pricesQuery = useLiveQuery((q) =>
		q
			.from({ row: storkPricesCollection })
			.where(({ row }) => eq(row.$source, DataSource.Stork))
			.select(({ row }) => ({ row })),
	)
	const liveQueryEntries = [
		{
			id: 'stork-prices',
			label: 'Stork Prices',
			query: pricesQuery,
		},
	]
	const liveQueryAttachment = liveQueryLocalAttachmentFrom(
		() => liveQueryEntries,
	)
	const prices = $derived<StorkPriceRow[]>(
		(pricesQuery.data ?? []).map((r) => r.row),
	)

	$effect(() => {
		if (assetIds.length === 0) return
		const unsubscribe = subscribeStorkPrices({ assetIds, chainId })
		return () => unsubscribe()
	})
</script>

<section class="stork-prices" data-card="secondary" {@attach liveQueryAttachment}>
	<header data-row="gap-2 align-center justify-between">
		<h3>{title}</h3>
		<span data-muted>{assetIds.length} feeds</span>
	</header>

	{#if assetIds.length === 0}
		<p data-muted>No Stork assets selected.</p>
	{:else}
		<ul data-column="gap-2">
			{#each assetIds as assetId (assetId)}
				{@const best = getBestStorkPrice(prices, assetId, chainId ?? null)}
				<li
					class="stork-price-row"
					data-row="gap-2 align-center justify-between"
				>
					<span class="stork-asset-id">{assetId}</span>
					{#if best}
						<span data-tabular>
							${formatSmallestToDecimal(best.price, 18, 6)}
						</span>
						<small data-muted>
							{best.transport}{best.chainId ? ` · ${best.chainId}` : ''} · {formatRelativeTime(
								Date.now() - best.updatedAt,
							)}
						</small>
					{:else}
						<small data-muted>Waiting for price…</small>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.stork-prices {
		display: grid;
		gap: 0.75rem;

		h3 {
			margin: 0;
			font-size: 1em;
		}
	}

	.stork-price-row {
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;

		&:last-child {
			border-bottom: none;
			padding-bottom: 0;
		}
	}

	.stork-asset-id {
		font-weight: 600;
	}
</style>
