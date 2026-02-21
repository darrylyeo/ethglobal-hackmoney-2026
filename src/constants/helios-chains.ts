/**
 * Helios light client supported chains. Helios verifies execution + consensus;
 * supports Ethereum, OP Stack, and Linea. Execution RPC must support eth_getProof.
 * Ref: spec 097, @a16z/helios (network/kind for createHeliosProvider).
 */

import { ChainId } from '$/constants/chain-id.ts'

export enum HeliosNetworkKind {
	Ethereum = 'ethereum',
	Opstack = 'opstack',
	Linea = 'linea',
}

/** Beacon network for consensus endpoint lookup; maps from Helios chain network strings. */
export enum HeliosBeaconNetwork {
	Mainnet = 'mainnet',
	Sepolia = 'sepolia',
	Holesky = 'holesky',
	Hoodi = 'hoodi',
}

export type HeliosChainInfo = {
	network: string
	kind: HeliosNetworkKind
}

export const HELIOS_CHAINS: Partial<Record<ChainId, HeliosChainInfo>> = {
	[ChainId.Ethereum]: { network: 'mainnet', kind: HeliosNetworkKind.Ethereum },
	[ChainId.EthereumSepolia]: { network: 'sepolia', kind: HeliosNetworkKind.Ethereum },
	[ChainId.Optimism]: { network: 'op-mainnet', kind: HeliosNetworkKind.Opstack },
	[ChainId.OPSepolia]: { network: 'op-sepolia', kind: HeliosNetworkKind.Opstack },
	[ChainId.Base]: { network: 'base', kind: HeliosNetworkKind.Opstack },
	[ChainId.BaseSepolia]: { network: 'base-sepolia', kind: HeliosNetworkKind.Opstack },
	[ChainId.WorldChain]: { network: 'worldchain', kind: HeliosNetworkKind.Opstack },
	[ChainId.WorldChainSepolia]: { network: 'worldchain-sepolia', kind: HeliosNetworkKind.Opstack },
	[ChainId.Unichain]: { network: 'unichain', kind: HeliosNetworkKind.Opstack },
	[ChainId.UnichainSepolia]: { network: 'unichain-sepolia', kind: HeliosNetworkKind.Opstack },
	[ChainId.Linea]: { network: 'linea', kind: HeliosNetworkKind.Linea },
	[ChainId.LineaSepolia]: { network: 'linea-sepolia', kind: HeliosNetworkKind.Linea },
}

export const HELIOS_SUPPORTED_CHAIN_IDS: readonly ChainId[] = (
	Object.keys(HELIOS_CHAINS).map(Number) as ChainId[]
)
