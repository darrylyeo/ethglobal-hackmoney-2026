/**
 * Circle CCTP API: fees, allowance, messages/attestation, and contract call encoding.
 */
import { Abi, encodeFunction } from '@tevm/voltaire/Abi'

export type CctpMessageResponse = {
	messages?: {
		message: string
		attestation?: string
		eventNonce?: string
		decodedMessage?: {
			sourceDomain: string
			destinationDomain: string
			nonce: string
		}
	}[]
}

export function addressToBytes32(addr: `0x${string}`): `0x${string}` {
	const hex = addr.slice(2).toLowerCase().padStart(64, '0')
	return `0x${hex}` as `0x${string}`
}

const DEPOSIT_FOR_BURN_ABI = Abi([
	{
		type: 'function',
		name: 'depositForBurn',
		stateMutability: 'payable',
		inputs: [
			{ type: 'uint256', name: 'amount' },
			{ type: 'uint32', name: 'destinationDomain' },
			{ type: 'bytes32', name: 'mintRecipient' },
			{ type: 'address', name: 'burnToken' },
			{ type: 'bytes32', name: 'destinationCaller' },
			{ type: 'uint256', name: 'maxFee' },
			{ type: 'uint32', name: 'minFinalityThreshold' },
		],
		outputs: [{ type: 'uint64', name: 'nonce' }],
	},
]) as unknown as Abi

const RECEIVE_MESSAGE_ABI = Abi([
	{
		type: 'function',
		name: 'receiveMessage',
		stateMutability: 'nonpayable',
		inputs: [
			{ type: 'bytes', name: 'message' },
			{ type: 'bytes', name: 'attestation' },
		],
		outputs: [],
	},
]) as unknown as Abi

export function encodeDepositForBurn(
	amount: bigint,
	destinationDomain: number,
	mintRecipient: `0x${string}`,
	burnToken: `0x${string}`,
	destinationCaller: `0x${string}`,
	maxFee: bigint,
	minFinalityThreshold: number,
): `0x${string}` {
	return encodeFunction(DEPOSIT_FOR_BURN_ABI, 'depositForBurn', [
		amount,
		destinationDomain,
		mintRecipient,
		burnToken,
		destinationCaller,
		maxFee,
		minFinalityThreshold,
	]) as `0x${string}`
}

export function encodeReceiveMessage(
	message: `0x${string}`,
	attestation: `0x${string}`,
): `0x${string}` {
	return encodeFunction(RECEIVE_MESSAGE_ABI, 'receiveMessage', [
		message as `0x${string}`,
		attestation as `0x${string}`,
	]) as `0x${string}`
}

const ZERO_BYTES32 =
	'0x0000000000000000000000000000000000000000000000000000000000000000' as const

export function zeroBytes32(): `0x${string}` {
	return ZERO_BYTES32
}

export async function fetchCctpMessages(
	apiHost: string,
	sourceDomain: number,
	transactionHash: string,
): Promise<CctpMessageResponse> {
	const res = await fetch(
		`${apiHost}/v2/messages/${sourceDomain}?transactionHash=${encodeURIComponent(transactionHash)}`,
		{ headers: { Accept: 'application/json', }, },
	)
	if (res.status === 404) return { messages: [] }
	if (!res.ok) throw new Error(`Messages request failed (${res.status})`)
	return res.json() as Promise<CctpMessageResponse>
}

export function getAttestationFromMessages(
	data: CctpMessageResponse,
): { message: string; attestation: string } | null {
	const msg = data.messages?.[0]
	if (!msg?.attestation || !msg?.message) return null
	return { message: msg.message, attestation: msg.attestation }
}
