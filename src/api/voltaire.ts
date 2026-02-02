/**
 * Minimal EIP-1193-style RPC and ERC20 balanceOf helpers using @tevm/voltaire.
 * Uses Abi/Hex subpaths only (main package and provider use bun:ffi and are Deno-incompatible; deno.json maps bun:ffi to a stub for unit tests).
 * Builtins available but not used here: @tevm/voltaire ERC20 (encodeBalanceOf, decodeUint256),
 * @tevm/voltaire/provider HttpProvider (timeout, retries).
 */
import { decodeParameters, encodeFunction } from '@tevm/voltaire/Abi'
import { toBytes } from '@tevm/voltaire/Hex'

export type VoltaireProvider = {
	request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
	on: (event: string, listener: () => void) => VoltaireProvider
	removeListener: (event: string, listener: () => void) => VoltaireProvider
}

const ERC20_BALANCE_OF_ABI = [
	{
		type: 'function' as const,
		name: 'balanceOf',
		stateMutability: 'view' as const,
		inputs: [{ type: 'address', name: 'account' }],
		outputs: [{ type: 'uint256', name: '' }],
	},
] as const
const BALANCE_OF_OUTPUTS = [{ type: 'uint256' as const, name: '' }] as const

export function getChainId(provider: VoltaireProvider): Promise<bigint> {
	return provider
		.request({ method: 'eth_chainId', params: [] })
		.then((
			res,
		) => (typeof res === 'string' ? BigInt(res) : BigInt(res as string)))
}

export function encodeBalanceOfCall(account: `0x${string}`): `0x${string}` {
	return encodeFunction(ERC20_BALANCE_OF_ABI, 'balanceOf', [
		account,
	]) as `0x${string}`
}

export function decodeBalanceOfResult(hex: string): bigint {
	const bytes = toBytes(hex as `0x${string}`)
	const [balance] = decodeParameters(BALANCE_OF_OUTPUTS, bytes) as [bigint]
	return balance
}

export async function getErc20Balance(
	provider: VoltaireProvider,
	contractAddress: `0x${string}`,
	accountAddress: `0x${string}`,
): Promise<bigint> {
	const data = encodeBalanceOfCall(accountAddress)

	const res = await provider.request({
		method: 'eth_call',
		params: [
			{ to: contractAddress, data },
			'latest',
		],
	})

	if (typeof res !== 'string')
		throw new Error('eth_call returned invalid data')
	if (!res || res === '0x' || res.length < 66)
		return 0n

	return decodeBalanceOfResult(res)
}

const ALLOWANCE_SELECTOR = '0xdd62ed3e'
const APPROVE_SELECTOR = '0x095ea7b3'
export const MAX_UINT256 = 2n ** 256n - 1n

export function encodeAllowanceCall(
	owner: `0x${string}`,
	spender: `0x${string}`,
): `0x${string}` {
	const paddedOwner = owner.slice(2).toLowerCase().padStart(64, '0')
	const paddedSpender = spender.slice(2).toLowerCase().padStart(64, '0')
	return `${ALLOWANCE_SELECTOR}${paddedOwner}${paddedSpender}` as `0x${string}`
}

export async function getErc20Allowance(
	provider: VoltaireProvider,
	tokenAddress: `0x${string}`,
	owner: `0x${string}`,
	spender: `0x${string}`,
): Promise<bigint> {
	const result = await provider.request({
		method: 'eth_call',
		params: [
			{
				to: tokenAddress,
				data: encodeAllowanceCall(owner, spender),
			},
			'latest',
		],
	})
	if (typeof result !== 'string' || !result) throw new Error('eth_call returned invalid data')
	return BigInt(result)
}

export function encodeApproveCall(
	spender: `0x${string}`,
	amount: bigint,
): `0x${string}` {
	const paddedSpender = spender.slice(2).toLowerCase().padStart(64, '0')
	const paddedAmount = amount.toString(16).padStart(64, '0')
	return `${APPROVE_SELECTOR}${paddedSpender}${paddedAmount}` as `0x${string}`
}

export function createHttpProvider(url: string): VoltaireProvider {
	const noop = () => ({ on: noop, removeListener: noop }) as VoltaireProvider
	return {
		request: async ({ method, params = [] }) => {
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
			})
			const data = await res.json()
			if (data.error) throw new Error(data.error.message ?? 'RPC error')
			return data.result
		},
		on: noop,
		removeListener: noop,
	}
}
