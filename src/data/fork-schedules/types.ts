export type ForkActivation = {
	name: string
	activation: { block?: number; timestamp?: number; epoch?: number }
	forkHash?: string
	kind?: 'execution' | 'consensus' | 'blob'
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
