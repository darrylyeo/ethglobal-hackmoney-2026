/**
 * Nitro RPC: compact message encoding/decoding and channel state signing.
 */

import type {
	YellowChannelAllocation,
	YellowChannelState,
} from '$/collections/yellow-channel-states'

export type NitroRpcPayload = [number, string, Record<string, unknown>, number]
export type NitroRpcMessage = NitroRpcPayload

export type NitroRpcEnvelope = {
	req?: NitroRpcPayload
	res?: NitroRpcPayload
	sig?: `0x${string}`[]
}

export const encodeNitroRpc = (
	requestId: number,
	method: string,
	params: Record<string, unknown>,
	timestamp = Date.now(),
	signatures: `0x${string}`[] = [],
): string =>
	JSON.stringify({
		req: [requestId, method, params, timestamp],
		...(signatures.length ? { sig: signatures } : {}),
	})

export const decodeNitroRpcEnvelope = (message: string): NitroRpcEnvelope =>
	JSON.parse(message) as NitroRpcEnvelope

export const decodeNitroRpc = (message: string): NitroRpcPayload => {
	const parsed = JSON.parse(message) as NitroRpcEnvelope | NitroRpcPayload
	if (Array.isArray(parsed)) return parsed
	if (parsed.req && Array.isArray(parsed.req)) return parsed.req
	if (parsed.res && Array.isArray(parsed.res)) return parsed.res
	throw new Error('Unsupported Nitro RPC message')
}

const serializeAllocations = (allocations: YellowChannelAllocation[]) =>
	allocations.map((allocation) => ({
		destination: allocation.destination,
		token: allocation.token,
		amount: allocation.amount.toString(),
	}))

export const packChannelState = (params: {
	channelId: `0x${string}`
	intent: number
	version: number
	stateData: `0x${string}`
	allocations: YellowChannelAllocation[]
}): string =>
	JSON.stringify([
		params.channelId,
		params.intent,
		params.version,
		params.stateData,
		serializeAllocations(params.allocations),
	])

export const hashChannelState = (params: {
	channelId: `0x${string}`
	intent: number
	version: number
	stateData: `0x${string}`
	allocations: YellowChannelAllocation[]
}): string =>
	// TODO: replace with abi.encode packedState + keccak256 when SDK is wired
	packChannelState(params)

export const signChannelState = async (params: {
	provider: {
		request: (args: { method: string; params: unknown[] }) => Promise<unknown>
	}
	address: `0x${string}`
	channelId: `0x${string}`
	intent: number
	version: number
	stateData: `0x${string}`
	allocations: YellowChannelAllocation[]
}): Promise<`0x${string}`> => {
	const packedState = hashChannelState({
		channelId: params.channelId,
		intent: params.intent,
		version: params.version,
		stateData: params.stateData,
		allocations: params.allocations,
	})
	const hex = await params.provider.request({
		method: 'personal_sign',
		params: [packedState, params.address],
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
