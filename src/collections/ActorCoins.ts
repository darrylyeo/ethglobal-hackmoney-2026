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
import { erc20Instances, type Erc20Token } from '$/constants/coin-instances.ts'
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
	$coin: { $network: { chainId }, address: tokenAddress },
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
		const item = fullRow(balance, error)
		if (actorCoinsCollection.state.get(key))
			actorCoinsCollection.update(key, (draft) => {
				draft.$source = item.$source
				draft.balance = item.balance
				draft.isLoading = item.isLoading
				draft.error = item.error
			})
		else actorCoinsCollection.insert(item)
		return actorCoinsCollection.state.get(key) ?? item
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

const tokenChainId = (t: ActorCoinToken | Erc20Token) =>
	'$id' in t && t.$id ? t.$id.$network.chainId : t.contract.$network.chainId
const tokenAddress = (t: ActorCoinToken | Erc20Token) =>
	'$id' in t && t.$id ? t.$id.address : t.contract.address

export const fetchAllBalancesForAddress = async (
	address: `0x${string}`,
	chainIds?: ChainId[],
	tokens: readonly (ActorCoinToken | Erc20Token)[] = erc20Instances,
) => {
	const targetChainIds = chainIds ?? [
		...new Set(tokens.map((t) => tokenChainId(t))),
	]
	return await Promise.all(
		tokens
			.filter((t) => targetChainIds.includes(tokenChainId(t)))
			.map((token) =>
				fetchActorCoinBalance(
					toActorCoin$Id(
						tokenChainId(token),
						address,
						tokenAddress(token),
					),
					token.symbol,
					token.decimals,
				),
			),
	)
}
