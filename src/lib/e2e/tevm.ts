import { encodeFunction } from '@tevm/voltaire/Abi'
import { DEFAULT_E2E_TEVM_RPC_URL, E2E_TEVM_CONTRACT_ADDRESS } from './tevm-config'

declare global {
	interface Window {
		__E2E_TEVM__?: boolean
		__E2E_TEVM_RPC_URL__?: string
	}
}

const E2E_SIMPLE_CONTRACT_ABI = [
	{
		type: 'function' as const,
		name: 'set',
		stateMutability: 'nonpayable' as const,
		inputs: [{ type: 'uint256', name: 'newValue' }],
		outputs: [],
	},
] as const

const isE2eFlag = (value: string | undefined) =>
	value === '1' || value === 'true'

const isHexString = (value: unknown): value is `0x${string}` =>
	typeof value === 'string' && value.startsWith('0x')

export const E2E_TEVM_ENABLED =
	(typeof window !== 'undefined' && window.__E2E_TEVM__ === true) ||
	(typeof import.meta.env !== 'undefined' &&
		isE2eFlag(import.meta.env.PUBLIC_E2E_TEVM))

export const E2E_TEVM_RPC_URL =
	typeof window !== 'undefined' && window.__E2E_TEVM_RPC_URL__
		? window.__E2E_TEVM_RPC_URL__
		: (typeof import.meta.env !== 'undefined'
				? import.meta.env.PUBLIC_E2E_TEVM_RPC_URL
				: undefined) ?? DEFAULT_E2E_TEVM_RPC_URL

export const requestE2eTevmContractTx = async (args: {
	provider: {
		request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
	}
	from: `0x${string}`
	value: bigint
}) => {
	const txHash = await args.provider.request({
		method: 'eth_sendTransaction',
		params: [
			{
				from: args.from,
				to: E2E_TEVM_CONTRACT_ADDRESS,
				data: encodeFunction(E2E_SIMPLE_CONTRACT_ABI, 'set', [args.value]),
			},
		],
	})
	await args.provider.request({ method: 'tevm_mine', params: [] })
	if (!isHexString(txHash))
		throw new Error('E2E Tevm contract call did not return a tx hash.')
	return txHash
}

export const requestE2eTevmValueTransfer = async (args: {
	provider: {
		request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
	}
	from: `0x${string}`
	to: `0x${string}`
	value: bigint
}) => {
	const txHash = await args.provider.request({
		method: 'eth_sendTransaction',
		params: [
			{
				from: args.from,
				to: args.to,
				value: `0x${args.value.toString(16)}`,
			},
		],
	})
	await args.provider.request({ method: 'tevm_mine', params: [] })
	if (!isHexString(txHash))
		throw new Error('E2E Tevm transfer did not return a tx hash.')
	return txHash
}
