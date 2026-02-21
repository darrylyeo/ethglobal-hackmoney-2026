/**
 * EIP-8004 Identity Registry config per chain.
 * When no deployment exists, use empty array; list/detail will be empty.
 * Add { chainId, contractAddress } when a reference deployment is available.
 * https://eips.ethereum.org/EIPS/eip-8004
 */

import type { ChainId } from '$/constants/networks.ts'

export type Eip8004RegistryConfig = {
	chainId: ChainId
	contractAddress: `0x${string}`
}

export const EIP8004_REGISTRY_CONFIGS: Eip8004RegistryConfig[] = []
