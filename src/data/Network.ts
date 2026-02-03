import type { Network } from '$/schema/constants/networks'

export type Network$Id = number

export type NetworkEntry = Network & { $id: Network$Id }
