/**
 * Decode function calldata using a human-readable signature (e.g. from 4byte/OpenChain).
 * Parses signature to ABI input types and uses Voltaire decodeParameters.
 */

import { decodeParameters } from '@tevm/voltaire/Abi'
import { keccak256String, toHex } from '@tevm/voltaire/Hash'
import { fromBytes, toBytes } from '@tevm/voltaire/Hex'
import { formatAddress, normalizeAddress } from '$/lib/address.ts'

/** Compute 4-byte function selector from full signature string (e.g. "transfer(address,uint256)"). */
export function functionSelectorFromSignature(signature: string): `0x${string}` | null {
	const parsed = parseFunctionSignature(signature.trim())
	if (!parsed) return null
	const sig = `${parsed.name}(${parsed.types.join(',')})`
	const hash = keccak256String(sig)
	return toHex(hash).slice(0, 10) as `0x${string}`
}

/** Compute 32-byte event topic (topic0) from event signature (e.g. "Transfer(address,address,uint256)"). */
export function eventTopicFromSignature(signature: string): `0x${string}` | null {
	const parsed = parseFunctionSignature(signature.trim())
	if (!parsed) return null
	const sig = `${parsed.name}(${parsed.types.join(',')})`
	const hash = keccak256String(sig)
	return toHex(hash).toLowerCase() as `0x${string}`
}

/** Event signature parse: types with optional "indexed" (e.g. "Transfer(address indexed, address indexed, uint256)"). */
export function parseEventSignature(
	sig: string,
): { name: string; indexedTypes: string[]; nonIndexedTypes: string[] } | null {
	const base = parseFunctionSignature(sig.trim())
	if (!base) return null
	const indexedTypes: string[] = []
	const nonIndexedTypes: string[] = []
	for (const t of base.types) {
		const trimmed = t.trim()
		if (trimmed.endsWith(' indexed')) {
			indexedTypes.push(trimmed.slice(0, -8).trim())
		} else if (trimmed.startsWith('indexed ')) {
			indexedTypes.push(trimmed.slice(8).trim())
		} else {
			nonIndexedTypes.push(trimmed)
		}
	}
	return { name: base.name, indexedTypes, nonIndexedTypes }
}

/** Parse "name(type1,type2,...)" into [name, [type1, type2, ...]]. Handles nested tuples. */
export function parseFunctionSignature(sig: string): { name: string; types: string[] } | null {
	const match = /^(\w+)\s*\((.*)\)\s*$/.exec(sig.trim())
	if (!match) return null
	const [, name, paramsBody] = match
	if (paramsBody.trim() === '') return { name: name ?? '', types: [] }
	const types: string[] = []
	let depth = 0
	let start = 0
	for (let i = 0; i < paramsBody.length; i++) {
		const c = paramsBody[i]
		if (c === '(') depth++
		else if (c === ')') depth--
		else if (c === ',' && depth === 0) {
			types.push(paramsBody.slice(start, i).trim())
			start = i + 1
		}
	}
	types.push(paramsBody.slice(start).trim())
	return { name: name ?? '', types }
}

export type DecodedParam = { type: string; value: unknown }
export type DecodedCalldata = { name: string; params: DecodedParam[] }

/**
 * Decode event log (topic0 [+ topic1...] + data) using an event signature.
 * topicAndDataHex must be at least 64 chars (32-byte topic0). Data starts after topic0 plus
 * 32 bytes per indexed param (topic1, topic2, ...). Topic0 must match eventTopicFromSignature(signature).
 * Returns params in signature order: indexed first (from topics), then non-indexed (from data).
 */
