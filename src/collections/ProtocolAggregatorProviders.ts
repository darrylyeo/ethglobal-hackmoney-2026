/**
 * Spandex provider names we configure. Normalized list for UI and consistency checks.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId } from '$/constants/data-sources.ts'
import { SpandexProviderId } from '$/constants/protocol-aggregator-providers.ts'
import type { SpandexProviderRow } from '$/data/ProtocolAggregatorProvider.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type SpandexProviderCollectionRow = SpandexProviderRow & {
	$source: DataSourceId
}

const initialRows: SpandexProviderCollectionRow[] = (
	[
		SpandexProviderId.Lifi,
		SpandexProviderId.Odos,
		SpandexProviderId.KyberSwap,
		SpandexProviderId.Relay,
	] as const
).map((id) => ({
	id,
	name: id,
	enabled: true,
	$source: DataSourceId.Spandex,
}))

export const spandexProvidersCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.SpandexProviders,
		getKey: (provider: SpandexProviderCollectionRow) => provider.id,
	}),
)

if (spandexProvidersCollection.state.size === 0) {
	for (const provider of initialRows) {
		spandexProvidersCollection.insert(provider)
	}
}
