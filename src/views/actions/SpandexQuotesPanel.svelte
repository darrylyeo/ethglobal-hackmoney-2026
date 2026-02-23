<script lang="ts">
	// Types/constants
	import type { ActionParams } from '$/constants/actions.ts'
	import { ActionType } from '$/constants/actions.ts'
	import {
		fetchSpandexQuoteForProvider,
		fetchSpandexQuotes,
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
		strategy = undefined,
		swapperAccount,
	}: {
		params: ActionParams<ActionType.Swap> | null
		provider?: string
		strategy?: ProtocolStrategy | undefined
		swapperAccount: `0x${string}` | null
	} = $props()

	// State
	let fetching = $state(false)
	let error = $state<string | undefined>(undefined)

	// (Derived)
	const swapParams = $derived(
		params &&
		'chainId' in params &&
		'tokenIn' in params &&
		'tokenOut' in params &&
		'amount' in params &&
		'slippage' in params &&
		(params as ActionParams<ActionType.Swap>).amount > 0n
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
	const itemForProvider = $derived(
		requestKey && quotesQuery.data && provider
			? quotesQuery.data.find(
					(r) => r.row.$id.requestId === requestKey && r.row.provider === provider,
				)?.row ?? null
			: null,
	)
	const itemsForRequest = $derived(
		requestKey && quotesQuery.data && !provider
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
	const providerLabel = $derived(
		provider ? (provider.charAt(0).toUpperCase() + provider.slice(1)) : '',
	)
	const strategyLabel = $derived(
		strategy ? labelByProtocolStrategy[strategy] : null,
	)

	// Actions
	const onFetch = async () => {
		if (!requestId) return
		fetching = true
		error = undefined
		try {
			if (provider) {
				await fetchSpandexQuoteForProvider(requestId, provider as ProviderKey)
			} else {
				await fetchSpandexQuotes(requestId, strategy ? { strategy } : undefined)
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
		} finally {
			fetching = false
		}
	}
</script>

{#if params && swapperAccount}
	<section data-card data-column>
		<h3>
			{provider ? `${providerLabel} quote` : 'spanDEX quotes'}
			{#if strategyLabel}
				<small data-text="muted">({strategyLabel})</small>
			{/if}
		</h3>
		<button
			type="button"
			disabled={!canFetch}
			onclick={onFetch}
		>
			{fetching ? 'Fetching…' : provider ? 'Fetch quote' : 'Fetch quotes'}
		</button>
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
		{:else if requestKey && !fetching}
			<p data-muted>Click “{provider ? 'Fetch quote' : 'Fetch quotes'}”{provider ? ` for ${providerLabel}` : ' to compare providers'}.</p>
		{/if}
	</section>
{/if}
