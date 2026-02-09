/**
 * Client-side helper to run Tevm simulation in-browser and return result plus
 * session summary for persisting on Session.simulation.
 */

import {
	runTevmSimulation,
	runTevmSimulationSequence,
} from '$/api/simulate.ts'
import type { SessionSimulationSummary } from '$/data/Session.ts'
import {
	TevmSimulationSummaryStatus,
	type TevmSimulationResult,
} from '$/data/TevmSimulationResult.ts'

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

const payloadToBody = (p: TevmSimulationPayload) => ({
	rpcUrl: p.rpcUrl,
	chainId: p.chainId,
	from: p.from,
	to: p.to,
	data: p.data,
	value: p.value,
	gasLimit: p.gasLimit,
})

export const runTevmSimulationFromClient = async (
	payload: TevmSimulationPayload,
): Promise<{
	result: TevmSimulationResult
	summary: SessionSimulationSummary
}> => {
	const result = await runTevmSimulation(payloadToBody(payload))
	const summary: SessionSimulationSummary = {
		forkMetadata: result.forkMetadata,
		summaryStatus: result.summaryStatus,
		gasTotals: result.gasTotals,
	}
	return { result, summary }
}

export type SimulationRunResult =
	| { steps: TevmSimulationResult[] }
	| TevmSimulationResult

/** Run all payloads; same-chain payloads run in sequence on one fork for accurate state. Returns single result or multi-step result. */
export const runTevmSimulationFromClientBatch = async (
	payloads: TevmSimulationPayload[],
): Promise<{ result: SimulationRunResult; summary: SessionSimulationSummary }> => {
	if (payloads.length === 0) {
		return {
			result: { steps: [] },
			summary: {
				forkMetadata: { blockNumber: 0, rpcUrl: '', timestamp: Date.now() },
				summaryStatus: TevmSimulationSummaryStatus.Success,
				gasTotals: { used: '0' },
			},
		}
	}
	if (payloads.length === 1) {
		const { result, summary } = await runTevmSimulationFromClient(payloads[0])
		return { result, summary }
	}

	const first = payloads[0]
	const sameChain = payloads.every(
		(p) => p.rpcUrl === first.rpcUrl && p.chainId === first.chainId,
	)

	if (sameChain) {
		const steps = await runTevmSimulationSequence(
			payloads.map((p) => payloadToBody(p)),
		)
		const failed = steps.find((s) => s.summaryStatus !== TevmSimulationSummaryStatus.Success)
		const summary: SessionSimulationSummary = {
			forkMetadata: steps[0]?.forkMetadata ?? { blockNumber: 0, rpcUrl: first.rpcUrl, timestamp: Date.now() },
			summaryStatus: failed?.summaryStatus ?? TevmSimulationSummaryStatus.Success,
			gasTotals: {
				used: steps.reduce((sum, s) => sum + BigInt(s.gasTotals.used), 0n).toString(),
				refund: steps.some((s) => s.gasTotals.refund)
					? steps.reduce((sum, s) => sum + BigInt(s.gasTotals.refund ?? 0), 0n).toString()
					: undefined,
			},
		}
		return { result: { steps }, summary }
	}

	const results = await Promise.all(
		payloads.map((p) => runTevmSimulation(payloadToBody(p))),
	)
	const steps = results
	const failed = steps.find((s) => s.summaryStatus !== TevmSimulationSummaryStatus.Success)
	const summary: SessionSimulationSummary = {
		forkMetadata: steps[0]?.forkMetadata ?? { blockNumber: 0, rpcUrl: '', timestamp: Date.now() },
		summaryStatus: failed?.summaryStatus ?? TevmSimulationSummaryStatus.Success,
		gasTotals: {
			used: steps.reduce((sum, s) => sum + BigInt(s.gasTotals.used), 0n).toString(),
			refund: steps.some((s) => s.gasTotals.refund)
				? steps.reduce((sum, s) => sum + BigInt(s.gasTotals.refund ?? 0), 0n).toString()
				: undefined,
		},
	}
	return { result: { steps }, summary }
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
