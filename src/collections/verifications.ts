/**
 * Verifications collection: per-peer verification requests/outcomes (separate from shared-addresses).
 * Peers may request verification multiple times per address.
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'
import type { Verification } from '$/data/Verification'

export type VerificationRow = Verification & { $source: DataSource }

export const verificationsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'verifications',
		getKey: (row: VerificationRow) => row.id,
	}),
)

export { verificationKey } from './verifications-keys'
