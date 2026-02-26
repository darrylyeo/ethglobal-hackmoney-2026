import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { singleFlight } from '$/lib/singleFlight.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { FarcasterUser } from '$/data/FarcasterUser.ts'
import {
	fetchUserDataByFid,
	fetchUsernameProofsByFid,
	fetchVerificationsByFid,
} from '$/api/farcaster/index.ts'

export type FarcasterUserRow = FarcasterUser & { $source: DataSource }

const USER_DATA_TYPE = {
	PFP: 'USER_DATA_TYPE_PFP',
	DISPLAY: 'USER_DATA_TYPE_DISPLAY',
	BIO: 'USER_DATA_TYPE_BIO',
	URL: 'USER_DATA_TYPE_URL',
} as const

const getKey = (row: FarcasterUserRow) => `fid:${row.$id.fid}`

export const farcasterUsersCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.FarcasterUsers,
		storageKey: CollectionId.FarcasterUsers,
		getKey,
		parser: { stringify, parse },
	}),
)

export const ensureFarcasterUser = singleFlight(
	async (fid: number): Promise<FarcasterUserRow> => {
		const key = `fid:${fid}`
		const existing = farcasterUsersCollection.state.get(key) as
			| FarcasterUserRow
			| undefined
		if (existing) return existing

		const [userDataRes, proofsRes, verificationsRes] = await Promise.all([
			fetchUserDataByFid(fid),
			fetchUsernameProofsByFid(fid),
			fetchVerificationsByFid(fid).catch(() => ({ messages: [] })),
		])

		const user: FarcasterUserRow = {
			$id: { fid },
			$source: DataSource.Farcaster,
		}

		for (const m of userDataRes.messages ?? []) {
			const type = m.data?.userDataBody?.type
			const value = m.data?.userDataBody?.value
			if (!value) continue
			if (type === USER_DATA_TYPE.PFP) user.pfpUrl = value
			else if (type === USER_DATA_TYPE.DISPLAY) user.displayName = value
			else if (type === USER_DATA_TYPE.BIO) user.bio = value
			else if (type === USER_DATA_TYPE.URL) (user as Record<string, unknown>).url = value
		}

		const fname = proofsRes.proofs?.[0]?.name
		if (fname) (user as FarcasterUserRow).username = fname

		const addr =
			verificationsRes.messages?.[0]?.data?.verificationAddEthAddressBody?.address
		if (addr) (user as FarcasterUserRow).verifiedAddress = addr

		farcasterUsersCollection.insert(user)
		return user
	},
)
