<script lang="ts">
	// Types/constants
	import type { BridgeParams, SwapParams } from '$/constants/actions.ts'
	import {
		getIntentsQuote,
		getIntentsBridgeQuote,
		type IntentsQuote,
	} from '$/api/lifi-intents.ts'

	// Props
	let {
		flow,
		params,
		fromAddress,
	}: {
		flow: 'swap' | 'bridge'
		params: SwapParams | BridgeParams | null
		fromAddress: `0x${string}` | null
	} = $props()

	// State
	let quote = $state<IntentsQuote | null>(null)
	let fetching = $state(
		false
	)
	let error = $state<string | undefined>(undefined)

	// (Derived)
	const swapParams = $derived(
		params && flow === 'swap' ? (params as SwapParams) : null
	)
	const bridgeParams = $derived(
		params && flow === 'bridge' ? (params as BridgeParams) : null
	)
	const canFetch = $derived(
		!!fromAddress &&
		(flow === 'swap'
			? (swapParams?.amount ?? 0n) > 0n
			: (bridgeParams?.amount ?? 0n) > 0n)
	)
	const validUntilFormatted = $derived(
		quote ? new Date(quote.validUntil * 1000).toISOString() : ''
	)

	// Actions
	const onFetch = async () => {
		if (!fromAddress) return
		if (flow === 'swap' && !swapParams) return
		if (flow === 'bridge' && !bridgeParams) return
		fetching = true
		error = undefined
		quote = null
		try {
			if (flow === 'swap' && swapParams && swapParams.tokenIn && swapParams.tokenOut) {
				const q = await getIntentsQuote({
					chainId: swapParams.chainId,
					tokenIn: swapParams.tokenIn,
					tokenOut: swapParams.tokenOut,
					amount: swapParams.amount,
					userAddress: fromAddress,
				})
				quote = q
				if (!q) error = 'No quote returned'
			} else if (flow === 'bridge' && bridgeParams) {
				const toAddr: `0x${string}` = (
					bridgeParams.useCustomRecipient && bridgeParams.customRecipient
						? (bridgeParams.customRecipient as `0x${string}`)
						: fromAddress
				)
				const q = await getIntentsBridgeQuote({
					fromChainId: bridgeParams.fromChainId!,
					toChainId: bridgeParams.toChainId!,
					amount: bridgeParams.amount,
					fromAddress,
					toAddress: toAddr,
				})
				quote = q
				if (!q) error = 'No quote returned'
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
		} finally {
			fetching = false
		}
	}
</script>

{#if params && fromAddress}
	<div data-column>
		<button
			type="button"
			disabled={!canFetch || fetching}
			onclick={onFetch}
		>
			{fetching ? 'Fetching…' : 'Fetch quote'}
		</button>

		{#if error}
			<p data-text="muted">{error}</p>
		{/if}

		{#if quote}
			<p data-text="muted">
				Quote ID: {quote.quoteId}. Valid until: {validUntilFormatted}
			</p>

			<p data-text="muted">
				Inputs: {quote.preview.inputs.length}. Outputs: {quote.preview.outputs.length}.
			</p>

			<button
				type="button"
				disabled
			>
				Confirm (placeholder)
			</button>
		{:else if canFetch && !fetching && !error}
			<p data-text="muted">
				Click "Fetch quote" for order-server quote.
			</p>
		{/if}
	</div>
{/if}
