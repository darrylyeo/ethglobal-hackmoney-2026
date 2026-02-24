/**
 * EVM precompile types. Per-chain entry has address + name; index adds $id when aggregating.
 */

export type Precompile$Id = {
	chainId: number
	address: `0x${string}`
}

export type Precompile = {
	$id: Precompile$Id
	name: string
}

/** Per-chain precompile entry (no $id). */
export type PrecompileEntry = {
	address: `0x${string}`
	name: string
}

export type ChainPrecompileSchedule = {
	chainId: number
	precompiles: PrecompileEntry[]
}
