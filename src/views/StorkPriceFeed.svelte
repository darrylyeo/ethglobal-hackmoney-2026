<script lang="ts">
	// Types/constants
	import type { WithSource } from '$/constants/data-sources.ts'
	import type { StorkPrice } from '$/data/StorkPrice.ts'


	// Props
	let {
		symbol,
		priceRow,
	}: {
		symbol: string
		priceRow: WithSource<StorkPrice> | null
	} = $props()


	// Functions
	import { formatRelativeTime } from '$/lib/formatRelativeTime.ts'
</script>


<div
	class="stork-price-feed"
	data-column
>
	<strong>{symbol} price</strong>
	{#if priceRow}
		{#if priceRow.error}
			<span data-error>{priceRow.error}</span>
		{:else}
			<div data-row>
				<span data-text="muted">
					Asset
				</span>
				<span>{priceRow.assetId}</span>
			</div>

			{#if priceRow.encodedAssetId}
				<div data-row>
					<span data-text="muted">
						Encoded
					</span>
					<span>{priceRow.encodedAssetId}</span>
				</div>
			{/if}

			<div data-row>
				<span data-text="muted">
					Feed
				</span>
				<span>{priceRow.transport}{priceRow.chainId ?
					` · ${priceRow.chainId}`
				: ''}</span>
			</div>

			<div data-row>
				<span data-text="muted">
					Updated
				</span>
				<span>{formatRelativeTime(Date.now() - priceRow.updatedAt)}</span>
			</div>

			{#if priceRow.isLoading}
				<span data-text="muted">
					Updating price…
				</span>
			{/if}
		{/if}
	{:else}
		<span data-text="muted">
			Waiting for price feed
		</span>
	{/if}
</div>


<style>
	.stork-price-feed {
		min-width: 220px;
	}
</style>
