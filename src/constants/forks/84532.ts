/**
 * Base Sepolia (chain 84532) forks.
 */

import type { ForkEntry } from '$/constants/forks/types.ts'
import { ExecutionProtocol, ForkScheduleKind } from '$/constants/forks/types.ts'

export enum ForkId {
	Canyon = 'Canyon',
	Delta = 'Delta',
	Ecotone = 'Ecotone',
	Fjord = 'Fjord',
	Granite = 'Granite',
	Holocene = 'Holocene',
	PectraBlobSchedule = 'Pectra Blob Schedule',
	Isthmus = 'Isthmus',
	Jovian = 'Jovian',
}

export const forks: readonly ForkEntry<ForkId>[] = [
	{
		forkId: ForkId.Canyon,
		activation: { timestamp: 1_699_981_200 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.Delta,
		activation: { timestamp: 1_703_203_200 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.Ecotone,
		activation: { timestamp: 1_708_534_800 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.Fjord,
		activation: { timestamp: 1_716_998_400 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.Granite,
		activation: { timestamp: 1_723_478_400 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.Holocene,
		activation: { timestamp: 1_732_633_200 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.PectraBlobSchedule,
		activation: { timestamp: 1_742_486_400 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.Isthmus,
		activation: { timestamp: 1_744_905_600 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
	{
		forkId: ForkId.Jovian,
		activation: { timestamp: 1_763_568_001 },
		kind: ForkScheduleKind.Execution,
		executionProtocol: ExecutionProtocol.OpStack,
	},
] as const satisfies readonly ForkEntry<ForkId>[]
