/**
 * Profile management: local-first identity and data isolation.
 * Profiles are stored in `blockhead.v1:profiles` as a JSON blob
 * (not devalue — ProfilesMeta only contains primitives, and JSON
 * enables simple seeding from Playwright init scripts).
 */

import { goto } from '$app/navigation'
import { CollectionId } from '$/constants/collections.ts'
import {
	NetworkEnvironment,
} from '$/constants/network-environment.ts'
import {
	generatePeerDisplayName,
	peerNameToEmoji,
} from '$/lib/rooms/room.ts'

export type Profile = {
	id: string
	name: string
	emoji: string
	createdAt: number
	updatedAt: number
}

export type ProfilesMeta = {
	version: 1
	activeProfileId: string
	profiles: Profile[]
}

const PROFILES_KEY = 'blockhead.v1:profiles'

const nsKey = (profileId: string, storageKey: string) =>
	`blockhead.v1:${profileId}:${storageKey}`

export const nsKeyEnv = (
	profileId: string,
	env: NetworkEnvironment,
	storageKey: string,
) => `blockhead.v1:${profileId}:${env}:${storageKey}`

/**
 * All localStorage storageKey values that are profile-scoped.
 * Global/cached collections (actor-coins, stork-prices, etc.) are excluded.
 */
export const PROFILE_SCOPED_STORAGE_KEYS = [
	CollectionId.WalletConnections,
	CollectionId.TransactionSessions,
	CollectionId.WatchedEntities,
	CollectionId.DashboardPanels,
	CollectionId.AgentChatTrees,
	CollectionId.AgentChatTurns,
	CollectionId.LlmConnections,
	CollectionId.BridgeTransactions,
	CollectionId.TransactionSessionSimulations,
	CollectionId.EntitySources,
	CollectionId.RoomPersistentPeerId,
] as const

/**
 * Subset of profile-scoped keys that are namespaced by network environment
 * (mainnet/testnet). Archive key format: blockhead.v1:<profileId>:<env>:<key>.
 * Excludes wallet-connections, agent-chat-*, llm-connections, room-persistent-peer-id
 * (not environment-specific).
 */
export const NETWORK_ENVIRONMENT_SCOPED_STORAGE_KEYS = [
	CollectionId.TransactionSessions,
	CollectionId.BridgeTransactions,
	CollectionId.TransactionSessionSimulations,
] as const

const isEnvScoped = (key: string) =>
	(NETWORK_ENVIRONMENT_SCOPED_STORAGE_KEYS as readonly string[]).includes(key)


const isBrowser = () => typeof localStorage !== 'undefined'

// --- Read ---

export const getProfilesMeta = (): ProfilesMeta | null => {
	if (!isBrowser()) return null
	const raw = localStorage.getItem(PROFILES_KEY)
	if (raw == null) return null
	return JSON.parse(raw) as ProfilesMeta
}

const setProfilesMeta = (meta: ProfilesMeta) => {
	if (!isBrowser()) return
	localStorage.setItem(PROFILES_KEY, JSON.stringify(meta))
}

export const getActiveProfileId = (): string => (
	getProfilesMeta()?.activeProfileId ?? 'default'
)

export const getActiveProfile = (): Profile => {
	const meta = ensureProfilesMeta()
	const list = meta.profiles ?? defaultMetaStub().profiles
	return list.find((p) => p.id === meta.activeProfileId) ?? list[0]!
}

export const listProfiles = (): Profile[] => (
	ensureProfilesMeta().profiles ?? defaultMetaStub().profiles
)


// --- Boot / Migration ---

const createDefaultProfile = (): Profile => {
	const name = generatePeerDisplayName()
	return {
		id: 'default',
		name,
		emoji: peerNameToEmoji(name, 'default'),
		createdAt: Date.now(),
		updatedAt: Date.now(),
	}
}

const defaultMetaStub = (): ProfilesMeta => ({
	version: 1,
	activeProfileId: 'default',
	profiles: [{ id: 'default', name: 'Default', emoji: '👤', createdAt: 0, updatedAt: 0 }],
})

