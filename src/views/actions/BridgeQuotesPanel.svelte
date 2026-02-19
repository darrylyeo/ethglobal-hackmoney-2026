<script lang="ts">
	// Types/constants
	import type { ActionParams } from '$/constants/actions.ts'
	import { ActionType } from '$/constants/actions.ts'
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
		params: ActionParams<ActionType.Bridge> | null
		fromAddress: `0x${string}` | null
	} = $props()

	// State
	let fetching = $state(false)
	let error = $state<string | undefined>(undefined)

	// (Derived)
	const bridgeParams = $derived(
		params &&
		'fromChainId' in params &&
		'toChainId' in params &&
		'amount' in params &&
		(params as ActionParams<ActionType.Bridge>).fromChainId != null &&
		(params as ActionParams<ActionType.Bridge>).toChainId != null &&
		(params as ActionParams<ActionType.Bridge>).amount > 0n &&
		fromAddress
			? (params as ActionParams<ActionType.Bridge>)
			: null,
	)
	const requestId = $derived(
		bridgeParams && fromAddress
			? {
					fromChainId: bridgeParams.fromChainId!,
					toChainId: bridgeParams.toChainId!,
					amount: bridgeParams.amount,
					fromAddress,
					slippage: bridgeParams.slippage ?? 0.005,
				}
			: null,
	)
	const requestKey = $derived(
		requestId ? getBridgeQuoteRequestKey(requestId) : '',
	)
	const quoteRow = $derived(requestKey ? getBridgeQuote(requestId!) : null)
	const canFetch = $derived(Boolean(requestId && !fetching))

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
	<section data-card data-column>
		<h3>LiFi quote</h3>
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
	</section>
{/if}
