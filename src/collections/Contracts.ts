/**
 * Contracts collection: known contracts with optional deployer, ABI from Sourcify.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { fetchContractWithAbi } from '$/api/sourcify.ts'
import { CollectionId } from '$/constants/collections.ts'
import type { ChainId } from '$/constants/networks.ts'
import type { ContractEntry, Contract$Id } from '$/data/Contract.ts'

const getKey = (row: ContractEntry) =>
	`${row.$id.$network.chainId}:${row.$id.address.toLowerCase()}`

export const contractsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.Contracts,
		storageKey: CollectionId.Contracts,
		getKey: (row: ContractEntry) => getKey(row),
		parser: { stringify, parse },
	}),
)

export async function fetchContract(
	chainId: ChainId,
	address: `0x${string}`,
	deployer?: `0x${string}`,
): Promise<ContractEntry | null> {
	const key = `${chainId}:${address.toLowerCase()}` as unknown as Parameters<
		typeof contractsCollection.state.get
	>[0]

	const existing = contractsCollection.state.get(key)
	const entry: ContractEntry = {
		$id: {
			$network: { chainId },
			address: address.toLowerCase() as `0x${string}`,
		},
		...(deployer && { deployer }),
	}

	if (existing) {
		contractsCollection.update(key, (draft) => {
			Object.assign(draft, entry)
		})
	} else {
		contractsCollection.insert(entry)
	}

	try {
		const withAbi = await fetchContractWithAbi(chainId, address)
		if (withAbi) {
			contractsCollection.update(key, (draft) => {
				if (withAbi.abi) draft.abi = withAbi.abi
				if (withAbi.source) draft.source = withAbi.source
			})
			return contractsCollection.state.get(key) ?? entry
		}
		return entry
	} catch {
		return entry
	}
}

export function ensureContract(
	chainId: ChainId,
	address: `0x${string}`,
	deployer?: `0x${string}`,
): void {
	const key = `${chainId}:${address.toLowerCase()}`
	if (contractsCollection.state.get(key as never)) return
	void fetchContract(chainId, address, deployer)
}
