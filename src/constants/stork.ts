/**
 * Stork endpoints, asset registry, and pushed assets.
 */

import { ChainId } from '$/constants/networks'
import type { Coin, Erc20Token } from '$/constants/coins'

export enum StorkApiRegion {
	Jp = 'Jp',
	Dev = 'Dev',
}

export enum StorkApiTransport {
	Rest = 'Rest',
	Websocket = 'Websocket',
}

export enum StorkNetworkEnvironment {
	Mainnet = 'Mainnet',
	Testnet = 'Testnet',
	Dognet = 'Dognet',
}

export type StorkApiEndpoint = {
	region: StorkApiRegion
	transport: StorkApiTransport
	baseUrl: string
}

export type StorkAssetSymbol = Coin['symbol'] | Erc20Token['symbol']

export type StorkAsset = {
	assetId: string
	encodedAssetId: `0x${string}`
	baseSymbol: StorkAssetSymbol
	quoteSymbol: StorkAssetSymbol
}

export type StorkPushedAsset = {
	network: string
	environment: StorkNetworkEnvironment
	assetId: StorkAsset['assetId']
	maxStalenessSeconds: number
	minDeltaPercent: number
}

export type StorkNetworkDeployment = {
	network: string
	environment: StorkNetworkEnvironment
	chainId: ChainId | null
	oracleChainId?: ChainId
}

export const storkApiEndpoints = [
	{
		region: StorkApiRegion.Jp,
		transport: StorkApiTransport.Rest,
		baseUrl: 'https://rest.jp.stork-oracle.network',
	},
	{
		region: StorkApiRegion.Dev,
		transport: StorkApiTransport.Rest,
		baseUrl: 'https://rest.dev.stork-oracle.network',
	},
	{
		region: StorkApiRegion.Jp,
		transport: StorkApiTransport.Websocket,
		baseUrl: 'wss://api.jp.stork-oracle.network',
	},
] as const satisfies readonly StorkApiEndpoint[]

const storkApiBaseUrlByRegionTransport = Object.fromEntries(
	storkApiEndpoints.map((endpoint) => [
		`${endpoint.region}:${endpoint.transport}`,
		endpoint.baseUrl,
	]),
) satisfies Record<string, string>

export const storkDefaultRegion: StorkApiRegion = StorkApiRegion.Jp

export const storkRestBaseUrl =
	storkApiBaseUrlByRegionTransport[`${storkDefaultRegion}:${StorkApiTransport.Rest}`]

export const storkWebsocketBaseUrl =
	storkApiBaseUrlByRegionTransport[`${storkDefaultRegion}:${StorkApiTransport.Websocket}`]

export const storkWebsocketUrl = `${storkWebsocketBaseUrl}/evm/subscribe`