/**
 * Ensures ProfilesMeta exists. On first load, migrates existing
 * un-namespaced localStorage data into the default profile's namespace.
 * On server, returns a stub so SSR does not touch localStorage.
 */
export const ensureProfilesMeta = (): ProfilesMeta => {
	if (!isBrowser()) return defaultMetaStub()
	const existing = getProfilesMeta()
	if (existing) return existing

	const profile = createDefaultProfile()

	for (const key of PROFILE_SCOPED_STORAGE_KEYS) {
		const value = localStorage.getItem(key)
		if (value == null) continue
		const archiveKey = isEnvScoped(key)
			? nsKeyEnv('default', NetworkEnvironment.Mainnet, key)
			: nsKey('default', key)
		localStorage.setItem(archiveKey, value)
	}

	const meta: ProfilesMeta = {
		version: 1,
		activeProfileId: 'default',
		profiles: [profile],
	}
	setProfilesMeta(meta)
	return meta
}


// --- CRUD ---

export const createProfile = (
	overrides?: Partial<Pick<Profile, 'name' | 'emoji'>>,
): Profile => {
	const meta = ensureProfilesMeta()
	const name = overrides?.name ?? generatePeerDisplayName()
	const id = crypto.randomUUID()
	const profile: Profile = {
		id,
		name,
		emoji: overrides?.emoji ?? peerNameToEmoji(name, id),
		createdAt: Date.now(),
		updatedAt: Date.now(),
	}
	meta.profiles.push(profile)
	setProfilesMeta(meta)
	return profile
}

export const updateProfile = (
	id: string,
	updates: Partial<Pick<Profile, 'name' | 'emoji'>>,
) => {
	const meta = ensureProfilesMeta()
	const profile = meta.profiles.find((p) => p.id === id)
	if (!profile) return
	if (updates.name !== undefined) profile.name = updates.name
	if (updates.emoji !== undefined) profile.emoji = updates.emoji
	profile.updatedAt = Date.now()
	setProfilesMeta(meta)
}

export const deleteProfile = (
	id: string,
	currentNetworkEnv: NetworkEnvironment,
): boolean => {
	const meta = ensureProfilesMeta()
	if (meta.profiles.length <= 1) return false

	const needSwitch = meta.activeProfileId === id
	if (needSwitch) {
		const other = meta.profiles.find((p) => p.id !== id)!
		switchProfile(other.id, currentNetworkEnv)
	}

	const updatedMeta = ensureProfilesMeta()
	updatedMeta.profiles = updatedMeta.profiles.filter((p) => p.id !== id)
	setProfilesMeta(updatedMeta)

	for (const key of PROFILE_SCOPED_STORAGE_KEYS) {
		if (isEnvScoped(key)) {
			localStorage.removeItem(nsKeyEnv(id, NetworkEnvironment.Mainnet, key))
			localStorage.removeItem(nsKeyEnv(id, NetworkEnvironment.Testnet, key))
		} else localStorage.removeItem(nsKey(id, key))
	}

	return true
}


// --- Switch ---

const archiveKeyFor = (
	profileId: string,
	key: string,
	currentEnv: NetworkEnvironment,
) => (isEnvScoped(key) ? nsKeyEnv(profileId, currentEnv, key) : nsKey(profileId, key))

export const switchProfile = (
	newProfileId: string,
	currentNetworkEnv: NetworkEnvironment,
) => {
	if (!isBrowser()) return
	const meta = ensureProfilesMeta()
	const oldProfileId = meta.activeProfileId
	if (oldProfileId === newProfileId) return

	// 1. Archive: working copy → old profile's namespaced keys
	for (const key of PROFILE_SCOPED_STORAGE_KEYS) {
		const value = localStorage.getItem(key)
		const archiveKey = archiveKeyFor(oldProfileId, key, currentNetworkEnv)
		if (value != null) localStorage.setItem(archiveKey, value)
		else localStorage.removeItem(archiveKey)
	}

	// 2. Restore: new profile's namespaced keys → working copy
	for (const key of PROFILE_SCOPED_STORAGE_KEYS) {
		const archiveKey = archiveKeyFor(newProfileId, key, currentNetworkEnv)
		const value = localStorage.getItem(archiveKey)
		if (value != null) localStorage.setItem(key, value)
		else localStorage.removeItem(key)
	}

	// 3. Update active profile
	meta.activeProfileId = newProfileId
	setProfilesMeta(meta)

	// 4. Trigger re-sync: dispatch storage events so TanStack DB
	//    collections re-read from the updated working copy keys.
	for (const key of PROFILE_SCOPED_STORAGE_KEYS)
		window.dispatchEvent(new StorageEvent('storage', {
			key,
			storageArea: localStorage,
		}))

	// 5. Navigate to root (profile-scoped dynamic routes may be invalid)
	goto('/')
}

