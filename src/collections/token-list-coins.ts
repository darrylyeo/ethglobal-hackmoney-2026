import { createCollection } from '@tanstack/svelte-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { tokenListUrls } from '$/constants/token-lists'
import { normalizeAddress } from '$/lib/address'
import { queryClient } from '$/lib/db/query-client'

export type TokenListCoin$id = {
	chainId: number
	address: `0x${string}`
}

export type TokenListCoinRow = {
	$id: TokenListCoin$id
	chainId: number
	address: `0x${string}`
	symbol: string
	name: string
	decimals: number
	logoURI?: string
}

type TokenListEntry = {
	chainId: number
	address: string
	symbol: string
	name: string
	decimals: number
	logoURI?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null

const toTokenListEntry = (value: unknown): TokenListEntry | null => {
	if (!isRecord(value)) return null
	const { chainId, address, symbol, name, decimals, logoURI } = value
	if (typeof chainId !== 'number' || !Number.isInteger(chainId)) return null
	if (typeof address !== 'string') return null
	if (typeof symbol !== 'string') return null
	if (typeof name !== 'string') return null
	if (typeof decimals !== 'number' || !Number.isInteger(decimals)) return null
	if (logoURI !== undefined && typeof logoURI !== 'string') return null
	return { chainId, address, symbol, name, decimals, logoURI }
}

const normalizeTokenListEntry = (
	entry: TokenListEntry,
): TokenListCoinRow | null => {
	const normalized = normalizeAddress(entry.address)
	if (!normalized) return null
	return {
		$id: {
			chainId: entry.chainId,
			address: normalized,
		},
		chainId: entry.chainId,
		address: normalized,
		symbol: entry.symbol,
		name: entry.name,
		decimals: entry.decimals,
		logoURI: entry.logoURI,
	}
}

const fetchTokenList = async (url: string): Promise<TokenListEntry[]> => {
	const response = await fetch(url)
	if (!response.ok) {
		throw new Error(`Failed token list fetch: ${url}`)
	}
	const data = await response.json()
	if (!isRecord(data) || !Array.isArray(data.tokens)) return []
	return data.tokens
		.map(toTokenListEntry)
		.filter((entry): entry is TokenListEntry => entry !== null)
}

const fetchTokenListEntries = async (): Promise<TokenListCoinRow[]> => {
	const results = await Promise.allSettled(tokenListUrls.map(fetchTokenList))
	const rows = results
		.filter(
			(result): result is PromiseFulfilledResult<TokenListEntry[]> =>
				result.status === 'fulfilled',
		)
		.flatMap((result) => result.value)
		.map(normalizeTokenListEntry)
		.filter((entry): entry is TokenListCoinRow => entry !== null)
	const unique = new Map<string, TokenListCoinRow>()
	for (const row of rows) {
		unique.set(`${row.chainId}-${row.address}`, row)
	}
	return [...unique.values()]
}

export const tokenListCoinsCollection = createCollection(
	queryCollectionOptions({
		id: 'token-list-coins',
		queryKey: ['token-list-coins'],
		queryFn: fetchTokenListEntries,
		queryClient,
		getKey: (row: TokenListCoinRow) =>
			`${row.chainId}-${row.address.toLowerCase()}`,
	}),
)
