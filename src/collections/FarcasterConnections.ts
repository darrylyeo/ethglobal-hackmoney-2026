/**
 * Farcaster connections: SIWF-signed or watched Farcaster accounts.
 * Persisted to localStorage, profile-scoped. Multiple accounts per profile.
 */

import { CollectionId } from '$/constants/collections.ts'
import { useLiveQuery } from '@tanstack/svelte-db'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import type {
	FarcasterConnectionRow,
	FarcasterConnectionSiwf,
	FarcasterConnectionWatch,
} from '$/data/FarcasterConnection.ts'
import { FarcasterConnectionTransport } from '$/data/FarcasterConnection.ts'
import type { FarcasterAuthUser } from '$/state/farcaster-auth.svelte.ts'

const getKey = (connection: FarcasterConnectionRow) => `fid:${connection.$id.fid}`

export const farcasterConnectionsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.FarcasterConnections,
		storageKey: CollectionId.FarcasterConnections,
		getKey,
		parser: { stringify, parse },
	}),
)

export const addFarcasterConnectionSiwf = (
	user: FarcasterAuthUser,
	autoSelect = true,
) => {
	const key = getKey({ $id: { fid: user.fid } })
	const existing = farcasterConnectionsCollection.state.get(key)
	const connection: FarcasterConnectionSiwf = {
		$id: { fid: user.fid },
		transport: FarcasterConnectionTransport.Siwf,
		username: user.username,
		displayName: user.displayName,
		pfpUrl: user.pfpUrl,
		bio: user.bio,
		selected: autoSelect,
		connectedAt: Date.now(),
		signedAt: user.signedAt,
	}
	if (autoSelect) {
		for (const [k, conn] of farcasterConnectionsCollection.state) {
			if (conn.selected && k !== key) {
				farcasterConnectionsCollection.update(k, (draft) => {
					draft.selected = false
				})
			}
		}
	}
	if (existing) {
		farcasterConnectionsCollection.update(key, (draft) => {
			Object.assign(draft, connection)
		})
	} else {
		farcasterConnectionsCollection.insert(connection)
	}
}

export const addFarcasterConnectionWatch = (
	fid: number,
	profile?: { username?: string; displayName?: string; pfpUrl?: string },
	autoSelect = true,
) => {
	const key = getKey({ $id: { fid } })
	if (farcasterConnectionsCollection.state.get(key)) return
	const connection: FarcasterConnectionWatch = {
		$id: { fid },
		transport: FarcasterConnectionTransport.Watch,
		username: profile?.username,
		displayName: profile?.displayName,
		pfpUrl: profile?.pfpUrl,
		selected: autoSelect,
		connectedAt: Date.now(),
	}
	if (autoSelect) {
		for (const [k, conn] of farcasterConnectionsCollection.state) {
			if (conn.selected) {
				farcasterConnectionsCollection.update(k, (draft) => {
					draft.selected = false
				})
			}
		}
	}
	farcasterConnectionsCollection.insert(connection)
}

export const removeFarcasterConnection = (fid: number) => {
	farcasterConnectionsCollection.delete(getKey({ $id: { fid } }))
}

export const selectFarcasterConnection = (fid: number) => {
	const targetKey = getKey({ $id: { fid } })
	for (const [key, conn] of farcasterConnectionsCollection.state) {
		farcasterConnectionsCollection.update(key, (draft) => {
			draft.selected = key === targetKey
		})
	}
}

export const useFarcasterConnections = () =>
	useLiveQuery(
		(q) =>
			q
				.from({ farcasterConnection: farcasterConnectionsCollection })
				.select(({ farcasterConnection }) => ({ farcasterConnection })),
		[],
	)
