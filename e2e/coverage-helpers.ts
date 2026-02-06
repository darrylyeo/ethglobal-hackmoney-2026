import { stringify } from 'devalue'
import { DataSource } from '../src/constants/data-sources.js'
import type { TransactionSession } from '../src/data/TransactionSession.js'

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

export type TransactionSessionRow = TransactionSession & { $source: DataSource }

export const buildSessionRow = (
	overrides: Partial<TransactionSessionRow> = {},
): TransactionSessionRow => {
	const now = 1_720_000_000_000
	return {
		id: 'session-seed',
		actions: ['bridge'],
		status: 'Draft',
		createdAt: now,
		updatedAt: now,
		params: {},
		$source: DataSource.Local,
		...overrides,
	}
