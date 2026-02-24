import { normalizeEvmSelector4 } from '$/collections/EvmSelectors.ts'
import { normalizeEvmTopic32 } from '$/collections/EvmTopics.ts'
import { normalizeEvmError4 } from '$/collections/EvmErrors.ts'

export function getEvmSelectorPath(hex: `0x${string}`): string {
	const h = normalizeEvmSelector4(hex)
	return `/evm/selector/${encodeURIComponent(h)}`
}

export function getEvmTopicPath(hex: `0x${string}`): string {
	const h = normalizeEvmTopic32(hex)
	return `/evm/topic/${encodeURIComponent(h)}`
}

export function getEvmErrorPath(hex: `0x${string}`): string {
	const h = normalizeEvmError4(hex)
	return `/evm/error/${encodeURIComponent(h)}`
}

export function parseEvmSelectorHex(hexParam: string): `0x${string}` | null {
	const decoded = decodeURIComponent(hexParam)
	const raw = decoded.trim().replace(/^0x/i, '').replace(/\s/g, '')
	if (!/^[0-9a-fA-F]+$/.test(raw)) return null
	return normalizeEvmSelector4(`0x${raw}` as `0x${string}`)
}

export function parseEvmTopicHex(hexParam: string): `0x${string}` | null {
	const decoded = decodeURIComponent(hexParam)
	const raw = decoded.trim().replace(/^0x/i, '').replace(/\s/g, '')
	if (!/^[0-9a-fA-F]+$/.test(raw)) return null
	return normalizeEvmTopic32(`0x${raw}` as `0x${string}`)
}

export function parseEvmErrorHex(hexParam: string): `0x${string}` | null {
	const decoded = decodeURIComponent(hexParam)
	const raw = decoded.trim().replace(/^0x/i, '').replace(/\s/g, '')
	if (!/^[0-9a-fA-F]+$/.test(raw)) return null
	return normalizeEvmError4(`0x${raw}` as `0x${string}`)
}
