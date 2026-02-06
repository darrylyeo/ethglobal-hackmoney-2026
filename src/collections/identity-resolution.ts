/**
 * Identity resolution collection: normalized identity input and resolved
 * payloads (address, name, text records). Uses TanStack DB; resolution
 * loading/error state is query/mutation state, not persisted on the entity.
 */

import { DataSource } from '$/constants/data-sources'
import type { IdentityResolution } from '$/constants/identity-resolver'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'

export type IdentityResolutionRow = IdentityResolution & { $source: DataSource }

export const identityResolutionCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'identity-resolution',
		getKey: (row: IdentityResolutionRow) => row.id,
	}),
)
