import type { ChainId } from '$/constants/networks'
import { networksByChainId } from '$/constants/networks'
import { rpcUrls } from '$/constants/rpc-endpoints'

export type WalletChainConfig = {
	chainId: string
	chainName: string
	nativeCurrency: { name: string; symbol: string; decimals: number }
	rpcUrls: string[]
	blockExplorerUrls?: string[]
}

const nativeCurrencies: Partial<Record<ChainId, { name: string; symbol: string }>> = {
	[1]: { name: 'Ether', symbol: 'ETH' },
	[10]: { name: 'Ether', symbol: 'ETH' },
	[50]: { name: 'XDC', symbol: 'XDC' },
	[51]: { name: 'XDC', symbol: 'XDC' },
	[130]: { name: 'Unichain', symbol: 'UNI' },
	[1301]: { name: 'Unichain', symbol: 'UNI' },
	[137]: { name: 'MATIC', symbol: 'MATIC' },
	[80002]: { name: 'MATIC', symbol: 'MATIC' },
	[143]: { name: 'Ether', symbol: 'ETH' },
	[10143]: { name: 'Ether', symbol: 'ETH' },
	[146]: { name: 'S', symbol: 'S' },
	[14601]: { name: 'S', symbol: 'S' },
	[300]: { name: 'Ether', symbol: 'ETH' },
	[324]: { name: 'Ether', symbol: 'ETH' },
	[480]: { name: 'Ether', symbol: 'ETH' },
	[4801]: { name: 'Ether', symbol: 'ETH' },
	[998]: { name: 'Ether', symbol: 'ETH' },
	[999]: { name: 'Ether', symbol: 'ETH' },
	[1328]: { name: 'SEI', symbol: 'SEI' },
	[1329]: { name: 'SEI', symbol: 'SEI' },
	[42161]: { name: 'Ether', symbol: 'ETH' },
	[421614]: { name: 'Ether', symbol: 'ETH' },
	[42220]: { name: 'CELO', symbol: 'CELO' },
	[43113]: { name: 'AVAX', symbol: 'AVAX' },
	[43114]: { name: 'AVAX', symbol: 'AVAX' },
	[8453]: { name: 'Ether', symbol: 'ETH' },
	[84532]: { name: 'Ether', symbol: 'ETH' },
	[57073]: { name: 'Ether', symbol: 'ETH' },
	[59141]: { name: 'Ether', symbol: 'ETH' },
	[59144]: { name: 'Ether', symbol: 'ETH' },
	[763373]: { name: 'Ether', symbol: 'ETH' },
	[81224]: { name: 'Ether', symbol: 'ETH' },
	[812242]: { name: 'Ether', symbol: 'ETH' },
	[98866]: { name: 'Ether', symbol: 'ETH' },
	[98867]: { name: 'Ether', symbol: 'ETH' },
	[11155111]: { name: 'Ether', symbol: 'ETH' },
	[11155420]: { name: 'Ether', symbol: 'ETH' },
	[11142220]: { name: 'CELO', symbol: 'CELO' },
	[5042002]: { name: 'Ether', symbol: 'ETH' },
}

const explorerUrls: Partial<Record<number, string>> = {
	1: 'https://etherscan.io',
	10: 'https://optimistic.etherscan.io',
	137: 'https://polygonscan.com',
	80002: 'https://amoy.polygonscan.com',
	42161: 'https://arbiscan.io',
	421614: 'https://sepolia.arbiscan.io',
	43114: 'https://snowtrace.io',
	43113: 'https://testnet.snowtrace.io',
	42220: 'https://celoscan.io',
	8453: 'https://basescan.org',
	84532: 'https://sepolia.basescan.org',
	59144: 'https://lineascan.build',
	59141: 'https://sepolia.lineascan.build',
	324: 'https://explorer.zksync.io',
	300: 'https://sepolia.explorer.zksync.io',
	11155111: 'https://sepolia.etherscan.io',
	11155420: 'https://sepolia-optimism.etherscan.io',
}

export const getChainConfig = (chainId: number): WalletChainConfig | null => {
	const network = networksByChainId[chainId as ChainId]
	const rpcUrl = rpcUrls[chainId]
	const explorerUrl = explorerUrls[chainId]
	const native = nativeCurrencies[chainId as ChainId]

	if (!network || !rpcUrl) return null

	return {
		chainId: `0x${chainId.toString(16)}`,
		chainName: network.name,
		nativeCurrency: {
			name: native?.name ?? 'Ether',
			symbol: native?.symbol ?? 'ETH',
			decimals: 18,
		},
		rpcUrls: [rpcUrl],
		blockExplorerUrls: explorerUrl ? [explorerUrl] : undefined,
	}
}
