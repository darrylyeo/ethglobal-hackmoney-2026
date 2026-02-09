import type { TransactionSigningPayload } from '$/lib/session/resolveSigningPayloads.ts'

const ERC20_TRANSFER_SELECTOR = '0xa9059cbb'
const ERC20_APPROVE_SELECTOR = '0x095ea7b3'

const hexToAddress = (hex: string): `0x${string}` =>
	`0x${hex.slice(-40).toLowerCase()}` as `0x${string}`

const hexToBigInt = (hex: string): bigint =>
	BigInt(hex ? `0x${hex}` : 0)

export type PayloadDataDescription =
	| { kind: 'empty' }
	| { kind: 'unknown'; byteLength: number }
	| { kind: 'erc20_transfer'; to: `0x${string}`; amount: bigint }
	| { kind: 'erc20_approve'; spender: `0x${string}`; amount: bigint }

export const describePayloadData = (
	payload: TransactionSigningPayload,
): PayloadDataDescription => {
	const data = payload.data ?? '0x'
	if (!data || data === '0x') return { kind: 'empty' }
	const raw = data.startsWith('0x') ? data.slice(2) : data
	if (raw.length < 72) return { kind: 'unknown', byteLength: raw.length / 2 }
	const selector = `0x${raw.slice(0, 8)}`
	const arg1 = raw.slice(8, 72)
	const arg2 = raw.slice(72, 136)
	if (selector === ERC20_TRANSFER_SELECTOR) {
		return {
			kind: 'erc20_transfer',
			to: hexToAddress(arg1),
			amount: hexToBigInt(arg2),
		}
	}
	if (selector === ERC20_APPROVE_SELECTOR) {
		return {
			kind: 'erc20_approve',
			spender: hexToAddress(arg1),
			amount: hexToBigInt(arg2),
		}
	}
	return { kind: 'unknown', byteLength: raw.length / 2 }
}

export const formatPayloadValue = (value: string | undefined): string => {
	if (value === undefined || value === '') return '0'
	const n = BigInt(value)
	if (n === 0n) return '0'
	if (n < 1000n) return String(n)
	if (n < 1_000_000n) return `${n} wei`
	if (n < 10n ** 18n) return `${Number(n) / 1e9 | 0} gwei`
	return `${Number(n) / 1e18} ETH`
}
