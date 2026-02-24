/**
 * Evm selectors (4-byte function) + Evm function signatures from OpenChain + 4byte.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import {
	fetchFunctionSignatures as fetchOpenchain,
} from '$/api/openchain.ts'
import {
	fetchFunctionSignatures as fetchFourbyte,
} from '$/api/fourbyte.ts'
import { CollectionId } from '$/constants/collections.ts'
import type { EvmSelector } from '$/data/EvmSelector.ts'

const getKey = (row: EvmSelector) => row.$id.hex

export function normalizeEvmSelector4(hex: `0x${string}`) {
	const h = hex.toLowerCase().startsWith('0x') ? hex.slice(2).toLowerCase() : hex.toLowerCase()
	return `0x${h.padStart(8, '0').slice(-8)}` as `0x${string}`
}

export const evmSelectorsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.EvmSelectors,
		storageKey: CollectionId.EvmSelectors,
		getKey: (row: EvmSelector) => getKey(row),
		parser: { stringify, parse },
	}),
)

function mergeSignatures(a: string[], b: string[]) {
	return [...new Set([...a, ...b])].sort()
}

export async function ensureEvmFunctionSignatures(selector: `0x${string}`) {
	const hex = normalizeEvmSelector4(selector)
	if (evmSelectorsCollection.state.get(hex)) return
	const [open, four] = await Promise.all([
		fetchOpenchain(hex),
		fetchFourbyte(hex),
	])
	evmSelectorsCollection.insert({
		$id: { hex },
		signatures: mergeSignatures(open, four),
	})
}
