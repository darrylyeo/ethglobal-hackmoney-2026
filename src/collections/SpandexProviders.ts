/**
 * Spandex provider names we configure. Normalized list for UI and consistency checks.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { SpandexProviderRow } from '$/data/SpandexProvider.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type SpandexProviderCollectionRow = SpandexProviderRow & {
	$source: DataSource
}

const PROVIDER_IDS = [
	'lifi',
	'odos',
	'kyberswap',
	'relay',
] as const

const initialRows: SpandexProviderCollectionRow[] = PROVIDER_IDS.map(
	(name) => ({
		id: name,
		name,
		enabled: true,
		$source: DataSource.Spandex,
	}),
)

export const spandexProvidersCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.SpandexProviders,
		getKey: (row: SpandexProviderCollectionRow) => row.id,
	}),
)

if (spandexProvidersCollection.state.size === 0) {
	for (const row of initialRows) {
		spandexProvidersCollection.insert(row)
	}
}
