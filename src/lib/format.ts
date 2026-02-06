/**
 * Format token amounts from smallest units to human-readable, with locale grouping.
 * Uses BigInt for precision (safe for 18+ decimals). Memoized for hot paths.
 */

const formatTokenAmountCache = new Map<string, string>()

export function formatTokenAmount(
	amountInSmallestUnits: bigint | string,
	decimals: number,
	locale?: string,
): string {
	const amount =
		typeof amountInSmallestUnits === 'bigint'
			? amountInSmallestUnits
			: BigInt(amountInSmallestUnits.trim() || '0')
	if (amount === 0n) return '0'
	const key = `${amount}|${decimals}|${locale ?? ''}`
	const cached = formatTokenAmountCache.get(key)
	if (cached !== undefined) return cached
	const divisor = 10n ** BigInt(decimals)
	const intPart = amount / divisor
	const fracPart = amount % divisor
	const fracPadded = fracPart
		.toString()
		.padStart(decimals, '0')
		.slice(0, decimals)
		.replace(/0+$/, '')
	const intFormatted = new Intl.NumberFormat(locale, {
		useGrouping: true,
	}).format(intPart)
	const result =
		fracPadded === '' ? intFormatted : `${intFormatted}.${fracPadded}`
	formatTokenAmountCache.set(key, result)
	return result
}

export function formatInteger(value: string | number, locale?: string): string {
	return new Intl.NumberFormat(locale, { useGrouping: true }).format(
		Number(value),
	)
}

export const parseDecimalToSmallest = (
	value: string,
	decimals: number,
): bigint => {
	const cleaned = value.replace(/[,\s]/g, '')
	if (!/^\d*\.?\d*$/.test(cleaned) || cleaned === '') return 0n
	const [integer = '0', fraction = ''] = cleaned.split('.')
	const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals)
	return BigInt((integer || '0') + paddedFraction)
}

export const formatSmallestToDecimal = (
	value: bigint | string,
	decimals: number,
	maxFractionDigits?: number,
): string => {
	const str = typeof value === 'string' ? value : value.toString()
	if (str === '0') return '0'
	const padded = str.padStart(decimals + 1, '0')
	const intPart = padded.slice(0, -decimals) || '0'
	let fracPart = padded.slice(-decimals).replace(/0+$/, '')
	if (maxFractionDigits !== undefined && fracPart.length > maxFractionDigits) {
		fracPart = fracPart.slice(0, maxFractionDigits)
	}
	return fracPart === '' ? intPart : `${intPart}.${fracPart}`
}

export const isValidDecimalInput = (
	value: string,
	decimals: number,
): boolean => {
	const cleaned = value.replace(/[,\s]/g, '')
	if (!/^\d*\.?\d*$/.test(cleaned)) return false
	const [, fraction = ''] = cleaned.split('.')
	return fraction.length <= decimals
}

/** Convert hex Wei string (e.g. "0x38d7ea4c68000") or bigint to ETH display. */
export const formatWei = (
	value: string | bigint,
	maxFractionDigits = 6,
): string => {
	const wei = (
		typeof value === 'bigint'
			? value
		: typeof value === 'string' && value.startsWith('0x')
			? BigInt(value)
		:
			BigInt(value || '0')
	)
	if (wei === 0n) return '0'
	return formatSmallestToDecimal(wei, 18, maxFractionDigits)
}

/** Format a bigint gas value with locale grouping. */
export const formatGas = (value: bigint, locale?: string): string => (
	new Intl.NumberFormat(locale, { useGrouping: true }).format(value)
)

/** Format Gwei from a Wei bigint. */
export const formatGwei = (wei: bigint, maxFractionDigits = 2): string => (
	formatSmallestToDecimal(wei, 9, maxFractionDigits)
)
