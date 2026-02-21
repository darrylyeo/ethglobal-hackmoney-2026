/**
 * Blockscout contract ABI API.
 * https://docs.blockscout.com/devs/apis/rpc/contract
 */

import type { ChainId } from '$/constants/networks.ts'
import type { ContractAbi } from '$/data/Contract.ts'

const BLOCKSCOUT_API_BY_CHAIN: Partial<Record<ChainId, string>> = {
	1: 'https://eth.blockscout.com/api',
	10: 'https://optimism.blockscout.com/api',
	8453: 'https://base.blockscout.com/api',
}

export type BlockscoutGetAbiResponse = {
	status: string
	message: string
	result?: string
}

/** Fetch contract ABI from Blockscout. Returns null if chain unsupported or not found. */
export async function fetchAbiFromBlockscout(
	chainId: ChainId,
	address: `0x${string}`,
	options?: { apiKey?: string },
) {
	const base = BLOCKSCOUT_API_BY_CHAIN[chainId]
	if (!base) return null
	const params = new URLSearchParams({
		module: 'contract',
		action: 'getabi',
		address,
	})
	if (options?.apiKey) params.set('apikey', options.apiKey)
	const res = await fetch(`${base}?${params}`)
	if (!res.ok) return null
	const data = (await res.json()) as BlockscoutGetAbiResponse
	if (data.status !== '1' || typeof data.result !== 'string' || !data.result.trim())
		return null
	const abi = JSON.parse(data.result) as unknown
	if (!Array.isArray(abi)) return null
	return abi as unknown as ContractAbi
}
