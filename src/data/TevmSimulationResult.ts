/**
 * Result of a Tevm-based transaction simulation.
 * Stored in TransactionSessionSimulation.result and optionally summarized on
 * TransactionSession.simulation.
 */

export type TevmSimulationForkMetadata = {
	blockNumber: number
	rpcUrl: string
	timestamp?: number
}

export type TevmSimulationSummaryStatus = 'success' | 'revert' | 'error'

export type TevmSimulationGasTotals = {
	used: string
	refund?: string
}

export type TevmSimulationTraceCall = {
	to: string
	data: string
	value: string
	gasUsed: string
	revert?: string
	selector?: string
	children?: TevmSimulationTraceCall[]
}

export type TevmSimulationDecodedEvent = {
	address: string
	topics: string[]
	data: string
	signature?: string
	args?: Record<string, unknown>
}

export type TevmSimulationResult = {
	forkMetadata: TevmSimulationForkMetadata
	summaryStatus: TevmSimulationSummaryStatus
	gasTotals: TevmSimulationGasTotals
	revertReason?: string
	errorSelector?: string
	trace?: TevmSimulationTraceCall[]
	events?: TevmSimulationDecodedEvent[]
	rawLogs?: { address: string; topics: string[]; data: string }[]
}