/**
 * Archives working copy to old env keys, restores from new env keys, dispatches
 * storage events. Caller must update global network environment state after.
 */
export const switchNetworkEnvironment = (
	oldEnv: NetworkEnvironment,
	newEnv: NetworkEnvironment,
) => {
	if (!isBrowser() || oldEnv === newEnv) return
	const profileId = getActiveProfileId()
	for (const key of NETWORK_ENVIRONMENT_SCOPED_STORAGE_KEYS) {
		const value = localStorage.getItem(key)
		if (value != null)
			localStorage.setItem(nsKeyEnv(profileId, oldEnv, key), value)
		else
			localStorage.removeItem(nsKeyEnv(profileId, oldEnv, key))
	}
	for (const key of NETWORK_ENVIRONMENT_SCOPED_STORAGE_KEYS) {
		const value = localStorage.getItem(nsKeyEnv(profileId, newEnv, key))
		if (value != null) localStorage.setItem(key, value)
		else localStorage.removeItem(key)
	}
	for (const key of NETWORK_ENVIRONMENT_SCOPED_STORAGE_KEYS)
		window.dispatchEvent(new StorageEvent('storage', {
			key,
			storageArea: localStorage,
		}))
}


// --- Export / Import ---

export type ProfileExport = {
	$format: 'blockhead-profile'
	$version: 1
	profile: Profile
	collections: Record<string, string>
}

export const exportProfile = (profileId: string) => {
	const meta = ensureProfilesMeta()
	const profile = meta.profiles.find((p) => p.id === profileId)
	if (!profile) return

	const isActive = meta.activeProfileId === profileId
	const collections: Record<string, string> = {}
	for (const key of PROFILE_SCOPED_STORAGE_KEYS) {
		const value = isActive
			? localStorage.getItem(key)
			: isEnvScoped(key)
				? localStorage.getItem(nsKeyEnv(profileId, NetworkEnvironment.Mainnet, key))
				: localStorage.getItem(nsKey(profileId, key))
		if (value != null) collections[key] = value
	}

	const data: ProfileExport = {
		$format: 'blockhead-profile',
		$version: 1,
		profile,
		collections,
	}

	const blob = new Blob([JSON.stringify(data, null, '\t')], { type: 'application/json' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = `${profile.name}.v1.blockhead.json`
	a.click()
	URL.revokeObjectURL(url)
}

export const importProfile = (file: File): Promise<Profile> => (
	file.text().then((text) => {
		const data = JSON.parse(text) as ProfileExport
		if (data.$format !== 'blockhead-profile')
			throw new Error('Invalid file format')
		if (data.$version !== 1)
			throw new Error(`Unsupported version: ${data.$version}`)

		const id = crypto.randomUUID()
		const profile: Profile = {
			...data.profile,
			id,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		}

		for (const [key, value] of Object.entries(data.collections)) {
			if (isEnvScoped(key)) {
				localStorage.setItem(nsKeyEnv(id, NetworkEnvironment.Mainnet, key), value)
				localStorage.setItem(nsKeyEnv(id, NetworkEnvironment.Testnet, key), value)
			} else localStorage.setItem(nsKey(id, key), value)
		}

		const meta = ensureProfilesMeta()
		meta.profiles.push(profile)
		setProfilesMeta(meta)
		return profile
	})
)
