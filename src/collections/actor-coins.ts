/**
 * ActorCoin: Balance of a token for an address on a chain.
 * Persisted to localStorage across sessions.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { createHttpProvider, getErc20Balance } from '$/api/voltaire.ts'
import { DataSource } from '$/constants/data-sources.ts'
import { ercTokens } from '$/constants/coins.ts'
import type { ChainId } from '$/constants/networks.ts'
import { toInteropName } from '$/constants/interop.ts'
import { rpcUrls } from '$/constants/rpc-endpoints.ts'
import type { ActorCoin, ActorCoin$Id, ActorCoinToken } from '$/data/ActorCoin.ts'

export type ActorCoinRow = ActorCoin & { $source: DataSource }

const actorCoinKeyParts = (
	id: Pick<ActorCoin$Id, 'chainId' | 'address' | 'tokenAddress'>,
) =>
	stringify({
		chainId: id.chainId,
		address: id.address,
		tokenAddress: id.tokenAddress,
	})

const actorCoinKey = (row: ActorCoinRow) => actorCoinKeyParts(row.$id)

export const actorCoinsCollection = createCollection(
	localStorageCollectionOptions({
		id: 'actorCoins',
		storageKey: 'actor-coins',
		getKey: actorCoinKey,
		parser: { stringify, parse },
	}),
)

export const getActorCoin = ($id: ActorCoin$Id) =>
	actorCoinsCollection.state.get(actorCoinKeyParts($id))

export const toActorCoin$Id = (
	chainId: number,
	address: `0x${string}`,
	tokenAddress: `0x${string}`,
): ActorCoin$Id => ({
	chainId,
	address,
	tokenAddress,
	interopAddress: toInteropName(chainId, address),
})

export const fetchActorCoinBalance = async (
	$id: ActorCoin$Id,
	symbol: string,
	decimals: number,
): Promise<ActorCoinRow> => {
	const key = actorCoinKeyParts($id)

	// Set loading state
	if (actorCoinsCollection.state.get(key)) {
		actorCoinsCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
			draft.isLoading = true
			draft.error = null
		})
	} else {
		actorCoinsCollection.insert({
			$id: {
				...$id,
				interopAddress:
					$id.interopAddress ?? toInteropName($id.chainId, $id.address),
			},
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
	chainIds?: ChainId[],
	tokens: readonly ActorCoinToken[] = ercTokens,
) => {
	const targetChainIds = chainIds ?? [
		...new Set(tokens.map((token) => token.chainId)),
	]
	return await Promise.all(
		tokens
			.filter((token) => targetChainIds.includes(token.chainId))
			.map((token) =>
				fetchActorCoinBalance(
					toActorCoin$Id(token.chainId, address, token.address),
					token.symbol,
					token.decimals,
				),
			),
	)
}
