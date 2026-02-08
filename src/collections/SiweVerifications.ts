/**
 * SIWE verifications collection: per-peer verification requests/outcomes (separate from shared-addresses).
 * Peers may request verification multiple times per address.
 */

import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import type { Verification } from '$/data/Verification.ts'

export type VerificationRow = Verification & { $source: DataSource }

export const siweVerificationsCollection = createCollection(
	localOnlyCollectionOptions({
		id: CollectionId.SiweVerifications,
		getKey: (row: VerificationRow) => row.id,
	}),
)

export const verificationKey = (
	roomId: string,
	verifierPeerId: string,
	verifiedPeerId: string,
	address: `0x${string}`,
	requestedAt: number,
) =>
	`${roomId}:${verifierPeerId}:${verifiedPeerId}:${address.toLowerCase()}:${requestedAt}`
