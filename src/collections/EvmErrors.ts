/**
 * Evm error selectors (4-byte) + Evm error signatures from 4byte.directory.
 * Sourcify 4byte lookup does not expose errors; 4byte.directory /signatures/ returns them.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { fetchErrorSignatures } from '$/api/fourbyte.ts'
import { CollectionId } from '$/constants/collections.ts'
import type { EvmError } from '$/data/EvmError.ts'

const getKey = (row: EvmError) => row.$id.hex

export function normalizeEvmError4(hex: `0x${string}`) {
	const h = hex.toLowerCase().startsWith('0x') ? hex.slice(2).toLowerCase() : hex.toLowerCase()
	return `0x${h.padStart(8, '0').slice(-8)}` as `0x${string}`
}

export const evmErrorsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.EvmErrors,
		storageKey: CollectionId.EvmErrors,
		getKey: (row: EvmError) => getKey(row),
		parser: { stringify, parse },
	}),
)

function mergeSignatures(a: string[], b: string[]) {
	return [...new Set([...a, ...b])].sort()
}

export async function ensureEvmErrorSignatures(selector: `0x${string}`) {
	const hex = normalizeEvmError4(selector)
	if (evmErrorsCollection.state.get(hex)) return
	const sigs = await fetchErrorSignatures(hex)
	evmErrorsCollection.insert({
		$id: { hex },
		signatures: mergeSignatures(sigs, []),
	})
}
