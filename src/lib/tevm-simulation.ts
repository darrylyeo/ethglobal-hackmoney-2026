/**
 * Client-side helper to run Tevm simulation via /api/simulate and return
 * result plus session summary for persisting on TransactionSession.simulation.
 */

import type { TransactionSessionSimulationSummary } from '$/data/TransactionSession'
import type { TevmSimulationResult } from '$/data/TevmSimulationResult'

export type TevmSimulationPayload = {
	rpcUrl: string
	chainId: number
	from: `0x${string}`
	to?: `0x${string}`
	data?: `0x${string}`
	value?: string
	gasLimit?: string
	blockTag?: number | 'latest'
}

export const runTevmSimulationFromClient = async (
	payload: TevmSimulationPayload,
): Promise<{ result: TevmSimulationResult; summary: TransactionSessionSimulationSummary }> => {
	const res = await fetch('/api/simulate', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			rpcUrl: payload.rpcUrl,
			chainId: payload.chainId,
			from: payload.from,
			to: payload.to,
			data: payload.data,
			value: payload.value,
			gasLimit: payload.gasLimit,
			blockTag: payload.blockTag,
		}),
	})
	if (!res.ok) {
		const err = await res.json().catch(() => ({}))
		throw new Error(err?.error ?? res.statusText)
	}
	const result = (await res.json()) as TevmSimulationResult
	const summary: TransactionSessionSimulationSummary = {
		forkMetadata: result.forkMetadata,
		summaryStatus: result.summaryStatus,
		gasTotals: result.gasTotals,
	}
	return { result, summary }
}

export const extractSimulationSummary = (
	result: unknown,
): TransactionSessionSimulationSummary | undefined => {
	const r = result as TevmSimulationResult
	return r?.forkMetadata && r?.summaryStatus && r?.gasTotals
		? {
				forkMetadata: r.forkMetadata,
				summaryStatus: r.summaryStatus,
				gasTotals: r.gasTotals,
			}
		: undefined
}
