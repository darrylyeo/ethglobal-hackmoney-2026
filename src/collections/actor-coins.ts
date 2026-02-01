/**
 * ActorCoin: Balance of a token for an address on a chain.
 * In-memory cache, no persistence needed.
 */

import { createCollection, localOnlyCollectionOptions } from '@tanstack/svelte-db'
import { stringify } from 'devalue'
import { ercTokens } from '$/constants/coins'
import { networksByChainId } from '$/constants/networks'
import { rpcUrls } from '$/constants/rpc-endpoints'
import { createHttpProvider, getErc20Balance } from '$/lib/voltaire'

export type ActorCoin$id = {
	chainId: number
	address: `0x${string}`
	tokenAddress: `0x${string}`
}

export type ActorCoinRow = {
	$id: ActorCoin$id
	symbol: string
	decimals: number
	balance: bigint
	isLoading: boolean
	error: string | null
}

export const actorCoinsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'actorCoins',
		getKey: (row: ActorCoinRow) => stringify(row.$id),
	}),
)

export const getActorCoin = ($id: ActorCoin$id) => (
	actorCoinsCollection.state.get(stringify($id))
)

export const fetchActorCoinBalance = async (
	$id: ActorCoin$id,
	symbol: string,
	decimals: number,
): Promise<ActorCoinRow> => {
	const key = stringify($id)
	const existing = actorCoinsCollection.state.get(key)

	// Set loading state
	if (existing) {
		actorCoinsCollection.update(key, (draft) => {
			draft.isLoading = true
			draft.error = null
		})
	} else {
		actorCoinsCollection.insert({
			$id,
			symbol,
			decimals,
			balance: 0n,
			isLoading: true,
			error: null,
		})
	}

	try {
		const rpcUrl = rpcUrls[$id.chainId]
		if (!rpcUrl) throw new Error(`No RPC URL for chain ${$id.chainId}`)
		const balance = await getErc20Balance(
			createHttpProvider(rpcUrl),
			$id.tokenAddress,
			$id.address,
		)
		actorCoinsCollection.update(key, (draft) => {
			draft.balance = balance
			draft.isLoading = false
			draft.error = null
		})
		return actorCoinsCollection.state.get(key)!
	} catch (e) {
		actorCoinsCollection.update(key, (draft) => {
			draft.isLoading = false
			draft.error = e instanceof Error ? e.message : String(e)
		})
		return actorCoinsCollection.state.get(key)!
	}
}

export const fetchAllBalancesForAddress = async (
	address: `0x${string}`,
	chainIds?: number[],
) => {
	const targetChainIds = chainIds ?? Object.keys(networksByChainId).map(Number)
	const tokens = ercTokens.filter((t) => targetChainIds.includes(t.chainId))
	return await Promise.all(
		tokens.map((token) => (
			fetchActorCoinBalance(
				{ chainId: token.chainId, address, tokenAddress: token.address },
				token.symbol,
				token.decimals,
			)
		)),
	)
}
