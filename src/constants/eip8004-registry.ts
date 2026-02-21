import type { Contract$Id } from '$/data/Contract.ts'
import { ChainId } from '$/constants/networks.ts'

export type Eip8004RegistryConfig = {
	label: string
	contract: Contract$Id
}

export const eip8004RegistryConfigs = [
	{
		label: 'Base',
		contract: {
			$network: { chainId: ChainId.Base },
			address: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
		},
	},
	{
		label: 'Base Sepolia',
		contract: {
			$network: { chainId: ChainId.BaseSepolia },
			address: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
		},
	},
] as const satisfies readonly Eip8004RegistryConfig[]
