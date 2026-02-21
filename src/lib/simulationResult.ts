/**
 * Flatten simulation result (single or multi-step) into events, rawLogs, and trace for display.
 */

import type {
	TevmSimulationDecodedEvent,
	TevmSimulationResult,
	TevmSimulationTraceCall,
} from '$/data/TevmSimulationResult.ts'

function isTevmStep(value: unknown): value is TevmSimulationResult {
	return (
		typeof value === 'object' &&
		value !== null &&
		'events' in value &&
		'trace' in value
	)
}

export function flattenSimulationResult(result: unknown) {
	const steps: TevmSimulationResult[] =
		typeof result === 'object' &&
		result !== null &&
		'steps' in result &&
		Array.isArray((result as { steps: unknown }).steps)
			? ((result as { steps: TevmSimulationResult[] }).steps).filter(
					isTevmStep,
				)
			: isTevmStep(result)
				? [result]
				: []

	const events = steps.flatMap((s) => s.events ?? [])
	const rawLogs = steps.flatMap((s) => s.rawLogs ?? [])
	const trace = steps.flatMap((s) => s.trace ?? [])

	return { events, rawLogs, trace }
}
