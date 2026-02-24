/** 32-byte Evm event topic hash + resolved Evm event signatures. */
export type EvmTopic$Id = {
	hex: `0x${string}`
}

export type EvmTopic = {
	$id: EvmTopic$Id
	signatures: string[]
}
