/**
 * Execution fork → opcodes first introduced. EIPs: 145 (SHL/SHR/SAR), 211 (RETURNDATA*), 214 (STATICCALL), 140 (REVERT), 210 (CLZ), 1052 (EXTCODEHASH), 1014 (CREATE2), 1344 (CHAINID), 1884 (SELFBALANCE), 3198 (BASEFEE), 3855 (PUSH0), 1153 (TLOAD/TSTORE), 5656 (MCOPY), 4844 (BLOBHASH), 7516 (BLOBBASEFEE).
 */

import { ForkId } from '$/constants/forks/1.ts'
import { EvmOpcode } from '$/constants/opcodes/types.ts'

/** Execution forks in activation order (mainnet). Used to compute cumulative opcode set. */
export const executionForkOrder: readonly string[] = [
	ForkId.Frontier,
	ForkId.FrontierThawing,
	ForkId.Homestead,
	ForkId.DAOFork,
	ForkId.EIP150,
	ForkId.EIP155,
	ForkId.EIP158,
	ForkId.Byzantium,
	ForkId.Constantinople,
	ForkId.Petersburg,
	ForkId.Istanbul,
	ForkId.MuirGlacier,
	ForkId.Berlin,
	ForkId.London,
	ForkId.ArrowGlacier,
	ForkId.GrayGlacier,
	ForkId.Paris,
	ForkId.Shanghai,
	ForkId.Cancun,
	ForkId.Prague,
	ForkId.Osaka,
]

/** Opcodes first introduced in each execution fork (ordered by fork). */
const executionForkOpcodesAddedList: readonly (readonly [string, readonly EvmOpcode[]])[] = [
	[ForkId.Byzantium, [EvmOpcode.SHL, EvmOpcode.SHR, EvmOpcode.SAR, EvmOpcode.RETURNDATASIZE, EvmOpcode.RETURNDATACOPY, EvmOpcode.STATICCALL, EvmOpcode.REVERT]],
	[ForkId.Constantinople, [EvmOpcode.CLZ, EvmOpcode.EXTCODEHASH, EvmOpcode.CREATE2]],
	[ForkId.Istanbul, [EvmOpcode.CHAINID, EvmOpcode.SELFBALANCE]],
	[ForkId.London, [EvmOpcode.BASEFEE]],
	[ForkId.Shanghai, [EvmOpcode.PUSH0]],
	[ForkId.Cancun, [EvmOpcode.TLOAD, EvmOpcode.TSTORE, EvmOpcode.MCOPY, EvmOpcode.BLOBHASH]],
	[ForkId.Prague, [EvmOpcode.BLOBBASEFEE]],
]

export const executionForkOpcodesAdded: Partial<Record<string, readonly EvmOpcode[]>> =
	Object.fromEntries(executionForkOpcodesAddedList)

const allAddedOpcodes = new Set(executionForkOpcodesAddedList.flatMap(([, added]) => added))

const frontierOpcodes = (Object.values(EvmOpcode) as EvmOpcode[]).filter(
	(op) => !allAddedOpcodes.has(op),
)

const forkOrderIndex = new Map(executionForkOrder.map((f, i) => [f, i]))

/** Cumulative opcodes available at the given execution fork (by fork name). */
export function getOpcodesForExecutionFork(executionForkName: string): EvmOpcode[] {
	const idx = forkOrderIndex.get(executionForkName) ?? -1
	if (idx < 0) return [...frontierOpcodes]
	const result = new Set<EvmOpcode>(frontierOpcodes)
	for (const [forkName, added] of executionForkOpcodesAddedList) {
		const addIdx = forkOrderIndex.get(forkName) ?? -1
		if (addIdx >= 0 && addIdx <= idx) for (const op of added) result.add(op)
	}
	return [...result]
}
