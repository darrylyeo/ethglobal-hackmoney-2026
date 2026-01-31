import { ChainId } from './networks'

export const explorerUrls: Partial<Record<ChainId, string>> = {
	[ChainId.Ethereum]: 'https://etherscan.io',
	[ChainId.Optimism]: 'https://optimistic.etherscan.io',
	[ChainId.XDC]: 'https://xdc.blocksscan.io',
	[ChainId.XDCApothem]: 'https://apothem.blocksscan.io',
	[ChainId.Unichain]: 'https://unichain.blockscout.com',
	[ChainId.UnichainSepolia]: 'https://sepolia.unichain.blockscout.com',
	[ChainId.Polygon]: 'https://polygonscan.com',
	[ChainId.PolygonAmoy]: 'https://amoy.polygonscan.com',
	[ChainId.Monad]: 'https://explorer.monad.xyz',
	[ChainId.MonadTestnet]: 'https://testnet-explorer.monad.xyz',
	[ChainId.Sonic]: 'https://sonicscan.org',
	[ChainId.SonicTestnet]: 'https://testnet.sonicscan.org',
	[ChainId.ZkSyncEraSepolia]: 'https://sepolia-era.zksync.network',
	[ChainId.ZkSyncEra]: 'https://era.zksync.network',
	[ChainId.WorldChain]: 'https://worldscan.org',
	[ChainId.WorldChainSepolia]: 'https://sepolia.worldscan.org',
	[ChainId.HyperEVMTestnet]: 'https://testnet.hyper.evm.cc',
	[ChainId.HyperEVM]: 'https://hyper.evm.cc',
	[ChainId.SeiTestnet]: 'https://testnet.seitrace.com',
	[ChainId.Sei]: 'https://seitrace.com',
	[ChainId.Arbitrum]: 'https://arbiscan.io',
	[ChainId.ArbitrumSepolia]: 'https://sepolia.arbiscan.io',
	[ChainId.Celo]: 'https://celoscan.io',
	[ChainId.AvalancheFuji]: 'https://testnet.snowtrace.io',
	[ChainId.Avalanche]: 'https://snowtrace.io',
	[ChainId.Base]: 'https://basescan.org',
	[ChainId.BaseSepolia]: 'https://sepolia.basescan.org',
	[ChainId.Ink]: 'https://explorer.inkonchain.com',
	[ChainId.LineaSepolia]: 'https://sepolia.lineascan.build',
	[ChainId.Linea]: 'https://lineascan.build',
	[ChainId.InkTestnet]: 'https://testnet.explorer.inkonchain.com',
	[ChainId.Codex]: 'https://explorer.codexchain.io',
	[ChainId.CodexTestnet]: 'https://testnet-explorer.codexchain.io',
	[ChainId.Plume]: 'https://plume-explorer.alt.technology',
	[ChainId.PlumeTestnet]: 'https://testnet-plume-explorer.alt.technology',
	[ChainId.CeloSepolia]: 'https://celo-sepolia.blockscout.com',
	[ChainId.EthereumSepolia]: 'https://sepolia.etherscan.io',
	[ChainId.OPSepolia]: 'https://sepolia-optimism.etherscan.io',
	[ChainId.ArcTestnet]: 'https://testnet.arcscan.io',
}

export const getTxUrl = (chainId: number, txHash: string): string =>
	`${explorerUrls[chainId as ChainId] ?? 'https://blockscan.com'}/tx/${txHash}`

export const getAddressUrl = (chainId: number, address: string): string =>
	`${explorerUrls[chainId as ChainId] ?? 'https://blockscan.com'}/address/${address}`
