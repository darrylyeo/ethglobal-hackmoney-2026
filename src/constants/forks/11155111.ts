/**
 * Ethereum Sepolia (chain 11155111) forks.
 */

import type { ForkEntry } from '$/constants/forks/types.ts'
import { ExecutionProtocol } from '$/constants/forks/types.ts'

export enum ForkId {
	Homestead = 'Homestead',
	EIP150 = 'EIP150',
	EIP155 = 'EIP155',
	EIP158 = 'EIP158',
	Byzantium = 'Byzantium',
	Constantinople = 'Constantinople',
	Petersburg = 'Petersburg',
	Istanbul = 'Istanbul',
	MuirGlacier = 'MuirGlacier',
	Berlin = 'Berlin',
	London = 'London',
	MergeNetsplit = 'MergeNetsplit',
	Shanghai = 'Shanghai',
	Cancun = 'Cancun',
}

export const forks: readonly ForkEntry<ForkId>[] = [
	{
		forkId: ForkId.Homestead,
		activation: { block: 0 },
		executionProtocol: ExecutionProtocol.Ethereum,
	},
	{
		forkId: ForkId.EIP150,
		activation: { block: 0 },
		executionProtocol: ExecutionProtocol.Ethereum,
	},
	{
		forkId: ForkId.EIP155,
		activation: { block: 0 },
		executionProtocol: ExecutionProtocol.Ethereum,
	},
	{
		forkId: ForkId.EIP158,
		activation: { block: 0 },
		executionProtocol: ExecutionProtocol.Ethereum,
	},
	{
		forkId: ForkId.Byzantium,
		activation: { block: 0 },
		executionProtocol: ExecutionProtocol.Ethereum,
	},
	{
		forkId: ForkId.Constantinople,
		activation: { block: 0 },
		executionProtocol: ExecutionProtocol.Ethereum,
	},
	{
		forkId: ForkId.Petersburg,
		activation: { block: 0 },
		executionProtocol: ExecutionProtocol.Ethereum,
	},
	{
		forkId: ForkId.Istanbul,
		activation: { block: 0 },
		executionProtocol: ExecutionProtocol.Ethereum,
	},
	{
		forkId: ForkId.MuirGlacier,
		activation: { block: 0 },
		executionProtocol: ExecutionProtocol.Ethereum,
	},
	{
		forkId: ForkId.Berlin,
		activation: { block: 0 },
		executionProtocol: ExecutionProtocol.Ethereum,
	},
	{
		forkId: ForkId.London,
		activation: { block: 0 },
		executionProtocol: ExecutionProtocol.Ethereum,
	},
	{
		forkId: ForkId.MergeNetsplit,
		activation: { block: 1_735_371 },
		executionProtocol: ExecutionProtocol.Ethereum,
	},
	{
		forkId: ForkId.Shanghai,
		activation: { timestamp: 1_677_557_088 },
		executionProtocol: ExecutionProtocol.Ethereum,
	},
	{
		forkId: ForkId.Cancun,
		activation: { timestamp: 1_706_655_072 },
		executionProtocol: ExecutionProtocol.Ethereum,
	},
] as const satisfies readonly ForkEntry<ForkId>[]
