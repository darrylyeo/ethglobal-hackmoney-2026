import type { ChainId } from '$/constants/networks.ts'
import type { Network } from '$/constants/networks.ts'

export type Network$Id = ChainId

export type NetworkEntry = Network & { $id: Network$Id }
