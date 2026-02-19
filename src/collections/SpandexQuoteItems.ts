/**
 * Per-provider spandex quotes cache. Normalizes getQuotes() results and flags
 * quote vs simulation mismatches.
 */

import { getQuotes, sortQuotesByPerformance } from '@spandex/core'
import type { ProviderKey, SimulatedQuote, SuccessfulSimulatedQuote } from '@spandex/core'
import { ProtocolStrategy } from '$/constants/protocols.ts'
import { spandexQuoteMetricByStrategy } from '$/constants/spandex-quote-strategies.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type {
	SpandexQuoteItem,
	SpandexQuoteRequestId,
} from '$/data/SpandexQuoteItem.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify } from 'devalue'
import { normalizeAddress } from '$/lib/address.ts'
import { getSpandexQuoteForProvider, spandexConfig } from '$/api/spandex.ts'
import type { FetchSwapQuoteParams } from '$/data/SwapQuote.ts'

export type SpandexQuoteItemRow = SpandexQuoteItem & { $source: DataSource }

const MISMATCH_THRESHOLD_BPS = 50

export const getRequestKeyForParams = (
	params: FetchSwapQuoteParams,
	swapperAccount: `0x${string}`,
): string =>
	requestIdString({
		chainId: params.chainId,
		inputToken: params.tokenIn,
		outputToken: params.tokenOut,
		amountIn: params.amountIn,
		slippageBps: Math.round(params.slippage * 10_000),
		swapperAccount,
	})

function requestIdString(r: SpandexQuoteRequestId): string {
	return stringify({
		chainId: r.chainId,
		inputToken: normalizeAddress(r.inputToken) ?? r.inputToken,
		outputToken: normalizeAddress(r.outputToken) ?? r.outputToken,
		amountIn: r.amountIn.toString(),
		slippageBps: r.slippageBps,
		swapperAccount: normalizeAddress(r.swapperAccount) ?? r.swapperAccount,
	})
}

function mismatchBps(quoted: bigint, simulated: bigint): number | null {
	if (quoted === 0n) return null
	const diff =
		simulated >= quoted
			? Number(simulated - quoted)
			: -Number(quoted - simulated)
	return Math.round((Number(diff) / Number(quoted)) * 10_000)
}

function normalizedItem(
	requestId: SpandexQuoteRequestId,
	quote: SimulatedQuote,
	fetchedAt: number,
): SpandexQuoteItem {
	const reqKey = requestIdString(requestId)
	const provider = quote.provider
	const success = quote.success
	let quotedOutputAmount = 0n
	let simulatedOutputAmount: bigint | null = null
	let gasUsed: bigint | null = null
	let mismatchBpsVal: number | null = null
	let error: string | null = null

	let transactionRequest: SpandexQuoteItem['transactionRequest'] = undefined
	if (success) {
		const q = quote as SuccessfulSimulatedQuote
		quotedOutputAmount = q.outputAmount
		simulatedOutputAmount = q.simulation.outputAmount
		gasUsed = q.simulation.gasUsed ?? null
		const bps = mismatchBps(quotedOutputAmount, q.simulation.outputAmount)
		mismatchBpsVal = bps
		const tx = q.txData
		if (tx?.to && tx?.data) {
			transactionRequest = {
				to: tx.to as `0x${string}`,
				data: tx.data,
				value: tx.value != null ? String(tx.value) : '0',
				chainId: requestId.chainId,
				...(gasUsed != null ? { gasLimit: String(gasUsed) } : {}),
			}
		}
	} else {
		quotedOutputAmount = 'outputAmount' in quote ? quote.outputAmount : 0n
		error = quote.simulation.error?.message ?? null
	}

	const mismatchFlag =
		mismatchBpsVal !== null && Math.abs(mismatchBpsVal) > MISMATCH_THRESHOLD_BPS

	return {
		$id: { requestId: reqKey, provider },
		requestId,
		provider,
		success,
		quotedOutputAmount,
		simulatedOutputAmount,
		gasUsed,
		mismatchBps: mismatchBpsVal,
		mismatchFlag,
		error,
		fetchedAt,
		transactionRequest,
	}
}

