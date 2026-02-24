/**
 * EVM opcodes: enum, metadata, and fork→opcode mapping. Integrated with fork schedules for getOpcodesForEra (see lib/forks.ts).
 */

export { EvmOpcode } from '$/constants/opcodes/types.ts'
export type { OpcodeEntry } from '$/constants/opcodes/types.ts'
export { opcodeEntries } from '$/constants/opcodes/entries.ts'
export {
	executionForkOrder,
	executionForkOpcodesAdded,
	getOpcodesForExecutionFork,
} from '$/constants/opcodes/fork-opcodes.ts'
