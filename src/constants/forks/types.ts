/**
 * Fork types: enums (ForkScheduleKind, ExecutionProtocol, ConsensusProtocol),
 * Fork ($id + all fields), ForkEntry (per-chain input), Fork$Id, ChainForkSchedule.
 */

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
}

export type Fork$Id = {
	chainId: number
	forkId: string
}

export type ForkLinks = {
	ethereumOrg?: string
	executionSpecs?: string
	consensusSpecs?: string
	forkcast?: string
}

export type Fork = {
	$id: Fork$Id
	name: string
	activation: { block?: number; timestamp?: number; epoch?: number }
	forkHash?: string
	kind?: ForkScheduleKind
	executionProtocol?: ExecutionProtocol
	consensusProtocol?: ConsensusProtocol
	links?: ForkLinks
	eipNumbers?: number[]
}

/** Per-chain fork entry: forkId from chain's ForkId enum (value = display name). */
export type ForkEntry<T extends string = string> = Omit<Fork, '$id' | 'name'> & {
	forkId: T
}

export type ChainForkSchedule = {
	chainId: number
	forks: Fork[]
}

export type Schedules = {
	chains: Record<string, ChainForkSchedule>
}

export type ForkSchedulesManifest = {
	sources: Record<string, { ref: string; url: string }>
	lastSynced?: string
}
