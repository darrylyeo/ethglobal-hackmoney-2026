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
		.then((res) =>
			typeof res === 'string' ? BigInt(res) : BigInt(res as string),
		)
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
		params: [{ to: contractAddress, data }, 'latest'],
	})

	if (typeof res !== 'string') throw new Error('eth_call returned invalid data')
	if (!res || res === '0x' || res.length < 66) return 0n

	return decodeBalanceOfResult(res)
}

const ALLOWANCE_SELECTOR = '0xdd62ed3e'
const APPROVE_SELECTOR = '0x095ea7b3'
const TRANSFER_SELECTOR = '0xa9059cbb'
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
	if (typeof result !== 'string' || !result)
		throw new Error('eth_call returned invalid data')
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

export function encodeTransferCall(
	recipient: `0x${string}`,
	amount: bigint,
): string {
	const paddedRecipient = recipient.slice(2).toLowerCase().padStart(64, '0')
	const paddedAmount = amount.toString(16).padStart(64, '0')
	return `${TRANSFER_SELECTOR}${paddedRecipient}${paddedAmount}`
}

/** ERC20 Transfer(address,address,uint256) topic0 */
export const TRANSFER_TOPIC =
	'0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4d52336f2' as const

export type EthLog = {
	address: string
	topics: string[]
	data: string
	blockNumber: string
	transactionHash: string
	logIndex: string
}

export async function getBlockByNumber(
	provider: VoltaireProvider,
	blockNum: bigint | 'latest',
): Promise<{ number: bigint; timestamp: number }> {
	const blockHex =
		blockNum === 'latest' ? 'latest' : `0x${blockNum.toString(16)}`
	const res = await provider.request({
		method: 'eth_getBlockByNumber',
		params: [blockHex, false],
	})
	const block = res as { number?: string; timestamp?: string } | null
	if (!block?.number || !block?.timestamp)
		throw new Error('eth_getBlockByNumber returned invalid block')
	return {
		number: BigInt(block.number),
		timestamp: parseInt(block.timestamp, 16) * 1000,
	}
}

export async function getCurrentBlockNumber(
	provider: VoltaireProvider,
): Promise<number> {
	const { number } = await getBlockByNumber(provider, 'latest')
	return Number(number)
}

export async function getBlockTransactionCount(
	provider: VoltaireProvider,
	blockNum: bigint | 'latest',
): Promise<number> {
	const blockHex =
		blockNum === 'latest' ? 'latest' : `0x${blockNum.toString(16)}`
	const res = await provider.request({
		method: 'eth_getBlockTransactionCountByNumber',
		params: [blockHex],
	})
	const hex = res as string | null
	if (hex == null) return 0
	return parseInt(hex, 16)
}

export async function getBlockTransactionHashes(
	provider: VoltaireProvider,
	blockNum: bigint | 'latest',
): Promise<`0x${string}`[]> {
	const blockHex =
		blockNum === 'latest' ? 'latest' : `0x${blockNum.toString(16)}`
	const res = await provider.request({
		method: 'eth_getBlockByNumber',
		params: [blockHex, true],
	})
	const block = res as { transactions?: { hash: string }[] } | null
	const txs = block?.transactions
	if (!Array.isArray(txs)) return []
	return txs.map((tx) => (typeof tx === 'string' ? tx : tx.hash) as `0x${string}`)
}

export type EthTransaction = {
	hash: string
	blockNumber: string
	blockHash: string
	from: string
	to: string | null
	value: string
	gas: string
	gasPrice: string
}

export async function getTransactionByHash(
	provider: VoltaireProvider,
	hash: `0x${string}`,
): Promise<EthTransaction | null> {
	const res = await provider.request({
		method: 'eth_getTransactionByHash',
		params: [hash],
	})
	const tx = res as EthTransaction | null
	return tx ?? null
}

export type EthTransactionReceipt = {
	logs: EthLog[]
}

export async function getTransactionReceipt(
	provider: VoltaireProvider,
	hash: `0x${string}`,
): Promise<EthTransactionReceipt | null> {
	const res = await provider.request({
		method: 'eth_getTransactionReceipt',
		params: [hash],
	})
	const receipt = res as EthTransactionReceipt | null
	return receipt ?? null
}

const BINARY_SEARCH_MAX_ITER = 30

/** Resolve block number at or before targetTimestamp (ms) via binary search. */
export async function getBlockNumberByTimestamp(
	provider: VoltaireProvider,
	targetTimestampMs: number,
): Promise<bigint> {
	const latest = await getBlockByNumber(provider, 'latest')
	if (latest.timestamp <= targetTimestampMs) return latest.number
	let lo = 0n
	let hi = latest.number
	for (let i = 0; i < BINARY_SEARCH_MAX_ITER && lo <= hi; i++) {
		const mid = (lo + hi) / 2n
		const { timestamp } = await getBlockByNumber(provider, mid)
		if (timestamp <= targetTimestampMs) lo = mid + 1n
		else hi = mid - 1n
	}
	return hi < 0n ? 0n : hi
}

export async function getLogs(
	provider: VoltaireProvider,
	filter: {
		address?: `0x${string}`
		topics?: (string | string[] | null)[]
		fromBlock?: string
		toBlock?: string
	},
): Promise<EthLog[]> {
	const res = await provider.request({
		method: 'eth_getLogs',
		params: [filter],
	})
	const logs = res as EthLog[] | null
	return Array.isArray(logs) ? logs : []
}

export function createHttpProvider(url: string): VoltaireProvider {
	const provider: VoltaireProvider = {
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
		on: () => provider,
		removeListener: () => provider,
	}
	return provider
}
