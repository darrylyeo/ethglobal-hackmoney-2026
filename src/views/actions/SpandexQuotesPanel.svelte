<script lang="ts">
	// Types/constants
	import type { ActionParams } from '$/constants/actions.ts'
	import { ActionType } from '$/constants/actions.ts'
	import {
		fetchSpandexQuoteForProvider,
		getRequestKeyForParams,
		spandexQuoteItemsCollection,
	} from '$/collections/SpandexQuoteItems.ts'
	import { labelByProtocolStrategy, ProtocolStrategy } from '$/constants/protocols.ts'
	import type { SpandexQuoteRequestId } from '$/data/SpandexQuoteItem.ts'
	import type { ProviderKey } from '@spandex/core'
	import { useLiveQuery } from '@tanstack/svelte-db'

	// Props
	let {
		params,
		provider,
		strategy = null,
		swapperAccount,
	}: {
		params: ActionParams<ActionType.Swap> | null
		provider: string
		strategy?: ProtocolStrategy | null
		swapperAccount: `0x${string}` | null
	} = $props()

	// State
	let fetching = $state(false)
	let error = $state<string | null>(null)

	// (Derived)
	const swapParams = $derived.by((): ActionParams<ActionType.Swap> | null => {
		if (
			!params ||
			!('chainId' in params && 'tokenIn' in params && 'tokenOut' in params && 'amount' in params && 'slippage' in params) ||
			(params as ActionParams<ActionType.Swap>).amount <= 0n
		)
			return null
		return params as ActionParams<ActionType.Swap>
	})
	const requestId = $derived(
		swapParams && swapperAccount
			? ({
					chainId: swapParams.chainId,
					inputToken: swapParams.tokenIn,
					outputToken: swapParams.tokenOut,
					amountIn: swapParams.amount,
					slippageBps: Math.round(swapParams.slippage * 10_000),
					swapperAccount,
				} satisfies SpandexQuoteRequestId)
			: null,
	)
	const requestKey = $derived(
		requestId ? getRequestKeyForParams(
			{
				chainId: requestId.chainId,
				tokenIn: requestId.inputToken,
				tokenOut: requestId.outputToken,
				amountIn: requestId.amountIn,
				slippage: requestId.slippageBps / 10_000,
			},
			requestId.swapperAccount,
		) : '',
	)
	const quotesQuery = useLiveQuery((q) =>
		q
			.from({ row: spandexQuoteItemsCollection })
			.select(({ row }) => ({ row })),
	)
	const itemForProvider = $derived(
		requestKey && quotesQuery.data && provider
			? quotesQuery.data.find(
					(r) => r.row.$id.requestId === requestKey && r.row.provider === provider,
				)?.row ?? null
			: null,
	)
	const canFetch = $derived(
		Boolean(swapParams && swapperAccount && !fetching && swapParams.amount > 0n),
	)
	const providerLabel = $derived(
		provider ? (provider.charAt(0).toUpperCase() + provider.slice(1)) : '',
	)
	const strategyLabel = $derived(
		strategy ? labelByProtocolStrategy[strategy] : null,
	)

	// Actions
	const onFetch = async () => {
		if (!requestId || !provider) return
		fetching = true
		error = null
		try {
			await fetchSpandexQuoteForProvider(requestId, provider as ProviderKey)
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
		} finally {
			fetching = false
		}
	}
</script>

{#if params && swapperAccount && provider}
	<section data-card data-column>
		<h3>
			{providerLabel} quote
			{#if strategyLabel}
				<small data-text="muted">({strategyLabel})</small>
			{/if}
		</h3>
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
		{#if itemForProvider}
			<div data-row="center gap-2">
				{#if itemForProvider.success}
					<span>
						{itemForProvider.simulatedOutputAmount?.toString() ?? '—'} out
					</span>
					{#if itemForProvider.mismatchFlag}
						<span data-muted title="Quote vs simulation mismatch">
							⚠ {itemForProvider.mismatchBps != null ? `${itemForProvider.mismatchBps} bps` : ''}
						</span>
					{/if}
				{:else}
					<span data-muted>{itemForProvider.error ?? 'Failed'}</span>
				{/if}
			</div>
		{:else if requestKey && !fetching}
			<p data-muted>Click “Fetch quote” for {providerLabel}.</p>
		{/if}
	</section>
{/if}
