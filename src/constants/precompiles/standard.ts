/**
 * Standard EVM precompiles (Frontier–Istanbul, Cancun point evaluation). Same on mainnet and typical L2s.
 * Sources: Yellow Paper, EIPs, evm.codes.
 */

import type { PrecompileEntry } from '$/constants/precompiles/types.ts'

export const standardPrecompiles: readonly PrecompileEntry[] = [
	{ address: '0x0000000000000000000000000000000000000001', name: 'ecrecover' },
	{ address: '0x0000000000000000000000000000000000000002', name: 'sha256' },
	{ address: '0x0000000000000000000000000000000000000003', name: 'ripemd160' },
	{ address: '0x0000000000000000000000000000000000000004', name: 'identity' },
	{ address: '0x0000000000000000000000000000000000000005', name: 'modexp' },
	{ address: '0x0000000000000000000000000000000000000006', name: 'ecAdd' },
	{ address: '0x0000000000000000000000000000000000000007', name: 'ecMul' },
	{ address: '0x0000000000000000000000000000000000000008', name: 'ecPairing' },
	{ address: '0x0000000000000000000000000000000000000009', name: 'blake2f' },
	{ address: '0x000000000000000000000000000000000000000a', name: 'pointEvaluation' },
]
