/**
 * Client-side helper to run Tevm simulation in-browser and return result plus
 * session summary for persisting on Session.simulation.
 */

import { runTevmSimulation } from '$/api/simulate.ts'
import type { SessionSimulationSummary } from '$/data/Session.ts'
import type { TevmSimulationResult } from '$/data/TevmSimulationResult.ts'

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
): Promise<{
	result: TevmSimulationResult
	summary: SessionSimulationSummary
}> => {
	const result = await runTevmSimulation({
		rpcUrl: payload.rpcUrl,
		chainId: payload.chainId,
		from: payload.from,
		to: payload.to,
		data: payload.data,
		value: payload.value,
		gasLimit: payload.gasLimit,
		blockTag: payload.blockTag,
	})
	const summary: SessionSimulationSummary = {
		forkMetadata: result.forkMetadata,
		summaryStatus: result.summaryStatus,
		gasTotals: result.gasTotals,
	}
	return { result, summary }
}

export const extractSimulationSummary = (
	result: unknown,
): SessionSimulationSummary | undefined => {
	const r = result as TevmSimulationResult
	return r?.forkMetadata && r?.summaryStatus && r?.gasTotals
		? {
				forkMetadata: r.forkMetadata,
				summaryStatus: r.summaryStatus,
				gasTotals: r.gasTotals,
			}
		: undefined
}
