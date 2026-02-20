import type { ChainId, Network } from '$/constants/networks.ts'

export type Network$Id = { chainId: ChainId }

export type NetworkEntry = Network & { $id: Network$Id }
