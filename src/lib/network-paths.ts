/**
 * Network-scoped path builders.
 */

export const getTxPath = (chainId: number, txHash: string) =>
	`/network/${chainId}/transaction/${txHash}`

export const getBlockPath = (
	chainId: number,
	blockNumber: number | string,
) => `/network/${chainId}/block/${blockNumber}`

export const getNetworkPath = (chainId: number) => `/network/${chainId}`

export const getForksPagePath = (chainId: number) =>
	`/network/${chainId}/forks`

export const getAccountPath = (address: string) => `/account/${address}`