export const spandexQuoteItemsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.SpandexQuoteItems,
		getKey: (row: SpandexQuoteItemRow) => stringify(row.$id),
	}),
)

export type FetchSpandexQuotesParams = SpandexQuoteRequestId

/** Fetch quote for a single provider, normalize, upsert to collection, return item or null. */
export const fetchSpandexQuoteForProvider = async (
	params: FetchSpandexQuotesParams,
	provider: ProviderKey,
): Promise<SpandexQuoteItem | null> => {
	const swap = {
		chainId: params.chainId,
		inputToken: params.inputToken,
		outputToken: params.outputToken,
		mode: 'exactIn' as const,
		inputAmount: params.amountIn,
		slippageBps: params.slippageBps,
		swapperAccount: params.swapperAccount,
	}
	const quote = await getSpandexQuoteForProvider(swap, provider)
	if (!quote) return null
	const fetchedAt = Date.now()
	const row: SpandexQuoteItemRow = {
		...normalizedItem(params, quote, fetchedAt),
		$source: DataSource.Spandex,
	}
	const key = stringify(row.$id)
	const existing = spandexQuoteItemsCollection.state.get(key)
	if (existing) {
		spandexQuoteItemsCollection.update(key, (draft) => {
			Object.assign(draft, row)
		})
	} else {
		spandexQuoteItemsCollection.insert(row)
	}
	return row
}

/** Fetch quotes from all providers, normalize, upsert to collection, return items. Optional strategy sorts successful quotes by that metric (best price, fastest, lowest gas). */
export const fetchSpandexQuotes = async (
	params: FetchSpandexQuotesParams,
	options?: { strategy?: ProtocolStrategy },
): Promise<SpandexQuoteItem[]> => {
	const swap = {
		chainId: params.chainId,
		inputToken: params.inputToken,
		outputToken: params.outputToken,
		mode: 'exactIn' as const,
		inputAmount: params.amountIn,
		slippageBps: params.slippageBps,
		swapperAccount: params.swapperAccount,
	}
	const quotes = await getQuotes({ config: spandexConfig, swap })
	const fetchedAt = Date.now()
	const reqKey = requestIdString(params)
	const successful = quotes.filter(
		(q): q is SuccessfulSimulatedQuote =>
			q.success && 'simulation' in q && (q as SuccessfulSimulatedQuote).simulation.success,
	)
	const failed = quotes.filter(
		(q) => !q.success || !(q as SuccessfulSimulatedQuote).simulation?.success,
	)
	const orderedQuotes: SimulatedQuote[] =
		options?.strategy && options.strategy !== ProtocolStrategy.Priority && successful.length > 0
			? [
					...sortQuotesByPerformance({
						quotes: successful,
						...spandexQuoteMetricByStrategy[options.strategy],
					}),
					...failed,
				]
			: [...successful, ...failed]
	const rows: SpandexQuoteItemRow[] = orderedQuotes.map((q) => ({
		...normalizedItem(params, q, fetchedAt),
		$source: DataSource.Spandex,
	}))

	const existingKeys = new Set(
		[...spandexQuoteItemsCollection.state]
			.filter(
				([_, row]) =>
					row.$source === DataSource.Spandex &&
					requestIdString(row.requestId) === reqKey,
			)
			.map(([k]) => k),
	)
	for (const key of existingKeys) {
		if (!rows.some((r) => stringify(r.$id) === key))
			spandexQuoteItemsCollection.delete(key)
	}
	for (const row of rows) {
		const key = stringify(row.$id)
		const existing = spandexQuoteItemsCollection.state.get(key)
		if (existing) {
			spandexQuoteItemsCollection.update(key, (draft) => {
				Object.assign(draft, row)
			})
		} else {
			spandexQuoteItemsCollection.insert(row)
		}
	}
	return rows
}
