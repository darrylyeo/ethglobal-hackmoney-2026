import type { EIP1193Provider } from '$/lib/wallet.ts'

export type Wallet$Id = {
	rdns: string
}

export type Wallet = {
	$id: Wallet$Id
	name: string
	icon: string
	rdns: string
	provider: EIP1193Provider
}
