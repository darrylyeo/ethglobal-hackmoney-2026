/**
 * Network-scoped path builders. Uses networksByChainId from constants/networks.
 */

import { networksByChainId } from '$/constants/networks.ts'

export const getTxPath = (chainId: number, txHash: string) => {
	const slug = networksByChainId[chainId]?.slug
	return slug != null
		? `/network/${slug}/transaction/${txHash}`
		: `/network/${chainId}/transaction/${txHash}`
}

export const getBlockPath = (
	chainId: number,
	blockNumber: number | string,
) => {
	const slug = networksByChainId[chainId]?.slug
	return slug != null
		? `/network/${slug}/block/${blockNumber}`
		: `/network/${chainId}/block/${blockNumber}`
}

export const getAccountPath = (address: string) => `/account/${address}`
