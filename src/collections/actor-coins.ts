/**
 * ActorCoin: Balance of a token for an address on a chain.
 * In-memory cache, no persistence needed.
 */

import {
	createCollection,
	localOnlyCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify } from 'devalue'
import { DataSource } from '$/constants/data-sources'
import { ercTokens } from '$/constants/coins'
import type { ActorCoin, ActorCoin$Id, ActorCoinToken } from '$/data/ActorCoin'
import { rpcUrls } from '$/constants/rpc-endpoints'
import { createHttpProvider, getErc20Balance } from '$/api/voltaire'

export type ActorCoinRow = ActorCoin & { $source: DataSource }

export const actorCoinsCollection = createCollection(
	localOnlyCollectionOptions({
		id: 'actorCoins',
		getKey: (row: ActorCoinRow) => stringify(row.$id),
	}),
)

export const getActorCoin = ($id: ActorCoin$Id) =>
	actorCoinsCollection.state.get(stringify($id))

export const fetchActorCoinBalance = async (
	$id: ActorCoin$Id,
	symbol: string,
	decimals: number,
): Promise<ActorCoinRow> => {
	const key = stringify($id)
	const existing = actorCoinsCollection.state.get(key)

	// Set loading state
	if (existing) {
		actorCoinsCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
			draft.isLoading = true
			draft.error = null
		})
	} else {
		actorCoinsCollection.insert({
			$id,
			$source: DataSource.Voltaire,
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
			draft.$source = DataSource.Voltaire
			draft.balance = balance
			draft.isLoading = false
			draft.error = null
		})
		return actorCoinsCollection.state.get(key)!
	} catch (e) {
		actorCoinsCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
			draft.isLoading = false
			draft.error = e instanceof Error ? e.message : String(e)
		})
		return actorCoinsCollection.state.get(key)!
	}
}

export const fetchAllBalancesForAddress = async (
	address: `0x${string}`,
	chainIds?: number[],
	tokens: readonly ActorCoinToken[] = ercTokens,
) => {
	const targetChainIds =
		chainIds ?? [...new Set(tokens.map((token) => token.chainId))]
	return await Promise.all(
		tokens
			.filter((token) => targetChainIds.includes(token.chainId))
			.map((token) =>
				fetchActorCoinBalance(
					{ chainId: token.chainId, address, tokenAddress: token.address },
					token.symbol,
					token.decimals,
				),
			),
	)
}
