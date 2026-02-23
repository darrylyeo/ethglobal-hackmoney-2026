/**
 * OP Mainnet (chain 10) forks.
 */

import type { ForkEntry } from '$/constants/forks/types.ts'
import { ExecutionProtocol, ForkScheduleKind } from '$/constants/forks/types.ts'

export enum ForkId {
	Bedrock = 'Bedrock',
	Canyon = 'Canyon',
	Delta = 'Delta',
	Ecotone = 'Ecotone',
	Fjord = 'Fjord',
	Granite = 'Granite',
	Holocene = 'Holocene',
	Isthmus = 'Isthmus',
	Jovian = 'Jovian',
}

export const forks: readonly ForkEntry<ForkId>[] = [
	{
		forkId: ForkId.Bedrock,
		activation: { timestamp: 1_686_079_703 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.Canyon,
		activation: { timestamp: 1_704_992_401 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.Delta,
		activation: { timestamp: 1_708_560_000 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.Ecotone,
		activation: { timestamp: 1_710_374_401 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.Fjord,
		activation: { timestamp: 1_720_627_201 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.Granite,
		activation: { timestamp: 1_726_070_401 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.Holocene,
		activation: { timestamp: 1_736_445_601 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.Isthmus,
		activation: { timestamp: 1_746_806_401 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.Jovian,
		activation: { timestamp: 1_764_691_201 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
] as const satisfies readonly ForkEntry<ForkId>[]
