/**
 * ActorCoin: Balance of a token for an address on a chain.
 * Persisted to localStorage across sessions.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { getErc20Balance } from '$/api/voltaire.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import { ercTokens } from '$/constants/coins.ts'
import type { ChainId } from '$/constants/networks.ts'
import { toInteropName } from '$/constants/interop.ts'
import { createProviderForChain } from '$/lib/helios-rpc.ts'
import type { ActorCoin, ActorCoin$Id, ActorCoinToken } from '$/data/ActorCoin.ts'

export type ActorCoinRow = ActorCoin & { $source: DataSource }

const actorCoinKeyParts = (id: ActorCoin$Id) => stringify(id)

const actorCoinKey = (row: ActorCoinRow) => actorCoinKeyParts(row.$id)

export const actorCoinsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.ActorCoins,
		storageKey: CollectionId.ActorCoins,
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
	$actor: {
		$network: { chainId },
		address,
		interopAddress: toInteropName(chainId, address),
	},
	$coin: {
		$network: { chainId },
		address: tokenAddress,
		interopAddress: toInteropName(chainId, tokenAddress),
	},
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
			$id,
			$source: DataSource.Voltaire,
			symbol,
			decimals,
			balance: 0n,
			isLoading: true,
			error: null,
		})
	}

	const fullRow = (balance: bigint, error: string | null): ActorCoinRow => ({
		$id,
		$source: DataSource.Voltaire,
		symbol,
		decimals,
		balance,
		isLoading: false,
		error,
	})
	const upsertResult = (balance: bigint, error: string | null) => {
		const row = fullRow(balance, error)
		if (actorCoinsCollection.state.get(key))
			actorCoinsCollection.update(key, (draft) => {
				draft.$source = row.$source
				draft.balance = row.balance
				draft.isLoading = row.isLoading
				draft.error = row.error
			})
		else actorCoinsCollection.insert(row)
		return actorCoinsCollection.state.get(key) ?? row
	}
	try {
		const chainId = $id.$actor.$network.chainId
		const balance = await getErc20Balance(
			createProviderForChain(chainId),
			$id.$coin.address,
			$id.$actor.address,
		)
		return upsertResult(balance, null)
	} catch (e) {
		return upsertResult(
			0n,
			e instanceof Error ? e.message : String(e),
		)
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
