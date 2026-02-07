/**
 * Viem client creation at the API boundary. Wallet layer operates only on EIP-1193 providers.
 */

import type { Chain } from 'viem'
import { createWalletClient, custom } from 'viem'
import type { WalletClient } from 'viem'
import { networkConfigsByChainId } from '$/constants/networks.ts'
import type { EIP1193Provider } from '$/lib/wallet.ts'

function chainFor(chainId: number): Chain {
	const config = networkConfigsByChainId[chainId]
	return (
		config
			? {
					id: config.chainId,
					name: config.name,
					nativeCurrency: {
						decimals: 18,
						name: config.nativeCurrency.name,
						symbol: config.nativeCurrency.symbol,
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
