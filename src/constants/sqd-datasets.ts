/**
 * ChainId → SQD Portal dataset slug. Only networks with Portal support.
 * Ref: https://beta.docs.sqd.dev/en/data/networks/evm
 */

import { ChainId } from '$/constants/chain-id.ts'

export type SqdDatasetInfo = {
	slug: string
	traces?: boolean
	stateDiffs?: boolean
}

export const SQD_DATASETS_BY_CHAIN_ID: Partial<Record<ChainId, SqdDatasetInfo>> = {
	[ChainId.Ethereum]: { slug: 'ethereum-mainnet', traces: true, stateDiffs: true },
	[ChainId.EthereumSepolia]: { slug: 'ethereum-sepolia', traces: true, stateDiffs: true },
	[ChainId.Optimism]: { slug: 'optimism-mainnet', traces: true, stateDiffs: true },
	[ChainId.OPSepolia]: { slug: 'optimism-sepolia', traces: true, stateDiffs: true },
	[ChainId.Unichain]: { slug: 'unichain-mainnet', traces: true, stateDiffs: true },
	[ChainId.UnichainSepolia]: { slug: 'unichain-sepolia', traces: true, stateDiffs: true },
	[ChainId.Polygon]: { slug: 'polygon-mainnet', traces: true, stateDiffs: true },
	[ChainId.PolygonAmoy]: { slug: 'polygon-amoy-testnet', traces: true, stateDiffs: true },
	[ChainId.Monad]: { slug: 'monad-mainnet', traces: true, stateDiffs: true },
	[ChainId.MonadTestnet]: { slug: 'monad-testnet', traces: true, stateDiffs: true },
	[ChainId.Sonic]: { slug: 'sonic-mainnet', traces: true, stateDiffs: true },
	[ChainId.SonicTestnet]: { slug: 'sonic-testnet', traces: true, stateDiffs: true },
	[ChainId.ZkSyncEraSepolia]: { slug: 'zksync-sepolia', traces: true, stateDiffs: true },
	[ChainId.ZkSyncEra]: { slug: 'zksync-mainnet', traces: true, stateDiffs: true },
	[ChainId.Arbitrum]: { slug: 'arbitrum-one', traces: true, stateDiffs: true },
	[ChainId.ArbitrumSepolia]: { slug: 'arbitrum-sepolia', traces: true, stateDiffs: true },
	[ChainId.Celo]: { slug: 'celo-mainnet', traces: true, stateDiffs: true },
	[ChainId.AvalancheFuji]: { slug: 'avalanche-testnet', traces: true, stateDiffs: true },
	[ChainId.Avalanche]: { slug: 'avalanche-mainnet', traces: true, stateDiffs: true },
	[ChainId.Base]: { slug: 'base-mainnet', traces: true, stateDiffs: true },
	[ChainId.BaseSepolia]: { slug: 'base-sepolia', traces: true, stateDiffs: true },
	[ChainId.Ink]: { slug: 'ink-mainnet', traces: true, stateDiffs: true },
	[ChainId.InkTestnet]: { slug: 'ink-sepolia', traces: true, stateDiffs: true },
	[ChainId.Linea]: { slug: 'linea-mainnet', traces: true, stateDiffs: true },
	[ChainId.Scroll]: { slug: 'scroll-mainnet', traces: true, stateDiffs: true },
	[ChainId.Plume]: { slug: 'plume-mainnet', traces: true, stateDiffs: true },
	[ChainId.PlumeTestnet]: { slug: 'plume-testnet', traces: true, stateDiffs: true },
	[ChainId.HyperEVMTestnet]: { slug: 'hyperevm-testnet', traces: true, stateDiffs: true },
	[ChainId.HyperEVM]: { slug: 'hyperevm-mainnet', traces: true, stateDiffs: true },
}

function getSqdDatasetInfo(chainId: number): SqdDatasetInfo | null {
	const info = SQD_DATASETS_BY_CHAIN_ID[chainId as ChainId]
	return info ?? null
}

export function getSqdDatasetSlug(chainId: number): string | null {
	return getSqdDatasetInfo(chainId)?.slug ?? null
}

export function getSqdPortalBaseUrl(chainId: number): string | null {
	const slug = getSqdDatasetSlug(chainId)
	return slug ? `https://portal.sqd.dev/datasets/${slug}` : null
}

export function hasSqdTraces(chainId: number): boolean {
	return getSqdDatasetInfo(chainId)?.traces === true
}
