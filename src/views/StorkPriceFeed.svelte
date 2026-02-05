<script lang="ts">
	// Types/constants
	import type { StorkPriceRow } from '$/collections/stork-prices'


	// Props
	let {
		symbol,
		priceRow,
	}: {
		symbol: string
		priceRow: StorkPriceRow | null
	} = $props()


	// Functions
	import { formatRelativeTime } from '$/lib/formatRelativeTime'
</script>


<div class="stork-price-feed" data-column="gap-1">
	<strong>{symbol} price</strong>
	{#if priceRow}
		{#if priceRow.error}
			<span data-error>{priceRow.error}</span>
		{:else}
			<div data-row="gap-2">
				<span data-muted>Asset</span>
				<span>{priceRow.assetId}</span>
			</div>
			{#if priceRow.encodedAssetId}
				<div data-row="gap-2">
					<span data-muted>Encoded</span>
					<span>{priceRow.encodedAssetId}</span>
				</div>
			{/if}
			<div data-row="gap-2">
				<span data-muted>Feed</span>
				<span
					>{priceRow.transport}{priceRow.chainId
						? ` · ${priceRow.chainId}`
						: ''}</span
				>
			</div>
			<div data-row="gap-2">
				<span data-muted>Updated</span>
				<span>{formatRelativeTime(Date.now() - priceRow.updatedAt)}</span>
			</div>
			{#if priceRow.isLoading}
				<span data-muted>Updating price…</span>
			{/if}
		{/if}
	{:else}
		<span data-muted>Waiting for price feed</span>
	{/if}
</div>




<style>
	.stork-price-feed {
		min-width: 220px;
	}
</style>