export const storkAssets = [
	{
		assetId: 'AAVEUSD',
		encodedAssetId:
			'0x029ff4e5b838907c663ddd7b03d9a7f56b1d8cb32cfc0662c37f2632c64b52a4',
		baseSymbol: 'AAVE',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'ADAUSD',
		encodedAssetId:
			'0x3cfdbed8f424d2c7113c47bb0775876d7a34cf04c48fcd15fc7bc2e8be85f3ed',
		baseSymbol: 'ADA',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'APTUSD',
		encodedAssetId:
			'0x90f4b4c95f9dee30278d7a62dab1916915c1472a51d03d39089f8492136b04aa',
		baseSymbol: 'APT',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'ARBUSD',
		encodedAssetId:
			'0x365f8b30df22d80f2e0b406679ef53f75e49d6cad9c1c9e6bc1df7b092658a20',
		baseSymbol: 'ARB',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'AUSDUSD',
		encodedAssetId:
			'0xf0f5bc7822329038ac4dbc4c6e6a4453c1980612111a87ff67d3624c8b2e0b2e',
		baseSymbol: 'AUSD',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'AVAXUSD',
		encodedAssetId:
			'0x0c26b653bce6116d26804ec1e9815465af19aaf56c39eaaf001816375fdf8a1d',
		baseSymbol: 'AVAX',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'BERAUSD',
		encodedAssetId:
			'0x9c7a8f90aa21b1e368d1a5f7b4d75aa03fec9abb903d84946ef76fd6fd79b312',
		baseSymbol: 'BERA',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'BNBUSD',
		encodedAssetId:
			'0x1bc6d6279e196b1fa7b94a792d57a47433858940c1b3500f2a5e69640cd12ef4',
		baseSymbol: 'BNB',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'BTCUSD',
		encodedAssetId:
			'0x7404e3d104ea7841c3d9e6fd20adfe99b4ad586bc08d8f3bd3afef894cf184de',
		baseSymbol: 'BTC',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'CAKEUSD',
		encodedAssetId:
			'0x4cdec5681c52113a81c288e66a15ad09ceb2136a349c1d5b1f18c0c54b74f22a',
		baseSymbol: 'CAKE',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'DOGEUSD',
		encodedAssetId:
			'0xaf3aa213a005c9a693262f7bd09dff6e39069392dea742922b0ecb61b5201751',
		baseSymbol: 'DOGE',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'EARNAUSDAUSD_RR',
		encodedAssetId:
			'0xe904b211ca1fdc78d094550c6c43d86f391a94277b71f1d84221835469acc8e0',
		baseSymbol: 'EARNAUSDA',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'EDUUSD',
		encodedAssetId:
			'0x6ee0e88f0bfb4b16b8f3eff7a0480b3338eed0367c7343ebf55b8bde53c620ca',
		baseSymbol: 'EDU',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'ETHUSD',
		encodedAssetId:
			'0x59102b37de83bdda9f38ac8254e596f0d9ac61d2035c07936675e87342817160',
		baseSymbol: 'ETH',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'FUELUSD',
		encodedAssetId:
			'0x670b7091d54af59331f97a1ce4a321eab14fd257a8b57b75ce4d4a5afc9186f4',
		baseSymbol: 'FUEL',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'HYPEUSD',
		encodedAssetId:
			'0x4458c4980d94bc7fef3ade260b034fb575f04ce6ce4abb20b9c1dbc4b0b9d169',
		baseSymbol: 'HYPE',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'LINKUSD',
		encodedAssetId:
			'0x694cad6038bcbefcc30e11862e412bb58f9c4ac3c9e0f9ed02d3e38b16829263',
		baseSymbol: 'LINK',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'MAUSDTLISTAUSD_RR',
		encodedAssetId:
			'0x06d9353dff928a252fbb2697fe4897752613ef4dfb77092bd77b8d3853388e83',
		baseSymbol: 'MAUSDTLISTA',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'MIBNBUSD_RR',
		encodedAssetId:
			'0xc11353274ef1bf42cd3476031e93ede567e9baa96d42c1423e285ab0e5c6faa2',
		baseSymbol: 'MIBNB',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'MIETHUSD_RR',
		encodedAssetId:
			'0x91ccdbe8da3b9dddf432f3eae0e700bdd7af249640736529d547371527fd0303',
		baseSymbol: 'MIETH',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'MITOUSD',
		encodedAssetId:
			'0x676e68664777355c00a9717c8bdfe8f55e98abfd159cce18051d01262b73f6a4',
		baseSymbol: 'MITO',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'MIUSDCUSD_RR',
		encodedAssetId:
			'0xe5fa6ce29b72da607ae16fc8932ec646a863ef0e6cb50e2a04a912ce8934b16c',
		baseSymbol: 'MIUSDC',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'MONUSD',
		encodedAssetId:
			'0xa4f6b07ae0c89e3f3cc03c1badcc3e9adffdf7206bafcd56d142979800887385',
		baseSymbol: 'MON',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'NACREDXUSD',
		encodedAssetId:
			'0x689dfb3251e38b997e3d82f681d088374ac80275fb1333a6759ae8f24afb87cf',
		baseSymbol: 'NACREDX',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'NALPHAUSD',
		encodedAssetId:
			'0x23a8a51db3a3da40db90c068e84d120bfc3dd4f8f5975cf4f4a7413826e1bbf8',
		baseSymbol: 'NALPHA',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'NBASISUSD',
		encodedAssetId:
			'0xf368c145faa5cac6eaf4e41eff80fd168211e4daa231a1b289fdab29b69c6623',
		baseSymbol: 'NBASIS',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'NCREDITUSD',
		encodedAssetId:
			'0xcd880ab078cf241d0685bd8f1dcee7da147295c44f5646ba178f7dc92cb22159',
		baseSymbol: 'NCREDIT',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'NELIXIRUSD',
		encodedAssetId:
			'0xdb3e876d4b971ba580b45ee4e1b3ab04c6584048ed4c151bd1148b73e43646ca',
		baseSymbol: 'NELIXIR',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'NETFUSD',
		encodedAssetId:
			'0x1a253fdb61a6b1dddce283bfe52f87b226fcbf03397de0105057cf686e5b5f20',
		baseSymbol: 'NETF',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'NINSTOUSD',
		encodedAssetId:
			'0xc31d5c25cd679100c1dff585834d7dca409026e232b37818c6723b812892c07d',
		baseSymbol: 'NINSTO',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'NOPALUSD',
		encodedAssetId:
			'0xc4fd7cb87179f5c5f727ae36d416181bc2bcbbf4b99776ce59445f8370c3c13a',
		baseSymbol: 'NOPAL',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'NPAYFIUSD',
		encodedAssetId:
			'0xc8013a55e8bc03a72fa9a306bc9014dc7754e5c686e8959982efc5d3c0620d67',
		baseSymbol: 'NPAYFI',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'NTBILLUSD',
		encodedAssetId:
			'0x2647985caf5516af21b0304b2acb77986d1eeea2c8bf3a5866cd5ae8d8e59926',
		baseSymbol: 'NTBILL',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'NUSDYUSD',
		encodedAssetId:
			'0x4977a819b788c1d318b1de4fd8cec0e3dde380762a2780739daa584f3a5dbb35',
		baseSymbol: 'NUSDY',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'NWISDOMUSD',
		encodedAssetId:
			'0x4530f38efa1b2d9153a159470e7146e596c06bb5e802ade53c718d88bcfa1098',
		baseSymbol: 'NWISDOM',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'NYIELDUSD',
		encodedAssetId:
			'0x18fddef43d68963e9041e7a0c0a33379841cc97b553988c84eb1e28fba6fe2c7',
		baseSymbol: 'NYIELD',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'OPUSD',
		encodedAssetId:
			'0x2316c275dd635566dd979f717711dcb9fef72e5b70bb46b28ed03958eb7a0e85',
		baseSymbol: 'OP',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'PETHUSD_RR',
		encodedAssetId:
			'0xe4230bc1e94312c4b57a311c5e3bf5b6a42564ddc1ea7e7edb004180036341c2',
		baseSymbol: 'PETH',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'PLUMEUSD',
		encodedAssetId:
			'0xfd8d4fb833e9a2ee44167d8fd258e6d0019a2994e1c863382b9bcd567b52810b',
		baseSymbol: 'PLUME',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'POLUSD',
		encodedAssetId:
			'0x3677639ed5e5918f1a5fdf6848a3a197d562a51fb309aac07903bd911d4e4eba',
		baseSymbol: 'POL',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'PUSDUSD',
		encodedAssetId:
			'0xe78fbac639b951bb7d4d8a6a7e4e3be7be423f4056b225ec071544c48dc303ef',
		baseSymbol: 'PUSD',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'PYTHUSD',
		encodedAssetId:
			'0xcf7965bf4ad8d01e1b4eeae12c41695dfa3c70c18de932ee0cfecf7235cfb48f',
		baseSymbol: 'PYTH',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'REDUSD',
		encodedAssetId:
			'0x7dfc788a1dc29f8559bcbf976dba1921ea21f3c18811aec678bd350f42229e38',
		baseSymbol: 'RED',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'SBTCUSD',
		encodedAssetId:
			'0x08fc8780f52cb9e9b6c835e55c4c083d9fe2d67470c1eb5207021292f95e5052',
		baseSymbol: 'SBTC',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'SEIUSD',
		encodedAssetId:
			'0x7dd60a3246f0df98f307775ca3856eb28872e2d36d044d307fe39768b2be208b',
		baseSymbol: 'SEI',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'SOLUSD',
		encodedAssetId:
			'0x1dcd89dfded9e8a9b0fa1745a8ebbacbb7c81e33d5abc81616633206d932e837',
		baseSymbol: 'SOL',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'SPLUMEUSD',
		encodedAssetId:
			'0x12b5f77572b7781fd674853d9949a4b86a194eaa05c7bb799a7fa3b879da9f83',
		baseSymbol: 'SPLUME',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'STFUELUSD_RR',
		encodedAssetId:
			'0xa3ed2e58076f53e8dd15c8463ee49e6ce547355c34c639777c5dace3728e2ded',
		baseSymbol: 'STFUEL',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'SUIUSD',
		encodedAssetId:
			'0xa24cc95a4f3d70a0a2f7ac652b67a4a73791631ff06b4ee7f729097311169b81',
		baseSymbol: 'SUI',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'SUSD',
		encodedAssetId:
			'0xe18df262d6d0bec60a8d935280235a1a1ee38eabbe83ca3eb9a1ed48b31ac8cb',
		baseSymbol: 'SUSD',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'SUSDEUSD',
		encodedAssetId:
			'0xf287ddec9700e4ab1db93dbfa5f0e125ee87f8a9eda635f76895e923408d8105',
		baseSymbol: 'SUSDE',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'SUSNUSD',
		encodedAssetId:
			'0x4fad14ab0b3793942fa6b796f40b263f0bb67815685625f9061f804cc4f7968f',
		baseSymbol: 'SUSN',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'SUPEROETHPWETH_RR',
		encodedAssetId:
			'0x1a623bb0b7eaa0dafff6122ecf16d0d3b66bae63bd0bfee833ee050f5d029389',
		baseSymbol: 'SUPEROETH',
		quoteSymbol: 'PWETH',
	},
	{
		assetId: 'TIAUSD',
		encodedAssetId:
			'0xc45bed07b2865e75808c5b94bf1720502a8d22ebcacb0a8d435d244e2ea1bd07',
		baseSymbol: 'TIA',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'UNIUSD',
		encodedAssetId:
			'0x9e6266a76df39a05a79ea6566fb4780787a70d8bd92ac5e8d5227ee526d20554',
		baseSymbol: 'UNI',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'USDCUSD',
		encodedAssetId:
			'0x7416a56f222e196d0487dce8a1a8003936862e7a15092a91898d69fa8bce290c',
		baseSymbol: 'USDC',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'USDEUSD',
		encodedAssetId:
			'0xa794a3432ecbe502ac5e44b28475b66b948cbd938ddae5005515133d328dad04',
		baseSymbol: 'USDE',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'USDTUSD',
		encodedAssetId:
			'0x6dcd0a8fb0460d4f0f98c524e06c10c63377cd098b589c0b90314bfb55751558',
		baseSymbol: 'USDT',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'WBTCUSD',
		encodedAssetId:
			'0x1ddeb20108df88bf27cc4a55fff8489a99c37ae2917ce13927c6cdadf4128503',
		baseSymbol: 'WBTC',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'WBNBUSD',
		encodedAssetId:
			'0x43a83fb6f275dcf9f6ae0f302246085b8033bae29dbe5bc737d1bc8e9f4f5b17',
		baseSymbol: 'WBNB',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'WEETHUSD',
		encodedAssetId:
			'0x2778ff4ef448d972c023c579b2bff9c55d48d0fde830dcdd72fff8189c01993e',
		baseSymbol: 'WEETH',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'WETHUSD',
		encodedAssetId:
			'0x8afba5f1a5d4969d23c3b42db1b88f8a9c8176392de5bf066752260478ce82b8',
		baseSymbol: 'WETH',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'WSTETHUSD',
		encodedAssetId:
			'0x56dd6ca223192c3f415d95b0e6812b9405845c7853522975239c88b6f4f34cbd',
		baseSymbol: 'WSTETH',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'XAUUSD',
		encodedAssetId:
			'0xe21c86d8b6a127bfef214d88fdb0c279e55d27dd8c443733e46c8d3de3c98cd6',
		baseSymbol: 'XAU',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'XAUMUSD',
		encodedAssetId:
			'0x5830a4bf67569f9de641c0114daf165c186efc272597a6570aabc4f7b02fd647',
		baseSymbol: 'XAUM',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'XRPUSD',
		encodedAssetId:
			'0x49139a167820038c145d3069c93650bc8e58e050592ba1095de576411ddf693d',
		baseSymbol: 'XRP',
		quoteSymbol: 'USD',
	},
	{
		assetId: 'ZROUSD',
		encodedAssetId:
			'0xeab1f0a597440f80e490a45615f860cae60e8c85c615d96922a38a41ef99155e',
		baseSymbol: 'ZRO',
		quoteSymbol: 'USD',
	},
] as const satisfies readonly StorkAsset[]

