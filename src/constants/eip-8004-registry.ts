import type { Contract$Id } from '$/data/Contract.ts'
import { ChainId } from '$/constants/networks.ts'

export type Eip8004RegistryConfig = {
	label: string
	contract: Contract$Id
}

/** Canonical EIP-8004 Identity Registry (CREATE2 same address on many chains). */
const EIP8004_IDENTITY_REGISTRY_MAINNET = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as const

export const eip8004RegistryConfigs = [
	{
		label: 'Ethereum',
		contract: {
			$network: { chainId: ChainId.Ethereum },
			address: EIP8004_IDENTITY_REGISTRY_MAINNET,
		},
	},
	{
		label: 'Base',
		contract: {
			$network: { chainId: ChainId.Base },
			address: EIP8004_IDENTITY_REGISTRY_MAINNET,
		},
	},
	{
		label: 'Arbitrum',
		contract: {
			$network: { chainId: ChainId.Arbitrum },
			address: EIP8004_IDENTITY_REGISTRY_MAINNET,
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
