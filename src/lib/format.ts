/**
 * Format token amounts from smallest units to human-readable, with locale grouping.
 * Uses BigInt for precision (safe for 18+ decimals).
 */

export function formatTokenAmount(
	amountInSmallestUnits: string,
	decimals: number,
	locale?: string,
): string {
	const trimmed = amountInSmallestUnits.trim()
	if (trimmed === '' || trimmed === '-') return '0'
	const amount = BigInt(trimmed)
	const divisor = 10n ** BigInt(decimals)
	const intPart = amount / divisor
	const fracPart = amount % divisor
	const fracPadded = fracPart
		.toString()
		.padStart(decimals, '0')
		.slice(0, decimals)
		.replace(/0+$/, '')
	const intFormatted = new Intl.NumberFormat(locale, { useGrouping: true })
		.format(intPart)
	return fracPadded === '' ? intFormatted : `${intFormatted}.${fracPadded}`
}

export function formatInteger(value: string | number, locale?: string): string {
	return new Intl.NumberFormat(locale, { useGrouping: true }).format(
		Number(value),
	)
}
