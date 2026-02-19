/**
 * Sign in with Farcaster (SIWF) auth state.
 * Stored in localStorage. Profile-scoped via getActiveProfileId().
 */

import { getActiveProfileId } from '$/lib/profile.ts'

const STORAGE_KEY = 'blockhead.v1:farcasterAuth'

export type FarcasterAuthUser = {
	fid: number
	username?: string
	displayName?: string
	pfpUrl?: string
	bio?: string
	verifications?: string[]
	custody?: `0x${string}`
	authMethod?: 'custody' | 'authAddress'
	signedAt: number
}

const nsKey = () => `${STORAGE_KEY}:${getActiveProfileId()}`

export const getFarcasterAuthUser = (): FarcasterAuthUser | null => {
	if (typeof localStorage === 'undefined') return null
	const raw = localStorage.getItem(nsKey())
	if (!raw) return null
	try {
		return JSON.parse(raw) as FarcasterAuthUser
	} catch {
		return null
	}
}

const listeners = new Set<() => void>()

export const setFarcasterAuthUser = (user: FarcasterAuthUser) => {
	if (typeof localStorage === 'undefined') return
	localStorage.setItem(nsKey(), JSON.stringify(user))
	listeners.forEach((fn) => fn())
}

export const clearFarcasterAuthUser = () => {
	if (typeof localStorage === 'undefined') return
	localStorage.removeItem(nsKey())
	listeners.forEach((fn) => fn())
}

export const subscribeFarcasterAuth = (fn: () => void) => {
	listeners.add(fn)
	return () => { listeners.delete(fn) }
}
