/**
 * Selector signatures (function 4-byte / event 32-byte) from OpenChain + 4byte.
 * Cached per kind:hex for calldata/decoder UI.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import {
	fetchEventSignatures as fetchEventOpenchain,
	fetchFunctionSignatures as fetchFunctionOpenchain,
} from '$/api/openchain.ts'
import {
	fetchEventSignatures as fetchEventFourbyte,
	fetchFunctionSignatures as fetchFunctionFourbyte,
} from '$/api/fourbyte.ts'
import { CollectionId } from '$/constants/collections.ts'
import {
	type SelectorSignatureEntry,
	SelectorKind,
} from '$/data/SelectorSignature.ts'

const getKey = (row: SelectorSignatureEntry) =>
	`${row.$id.kind}:${row.$id.hex}`

export function normalizeSelector4(hex: `0x${string}`) {
	const h = hex.toLowerCase().startsWith('0x') ? hex.slice(2).toLowerCase() : hex.toLowerCase()
	return `0x${h.padStart(8, '0').slice(-8)}` as `0x${string}`
}

function normalizeHex32(hex: `0x${string}`) {
	const h = hex.toLowerCase().startsWith('0x') ? hex.slice(2).toLowerCase() : hex.toLowerCase()
	return `0x${h.padStart(64, '0').slice(-64)}` as `0x${string}`
}

export const selectorSignaturesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.SelectorSignatures,
		storageKey: CollectionId.SelectorSignatures,
		getKey: (row: SelectorSignatureEntry) => getKey(row),
		parser: { stringify, parse },
	}),
)

function mergeSignatures(a: string[], b: string[]) {
	return [...new Set([...a, ...b])].sort()
}

export async function ensureFunctionSignatures(selector: `0x${string}`) {
	const hex = normalizeSelector4(selector)
	const key = `${SelectorKind.Function}:${hex}` as Parameters<
		typeof selectorSignaturesCollection.state.get
	>[0]
	if (selectorSignaturesCollection.state.get(key)) return
	const [open, four] = await Promise.all([
		fetchFunctionOpenchain(hex),
		fetchFunctionFourbyte(hex),
	])
	const signatures = mergeSignatures(open, four)
	selectorSignaturesCollection.insert({
		$id: { kind: SelectorKind.Function, hex },
		signatures,
	})
}

export async function ensureEventSignatures(topicHash: `0x${string}`) {
	const hex = normalizeHex32(topicHash)
	const key = `${SelectorKind.Event}:${hex}` as Parameters<
		typeof selectorSignaturesCollection.state.get
	>[0]
	if (selectorSignaturesCollection.state.get(key)) return
	const [open, four] = await Promise.all([
		fetchEventOpenchain(hex),
		fetchEventFourbyte(hex),
	])
	const signatures = mergeSignatures(open, four)
	selectorSignaturesCollection.insert({
		$id: { kind: SelectorKind.Event, hex },
		signatures,
	})
}
