/** 4-byte Evm function selector + resolved Evm function signatures. */
export type EvmSelector$Id = {
	hex: `0x${string}`
}

export type EvmSelector = {
	$id: EvmSelector$Id
	signatures: string[]
}
