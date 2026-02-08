import type { ChainId } from '$/constants/networks.ts'
import type { Wallet$Id, Wallet } from './Wallet.ts'

export enum ConnectionStatus {
	Connecting = 'connecting',
	Connected = 'connected',
	Error = 'error',
}

/** Display enum for wallet connection status in the UI. */
export enum WalletConnectionStatus {
	Connecting = 'Connecting',
	Connected = 'Connected',
	Error = 'Error',
}

export const toWalletConnectionStatus = (status: ConnectionStatus): WalletConnectionStatus =>
	status === ConnectionStatus.Connecting
		? WalletConnectionStatus.Connecting
		: status === ConnectionStatus.Connected
			? WalletConnectionStatus.Connected
			: WalletConnectionStatus.Error

export enum WalletConnectionTransport {
	Eip1193 = 'eip1193',
	None = 'none',
}

export type WalletConnection$Id = {
	wallet$id: Wallet$Id,
}

export type WalletConnectionBase = {
	$id: WalletConnection$Id
	status: ConnectionStatus
	actors: `0x${string}`[]
	activeActor: `0x${string}` | null
	chainId: ChainId | null
	selected: boolean
	error: string | null
	connectedAt: number,
}

export type WalletConnectionEip1193 = WalletConnectionBase & {
	transport: WalletConnectionTransport.Eip1193,
}

export type WalletConnectionNone = WalletConnectionBase & {
	transport: WalletConnectionTransport.None,
}

export type ReadOnlyWallet = {
	$id: Wallet$Id
	name: string
	icon: string
	rdns: string,
}

export type ConnectedWallet =
	| { wallet: Wallet; connection: WalletConnectionEip1193 }
	| { wallet: ReadOnlyWallet; connection: WalletConnectionNone }
