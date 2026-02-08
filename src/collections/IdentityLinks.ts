/**
 * Identity links collection: normalized identity input and resolved
 * payloads (address, name, text records). Uses TanStack DB; resolution
 * loading/error state is query/mutation state, not persisted on the entity.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { IdentityResolution } from '$/constants/identity-resolver.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type IdentityLinkRow = IdentityResolution & { $source: DataSource }

export const identityLinksCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.IdentityLinks,
		getKey: (row: IdentityLinkRow) => row.id,
	}),
)
