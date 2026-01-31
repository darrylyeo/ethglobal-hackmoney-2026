<script lang="ts">
	// Types/constants
	import type { FeeBreakdown } from '$/api/lifi'

	// Functions
	import { formatTokenAmount } from '$/lib/format'
	import { networksByChainId } from '$/constants/networks'

	// Props
	let {
		fees,
		expanded = false,
	}: {
		fees: FeeBreakdown
		expanded?: boolean
	} = $props()

	const initialExpanded = expanded
	let isExpanded = $state(initialExpanded)
</script>

<div data-fee-breakdown data-card="secondary">
	<button
		type="button"
		data-fee-summary
		data-row="gap-2 align-center"
		onclick={() => (isExpanded = !isExpanded)}
		aria-expanded={isExpanded}
	>
		<span>Total fees: ~${fees.totalUsd}</span>
		<span data-muted>({fees.percentOfTransfer}% of transfer)</span>
		<span data-row-item="wrap-end">{isExpanded ? '▲' : '▼'}</span>
	</button>

	{#if isExpanded}
		<div data-fee-details data-column="gap-4">
			{#if fees.gasCost.length > 0}
				<section>
					<h4 data-muted>Gas fees</h4>
					<dl data-fee-list>
						{#each fees.gasCost as gas (gas.chainId + gas.token.symbol)}
							<dt>{networksByChainId[gas.chainId]?.name ?? 'Unknown'} gas</dt>
							<dd>
								{formatTokenAmount(gas.amount, gas.token.decimals)} {gas.token.symbol}
								<span data-muted>(~${gas.amountUsd})</span>
							</dd>
						{/each}
					</dl>
				</section>
			{/if}

			{#if fees.protocolFees.length > 0}
				<section>
					<h4 data-muted>Protocol fees</h4>
					<dl data-fee-list>
						{#each fees.protocolFees as fee (fee.name + fee.token.symbol)}
							<dt>{fee.name}</dt>
							<dd>
								{formatTokenAmount(fee.amount, fee.token.decimals)} {fee.token.symbol}
								<span data-muted>(~${fee.amountUsd})</span>
							</dd>
						{/each}
					</dl>
				</section>
			{/if}

			{#if fees.gasCost.length === 0 && fees.protocolFees.length === 0}
				<p data-muted>No fee details available</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	[data-fee-breakdown] {
		overflow: hidden;
	}

	[data-fee-summary] {
		width: 100%;
		background: var(--color-bg-subtle);
		border: none;
		text-align: left;
	}

	[data-fee-details] {
		padding: 0.75em;
	}

	[data-fee-list] {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25em 1em;
		margin: 0.25em 0 0;
	}

	[data-fee-list] dt,
	[data-fee-list] dd {
		margin: 0;
	}
</style>
