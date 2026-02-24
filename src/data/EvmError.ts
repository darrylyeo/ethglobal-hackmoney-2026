/** 4-byte Evm error selector + resolved Evm error signatures. */
export type EvmError$Id = {
	hex: `0x${string}`
}

export type EvmError = {
	$id: EvmError$Id
	signatures: string[]
}
