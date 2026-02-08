/**
 * Brand colors for networks (by chain ID) and coins (by symbol).
 * Sourced from: blockhead repo, official brand guidelines, or dominant color from project SVGs.
 */

import { ChainId } from '$/constants/chain-id.ts'

/** Primary brand color (hex) per chain ID. */
export const networkColorByChainId: Partial<Record<ChainId, string>> = {
	[ChainId.Ethereum]: '#627EEA',
	[ChainId.EthereumSepolia]: '#627EEA',
	[ChainId.Optimism]: '#FF0823',
	[ChainId.OPSepolia]: '#FF0823',
	[ChainId.XDC]: '#254C81',
	[ChainId.XDCApothem]: '#254C81',
	[ChainId.Unichain]: '#F50DB4',
	[ChainId.UnichainSepolia]: '#F50DB4',
	[ChainId.Polygon]: '#7B3FE4',
	[ChainId.PolygonAmoy]: '#7B3FE4',
	[ChainId.Monad]: '#836EF9',
	[ChainId.MonadTestnet]: '#836EF9',
	[ChainId.Sonic]: '#000000',
	[ChainId.SonicTestnet]: '#000000',
	[ChainId.ZkSyncEra]: '#8C8DFC',
	[ChainId.ZkSyncEraSepolia]: '#8C8DFC',
	[ChainId.WorldChain]: '#111111',
	[ChainId.WorldChainSepolia]: '#111111',
	[ChainId.HyperEVM]: '#282828',
	[ChainId.HyperEVMTestnet]: '#282828',
	[ChainId.Sei]: '#C1121F',
	[ChainId.SeiTestnet]: '#C1121F',
	[ChainId.Arbitrum]: '#12AAFF',
	[ChainId.ArbitrumSepolia]: '#12AAFF',
	[ChainId.Celo]: '#FCFF52',
	[ChainId.CeloSepolia]: '#FCFF52',
	[ChainId.Avalanche]: '#E84142',
	[ChainId.AvalancheFuji]: '#E84142',
	[ChainId.Base]: '#0052FF',
	[ChainId.BaseSepolia]: '#0052FF',
	[ChainId.Ink]: '#6366F1',
	[ChainId.InkTestnet]: '#6366F1',
	[ChainId.Linea]: '#61DFFF',
	[ChainId.LineaSepolia]: '#61DFFF',
	[ChainId.Codex]: '#E5FF5D',
	[ChainId.CodexTestnet]: '#E5FF5D',
	[ChainId.Plume]: '#E84142',
	[ChainId.PlumeTestnet]: '#E84142',
	[ChainId.ArcTestnet]: '#94A3B8',
}

/** Primary brand color (hex) per coin symbol. */
export const coinColorBySymbol: Partial<Record<string, string>> = {
	ETH: '#627EEA',
	USDC: '#2775CA',
	USDT: '#26A17B',
	MATIC: '#7B3FE4',
	AVAX: '#E84142',
	CELO: '#FCFF52',
	UNI: '#F50DB4',
	S: '#000000',
	XDC: '#254C81',
	EDU: '#7C3AED',
	MITO: '#6366F1',
	TAC: '#3B82F6',
}
