/**
 * ActorAllowance: ERC20 approval state for an actor/token/spender.
 * Tracks on-chain allowances to avoid redundant approval transactions.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify, parse } from 'devalue'
import { DataSource } from '$/constants/data-sources'
import type { ActorAllowance, ActorAllowance$Id } from '$/data/ActorAllowance'
import { rpcUrls } from '$/constants/rpc-endpoints'
import { createHttpProvider, getErc20Allowance } from '$/api/voltaire'

export type ActorAllowanceRow = ActorAllowance & { $source: DataSource }

export const actorAllowancesCollection = createCollection(
	localStorageCollectionOptions({
		id: 'actorAllowances',
		storageKey: 'actor-allowances',
		getKey: (row: ActorAllowanceRow) => stringify(row.$id),
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

export const getActorAllowance = ($id: ActorAllowance$Id) =>
	actorAllowancesCollection.state.get(stringify($id))

export const fetchActorAllowance = async (
	$id: ActorAllowance$Id,
): Promise<ActorAllowanceRow> => {
	const key = stringify($id)
	const existing = actorAllowancesCollection.state.get(key)

	// Set loading state
	if (existing) {
		actorAllowancesCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
			draft.isLoading = true
			draft.error = null
		})
	} else {
		actorAllowancesCollection.insert({
			$id,
			$source: DataSource.Voltaire,
			allowance: 0n,
			isLoading: true,
			error: null,
			lastChecked: Date.now(),
		})
	}

	try {
		const rpcUrl = rpcUrls[$id.chainId]
		if (!rpcUrl) throw new Error(`No RPC URL for chain ${$id.chainId}`)

		const allowance = await getErc20Allowance(
			createHttpProvider(rpcUrl),
			$id.tokenAddress,
			$id.address,
			$id.spenderAddress,
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
			draft.error = e instanceof Error ? e.message : String(e)
			draft.lastChecked = Date.now()
		})
		return actorAllowancesCollection.state.get(key)!
	}
}

// Check if allowance is sufficient for amount
export const hasApproval = ($id: ActorAllowance$Id, amount: bigint) => {
	const row = getActorAllowance($id)
	return row ? row.allowance >= amount : false
}

// Update allowance after successful approval tx (optimistic)
export const setActorAllowance = (
	$id: ActorAllowance$Id,
	allowance: bigint,
) => {
	const key = stringify($id)
	const existing = actorAllowancesCollection.state.get(key)
	if (existing) {
		actorAllowancesCollection.update(key, (draft) => {
			draft.$source = DataSource.Voltaire
			draft.allowance = allowance
			draft.lastChecked = Date.now()
		})
	} else {
		actorAllowancesCollection.insert({
			$id,
			$source: DataSource.Voltaire,
			allowance,
			isLoading: false,
			error: null,
			lastChecked: Date.now(),
		})
	}
}
