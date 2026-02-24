/**
 * Evm topics (32-byte event) + Evm event signatures from OpenChain + 4byte.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { fetchEventSignatures as fetchOpenchain } from '$/api/openchain.ts'
import { fetchEventSignatures as fetchFourbyte } from '$/api/fourbyte.ts'
import { CollectionId } from '$/constants/collections.ts'
import type { EvmTopic } from '$/data/EvmTopic.ts'

const getKey = (row: EvmTopic) => row.$id.hex

export function normalizeEvmTopic32(hex: `0x${string}`) {
	const h = hex.toLowerCase().startsWith('0x') ? hex.slice(2).toLowerCase() : hex.toLowerCase()
	return `0x${h.padStart(64, '0').slice(-64)}` as `0x${string}`
}

export const evmTopicsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.EvmTopics,
		storageKey: CollectionId.EvmTopics,
		getKey: (row: EvmTopic) => getKey(row),
		parser: { stringify, parse },
	}),
)

function mergeSignatures(a: string[], b: string[]) {
	return [...new Set([...a, ...b])].sort()
}

export async function ensureEvmEventSignatures(topicHash: `0x${string}`) {
	const hex = normalizeEvmTopic32(topicHash)
	if (evmTopicsCollection.state.get(hex)) return
	const [open, four] = await Promise.all([
		fetchOpenchain(hex),
		fetchFourbyte(hex),
	])
	evmTopicsCollection.insert({
		$id: { hex },
		signatures: mergeSignatures(open, four),
	})
}
