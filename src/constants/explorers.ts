/**
 * Chain-specific block explorer URLs for transaction and address links.
 * Spec 008: Transaction status tracking.
 */

import { ChainId } from '$/constants/networks'

export type ExplorerEntry = {
	chainId: ChainId
	url: string
}

export const explorerEntries = [
	{ chainId: ChainId.Ethereum, url: 'https://etherscan.io' },
	{ chainId: ChainId.Optimism, url: 'https://optimistic.etherscan.io' },
	{ chainId: ChainId.XDC, url: 'https://xdc.blocksscan.io' },
	{ chainId: ChainId.XDCApothem, url: 'https://apothem.blocksscan.io' },
	{ chainId: ChainId.Unichain, url: 'https://unichain.blockscout.com' },
	{ chainId: ChainId.UnichainSepolia, url: 'https://sepolia.unichain.blockscout.com' },
	{ chainId: ChainId.Polygon, url: 'https://polygonscan.com' },
	{ chainId: ChainId.PolygonAmoy, url: 'https://amoy.polygonscan.com' },
	{ chainId: ChainId.Monad, url: 'https://explorer.monad.xyz' },
	{ chainId: ChainId.MonadTestnet, url: 'https://testnet-explorer.monad.xyz' },
	{ chainId: ChainId.Sonic, url: 'https://sonicscan.org' },
	{ chainId: ChainId.SonicTestnet, url: 'https://testnet.sonicscan.org' },
	{ chainId: ChainId.ZkSyncEraSepolia, url: 'https://sepolia-era.zksync.network' },
	{ chainId: ChainId.ZkSyncEra, url: 'https://era.zksync.network' },
	{ chainId: ChainId.WorldChain, url: 'https://worldscan.org' },
	{ chainId: ChainId.WorldChainSepolia, url: 'https://sepolia.worldscan.org' },
	{ chainId: ChainId.HyperEVMTestnet, url: 'https://testnet.hyper.evm.cc' },
	{ chainId: ChainId.HyperEVM, url: 'https://hyper.evm.cc' },
	{ chainId: ChainId.SeiTestnet, url: 'https://testnet.seitrace.com' },
	{ chainId: ChainId.Sei, url: 'https://seitrace.com' },
	{ chainId: ChainId.Arbitrum, url: 'https://arbiscan.io' },
	{ chainId: ChainId.ArbitrumSepolia, url: 'https://sepolia.arbiscan.io' },
	{ chainId: ChainId.Celo, url: 'https://celoscan.io' },
	{ chainId: ChainId.AvalancheFuji, url: 'https://testnet.snowtrace.io' },
	{ chainId: ChainId.Avalanche, url: 'https://snowtrace.io' },
	{ chainId: ChainId.Base, url: 'https://basescan.org' },
	{ chainId: ChainId.BaseSepolia, url: 'https://sepolia.basescan.org' },
	{ chainId: ChainId.Ink, url: 'https://explorer.inkonchain.com' },
	{ chainId: ChainId.LineaSepolia, url: 'https://sepolia.lineascan.build' },
	{ chainId: ChainId.Linea, url: 'https://lineascan.build' },
	{ chainId: ChainId.InkTestnet, url: 'https://testnet.explorer.inkonchain.com' },
	{ chainId: ChainId.Codex, url: 'https://explorer.codexchain.io' },
	{ chainId: ChainId.CodexTestnet, url: 'https://testnet-explorer.codexchain.io' },
	{ chainId: ChainId.Plume, url: 'https://plume-explorer.alt.technology' },
	{ chainId: ChainId.PlumeTestnet, url: 'https://testnet-plume-explorer.alt.technology' },
	{ chainId: ChainId.CeloSepolia, url: 'https://celo-sepolia.blockscout.com' },
	{ chainId: ChainId.EthereumSepolia, url: 'https://sepolia.etherscan.io' },
	{ chainId: ChainId.OPSepolia, url: 'https://sepolia-optimism.etherscan.io' },
	{ chainId: ChainId.ArcTestnet, url: 'https://testnet.arcscan.io' },
] as const satisfies readonly ExplorerEntry[]

export const explorerUrls: Record<number, string> = Object.fromEntries(
	explorerEntries.map((entry) => [entry.chainId, entry.url]),
)

export const getTxUrl = (chainId: number, txHash: string): string => (
	`${explorerUrls[chainId] ?? 'https://blockscan.com'}/tx/${txHash}`
)

export const getAddressUrl = (chainId: number, address: string): string => (
	`${explorerUrls[chainId] ?? 'https://blockscan.com'}/address/${address}`
)
