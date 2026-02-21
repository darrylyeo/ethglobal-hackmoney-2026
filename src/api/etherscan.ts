/**
 * Etherscan Contracts API — get contract ABI.
 * https://docs.etherscan.io/api-endpoints/contracts
 */

import { getExplorerApiUrl } from '$/api/contract-discovery.ts'
import type { ChainId } from '$/constants/networks.ts'
import type { ContractAbi } from '$/data/Contract.ts'

export type EtherscanGetAbiResponse = {
	status: string
	message: string
	result?: string
}

/** Fetch contract ABI from Etherscan-style API. Returns null if chain unsupported or not found. */
export async function fetchAbiFromEtherscan(
	chainId: ChainId,
	address: `0x${string}`,
	options?: { apiKey?: string },
) {
	const base = getExplorerApiUrl(chainId)
	if (!base) return null
	const params = new URLSearchParams({
		module: 'contract',
		action: 'getabi',
		address,
	})
	if (options?.apiKey) params.set('apikey', options.apiKey)
	const res = await fetch(`${base}?${params}`)
	if (!res.ok) return null
	const data = (await res.json()) as EtherscanGetAbiResponse
	if (data.status !== '1' || typeof data.result !== 'string' || !data.result.trim())
		return null
	const abi = JSON.parse(data.result) as unknown
	if (!Array.isArray(abi)) return null
	return abi as unknown as ContractAbi
}
