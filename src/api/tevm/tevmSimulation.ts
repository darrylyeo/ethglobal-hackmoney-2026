/**
 * Client-side helper to run Tevm simulation in-browser and return result plus
 * session summary for persisting on Session.simulation.
 */

import { type } from 'arktype'
import { normalizeAddress } from '$/lib/address.ts'
import {
	runTevmSimulation,
	runTevmSimulationSequence,
	type SimulatePayload,
} from '$/api/simulate.ts'
import type { SessionSimulationSummary } from '$/data/Session.ts'
import {
	TevmSimulationSummaryStatus,
	type TevmSimulationResult,
} from '$/data/TevmSimulationResult.ts'

const simulatePayloadSchema = type({
	rpcUrl: type('string'),
	chainId: type('number.integer'),
	from: type('string'),
	to: type('string').optional(),
	data: type('string').optional(),
	value: type('string').optional(),
	gasLimit: type('string').optional(),
	blockTag: type('number.integer').or(type("'latest'")).optional(),
}).pipe((obj, ctx) => {
	if (normalizeAddress(obj.from) == null) return ctx.mustBe('from: valid address')
	if (obj.to != null && normalizeAddress(obj.to) == null) return ctx.mustBe('to: valid address')
	if (obj.data != null && !/^0x[0-9a-fA-F]*$/.test(obj.data)) return ctx.mustBe('data: hex string')
	return obj
})

export type TevmSimulationPayload = typeof simulatePayloadSchema.infer

function payloadToBody(p: TevmSimulationPayload): SimulatePayload {
	return {
		rpcUrl: p.rpcUrl,
		chainId: p.chainId,
		from: p.from,
		to: p.to,
		data: p.data,
		value: p.value,
		gasLimit: p.gasLimit,
		blockTag: p.blockTag,
	}
}

export const runTevmSimulationFromClient = async (
	payload: unknown,
): Promise<{
	result: TevmSimulationResult
	summary: SessionSimulationSummary
}> => {
	const valid = simulatePayloadSchema.assert(payload)
	const result = await runTevmSimulation(payloadToBody(valid))
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
	payloads: unknown[],
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
		const { result, summary } = await runTevmSimulationFromClient(payloads[0] as unknown)
		return { result, summary }
	}

	const validPayloads = payloads.map((p) => simulatePayloadSchema.assert(p))
	const first = validPayloads[0]
	const sameChain = validPayloads.every(
		(p) => p.rpcUrl === first.rpcUrl && p.chainId === first.chainId,
	)

	if (sameChain) {
		const steps = await runTevmSimulationSequence(
			validPayloads.map((p) => payloadToBody(p)),
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
		validPayloads.map((p) => runTevmSimulation(payloadToBody(p))),
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
