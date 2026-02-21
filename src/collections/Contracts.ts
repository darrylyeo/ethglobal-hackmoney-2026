/**
 * Contracts collection: known contracts with optional deployer, ABI from Sourcify.
 */

import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'
import { fetchAbiFromBlockscout } from '$/api/blockscout.ts'
import { fetchAbiFromEtherscan } from '$/api/etherscan.ts'
import { fetchContractFull } from '$/api/sourcify.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import type { ChainId } from '$/constants/networks.ts'
import type { ContractEntry, Contract$Id } from '$/data/Contract.ts'
import {
	verifiedContractSourcesCollection,
	type VerifiedContractSourceRow,
} from '$/collections/VerifiedContractSources.ts'

const getKey = (row: ContractEntry) =>
	`${row.$id.$network.chainId}:${row.$id.address}`

const inFlight = new Set<string>()

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
	const keyStr = `${chainId}:${address}`
	const key = keyStr as unknown as Parameters<
		typeof contractsCollection.state.get
	>[0]

	if (inFlight.has(keyStr)) {
		return contractsCollection.state.get(key) ?? null
	}

	const existing = contractsCollection.state.get(key)
	const entry: ContractEntry = {
		$id: {
			$network: { chainId },
			address,
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

	inFlight.add(keyStr)
	try {
		const full = await fetchContractFull(chainId, address)
		if (full) {
			if (full.abi) {
				contractsCollection.update(key, (draft) => {
					draft.abi = full.abi
					draft.source = DataSource.Sourcify
				})
			}
			const sourceKey = key as unknown as Parameters<
				typeof verifiedContractSourcesCollection.state.get
			>[0]
			if (verifiedContractSourcesCollection.state.get(sourceKey)) {
				verifiedContractSourcesCollection.update(sourceKey, (draft) => {
					Object.assign(draft, {
						...full.source,
						notFound: false,
						isLoading: false,
						error: null,
					} satisfies Partial<VerifiedContractSourceRow>)
				})
			} else {
				verifiedContractSourcesCollection.insert({
					...full.source,
					$source: DataSource.Sourcify,
					isLoading: false,
					error: null,
				} satisfies VerifiedContractSourceRow)
			}
			if (full.abi) return contractsCollection.state.get(key) ?? entry
		}
		if (!contractsCollection.state.get(key)?.abi) {
			const abiE = await fetchAbiFromEtherscan(chainId, address)
			if (abiE) {
				contractsCollection.update(key, (draft) => {
					draft.abi = abiE
					draft.source = DataSource.Etherscan
				})
				return contractsCollection.state.get(key) ?? entry
			}
			const abiB = await fetchAbiFromBlockscout(chainId, address)
			if (abiB) {
				contractsCollection.update(key, (draft) => {
					draft.abi = abiB
					draft.source = DataSource.Blockscout
				})
				return contractsCollection.state.get(key) ?? entry
			}
		}
		if (!full) {
			const sourceKey = key as unknown as Parameters<
				typeof verifiedContractSourcesCollection.state.get
			>[0]
			if (verifiedContractSourcesCollection.state.get(sourceKey)) {
				verifiedContractSourcesCollection.update(sourceKey, (draft) => {
					draft.notFound = true
					draft.isLoading = false
					draft.error = null
				})
			} else {
				verifiedContractSourcesCollection.insert({
					$id: { $network: { chainId }, address },
					files: {},
					$source: DataSource.Sourcify,
					notFound: true,
					isLoading: false,
					error: null,
				} satisfies VerifiedContractSourceRow)
			}
		}
		return contractsCollection.state.get(key) ?? entry
	} catch {
		return entry
	} finally {
		inFlight.delete(keyStr)
	}
}

export function ensureContract(
	chainId: ChainId,
	address: `0x${string}`,
	deployer?: `0x${string}`,
): void {
	const key = `${chainId}:${address}`
	if (contractsCollection.state.get(key as never)) return
	void fetchContract(chainId, address, deployer)
}
