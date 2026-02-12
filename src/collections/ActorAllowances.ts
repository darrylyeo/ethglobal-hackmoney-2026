/**
 * ActorAllowance: ERC20 approval state for an actor/token/spender.
 * Tracks on-chain allowances to avoid redundant approval transactions.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify, parse } from 'devalue'
import { createHttpProvider, getErc20Allowance } from '$/api/voltaire.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import { toInteropName } from '$/constants/interop.ts'
import { rpcUrls } from '$/constants/rpc-endpoints.ts'
import type { ActorAllowance, ActorAllowance$Id } from '$/data/ActorAllowance.ts'

export type ActorAllowanceRow = ActorAllowance & { $source: DataSource }

const allowanceKeyParts = (id: ActorAllowance$Id) =>
	stringify({
		chainId: id.$actorCoin.$actor.$network.chainId,
		address: id.$actorCoin.$actor.address,
		tokenAddress: id.$actorCoin.$coin.address,
		spenderAddress: id.$spender.address,
	})

export const actorAllowancesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.ActorAllowances,
		storageKey: CollectionId.ActorAllowances,
		getKey: (row: ActorAllowanceRow) => allowanceKeyParts(row.$id),
		parser: { stringify, parse },
	}),
)

for (const [key, row] of actorAllowancesCollection.state) {
	if (row.$source !== DataSource.Voltaire) {
		actorAllowancesCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
		})
	}
}

export const toActorAllowance$Id = (
	chainId: number,
	address: `0x${string}`,
	tokenAddress: `0x${string}`,
	spenderAddress: `0x${string}`,
): ActorAllowance$Id => ({
	$actorCoin: {
		$actor: { $network: { chainId }, address },
		$coin: { $network: { chainId }, address: tokenAddress },
	},
	$spender: { $network: { chainId }, address: spenderAddress },
	interopAddress: toInteropName(chainId, address),
})

export const getActorAllowance = ($id: ActorAllowance$Id) =>
	actorAllowancesCollection.state.get(allowanceKeyParts($id))

export const fetchActorAllowance = async (
	$id: ActorAllowance$Id,
): Promise<ActorAllowanceRow> => {
	const key = allowanceKeyParts($id)
	const existing = actorAllowancesCollection.state.get(key)

	// Set loading state
	if (existing) {
		actorAllowancesCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
			draft.isLoading = true
			draft.error = null
		})
	} else {
		const full$id: ActorAllowance$Id = {
			...$id,
			interopAddress:
				$id.interopAddress
					?? toInteropName(
							$id.$actorCoin.$actor.$network.chainId,
							$id.$actorCoin.$actor.address,
						),
		}
		actorAllowancesCollection.insert({
			$id: full$id,
			$source: DataSource.Voltaire,
			allowance: 0n,
			isLoading: true,
			error: null,
			lastChecked: Date.now(),
		})
	}

	try {
		const chainId = $id.$actorCoin.$actor.$network.chainId
		const rpcUrl = rpcUrls[chainId]
		if (!rpcUrl) throw new Error(`No RPC URL for chain ${chainId}`)

		const allowance = await getErc20Allowance(
			createHttpProvider(rpcUrl),
			$id.$actorCoin.$coin.address,
			$id.$actorCoin.$actor.address,
			$id.$spender.address,
		)

		actorAllowancesCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
			draft.allowance = allowance
			draft.isLoading = false
			draft.error = null
			draft.lastChecked = Date.now()
		})
		return actorAllowancesCollection.state.get(key)!
	} catch (e) {
		actorAllowancesCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
			draft.isLoading = false
			draft.error = (
				e instanceof Error
					? e.message
					: String(e)
			)
			draft.lastChecked = Date.now()
		})
		return actorAllowancesCollection.state.get(key)!
	}
}

// Check if allowance is sufficient for amount
export const hasApproval = ($id: ActorAllowance$Id, amount: bigint) => {
	const row = getActorAllowance($id)
	return (
		row
			? row.allowance >= amount
			: false
	)
}

// Update allowance after successful approval tx (optimistic)
export const setActorAllowance = (
	$id: ActorAllowance$Id,
	allowance: bigint,
) => {
	const key = allowanceKeyParts($id)
	const full$id: ActorAllowance$Id = {
		...$id,
		interopAddress:
			$id.interopAddress
				?? toInteropName(
						$id.$actorCoin.$actor.$network.chainId,
						$id.$actorCoin.$actor.address,
					),
	}
	const existing = actorAllowancesCollection.state.get(key)
	if (existing) {
		actorAllowancesCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
			draft.allowance = allowance
			draft.lastChecked = Date.now()
		})
	} else {
		actorAllowancesCollection.insert({
			$id: full$id,
			$source: DataSource.Voltaire,
			allowance,
			isLoading: false,
			error: null,
			lastChecked: Date.now(),
		})
	}
}
