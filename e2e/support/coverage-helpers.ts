import { stringify } from 'devalue'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import { toInteropName } from '$/constants/interop.ts'
import type { Session } from '$/data/Session.ts'

const encodeStorageKey = (key: string | number) =>
	typeof key === 'number' ? `n:${key}` : `s:${key}`

type StoredItem<T> = {
	versionKey: string
	data: T
}

export const buildLocalStoragePayload = <T>(
	rows: T[],
	getKey: (row: T) => string | number,
) => {
	const payload: Record<string, StoredItem<T>> = {}
	rows.forEach((row, index) => {
		payload[encodeStorageKey(getKey(row))] = {
			versionKey: `seed-${index + 1}`,
			data: row,
		}
	})
	return stringify(payload)
}

export const seedLocalStorageCollection = async (
	context: {
		addInitScript: (
			fn: (...args: unknown[]) => void,
			...args: unknown[]
		) => Promise<void>
	},
	storageKey: string,
	payload: string,
) => {
	await context.addInitScript(
		(key: string, value: string) => {
			localStorage.setItem(key, value)
		},
		storageKey,
		payload,
	)
}

export const seedLocalStorageCollectionViaPage = async (
	page: {
		goto: (url: string) => Promise<unknown>
		evaluate: <T>(
			fn: (arg: { key: string; value: string }) => T,
			arg: { key: string; value: string },
		) => Promise<T>
	},
	baseURL: string,
	storageKey: string,
	payload: string,
) => {
	await page.goto(baseURL)
	await page.evaluate(
		({ key, value }) => {
			localStorage.setItem(key, value)
		},
		{ key: storageKey, value: payload },
	)
}

export type SessionRow = Session & { $source: DataSource }

export type ActorCoinSeedRow = {
	$id: {
		$actor: { $network: { chainId: number }; address: `0x${string}`; interopAddress: string }
		$coin: { $network: { chainId: number }; address: `0x${string}`; interopAddress: string }
	}
	$source: DataSource
	symbol: string
	decimals: number
	balance: bigint
	isLoading: boolean
	error: string | null
}

export const buildActorCoinSeedRow = (
	chainId: number,
	actorAddress: `0x${string}`,
	tokenAddress: `0x${string}`,
	symbol: string,
	decimals: number,
	balance: bigint,
	overrides: Partial<ActorCoinSeedRow> = {},
): ActorCoinSeedRow => ({
	$id: {
		$actor: {
			$network: { chainId },
			address: actorAddress,
			interopAddress: toInteropName(chainId, actorAddress),
		},
		$coin: {
			$network: { chainId },
			address: tokenAddress,
			interopAddress: toInteropName(chainId, tokenAddress),
		},
	},
	$source: DataSource.Local,
	symbol,
	decimals,
	balance,
	isLoading: false,
	error: null,
	...overrides,
})

export const buildActorCoinsPayload = (rows: ActorCoinSeedRow[]): string =>
	buildLocalStoragePayload(rows, (row) => stringify(row.$id))

export const seedActorCoins = async (
	context: { addInitScript: (fn: (...args: unknown[]) => void, ...args: unknown[]) => Promise<void> },
	rows: ActorCoinSeedRow[],
) => {
	await seedLocalStorageCollection(
		context,
		CollectionId.ActorCoins,
		buildActorCoinsPayload(rows),
	)
}

export const buildSessionRow = (
	overrides: Partial<SessionRow> = {},
): SessionRow => {
	const now = 1_720_000_000_000
	return {
		id: 'session-seed',
		actions: [{ type: 'Bridge', params: {} }],
		status: 'Draft',
		createdAt: now,
		updatedAt: now,
		params: {},
		$source: DataSource.Local,
		...overrides,
	};
}
