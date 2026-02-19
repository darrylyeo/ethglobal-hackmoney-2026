/**
 * Minimal EIP-1193-style RPC and ERC20 helpers using @tevm/voltaire.
 * Uses ERC20 SELECTORS, decodeUint256; we use fetch-based createHttpProvider for compatibility (upstream provider may use native bindings).
 */
import { ERC20 } from '@tevm/voltaire'
import type { Trace } from '$/data/Trace.ts'

export type VoltaireProvider = {
	request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
	on: (event: string, listener: () => void) => VoltaireProvider
	removeListener: (event: string, listener: () => void) => VoltaireProvider
}

export type EvmLog = {
	address: string
	topics: string[]
	data: string
	blockNumber: string
	transactionHash: string
	logIndex: string
}

export type EvmBlock = {
	number: bigint
	timestamp: number
	hash?: `0x${string}`
	parentHash?: `0x${string}`
	miner?: `0x${string}`
	gasUsed?: bigint
	gasLimit?: bigint
	baseFeePerGas?: bigint
}

export type EvmTransaction = {
	hash: string
	blockNumber: string
	blockHash: string
	transactionIndex: string
	from: string
	to: string | null
	value: string
	nonce: string
	input: string
	gas: string
	gasPrice: string
	type?: string
	maxFeePerGas?: string
	maxPriorityFeePerGas?: string
}

export type EvmTransactionReceipt = {
	status: string
	gasUsed: string
	contractAddress: string | null
	effectiveGasPrice?: string
	cumulativeGasUsed?: string
	logs: EvmLog[]
}

export type RawTrace = {
	type?: string
	from?: string
	to?: string
	value?: string
	gas?: string
	gasUsed?: string
	input?: string
	output?: string
	error?: string
	calls?: RawTrace[]
}

/** Normalize RawTrace (callTracer output) to Trace. */
export function rawTraceToTrace(raw: RawTrace, index = 0): Trace {
	const parseHex = (v: string | undefined): bigint | undefined =>
		v ? BigInt(v) : undefined
	return {
		index,
		type: raw.type,
		from: raw.from,
		to: raw.to,
		value: raw.value,
		gas: parseHex(raw.gas),
		gasUsed: parseHex(raw.gasUsed),
		input: raw.input,
		output: raw.output,
		error: raw.error,
		children: raw.calls?.map((c, i) => rawTraceToTrace(c, i)),
	}
}

export function getChainId(provider: VoltaireProvider): Promise<bigint> {
	return provider
		.request({ method: 'eth_chainId', params: [] })
		.then((res) =>
			typeof res === 'string' ? BigInt(res) : BigInt(res as string),
		)
}

export function encodeBalanceOfCall(account: `0x${string}`): `0x${string}` {
	return (ERC20.SELECTORS.balanceOf +
		account.slice(2).toLowerCase().padStart(64, '0')) as `0x${string}`
}

export function decodeBalanceOfResult(hex: string): bigint {
	return ERC20.decodeUint256(hex)
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

export const MAX_UINT256 = 2n ** 256n - 1n

export function encodeAllowanceCall(
	owner: `0x${string}`,
	spender: `0x${string}`,
): `0x${string}` {
	return (ERC20.SELECTORS.allowance +
		owner.slice(2).toLowerCase().padStart(64, '0') +
		spender.slice(2).toLowerCase().padStart(64, '0')) as `0x${string}`
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
			{ to: tokenAddress, data: encodeAllowanceCall(owner, spender) },
			'latest',
		],
	})
	if (typeof result !== 'string' || !result)
		throw new Error('eth_call returned invalid data')
	return ERC20.decodeUint256(result)
}

export function encodeApproveCall(
	spender: `0x${string}`,
	amount: bigint,
): `0x${string}` {
	return (ERC20.SELECTORS.approve +
		spender.slice(2).toLowerCase().padStart(64, '0') +
		amount.toString(16).padStart(64, '0')) as `0x${string}`
}

export function encodeTransferCall(
	recipient: `0x${string}`,
	amount: bigint,
): string {
	return (
		ERC20.SELECTORS.transfer +
		recipient.slice(2).toLowerCase().padStart(64, '0') +
		amount.toString(16).padStart(64, '0')
	)
}

/** ERC20 Transfer(address,address,uint256) topic0; not ERC20.EVENTS.Transfer (package has typo) */
export const TRANSFER_TOPIC =
	'0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4d52336f2' as const

function parseBlockNumber(
	v: string | number | undefined | null,
): bigint | undefined {
	if (v === undefined || v === null) return undefined
	return BigInt(v)
}
function parseBlockTimestampMs(
	v: string | number | undefined | null,
): number | undefined {
	if (v === undefined || v === null) return undefined
	return typeof v === 'number' ? v * 1000 : parseInt(v, 16) * 1000
}

const parseHexAddress = (v: unknown): `0x${string}` | undefined => (
	typeof v === 'string' && v.startsWith('0x')
		? v as `0x${string}`
	:
		undefined
)

