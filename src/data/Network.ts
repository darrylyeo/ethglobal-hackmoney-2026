import type { ChainId } from '$/constants/networks'
import type { Network } from '$/constants/networks'

export type Network$Id = ChainId

export type NetworkEntry = Network & { $id: Network$Id }
