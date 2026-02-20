/**
 * Viem client creation at the API boundary. RPC uses Voltaire (createHttpProvider);
 * wallet layer operates only on EIP-1193 providers.
 */

import type { Chain } from 'viem'
import { createPublicClient, createWalletClient, custom } from 'viem'
import type { PublicClient, WalletClient } from 'viem'
import { createHttpProvider } from '$/api/voltaire.ts'
import { networksByChainId } from '$/constants/networks.ts'
import type { EIP1193Provider } from '$/lib/wallet.ts'

function chainFor(chainId: number): Chain {
	const network = networksByChainId[chainId]
	return (
		network
			? {
					id: network.chainId,
					name: network.name,
					nativeCurrency: {
						decimals: 18,
						name: network.nativeCurrency.name,
						symbol: network.nativeCurrency.symbol,
					},
					rpcUrls: { default: { http: [] } },
				}
			: {
					id: chainId,
					name: `Chain ${chainId}`,
					nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
					rpcUrls: { default: { http: [] } },
				}
	) as Chain
}

export function createWalletClientForChain(
	provider: EIP1193Provider,
	chainId: number,
): WalletClient {
	return createWalletClient({
		chain: chainFor(chainId),
		transport: custom(provider),
	})
}

export function getChainFor(chainId: number): Chain {
	return chainFor(chainId)
}

/** PublicClient backed by Voltaire RPC (createHttpProvider). Use for spandex and other read-only chain access. */
export function createPublicClientForChain(
	chainId: number,
	rpcUrl: string,
): PublicClient {
	return createPublicClient({
		chain: chainFor(chainId),
		transport: custom(createHttpProvider(rpcUrl) as EIP1193Provider),
	})
}
