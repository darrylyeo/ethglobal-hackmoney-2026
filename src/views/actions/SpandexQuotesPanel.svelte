<script lang="ts">
	// Types/constants
	import type { ActionParams } from '$/constants/actions.ts'
	import { ActionType } from '$/constants/actions.ts'
	import {
		fetchSpandexQuotes,
		getRequestKeyForParams,
		spandexQuoteItemsCollection,
	} from '$/collections/SpandexQuoteItems.ts'
	import type { SpandexQuoteRequestId } from '$/data/SpandexQuoteItem.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'

	// Props
	let {
		params,
		swapperAccount,
	}: {
		params: ActionParams<ActionType.Swap> | null
		swapperAccount: `0x${string}` | null
	} = $props()

	// State
	let fetching = $state(false)
	let error = $state<string | null>(null)

	// (Derived)
	const swapParams = $derived(
		params &&
		'chainId' in params &&
		'tokenIn' in params &&
		'tokenOut' in params &&
		'amount' in params &&
		'slippage' in params &&
		params.amount > 0n
			? (params as ActionParams<ActionType.Swap>)
			: null,
	)
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
	const itemsForRequest = $derived(
		requestKey && quotesQuery.data
			? quotesQuery.data
					.filter((r) => r.row.$id.requestId === requestKey)
					.map((r) => r.row)
					.sort((a, b) =>
						(a.simulatedOutputAmount ?? 0n) > (b.simulatedOutputAmount ?? 0n)
							? -1
							: 1,
					)
			: [],
	)
	const canFetch = $derived(
		Boolean(swapParams && swapperAccount && !fetching && swapParams.amount > 0n),
	)

	// Actions
	const onFetch = async () => {
		if (!requestId) return
		fetching = true
		error = null
		try {
			await fetchSpandexQuotes(requestId)
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
		} finally {
			fetching = false
		}
	}
</script>

{#if params && swapperAccount}
	<section data-card data-column>
		<h3>spanDEX quotes</h3>
		<button
			type="button"
			disabled={!canFetch}
			onclick={onFetch}
		>
			{fetching ? 'Fetching…' : 'Fetch quotes'}
		</button>
		{#if error}
			<p data-muted>{error}</p>
		{/if}
		{#if itemsForRequest.length > 0}
			<ul data-column>
				{#each itemsForRequest as item}
					<li data-row="center gap-2">
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
		{:else if requestKey && !fetching}
			<p data-muted>Click “Fetch quotes” to compare providers.</p>
		{/if}
	</section>
{/if}
