/**
 * Chain-specific block explorer URLs for transaction and address links.
 * Spec 008: Transaction status tracking.
 */

import { ChainId, networkConfigs } from '$/constants/networks.ts'

export type ExplorerEntry = {
	chainId: ChainId
	url: string
}

export const explorerEntries = networkConfigs.flatMap((config) =>
	config.explorerUrls?.[0]
		? [
				{
					chainId: config.chainId,
					url: config.explorerUrls[0],
				},
			]
		: [],
) satisfies readonly ExplorerEntry[]

export const explorerUrls: Record<number, string> = Object.fromEntries(
	explorerEntries.map((entry) => [entry.chainId, entry.url]),
)

export const getTxUrl = (chainId: number, txHash: string): string =>
	`${explorerUrls[chainId] ?? 'https://blockscan.com'}/tx/${txHash}`

export const getAddressUrl = (chainId: number, address: string): string =>
	`${explorerUrls[chainId] ?? 'https://blockscan.com'}/address/${address}`

export const getBlockUrl = (
	chainId: number,
	blockNumber: number | string,
): string =>
	`${explorerUrls[chainId] ?? 'https://blockscan.com'}/block/${blockNumber}`
