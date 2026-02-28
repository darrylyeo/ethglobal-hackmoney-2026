<script lang="ts">
	// Types/constants
	import type { ActionParams } from '$/constants/actions.ts'
	import { ActionType } from '$/constants/actions.ts'
	import {
		fetchSwapQuoteForProvider,
		fetchSwapQuotes,
		getRequestKeyForParams,
		swapQuoteItemsCollection,
		type SwapQuoteRequestId,
	} from '$/collections/ProtocolAggregatorQuoteItems.ts'
	import type { ProtocolStrategy } from '$/constants/protocols.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { singleFlight } from '$/lib/singleFlight.ts'

	type SwapParamsForQuote = {
		chainId: number
		tokenIn: `0x${string}`
		tokenOut: `0x${string}`
		amount: bigint
		slippage: number
	}
	function isSwapParams(v: unknown): v is SwapParamsForQuote {
		if (v == null || typeof v !== 'object') return false
		const o = v as Record<string, unknown>
		return (
			'chainId' in o &&
			'tokenIn' in o &&
			'tokenOut' in o &&
			'amount' in o &&
			'slippage' in o &&
			typeof o.amount === 'bigint'
		)
	}

	// Props
	let {
		params,
		provider,
		strategy = undefined,
		swapperAccount,
	}: {
		params: ActionParams<ActionType.Swap> | null
		provider?: string
		strategy?: ProtocolStrategy | undefined
		swapperAccount: `0x${string}` | null
	} = $props()

	// State
	let error = $state<string | undefined>(undefined)

	// (Derived)
	const swapParams = $derived.by((): SwapParamsForQuote | null => {
		if (!isSwapParams(params) || params.amount <= 0n) return null
		return params
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
				} satisfies SwapQuoteRequestId)
			: null
	)
	const requestKey = $derived(
		requestId
			? getRequestKeyForParams(
					{
						chainId: requestId.chainId,
						tokenIn: requestId.inputToken,
						tokenOut: requestId.outputToken,
						amountIn: requestId.amountIn,
						slippage: requestId.slippageBps / 10_000,
					},
					requestId.swapperAccount,
				)
			: ''
	)
	const quotesQuery = useLiveQuery((q) =>
		q
			.from({ row: swapQuoteItemsCollection })
			.select(({ row }) => ({ row })),
	)
	const quoteRowsForRequest = $derived(
		requestKey && quotesQuery.data
			? quotesQuery.data
					.filter(({ row: quote }) => quote.$id.requestId === requestKey)
					.map(({ row: quote }) => quote)
			: []
	)
	const itemForProvider = $derived(
		provider && quoteRowsForRequest.length > 0
			? quoteRowsForRequest.find((r) => r.provider === provider) ?? null
			: null
	)
	const itemsForRequest = $derived(
		!provider
			? [...quoteRowsForRequest].sort((a, b) =>
					(a.simulatedOutputAmount ?? 0n) > (b.simulatedOutputAmount ?? 0n) ? -1 : 1,
				)
			: []
	)

	// Actions
	const fetchQuotesOnce = singleFlight(
		async (
			rid: SwapQuoteRequestId,
			prov?: string,
			strat?: ProtocolStrategy,
		) => {
			if (prov) return fetchSwapQuoteForProvider(rid, prov as Parameters<typeof fetchSwapQuoteForProvider>[1])
			return fetchSwapQuotes(rid, strat ? { strategy: strat } : undefined)
		},
	)
	const QUOTE_POLL_MS = 10_000
	$effect(() => {
		if (!requestId) return
		error = undefined
		void fetchQuotesOnce(requestId, provider, strategy).catch((e) => {
			error = e instanceof Error ? e.message : String(e)
		})
		const id = setInterval(() => {
			error = undefined
			void fetchQuotesOnce(requestId, provider, strategy).catch((e) => {
				error = e instanceof Error ? e.message : String(e)
			})
		}, QUOTE_POLL_MS)
		return () => clearInterval(id)
	})
</script>

{#if params && swapperAccount}
	<div data-column>
		{#if error}
			<p data-muted>{error}</p>
		{/if}

		{#if provider && itemForProvider}
			<div data-row="center">
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
		{:else if !provider && itemsForRequest.length > 0}
			<ul data-column>
				{#each itemsForRequest as item}
					<li data-row="center">
						<span>{item.provider}</span>
						{#if item.success}
							<span>
								{item.simulatedOutputAmount?.toString() ?? '—'} out
							</span>

							{#if item.mismatchFlag}
								<span data-muted title="Quote vs simulation mismatch">
									⚠ {item.mismatchBps != null ? `${item.mismatchBps} bps` : ''}
								</span>
							{/if}
						{:else}
							<span data-muted>{item.error ?? 'Failed'}</span>
						{/if}
					</li>
				{/each}
			</ul>
		{:else if requestKey}
			<p data-muted>Quotes refresh every 10s.</p>
		{/if}
	</div>
{/if}