export const storkEncodedAssetIdByAssetId = Object.fromEntries(
	storkAssets.map((asset) => [asset.assetId, asset.encodedAssetId]),
) satisfies Record<string, string>

export const storkAssetIdByTokenSymbol = Object.fromEntries(
	storkAssets
		.filter((asset) => asset.quoteSymbol === 'USD')
		.map((asset) => [asset.baseSymbol, asset.assetId]),
) satisfies Record<string, string>

// TODO: add ChainId entries for EDU Chain, Fuel, Mitosis, and TAC.
export const storkNetworkDeployments = [
	{
		network: 'EDU Chain',
		environment: StorkNetworkEnvironment.Mainnet,
		chainId: null,
	},
	{
		network: 'Fuel',
		environment: StorkNetworkEnvironment.Mainnet,
		chainId: null,
	},
	{
		network: 'Mitosis',
		environment: StorkNetworkEnvironment.Dognet,
		chainId: null,
	},
	{
		network: 'Mitosis',
		environment: StorkNetworkEnvironment.Mainnet,
		chainId: null,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		chainId: ChainId.Monad,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		chainId: ChainId.MonadTestnet,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		chainId: ChainId.Plume,
	},
	{
		network: 'TAC',
		environment: StorkNetworkEnvironment.Mainnet,
		chainId: null,
	},
] as const satisfies readonly StorkNetworkDeployment[]

