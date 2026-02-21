/**
 * OpenChain signature database — selector/topic → text signatures.
 * https://openchain.xyz/
 */

const OPENCHAIN_BASE = 'https://api.openchain.xyz/signature-database/v1'

function normalizeHex4(hex: `0x${string}`) {
	const h = hex.toLowerCase().startsWith('0x') ? hex.slice(2).toLowerCase() : hex.toLowerCase()
	return `0x${h.padStart(8, '0').slice(-8)}` as `0x${string}`
}

function normalizeHex32(hex: `0x${string}`) {
	const h = hex.toLowerCase().startsWith('0x') ? hex.slice(2).toLowerCase() : hex.toLowerCase()
	return `0x${h.padStart(64, '0').slice(-64)}` as `0x${string}`
}

type OpenChainResult = {
	function?: Record<string, { name: string }[]>
	event?: Record<string, { name: string }[]>
}

/** Fetch function signatures for a 4-byte selector. */
export async function fetchFunctionSignatures(selector: `0x${string}`) {
	const key = normalizeHex4(selector)
	const res = await fetch(`${OPENCHAIN_BASE}/lookup?function=${key}`)
	if (!res.ok) return []
	const json = (await res.json()) as { ok?: boolean; result?: OpenChainResult }
	if (!json.ok || !json.result?.function) return []
	const arr = json.result.function[key]
	return (arr ?? []).map((e) => e.name)
}

/** Fetch event signatures for a 32-byte topic hash. */
export async function fetchEventSignatures(topicHash: `0x${string}`) {
	const key = normalizeHex32(topicHash)
	const res = await fetch(`${OPENCHAIN_BASE}/lookup?event=${key}`)
	if (!res.ok) return []
	const json = (await res.json()) as { ok?: boolean; result?: OpenChainResult }
	if (!json.ok || !json.result?.event) return []
	const arr = json.result.event[key]
	return (arr ?? []).map((e) => e.name)
}
