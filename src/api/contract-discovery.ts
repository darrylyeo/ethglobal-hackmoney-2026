/**
 * Discover contracts deployed by an address via Etherscan-style API.
 * No API key required for read-only; rate limits apply.
 */

import { type ChainId, networksByChainId } from '$/constants/networks.ts'
import { normalizeAddress } from '$/lib/address.ts'

const EXPLORER_API_BY_CHAIN: Partial<Record<ChainId, string>> = {
	1: 'https://api.etherscan.io/api',
	10: 'https://api-optimistic.etherscan.io/api',
	11155111: 'https://api-sepolia.etherscan.io/api',
	42161: 'https://api.arbiscan.io/api',
	421614: 'https://api-sepolia.arbiscan.io/api',
	8453: 'https://api.basescan.org/api',
	84532: 'https://api-sepolia.basescan.org/api',
	137: 'https://api.polygonscan.com/api',
	80002: 'https://api-amoy.polygonscan.com/api',
	43114: 'https://api.snowtrace.io/api',
	43113: 'https://api-testnet.snowtrace.io/api',
	42220: 'https://api.celoscan.io/api',
	534352: 'https://api.lineascan.build/api',
	59144: 'https://api.lineascan.build/api',
}

export type DeployedContract = {
	chainId: ChainId
	address: `0x${string}`
	deployer: `0x${string}`
	txHash: `0x${string}`
}

export async function fetchContractsDeployedBy(
	chainId: ChainId,
	deployer: `0x${string}`,
): Promise<DeployedContract[]> {
	const base = EXPLORER_API_BY_CHAIN[chainId]
	if (!base) return []
	const url = `${base}?module=account&action=txlist&address=${deployer}&startblock=0&endblock=99999999&page=1&offset=100&sort=asc`
	const res = await fetch(url)
	const data = (await res.json()) as {
		status?: string
		result?: { to?: string; contractAddress?: string; hash?: string }[]
	}
	if (data.status !== '1' || !Array.isArray(data.result)) return []
	return data.result
		.filter((tx) => !tx.to && tx.contractAddress)
		.map((tx) => {
			const addr = normalizeAddress(tx.contractAddress! as `0x${string}`)
			const deployerNorm = normalizeAddress(deployer) ?? deployer
			if (!addr) return null
			return {
				chainId,
				address: addr,
				deployer: deployerNorm,
				txHash: tx.hash as `0x${string}`,
			}
		})
		.filter((c): c is DeployedContract => c != null)
}

export function getExplorerApiUrl(chainId: ChainId): string | null {
	return EXPLORER_API_BY_CHAIN[chainId] ?? null
}

export const SUPPORTED_DISCOVERY_CHAINS: ChainId[] = (
	Object.keys(EXPLORER_API_BY_CHAIN) as unknown as ChainId[]
)