const storkNetworkDeploymentByKey = Object.fromEntries(
	storkNetworkDeployments.map((entry) => [
		`${entry.network}:${entry.environment}`,
		entry,
	]),
) satisfies Record<string, StorkNetworkDeployment>

export const storkPushedAssets = [
	{
		network: 'EDU Chain',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'BTCUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'EDU Chain',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'EDUUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'EDU Chain',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'ETHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'EDU Chain',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'USDCUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'EDU Chain',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'USDTUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Fuel',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'ETHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Fuel',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'FUELUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Fuel',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'STFUELUSD_RR',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Fuel',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'USDCUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Mitosis',
		environment: StorkNetworkEnvironment.Dognet,
		assetId: 'ETHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Mitosis',
		environment: StorkNetworkEnvironment.Dognet,
		assetId: 'USDCUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Mitosis',
		environment: StorkNetworkEnvironment.Dognet,
		assetId: 'USDTUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Mitosis',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'MAUSDTLISTAUSD_RR',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Mitosis',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'MIBNBUSD_RR',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Mitosis',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'MIETHUSD_RR',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Mitosis',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'MITOUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Mitosis',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'MIUSDCUSD_RR',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Mitosis',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'USDCUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Mitosis',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'USDTUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Mitosis',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'WBNBUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Mitosis',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'WEETHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Mitosis',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'WETHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'AAVEUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'ADAUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'APTUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'ARBUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'AUSDUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'AVAXUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'BERAUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'BNBUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'BTCUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.02,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'CAKEUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'DOGEUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'EARNAUSDAUSD_RR',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'ETHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.02,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'HYPEUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'LINKUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'MONUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.02,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'OPUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'POLUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'PYTHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'REDUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'SBTCUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'SEIUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'SOLUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'SUIUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'SUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'SUSDEUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'TIAUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'UNIUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'USDCUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'USDEUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'USDTUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'WBTCUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'WEETHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'WETHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'WSTETHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'XAUUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'XRPUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'ZROUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'AAVEUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'ADAUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'APTUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'ARBUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'AVAXUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'BERAUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'BNBUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'BTCUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.02,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'DOGEUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'ETHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.02,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'HYPEUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'LINKUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'MONUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.02,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'OPUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'POLUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'PYTHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'REDUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'SBTCUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'SEIUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'SOLUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'SUIUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'SUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'SUSDEUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'TIAUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'UNIUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'USDCUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'USDEUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'USDTUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'WBTCUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'WEETHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'WETHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'WSTETHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'XAUUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'XRPUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Monad',
		environment: StorkNetworkEnvironment.Testnet,
		assetId: 'ZROUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.05,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'NACREDXUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'NALPHAUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'NBASISUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'NCREDITUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'NELIXIRUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'NETFUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'NINSTOUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'NOPALUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'NPAYFIUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'NTBILLUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'NUSDYUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'NWISDOMUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'NYIELDUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'PETHUSD_RR',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'PLUMEUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'PUSDUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'SPLUMEUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'SUPEROETHPWETH_RR',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'WETHUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'Plume',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'XAUMUSD',
		maxStalenessSeconds: 3600,
		minDeltaPercent: 0.5,
	},
	{
		network: 'TAC',
		environment: StorkNetworkEnvironment.Mainnet,
		assetId: 'SUSNUSD',
		maxStalenessSeconds: 21600,
		minDeltaPercent: 1,
	},
] as const satisfies readonly StorkPushedAsset[]

