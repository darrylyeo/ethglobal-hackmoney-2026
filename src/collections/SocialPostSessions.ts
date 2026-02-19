/**
 * Social post sessions: draft/create and reply-to post flows.
 * Protocol: Farcaster. Persisted to localStorage, profile-scoped.
 * Parallel to Sessions (transaction sessions). Mirror Action/actionTypes enum structure.
 */

import { CollectionId } from '$/constants/collections.ts'
import {
	createSocialPostAction,
	SocialPostActionType,
} from '$/constants/social-post-actions.ts'
import { SocialProtocol } from '$/constants/social-post-actions.ts'
import type { SocialPostSession } from '$/data/SocialPostSession.ts'
import { SocialPostSessionStatus } from '$/data/SocialPostSession.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type SocialPostSessionRow = SocialPostSession

export const socialPostSessionsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.SocialPostSessions,
		storageKey: CollectionId.SocialPostSessions,
		getKey: (row: SocialPostSessionRow) => row.id,
		parser: { stringify, parse },
	}),
)

const createSessionId = () =>
	globalThis.crypto?.randomUUID?.() ??
	`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export const createSocialPostSession = (
	template: SocialPostActionType,
	protocol: SocialProtocol,
	authorId: number,
	params?: Record<string, unknown>,
): SocialPostSessionRow => {
	const now = Date.now()
	const action = createSocialPostAction(template, params as Record<string, unknown>)
	return {
		id: createSessionId(),
		name: undefined,
		actions: [action],
		status: SocialPostSessionStatus.Draft,
		protocol,
		authorId,
		createdAt: now,
		updatedAt: now,
		params: { ...action.params },
	}
}

export const updateSocialPostSession = (
	id: string,
	updater: (draft: SocialPostSessionRow) => void,
) => {
	const key = id
	const existing = socialPostSessionsCollection.state.get(key)
	if (!existing) return
	socialPostSessionsCollection.update(key, (draft) => {
		updater(draft as SocialPostSessionRow)
		;(draft as SocialPostSessionRow).updatedAt = Date.now()
	})
}

export const getSocialPostSession = (id: string): SocialPostSessionRow | undefined =>
	socialPostSessionsCollection.state.get(id) as SocialPostSessionRow | undefined

export const deleteSocialPostSession = (id: string) => {
	socialPostSessionsCollection.delete(id)
}
