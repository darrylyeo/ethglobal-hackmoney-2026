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

<div data-fee-breakdown>
	<button
		type="button"
		data-fee-summary
		onclick={() => (isExpanded = !isExpanded)}
		aria-expanded={isExpanded}
	>
		<span>Total fees: ~${fees.totalUsd}</span>
		<span data-fee-percent>({fees.percentOfTransfer}% of transfer)</span>
		<span data-fee-toggle>{isExpanded ? '▲' : '▼'}</span>
	</button>

	{#if isExpanded}
		<div data-fee-details>
			{#if fees.gasCost.length > 0}
				<div data-fee-section>
					<h4>Gas fees</h4>
					{#each fees.gasCost as gas (gas.chainId + gas.token.symbol)}
						<div data-fee-line>
							<span>{networksByChainId[gas.chainId]?.name ?? 'Unknown'} gas</span>
							<span>
								{formatTokenAmount(gas.amount, gas.token.decimals)} {gas.token.symbol}
								<span data-fee-usd>(~${gas.amountUsd})</span>
							</span>
						</div>
					{/each}
				</div>
			{/if}

			{#if fees.protocolFees.length > 0}
				<div data-fee-section>
					<h4>Protocol fees</h4>
					{#each fees.protocolFees as fee (fee.name + fee.token.symbol)}
						<div data-fee-line>
							<span>{fee.name}</span>
							<span>
								{formatTokenAmount(fee.amount, fee.token.decimals)} {fee.token.symbol}
								<span data-fee-usd>(~${fee.amountUsd})</span>
							</span>
						</div>
					{/each}
				</div>
			{/if}

			{#if fees.gasCost.length === 0 && fees.protocolFees.length === 0}
				<p data-fee-none>No fee details available</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	[data-fee-breakdown] {
		border: 1px solid var(--color-border);
		border-radius: 0.5em;
		overflow: hidden;
	}

	[data-fee-summary] {
		display: flex;
		align-items: center;
		gap: 0.5em;
		width: 100%;
		padding: 0.75em;
		background: var(--color-bg-subtle);
		border: none;
		cursor: pointer;
		text-align: left;
	}

	[data-fee-percent] {
		opacity: 0.7;
		font-size: 0.875em;
	}

	[data-fee-toggle] {
		margin-left: auto;
		font-size: 0.75em;
	}

	[data-fee-details] {
		padding: 0.75em;
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	[data-fee-section] > h4 {
		font-size: 0.75em;
		text-transform: uppercase;
		opacity: 0.7;
		margin-bottom: 0.5em;
	}

	[data-fee-line] {
		display: flex;
		justify-content: space-between;
		font-size: 0.875em;
	}

	[data-fee-usd] {
		opacity: 0.7;
		font-size: 0.875em;
	}
</style>
