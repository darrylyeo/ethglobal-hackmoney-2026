/**
 * Per-provider spandex quotes cache. Normalizes getQuotes() results and flags
 * quote vs simulation mismatches.
 */

import { getQuotes } from '@spandex/core'
import type { SimulatedQuote, SuccessfulSimulatedQuote } from '@spandex/core'
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
import { spandexConfig } from '$/api/spandex.ts'
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
		inputToken: r.inputToken.toLowerCase(),
		outputToken: r.outputToken.toLowerCase(),
		amountIn: r.amountIn.toString(),
		slippageBps: r.slippageBps,
		swapperAccount: r.swapperAccount.toLowerCase(),
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

	if (success) {
		const q = quote as SuccessfulSimulatedQuote
		quotedOutputAmount = q.outputAmount
		simulatedOutputAmount = q.simulation.outputAmount
		gasUsed = q.simulation.gasUsed ?? null
		const bps = mismatchBps(quotedOutputAmount, q.simulation.outputAmount)
		mismatchBpsVal = bps
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
	}
}

export const spandexQuoteItemsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.SpandexQuoteItems,
		getKey: (row: SpandexQuoteItemRow) => stringify(row.$id),
	}),
)

export type FetchSpandexQuotesParams = SpandexQuoteRequestId

/** Fetch quotes from all providers, normalize, upsert to collection, return items. Best quote is highest simulatedOutputAmount among successful. */
export const fetchSpandexQuotes = async (
	params: FetchSpandexQuotesParams,
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
	const rows: SpandexQuoteItemRow[] = quotes.map((q) => ({
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
