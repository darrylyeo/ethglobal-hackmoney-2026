/**
 * 4byte.directory — function and event signature lookup.
 * https://www.4byte.directory/docs/
 */

const FOURBYTE_BASE = 'https://www.4byte.directory/api/v1'

function normalizeHex4(hex: `0x${string}`) {
	const h = hex.toLowerCase().startsWith('0x') ? hex.slice(2).toLowerCase() : hex.toLowerCase()
	return h.padStart(8, '0').slice(-8)
}

function normalizeHex32(hex: `0x${string}`) {
	const h = hex.toLowerCase().startsWith('0x') ? hex.slice(2).toLowerCase() : hex.toLowerCase()
	return h.padStart(64, '0').slice(-64)
}

type FourByteResult = { text_signature: string }[]

/** Fetch function signatures for a 4-byte selector (first page only). */
export async function fetchFunctionSignatures(selector: `0x${string}`) {
	const hex = normalizeHex4(selector)
	const res = await fetch(`${FOURBYTE_BASE}/signatures/?hex_signature=${hex}`)
	if (!res.ok) return []
	const json = (await res.json()) as { results?: FourByteResult }
	return (json.results ?? []).map((r) => r.text_signature)
}

/** Fetch event signatures for a 32-byte topic (first page only). */
export async function fetchEventSignatures(topicHash: `0x${string}`) {
	const hex = normalizeHex32(topicHash)
	const res = await fetch(`${FOURBYTE_BASE}/event-signatures/?hex_signature=${hex}`)
	if (!res.ok) return []
	const json = (await res.json()) as { results?: FourByteResult }
	return (json.results ?? []).map((r) => r.text_signature)
}
