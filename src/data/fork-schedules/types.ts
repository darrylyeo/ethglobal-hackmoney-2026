export enum ForkScheduleKind {
	Execution = 'execution',
	Consensus = 'consensus',
	Blob = 'blob',
}

export enum ExecutionProtocol {
	Ethereum = 'Ethereum',
	OpStack = 'OpStack',
	PolygonBor = 'PolygonBor',
	ArbitrumNitro = 'ArbitrumNitro',
	Other = 'Other',
}

export enum ConsensusProtocol {
	EthereumBeacon = 'EthereumBeacon',
	None = 'None',
}

export type ForkActivation = {
	name: string
	activation: { block?: number; timestamp?: number; epoch?: number }
	forkHash?: string
	kind?: ForkScheduleKind
	executionProtocol?: ExecutionProtocol
	consensusProtocol?: ConsensusProtocol
}

export type ChainForkSchedule = {
	chainId: number
	forks: ForkActivation[]
}

export type Schedules = {
	chains: Record<string, ChainForkSchedule>
}

export type ForkSchedulesManifest = {
	sources: Record<string, { ref: string; url: string }>
	lastSynced?: string
}

export type EraAtBlock = {
	eraId: string
	label: string
	startBlock?: number
	endBlock?: number
}
