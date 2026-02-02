/**
 * Yellow Network / Nitrolite: Custody, Clearnode, channel operations.
 * SDK lazy-loaded when available; stubs allow UI to render.
 */

import type { EIP1193Provider } from '$/lib/wallet'
import type { YellowChannelState } from '$/collections/yellow-channel-states'
import { CUSTODY_CONTRACT_ADDRESS, CLEARNODE_WS_URL } from '$/constants/yellow'

export type ClearnodeConnection = {
	close: () => void
	onMessage: (handler: (msg: unknown) => void) => void
	send: (msg: unknown) => void
}

const getYellowSdk = async (): Promise<unknown> => (
	// TODO: lazy-load @erc7824/nitrolite and expose typed helpers
	null
)

export const connectClearnode = async (params: {
	chainId: number
	signer: EIP1193Provider
	address: `0x${string}`
}): Promise<ClearnodeConnection> => {
	const sdk = await getYellowSdk()
	const wsUrl = CLEARNODE_WS_URL[params.chainId]
	if (sdk && wsUrl && typeof (sdk as { connect?: (p: typeof params) => Promise<ClearnodeConnection> }).connect === 'function') {
		return (sdk as { connect: (p: typeof params) => Promise<ClearnodeConnection> }).connect(params)
	}
	return {
		close: () => {},
		onMessage: () => {},
		send: () => {},
	}
}

export const depositToCustody = async (params: {
	provider: EIP1193Provider
	chainId: number
	amount: bigint
}): Promise<{ txHash: `0x${string}` }> => {
	if (!CUSTODY_CONTRACT_ADDRESS[params.chainId]) {
		throw new Error('Yellow Custody Contract not configured for this chain')
	}
	const sdk = await getYellowSdk()
	if (sdk && typeof (sdk as { depositToCustody?: (p: typeof params) => Promise<{ txHash: `0x${string}` }> }).depositToCustody === 'function') {
		return (sdk as { depositToCustody: (p: typeof params) => Promise<{ txHash: `0x${string}` }> }).depositToCustody(params)
	}
	throw new Error('Yellow SDK not loaded; deposit when configured')
}

export const withdrawFromCustody = async (params: {
	provider: EIP1193Provider
	chainId: number
	amount: bigint
}): Promise<{ txHash: `0x${string}` }> => {
	if (!CUSTODY_CONTRACT_ADDRESS[params.chainId]) {
		throw new Error('Yellow Custody Contract not configured for this chain')
	}
	const sdk = await getYellowSdk()
	if (sdk && typeof (sdk as { withdrawFromCustody?: (p: typeof params) => Promise<{ txHash: `0x${string}` }> }).withdrawFromCustody === 'function') {
		return (sdk as { withdrawFromCustody: (p: typeof params) => Promise<{ txHash: `0x${string}` }> }).withdrawFromCustody(params)
	}
	throw new Error('Yellow SDK not loaded; withdraw when configured')
}

export const getAvailableBalance = async (params: {
	chainId: number
	address: `0x${string}`
}): Promise<bigint> => {
	const sdk = await getYellowSdk()
	if (sdk && typeof (sdk as { getAvailableBalance?: (p: typeof params) => Promise<bigint> }).getAvailableBalance === 'function') {
		return (sdk as { getAvailableBalance: (p: typeof params) => Promise<bigint> }).getAvailableBalance(params)
	}
	return 0n
}

export const openChannel = async (params: {
	provider: EIP1193Provider
	chainId: number
	token: `0x${string}`
}): Promise<{ channelId: string }> => {
	const sdk = await getYellowSdk()
	if (sdk && typeof (sdk as { openChannel?: (p: typeof params) => Promise<{ channelId: string }> }).openChannel === 'function') {
		return (sdk as { openChannel: (p: typeof params) => Promise<{ channelId: string }> }).openChannel(params)
	}
	throw new Error('Yellow SDK not loaded; open channel when configured')
}

export const sendTransfer = async (params: {
	clearnodeConnection: ClearnodeConnection
	destination: `0x${string}`
	allocations: { asset: string; amount: string }[]
}): Promise<{ turnNum: number }> => {
	const sdk = await getYellowSdk()
	if (sdk && typeof (sdk as { sendTransfer?: (p: typeof params) => Promise<{ turnNum: number }> }).sendTransfer === 'function') {
		return (sdk as { sendTransfer: (p: typeof params) => Promise<{ turnNum: number }> }).sendTransfer(params)
	}
	throw new Error('Yellow SDK not loaded; send transfer when configured')
}

export const closeChannel = async (params: {
	provider: EIP1193Provider
	clearnodeConnection: ClearnodeConnection
	channelId: string
}): Promise<{ txHash: `0x${string}` }> => {
	const sdk = await getYellowSdk()
	if (sdk && typeof (sdk as { closeChannel?: (p: typeof params) => Promise<{ txHash: `0x${string}` }> }).closeChannel === 'function') {
		return (sdk as { closeChannel: (p: typeof params) => Promise<{ txHash: `0x${string}` }> }).closeChannel(params)
	}
	throw new Error('Yellow SDK not loaded; close channel when configured')
}

export const challengeChannel = async (params: {
	provider: EIP1193Provider
	channelId: string
	latestState: YellowChannelState
}): Promise<{ txHash: `0x${string}` }> => {
	const sdk = await getYellowSdk()
	if (sdk && typeof (sdk as { challengeChannel?: (p: typeof params) => Promise<{ txHash: `0x${string}` }> }).challengeChannel === 'function') {
		return (sdk as { challengeChannel: (p: typeof params) => Promise<{ txHash: `0x${string}` }> }).challengeChannel(params)
	}
	throw new Error('Yellow SDK not loaded; challenge channel when configured')
}
