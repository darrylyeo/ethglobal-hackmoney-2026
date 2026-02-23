import type { Contract$Id } from '$/data/Contract.ts'
import type { Media } from '$/constants/media.ts'
import type { Network$Id } from '$/data/Network.ts'
import { ChainId } from '$/constants/networks.ts'
import { CoinId } from '$/constants/coins.ts'
import { networks } from '$/constants/networks.ts'

export enum CoinInstanceType {
	NativeCurrency = 'NativeCurrency',
	Erc20Token = 'Erc20Token',
}

export type NativeCurrency = {
	type: CoinInstanceType.NativeCurrency
	$id: { $network: Network$Id }
	coinId: CoinId
	name?: string
	symbol: string
	decimals: number
	icon?: Media
}

export type Erc20Token = {
	type: CoinInstanceType.Erc20Token
	$id: Contract$Id
	coinId: CoinId
	name?: string
	symbol: string
	decimals: number
	icon?: Media
}

export type Erc20Coin$Id = Erc20Token['$id']

export type CoinInstance = NativeCurrency | Erc20Token

export type CoinInstance$Id = CoinInstance['$id']

export type CoinInstanceEntry = Omit<Erc20Token, '$id'> & { $id: CoinInstance$Id }

export const coinInstances: readonly CoinInstance[] = [
	...networks.map((network) => ({
		type: CoinInstanceType.NativeCurrency as const,
		$id: { $network: { chainId: network.chainId } },
		coinId: network.nativeCurrency.coinId,
		name: network.nativeCurrency.name,
		symbol: network.nativeCurrency.symbol,
		decimals: network.nativeCurrency.decimals,
	})),

	// ERC20 instances (USDC, WETH per chain)
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Ethereum }, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Optimism }, address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Polygon }, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Arbitrum }, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Avalanche }, address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Celo }, address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Base }, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Linea }, address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.ZkSyncEra }, address: '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Unichain }, address: '0x078D782b760474a361dDA0AF3839290b0EF57AD6' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Monad }, address: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Sonic }, address: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Codex }, address: '0xd996633a415985DBd7D6D12f4A4343E31f5037cf' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.HyperEVM }, address: '0xb88339CB7199b77E23DB6E890353E22632Ba630f' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Ink }, address: '0x2D270e6886d130D724215A266106e6832161EAEd' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Sei }, address: '0xe15fC38F6D8c56aF07bbCBe3BAf5708A2Bf42392' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Plume }, address: '0x222365EF19F7947e5484218551B56bb3965Aa7aF' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.WorldChain }, address: '0x79A02482A880bCe3F13E09da970dC34dB4cD24D1' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.XDC }, address: '0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.EthereumSepolia }, address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.OPSepolia }, address: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.BaseSepolia }, address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.ArbitrumSepolia }, address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.PolygonAmoy }, address: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.UnichainSepolia }, address: '0x31d0220469e10c4E71834a79b1f276d740d3768F' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.LineaSepolia }, address: '0xFEce4462D57bD51A6A552365A011b95f0E16d9B7' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.CodexTestnet }, address: '0x6d7f141b6819C2c9CC2f818e6ad549E7Ca090F8f' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.SonicTestnet }, address: '0x0BA304580ee7c9a980CF72e55f5Ed2E9fd30Bc51' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.WorldChainSepolia }, address: '0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.MonadTestnet }, address: '0x534b2f3A21130d7a60830c2Df862319e593943A3' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.SeiTestnet }, address: '0x4fCF1784B31630811181f670Aea7A7bEF803eaED' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.XDCApothem }, address: '0xb5AB69F7bBada22B28e79C8FFAECe55eF1c771D4' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.HyperEVMTestnet }, address: '0x2B3370eE501B4a559b57D449569354196457D8Ab' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.InkTestnet }, address: '0xFabab97dCE620294D2B0b0e46C68964e326300Ac' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.PlumeTestnet }, address: '0xcB5f30e335672893c7eb944B374c196392C19D18' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.ArcTestnet }, address: '0x3600000000000000000000000000000000000000' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.CeloSepolia }, address: '0x01C5C0122039549AD1493B8220cABEdD739BC44E' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.ZkSyncEraSepolia }, address: '0xAe045DE5638162fa134807Cb558E15A3F5A7F853' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.AvalancheFuji }, address: '0x5425890298aed601595a70AB815c96711a31Bc65' }, coinId: CoinId.USDC, symbol: 'USDC', decimals: 6 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Ethereum }, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' }, coinId: CoinId.ETH, symbol: 'WETH', decimals: 18 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Optimism }, address: '0x4200000000000000000000000000000000000006' }, coinId: CoinId.ETH, symbol: 'WETH', decimals: 18 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Base }, address: '0x4200000000000000000000000000000000000006' }, coinId: CoinId.ETH, symbol: 'WETH', decimals: 18 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Arbitrum }, address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' }, coinId: CoinId.ETH, symbol: 'WETH', decimals: 18 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Polygon }, address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' }, coinId: CoinId.ETH, symbol: 'WETH', decimals: 18 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Avalanche }, address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB' }, coinId: CoinId.ETH, symbol: 'WETH.e', decimals: 18 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.Linea }, address: '0xe5D7C2a44FfDdf6b295A15c148167daaAf5Cf34f' }, coinId: CoinId.ETH, symbol: 'WETH', decimals: 18 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.EthereumSepolia }, address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' }, coinId: CoinId.ETH, symbol: 'WETH', decimals: 18 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.OPSepolia }, address: '0x4200000000000000000000000000000000000006' }, coinId: CoinId.ETH, symbol: 'WETH', decimals: 18 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.BaseSepolia }, address: '0x4200000000000000000000000000000000000006' }, coinId: CoinId.ETH, symbol: 'WETH', decimals: 18 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.ArbitrumSepolia }, address: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73' }, coinId: CoinId.ETH, symbol: 'WETH', decimals: 18 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.PolygonAmoy }, address: '0x7b79995e5f793A4712D92A3c7e7c1B945100F8d' }, coinId: CoinId.ETH, symbol: 'WETH', decimals: 18 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.LineaSepolia }, address: '0x2C1b868d6596a18e32e61B901E4060C872647b6C' }, coinId: CoinId.ETH, symbol: 'WETH', decimals: 18 },
	{ type: CoinInstanceType.Erc20Token, $id: { $network: { chainId: ChainId.AvalancheFuji }, address: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c' }, coinId: CoinId.ETH, symbol: 'WETH', decimals: 18 },
]

export const erc20Instances = coinInstances.filter(
	(i): i is Erc20Token => i.type === CoinInstanceType.Erc20Token,
)

export const nativeCurrencyByNetwork = Map.groupBy(
	coinInstances.filter(
		(i): i is NativeCurrency =>
			i.type === CoinInstanceType.NativeCurrency,
	),
	(n) => n.$id.$network.chainId,
)
export const erc20TokenByNetwork = Map.groupBy(
	erc20Instances,
	(t) => t.$id.$network.chainId,
)
export const erc20InstancesBySymbol = Map.groupBy(
	erc20Instances,
	(t) => t.symbol,
)
export const erc20InstancesByCoinId = Map.groupBy(
	erc20Instances,
	(t) => t.coinId,
)
const chainIdsWithInstances = new Set([
	...nativeCurrencyByNetwork.keys(),
	...erc20TokenByNetwork.keys(),
])
export const coinInstanceByNetwork = new Map(
	[...chainIdsWithInstances].map((chainId) => [
		chainId,
		[
			...(nativeCurrencyByNetwork.get(chainId) ?? []),
			...(erc20TokenByNetwork.get(chainId) ?? []),
		],
	] as const),
)

export const coinInstanceByChainAndCoinId = new Map<string, CoinInstance>(
	coinInstances.map((i) => [`${i.$id.$network.chainId}:${i.coinId}`, i]),
)
