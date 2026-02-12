/**
 * Network-scoped path builders. Uses networkConfigsByChainId from constants/networks.
 */

import { networkConfigsByChainId } from '$/constants/networks.ts'

export const getTxPath = (chainId: number, txHash: string): string => {
	const slug = networkConfigsByChainId[chainId]?.slug
	return slug != null
		? `/network/${slug}/transaction/${txHash}`
		: `/network/${chainId}/transaction/${txHash}`
}

export const getBlockPath = (
	chainId: number,
	blockNumber: number | string,
): string => {
	const slug = networkConfigsByChainId[chainId]?.slug
	return slug != null
		? `/network/${slug}/block/${blockNumber}`
		: `/network/${chainId}/block/${blockNumber}`
}

export const getAccountPath = (address: string): string => `/account/${address}`
