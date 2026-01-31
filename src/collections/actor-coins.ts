/**
 * ActorCoin: Balance of a coin for an actor (account on a specific chain).
 * $id: { actor: Actor$id, coin: Coin$id }
 */

import { createCollection } from '@tanstack/svelte-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { queryClient } from '$/lib/db/query-client'
import { ercTokens } from '$/constants/coins'
import { networksByChainId } from '$/constants/networks'
import { rpcUrls } from '$/constants/rpc-endpoints'
import { createHttpProvider, getErc20Balance } from '$/lib/voltaire'
import type { Actor$id } from './actors'
import type { Coin$id } from './coins'

export type ActorCoin$id = { actor: Actor$id; coin: Coin$id }

export type ActorCoin = {
	$id: ActorCoin$id
	chainId: number
	address: `0x${string}`
	coinAddress: `0x${string}`
	coinSymbol: string
	coinDecimals: number
	balance: bigint
	balanceFormatted: string
	isLoading: boolean
	error: string | null
}

export const actorCoinKey = (
	chainId: number,
	address: `0x${string}`,
	coinAddress: `0x${string}`,
) => (
	`${chainId}-${address.toLowerCase()}-${coinAddress.toLowerCase()}`
)

export const actorCoinsCollection = createCollection(
	queryCollectionOptions({
		id: 'actorCoins',
		queryKey: ['actorCoins'],
		queryFn: () => Promise.resolve<ActorCoin[]>([]),
		queryClient,
		getKey: (row: ActorCoin) => (
			actorCoinKey(
				row.$id.actor.network,
				row.$id.actor.address,
				row.$id.coin.address,
			)
		),
	}),
)

const formatBalance = (balance: bigint, decimals: number) => {
	const divisor = 10n ** BigInt(decimals)
	const integerPart = balance / divisor
	const fractionalPart = balance % divisor
	const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(
		0,
		4,
	)
	return `${integerPart}.${fractionalStr}`
}

export const fetchActorCoinBalance = async (
	chainId: number,
	address: `0x${string}`,
	coinAddress: `0x${string}`,
	coinSymbol: string,
	coinDecimals: number,
): Promise<ActorCoin> => {
	const $id: ActorCoin$id = {
		actor: { network: chainId, address },
		coin: { network: chainId, address: coinAddress },
	}
	const key = actorCoinKey(chainId, address, coinAddress)
	const existing = actorCoinsCollection.state.get(key)
	const placeholder: ActorCoin = {
		$id,
		chainId,
		address,
		coinAddress,
		coinSymbol,
		coinDecimals,
		balance: existing?.balance ?? 0n,
		balanceFormatted: existing?.balanceFormatted ?? '0.0000',
		isLoading: true,
		error: null,
	}
	actorCoinsCollection.insert(placeholder)
	try {
		const rpcUrl = rpcUrls[chainId]
		if (!rpcUrl) throw new Error(`No RPC URL for chain ${chainId}`)
		const provider = createHttpProvider(rpcUrl)
		const balance = await getErc20Balance(provider, coinAddress, address)
		const result: ActorCoin = {
			...placeholder,
			balance,
			balanceFormatted: formatBalance(balance, coinDecimals),
			isLoading: false,
		}
		actorCoinsCollection.insert(result)
		return result
	} catch (e) {
		const result: ActorCoin = {
			...placeholder,
			isLoading: false,
			error: e instanceof Error ? e.message : String(e),
		}
		actorCoinsCollection.insert(result)
		return result
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
				token.chainId,
				address,
				token.address,
				token.symbol,
				token.decimals,
			)
		)),
	)
}
