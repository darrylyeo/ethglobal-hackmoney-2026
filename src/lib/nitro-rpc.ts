/**
 * Nitro RPC: compact message encoding/decoding and channel state signing.
 */

import type { YellowChannelState } from '$/collections/yellow-channel-states'

export type NitroRpcMessage = [number, string, Record<string, unknown>, number]

export const encodeNitroRpc = (
	requestId: number,
	method: string,
	params: Record<string, unknown>,
): string => (
	JSON.stringify([requestId, method, params, Date.now()])
)

export const decodeNitroRpc = (message: string): NitroRpcMessage => (
	JSON.parse(message) as NitroRpcMessage
)

export const hashChannelState = (params: {
	channelId: string
	turnNum: number
	balance0: bigint
	balance1: bigint
	appData: string
}): string => (
	[
		params.channelId,
		params.turnNum,
		params.balance0.toString(),
		params.balance1.toString(),
		params.appData,
	].join('|')
)

export const signChannelState = async (params: {
	provider: { request: (args: { method: string; params: unknown[] }) => Promise<unknown> }
	address: `0x${string}`
	channelId: string
	turnNum: number
	balance0: bigint
	balance1: bigint
	appData: string
}): Promise<`0x${string}`> => {
	const stateHash = hashChannelState({
		channelId: params.channelId,
		turnNum: params.turnNum,
		balance0: params.balance0,
		balance1: params.balance1,
		appData: params.appData,
	})
	const hex = await params.provider.request({
		method: 'personal_sign',
		params: [stateHash, params.address],
	})
	return hex as `0x${string}`
}

export const verifyStateSignature = async (_params: {
	state: YellowChannelState
	signature: `0x${string}`
	expectedSigner: `0x${string}`
}): Promise<boolean> => {
	// Stub: real implementation would recover signer from signature and compare
	return false
}
