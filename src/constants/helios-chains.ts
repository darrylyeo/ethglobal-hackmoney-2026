/**
 * Helios light client supported chains. Helios verifies execution + consensus;
 * supports Ethereum, OP Stack, and Linea. Execution RPC must support eth_getProof.
 * Ref: spec 097, @a16z/helios (network/kind for createHeliosProvider).
 */

import { ChainId } from '$/constants/chain-id.ts'

export type HeliosNetworkKind = 'ethereum' | 'opstack' | 'linea'

export type HeliosChainInfo = {
	network: string
	kind: HeliosNetworkKind
}

export const HELIOS_CHAINS: Partial<Record<ChainId, HeliosChainInfo>> = {
	[ChainId.Ethereum]: { network: 'mainnet', kind: 'ethereum' },
	[ChainId.EthereumSepolia]: { network: 'sepolia', kind: 'ethereum' },
	[ChainId.Optimism]: { network: 'op-mainnet', kind: 'opstack' },
	[ChainId.OPSepolia]: { network: 'op-sepolia', kind: 'opstack' },
	[ChainId.Base]: { network: 'base', kind: 'opstack' },
	[ChainId.BaseSepolia]: { network: 'base-sepolia', kind: 'opstack' },
	[ChainId.WorldChain]: { network: 'worldchain', kind: 'opstack' },
	[ChainId.WorldChainSepolia]: { network: 'worldchain-sepolia', kind: 'opstack' },
	[ChainId.Unichain]: { network: 'unichain', kind: 'opstack' },
	[ChainId.UnichainSepolia]: { network: 'unichain-sepolia', kind: 'opstack' },
	[ChainId.Linea]: { network: 'linea', kind: 'linea' },
	[ChainId.LineaSepolia]: { network: 'linea-sepolia', kind: 'linea' },
}

export const HELIOS_SUPPORTED_CHAIN_IDS: readonly ChainId[] = (
	Object.keys(HELIOS_CHAINS).map(Number) as ChainId[]
)