export const storkPushedAssetsByNetwork = Object.fromEntries(
	Map.groupBy(storkPushedAssets, (asset) => asset.network)
		.entries()
		.map(([network, assets]) => [
			network,
			Object.fromEntries(
				Map.groupBy(assets, (asset) => asset.environment)
					.entries()
					.map(([environment, envAssets]) => [environment, envAssets]),
			),
		]),
) satisfies Record<
	string,
	Partial<Record<StorkNetworkEnvironment, StorkPushedAsset[]>>
>

const storkAssetChainEntries: [StorkAsset['assetId'], ChainId][] =
	storkPushedAssets.flatMap((asset) => {
		const key = `${asset.network}:${asset.environment}`
		const config = storkNetworkDeploymentByKey[key]
		const chainId = config?.oracleChainId ?? config?.chainId
		return chainId == null ? [] : [[asset.assetId, chainId]]
	})

export const storkOracleChainIdsByAssetId = Object.fromEntries(
	Map.groupBy(storkAssetChainEntries, ([assetId]) => assetId)
		.entries()
		.map(([assetId, entries]) => [
			assetId,
			[...new Set(entries.map((entry) => entry[1]))],
		]),
) satisfies Record<string, readonly ChainId[]>

export const storkPushedAssetIds: readonly string[] = [
	...new Set(storkPushedAssets.map((asset) => asset.assetId)),
]