const parseHexBigInt = (v: unknown): bigint | undefined => (
	typeof v === 'string'
		? BigInt(v)
	: typeof v === 'number'
		? BigInt(v)
	:
		undefined
)

export async function getBlockByNumber(
	provider: VoltaireProvider,
	blockNum: bigint | 'latest',
): Promise<EvmBlock> {
	const blockHex =
		blockNum === 'latest' ? 'latest' : `0x${blockNum.toString(16)}`
	const res = await provider.request({
		method: 'eth_getBlockByNumber',
		params: [blockHex, false],
	})
	const block = res as Record<string, unknown> | null
	if (block == null || typeof block !== 'object') {
		throw new Error('eth_getBlockByNumber returned invalid block')
	}
	const number = parseBlockNumber(block.number as string | number | undefined | null)
	const timestampMs = parseBlockTimestampMs(block.timestamp as string | number | undefined | null)
	if (number === undefined || timestampMs === undefined) {
		throw new Error('eth_getBlockByNumber returned invalid block')
	}
	return {
		number,
		timestamp: timestampMs,
		hash: parseHexAddress(block.hash),
		parentHash: parseHexAddress(block.parentHash),
		miner: parseHexAddress(block.miner),
		gasUsed: parseHexBigInt(block.gasUsed),
		gasLimit: parseHexBigInt(block.gasLimit),
		baseFeePerGas: parseHexBigInt(block.baseFeePerGas),
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
	return txs.map(
		(tx) => (typeof tx === 'string' ? tx : tx.hash) as `0x${string}`,
	)
}

export async function getTransactionByHash(
	provider: VoltaireProvider,
	hash: `0x${string}`,
): Promise<EvmTransaction | null> {
	const res = await provider.request({
		method: 'eth_getTransactionByHash',
		params: [hash],
	})
	const tx = res as EvmTransaction | null
	return tx ?? null
}

export async function getTransactionReceipt(
	provider: VoltaireProvider,
	hash: `0x${string}`,
): Promise<EvmTransactionReceipt | null> {
	const res = await provider.request({
		method: 'eth_getTransactionReceipt',
		params: [hash],
	})
	const receipt = res as EvmTransactionReceipt | null
	return receipt ?? null
}

const BINARY_SEARCH_MAX_ITER = 30
const PRUNED_EARLIEST_RE = /earliest available is (\d+)/i

function parsePrunedEarliest(message: string): bigint | null {
	const m = message.match(PRUNED_EARLIEST_RE)
	return m ? BigInt(m[1]) : null
}

/** Resolve block number at or before targetTimestamp (ms) via binary search.
 * On pruned nodes, avoids querying blocks below the node's earliest available block. */
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
		let timestamp: number
		try {
			;({ timestamp } = await getBlockByNumber(provider, mid))
		} catch (e) {
			const earliest = parsePrunedEarliest(
				e instanceof Error ? e.message : String(e),
			)
			if (earliest != null) {
				lo = lo < earliest ? earliest : lo
				continue
			}
			throw e
		}
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
): Promise<EvmLog[]> {
	const res = await provider.request({
		method: 'eth_getLogs',
		params: [filter],
	})
	const logs = res as EvmLog[] | null
	return Array.isArray(logs) ? logs : []
}

/** Attempt debug_traceTransaction (callTracer). Returns null if unsupported. */
export async function debugTraceTransaction(
	provider: VoltaireProvider,
	hash: `0x${string}`,
): Promise<RawTrace | null> {
	try {
		const res = await provider.request({
			method: 'debug_traceTransaction',
			params: [hash, { tracer: 'callTracer' }],
		})
		return (res as RawTrace) ?? null
	} catch {
		return null
	}
}

export type EthCallParams = {
	to: `0x${string}`
	data: `0x${string}`
	from?: `0x${string}`
	value?: string | bigint
	gas?: string | bigint
	gasPrice?: string | bigint
}

/** Generic eth_call for contract reads. */
export async function ethCall(
	provider: VoltaireProvider,
	params: EthCallParams,
	blockTag: string | bigint = 'latest',
): Promise<string> {
	const blockHex =
		blockTag === 'latest'
			? 'latest'
			: typeof blockTag === 'bigint'
				? `0x${blockTag.toString(16)}`
				: String(blockTag)
	const tx: Record<string, unknown> = {
		to: params.to,
		data: params.data,
	}
	if (params.from != null) tx.from = params.from
	if (params.value != null)
		tx.value =
			typeof params.value === 'bigint'
				? `0x${params.value.toString(16)}`
				: params.value
	if (params.gas != null)
		tx.gas =
			typeof params.gas === 'bigint'
				? `0x${params.gas.toString(16)}`
				: params.gas
	if (params.gasPrice != null)
		tx.gasPrice =
			typeof params.gasPrice === 'bigint'
				? `0x${params.gasPrice.toString(16)}`
				: params.gasPrice
	const res = await provider.request({
		method: 'eth_call',
		params: [tx, blockHex],
	})
	if (typeof res !== 'string') throw new Error('eth_call returned invalid data')
	return res
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
