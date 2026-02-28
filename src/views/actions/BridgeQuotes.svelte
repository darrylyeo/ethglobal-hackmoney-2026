<script lang="ts">
	// Types/constants
	import type { BridgeParams } from '$/constants/actions.ts'
	import {
		fetchBridgeQuote,
		getBridgeQuote,
		getBridgeQuoteRequestKey,
	} from '$/collections/BridgeQuoteItems.ts'

	// Props
	let {
		params,
		fromAddress,
	}: {
		params: BridgeParams | null
		fromAddress: `0x${string}` | null
	} = $props()

	// State
	let fetching = $state(
		false
	)
	let error = $state<string | undefined>(undefined)

	// (Derived)
	const bridgeParams = $derived.by((): BridgeParams | null => {
		if (!params || !fromAddress) return null
		if (params.fromChainId == null || params.toChainId == null || params.amount <= 0n) return null
		return params
	})
	const requestId = $derived.by(() => {
		if (!bridgeParams || !fromAddress || bridgeParams.fromChainId == null || bridgeParams.toChainId == null)
			return null
		return {
			fromChainId: bridgeParams.fromChainId!,
			toChainId: bridgeParams.toChainId!,
			amount: bridgeParams.amount,
			fromAddress,
			slippage: bridgeParams.slippage ?? 0.005,
		}
	})
	const requestKey = $derived(
		requestId ? getBridgeQuoteRequestKey(requestId) : ''
	)
	const quoteRow = $derived(
		requestId ? getBridgeQuote(requestId) : null
	)
	const canFetch = $derived(
		!!requestId && !fetching
	)

	// Actions
	const onFetch = async () => {
		if (!requestId) return
		fetching = true
		error = undefined
		try {
			await fetchBridgeQuote(requestId)
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
			disabled={!canFetch}
			onclick={onFetch}
		>
			{fetching ? 'Fetching…' : 'Fetch quote'}
		</button>
		{#if error}
			<p data-muted>{error}</p>
		{/if}
		{#if quoteRow?.success && quoteRow.transactionRequests.length > 0}
			<p data-text="muted">
				{quoteRow.transactionRequests.length} step(s) ready.
			</p>
		{:else if requestKey && !fetching && quoteRow && !quoteRow.success}
			<p data-text="muted">
				{quoteRow.error ?? 'No transaction data. Fetch again.'}
			</p>
		{:else if requestKey && !fetching}
			<p data-text="muted">Click "Fetch quote" for transaction details.</p>
		{/if}
	</div>
{/if}