export function decodeEventDataWithSignature(
	signature: string,
	topicAndDataHex: `0x${string}`,
): DecodedCalldata | null {
	const parsed = parseEventSignature(signature)
	if (!parsed) return null
	const raw = topicAndDataHex.startsWith('0x') ? topicAndDataHex.slice(2) : topicAndDataHex
	const dataStart = 64 + parsed.indexedTypes.length * 64
	const minDataLen = parsed.nonIndexedTypes.length * 64
	if (raw.length < dataStart + minDataLen) return null
	const topic0 = (`0x${raw.slice(0, 64).toLowerCase()}` as `0x${string}`)
	const expectedTopic = eventTopicFromSignature(signature)
	if (expectedTopic && topic0 !== expectedTopic) return null
	const params: DecodedParam[] = []
	try {
		for (let i = 0; i < parsed.indexedTypes.length; i++) {
			const type = parsed.indexedTypes[i]
			const topicHex = (`0x${raw.slice(64 + i * 64, 64 + (i + 1) * 64).toLowerCase()}` as `0x${string}`)
			const decoded = decodeParameters(
				[{ type, name: 'x' }] as unknown as Parameters<typeof decodeParameters>[0],
				toBytes(topicHex),
			)
			params.push({ type, value: decoded[0] })
		}
		if (parsed.nonIndexedTypes.length > 0) {
			const dataHex = (`0x${raw.slice(dataStart)}` as `0x${string}`).toLowerCase() as `0x${string}`
			const inputs = parsed.nonIndexedTypes.map((type, i) => ({ type, name: `param${i}` }))
			const decoded = decodeParameters(
				inputs as unknown as Parameters<typeof decodeParameters>[0],
				toBytes(dataHex),
			)
			for (let i = 0; i < parsed.nonIndexedTypes.length; i++)
				params.push({ type: parsed.nonIndexedTypes[i], value: decoded[i] })
		}
		return { name: parsed.name, params }
	} catch {
		return null
	}
}

/**
 * Decode calldata (selector + args) using a text signature.
 * calldataHex must start with selector (4 bytes); the rest is decoded as ABI-encoded params.
 */
export function decodeCalldataWithSignature(
	signature: string,
	calldataHex: `0x${string}`,
): DecodedCalldata | null {
	const parsed = parseFunctionSignature(signature)
	if (!parsed) return null
	const raw = calldataHex.startsWith('0x') ? calldataHex.slice(2) : calldataHex
	if (raw.length < 8) return null
	const expectedSelector = functionSelectorFromSignature(signature)
	if (
		expectedSelector &&
		raw.slice(0, 8).toLowerCase() !== expectedSelector.slice(2).toLowerCase()
	)
		return null
	const tailHex = (`0x${raw.slice(8)}` as `0x${string}`).toLowerCase() as `0x${string}`
	if (parsed.types.length === 0) return { name: parsed.name, params: [] }
	const inputs = parsed.types.map((type, i) => ({ type, name: `param${i}` }))
	try {
		const decoded = decodeParameters(
			inputs as unknown as Parameters<typeof decodeParameters>[0],
			toBytes(tailHex),
		)
		const params: DecodedParam[] = parsed.types.map((type, i) => ({
			type,
			value: decoded[i],
		}))
		return { name: parsed.name, params }
	} catch {
		return null
	}
}

/** Parse "(type1,type2,...)" into [type1, type2, ...]. Returns null if not a tuple type. */
function parseTupleTypes(tupleType: string): string[] | null {
	const t = tupleType.trim()
	if (!t.startsWith('(') || !t.endsWith(')')) return null
	const inner = t.slice(1, -1).trim()
	if (inner === '') return []
	const types: string[] = []
	let depth = 0
	let start = 0
	for (let i = 0; i < inner.length; i++) {
		const c = inner[i]
		if (c === '(') depth++
		else if (c === ')') depth--
		else if (c === ',' && depth === 0) {
			types.push(inner.slice(start, i).trim())
			start = i + 1
		}
	}
	types.push(inner.slice(start).trim())
	return types
}

/** Format a decoded param value for display (address short, bigint string, bytes as hex, tuple, etc.). */
export function formatDecodedParamValue(type: string, value: unknown): string {
	if (type === 'address' && typeof value === 'string')
		return formatAddress(normalizeAddress(value) ?? value)
	if (typeof value === 'bigint') return value.toString()
	if (typeof value === 'boolean') return value ? 'true' : 'false'
	if (value instanceof Uint8Array)
		return (value.length === 0 ? '0x' : fromBytes(value)) as string
	const tupleTypes = parseTupleTypes(type)
	if (tupleTypes && Array.isArray(value))
		return `(${value.map((v, i) => formatDecodedParamValue(tupleTypes[i] ?? 'unknown', v)).join(', ')})`
	return String(value)
}
