/**
 * Stork API endpoints by region: url, transportType, environment.
 */

import { ChainId } from '$/constants/networks'

export enum StorkRegion {
	Dev = 'dev',
	Jp = 'jp',
}

export enum StorkTransportType {
	Rest = 'Rest',
	WebSocket = 'WebSocket',
}

export enum StorkEnvironment {
	Development = 'development',
	Production = 'production',
}

export type StorkEndpoint = {
	region: StorkRegion
	url: string
	transportType: StorkTransportType
	environment: StorkEnvironment
}

export const storkEndpoints: readonly StorkEndpoint[] = [
	{
		region: StorkRegion.Jp,
		url: 'https://rest.jp.stork-oracle.network',
		transportType: StorkTransportType.Rest,
		environment: StorkEnvironment.Production,
	},
	{
		region: StorkRegion.Jp,
		url: 'wss://api.jp.stork-oracle.network/evm/subscribe',
		transportType: StorkTransportType.WebSocket,
		environment: StorkEnvironment.Production,
	},
	{
		region: StorkRegion.Dev,
		url: 'https://rest.dev.stork-oracle.network',
		transportType: StorkTransportType.Rest,
		environment: StorkEnvironment.Development,
	},
	{
		region: StorkRegion.Dev,
		url: 'wss://api.dev.stork-oracle.network/evm/subscribe',
		transportType: StorkTransportType.WebSocket,
		environment: StorkEnvironment.Development,
	},
] as const satisfies readonly StorkEndpoint[]

export const storkEndpointsByRegion = Map.groupBy(storkEndpoints, (e) => e.region)

export const storkRestUrls = Object.fromEntries(
	storkEndpoints
		.filter((endpoint) => endpoint.transportType === StorkTransportType.Rest)
		.map((endpoint) => [endpoint.region, endpoint.url]),
) satisfies Record<StorkRegion, string>

export const storkWebsocketUrls = Object.fromEntries(
	storkEndpoints
		.filter((endpoint) => endpoint.transportType === StorkTransportType.WebSocket)
		.map((endpoint) => [endpoint.region, endpoint.url]),
) satisfies Record<StorkRegion, string>

export const storkDefaultRegion = StorkRegion.Jp
export const storkRestBaseUrl = storkRestUrls[storkDefaultRegion]
export const storkWebsocketUrl = storkWebsocketUrls[storkDefaultRegion]

export enum StorkQuoteAsset {
	Usd = 'USD',
}

export type StorkAssetRegistryEntry = {
	assetId: string
	encodedAssetId: string
}

export type StorkAssetDefinition = StorkAssetRegistryEntry & {
	baseAsset: string
	quoteAsset: StorkQuoteAsset
	chainIds: readonly number[]
}

export const storkAssetEntries = [
	{
		assetId: 'AAVEUSD',
		encodedAssetId: '0x029ff4e5b838907c663ddd7b03d9a7f56b1d8cb32cfc0662c37f2632c64b52a4',
	},
	{
		assetId: 'ADAUSD',
		encodedAssetId: '0x3cfdbed8f424d2c7113c47bb0775876d7a34cf04c48fcd15fc7bc2e8be85f3ed',
	},
	{
		assetId: 'APTUSD',
		encodedAssetId: '0x90f4b4c95f9dee30278d7a62dab1916915c1472a51d03d39089f8492136b04aa',
	},
	{
		assetId: 'ARBUSD',
		encodedAssetId: '0x365f8b30df22d80f2e0b406679ef53f75e49d6cad9c1c9e6bc1df7b092658a20',
	},
	{
		assetId: 'AUSDUSD',
		encodedAssetId: '0xf0f5bc7822329038ac4dbc4c6e6a4453c1980612111a87ff67d3624c8b2e0b2e',
	},
	{
		assetId: 'AVAXUSD',
		encodedAssetId: '0x0c26b653bce6116d26804ec1e9815465af19aaf56c39eaaf001816375fdf8a1d',
	},
	{
		assetId: 'BERAUSD',
		encodedAssetId: '0x9c7a8f90aa21b1e368d1a5f7b4d75aa03fec9abb903d84946ef76fd6fd79b312',
	},
	{
		assetId: 'BNBUSD',
		encodedAssetId: '0x1bc6d6279e196b1fa7b94a792d57a47433858940c1b3500f2a5e69640cd12ef4',
	},
	{
		assetId: 'BTCUSD',
		encodedAssetId: '0x7404e3d104ea7841c3d9e6fd20adfe99b4ad586bc08d8f3bd3afef894cf184de',
	},
	{
		assetId: 'CAKEUSD',
		encodedAssetId: '0x4cdec5681c52113a81c288e66a15ad09ceb2136a349c1d5b1f18c0c54b74f22a',
	},
	{
		assetId: 'DOGEUSD',
		encodedAssetId: '0xaf3aa213a005c9a693262f7bd09dff6e39069392dea742922b0ecb61b5201751',
	},
	{
		assetId: 'EARNAUSDAUSD_RR',
		encodedAssetId: '0xe904b211ca1fdc78d094550c6c43d86f391a94277b71f1d84221835469acc8e0',
	},
	{
		assetId: 'EDUUSD',
		encodedAssetId: '0x6ee0e88f0bfb4b16b8f3eff7a0480b3338eed0367c7343ebf55b8bde53c620ca',
	},
	{
		assetId: 'ETHUSD',
		encodedAssetId: '0x59102b37de83bdda9f38ac8254e596f0d9ac61d2035c07936675e87342817160',
	},
	{
		assetId: 'FUELUSD',
		encodedAssetId: '0x670b7091d54af59331f97a1ce4a321eab14fd257a8b57b75ce4d4a5afc9186f4',
	},
	{
		assetId: 'HYPEUSD',
		encodedAssetId: '0x4458c4980d94bc7fef3ade260b034fb575f04ce6ce4abb20b9c1dbc4b0b9d169',
	},
	{
		assetId: 'LINKUSD',
		encodedAssetId: '0x694cad6038bcbefcc30e11862e412bb58f9c4ac3c9e0f9ed02d3e38b16829263',
	},
	{
		assetId: 'MAUSDTLISTAUSD_RR',
		encodedAssetId: '0x06d9353dff928a252fbb2697fe4897752613ef4dfb77092bd77b8d3853388e83',
	},
	{
		assetId: 'MIBNBUSD_RR',
		encodedAssetId: '0xc11353274ef1bf42cd3476031e93ede567e9baa96d42c1423e285ab0e5c6faa2',
	},
	{
		assetId: 'MIETHUSD_RR',
		encodedAssetId: '0x91ccdbe8da3b9dddf432f3eae0e700bdd7af249640736529d547371527fd0303',
	},
	{
		assetId: 'MITOUSD',
		encodedAssetId: '0x676e68664777355c00a9717c8bdfe8f55e98abfd159cce18051d01262b73f6a4',
	},
	{
		assetId: 'MIUSDCUSD_RR',
		encodedAssetId: '0xe5fa6ce29b72da607ae16fc8932ec646a863ef0e6cb50e2a04a912ce8934b16c',
	},
	{
		assetId: 'MONUSD',
		encodedAssetId: '0xa4f6b07ae0c89e3f3cc03c1badcc3e9adffdf7206bafcd56d142979800887385',
	},
	{
		assetId: 'NACREDXUSD',
		encodedAssetId: '0x689dfb3251e38b997e3d82f681d088374ac80275fb1333a6759ae8f24afb87cf',
	},
	{
		assetId: 'NALPHAUSD',
		encodedAssetId: '0x23a8a51db3a3da40db90c068e84d120bfc3dd4f8f5975cf4f4a7413826e1bbf8',
	},
	{
		assetId: 'NBASISUSD',
		encodedAssetId: '0xf368c145faa5cac6eaf4e41eff80fd168211e4daa231a1b289fdab29b69c6623',
	},
	{
		assetId: 'NCREDITUSD',
		encodedAssetId: '0xcd880ab078cf241d0685bd8f1dcee7da147295c44f5646ba178f7dc92cb22159',
	},
	{
		assetId: 'NELIXIRUSD',
		encodedAssetId: '0xdb3e876d4b971ba580b45ee4e1b3ab04c6584048ed4c151bd1148b73e43646ca',
	},
	{
		assetId: 'NETFUSD',
		encodedAssetId: '0x1a253fdb61a6b1dddce283bfe52f87b226fcbf03397de0105057cf686e5b5f20',
	},
	{
		assetId: 'NINSTOUSD',
		encodedAssetId: '0xc31d5c25cd679100c1dff585834d7dca409026e232b37818c6723b812892c07d',
	},
	{
		assetId: 'NOPALUSD',
		encodedAssetId: '0xc4fd7cb87179f5c5f727ae36d416181bc2bcbbf4b99776ce59445f8370c3c13a',
	},
	{
		assetId: 'NPAYFIUSD',
		encodedAssetId: '0xc8013a55e8bc03a72fa9a306bc9014dc7754e5c686e8959982efc5d3c0620d67',
	},
	{
		assetId: 'NTBILLUSD',
		encodedAssetId: '0x2647985caf5516af21b0304b2acb77986d1eeea2c8bf3a5866cd5ae8d8e59926',
	},
	{
		assetId: 'NUSDYUSD',
		encodedAssetId: '0x4977a819b788c1d318b1de4fd8cec0e3dde380762a2780739daa584f3a5dbb35',
	},
	{
		assetId: 'NWISDOMUSD',
		encodedAssetId: '0x4530f38efa1b2d9153a159470e7146e596c06bb5e802ade53c718d88bcfa1098',
	},
	{
		assetId: 'NYIELDUSD',
		encodedAssetId: '0x18fddef43d68963e9041e7a0c0a33379841cc97b553988c84eb1e28fba6fe2c7',
	},
	{
		assetId: 'OPUSD',
		encodedAssetId: '0x2316c275dd635566dd979f717711dcb9fef72e5b70bb46b28ed03958eb7a0e85',
	},
	{
		assetId: 'PETHUSD_RR',
		encodedAssetId: '0xe4230bc1e94312c4b57a311c5e3bf5b6a42564ddc1ea7e7edb004180036341c2',
	},
	{
		assetId: 'PLUMEUSD',
		encodedAssetId: '0xfd8d4fb833e9a2ee44167d8fd258e6d0019a2994e1c863382b9bcd567b52810b',
	},
	{
		assetId: 'POLUSD',
		encodedAssetId: '0x3677639ed5e5918f1a5fdf6848a3a197d562a51fb309aac07903bd911d4e4eba',
	},
	{
		assetId: 'PUSDUSD',
		encodedAssetId: '0xe78fbac639b951bb7d4d8a6a7e4e3be7be423f4056b225ec071544c48dc303ef',
	},
	{
		assetId: 'PYTHUSD',
		encodedAssetId: '0xcf7965bf4ad8d01e1b4eeae12c41695dfa3c70c18de932ee0cfecf7235cfb48f',
	},
	{
		assetId: 'REDUSD',
		encodedAssetId: '0x7dfc788a1dc29f8559bcbf976dba1921ea21f3c18811aec678bd350f42229e38',
	},
	{
		assetId: 'SBTCUSD',
		encodedAssetId: '0x08fc8780f52cb9e9b6c835e55c4c083d9fe2d67470c1eb5207021292f95e5052',
	},
	{
		assetId: 'SEIUSD',
		encodedAssetId: '0x7dd60a3246f0df98f307775ca3856eb28872e2d36d044d307fe39768b2be208b',
	},
	{
		assetId: 'SOLUSD',
		encodedAssetId: '0x1dcd89dfded9e8a9b0fa1745a8ebbacbb7c81e33d5abc81616633206d932e837',
	},
	{
		assetId: 'SPLUMEUSD',
		encodedAssetId: '0x12b5f77572b7781fd674853d9949a4b86a194eaa05c7bb799a7fa3b879da9f83',
	},
	{
		assetId: 'STFUELUSD_RR',
		encodedAssetId: '0xa3ed2e58076f53e8dd15c8463ee49e6ce547355c34c639777c5dace3728e2ded',
	},
	{
		assetId: 'SUIUSD',
		encodedAssetId: '0xa24cc95a4f3d70a0a2f7ac652b67a4a73791631ff06b4ee7f729097311169b81',
	},
	{
		assetId: 'SUSD',
		encodedAssetId: '0xe18df262d6d0bec60a8d935280235a1a1ee38eabbe83ca3eb9a1ed48b31ac8cb',
	},
	{
		assetId: 'SUSDEUSD',
		encodedAssetId: '0xf287ddec9700e4ab1db93dbfa5f0e125ee87f8a9eda635f76895e923408d8105',
	},
	{
		assetId: 'SUSNUSD',
		encodedAssetId: '0x4fad14ab0b3793942fa6b796f40b263f0bb67815685625f9061f804cc4f7968f',
	},
	{
		assetId: 'SUPEROETHPWETH_RR',
		encodedAssetId: '0x1a623bb0b7eaa0dafff6122ecf16d0d3b66bae63bd0bfee833ee050f5d029389',
	},
	{
		assetId: 'TIAUSD',
		encodedAssetId: '0xc45bed07b2865e75808c5b94bf1720502a8d22ebcacb0a8d435d244e2ea1bd07',
	},
	{
		assetId: 'UNIUSD',
		encodedAssetId: '0x9e6266a76df39a05a79ea6566fb4780787a70d8bd92ac5e8d5227ee526d20554',
	},
	{
		assetId: 'USDCUSD',
		encodedAssetId: '0x7416a56f222e196d0487dce8a1a8003936862e7a15092a91898d69fa8bce290c',
	},
	{
		assetId: 'USDEUSD',
		encodedAssetId: '0xa794a3432ecbe502ac5e44b28475b66b948cbd938ddae5005515133d328dad04',
	},
	{
		assetId: 'USDTUSD',
		encodedAssetId: '0x6dcd0a8fb0460d4f0f98c524e06c10c63377cd098b589c0b90314bfb55751558',
	},
	{
		assetId: 'WBTCUSD',
		encodedAssetId: '0x1ddeb20108df88bf27cc4a55fff8489a99c37ae2917ce13927c6cdadf4128503',
	},
	{
		assetId: 'WBNBUSD',
		encodedAssetId: '0x43a83fb6f275dcf9f6ae0f302246085b8033bae29dbe5bc737d1bc8e9f4f5b17',
	},
	{
		assetId: 'WEETHUSD',
		encodedAssetId: '0x2778ff4ef448d972c023c579b2bff9c55d48d0fde830dcdd72fff8189c01993e',
	},
	{
		assetId: 'WETHUSD',
		encodedAssetId: '0x8afba5f1a5d4969d23c3b42db1b88f8a9c8176392de5bf066752260478ce82b8',
	},
	{
		assetId: 'WSTETHUSD',
		encodedAssetId: '0x56dd6ca223192c3f415d95b0e6812b9405845c7853522975239c88b6f4f34cbd',
	},
	{
		assetId: 'XAUUSD',
		encodedAssetId: '0xe21c86d8b6a127bfef214d88fdb0c279e55d27dd8c443733e46c8d3de3c98cd6',
	},
	{
		assetId: 'XAUMUSD',
		encodedAssetId: '0x5830a4bf67569f9de641c0114daf165c186efc272597a6570aabc4f7b02fd647',
	},
	{
		assetId: 'XRPUSD',
		encodedAssetId: '0x49139a167820038c145d3069c93650bc8e58e050592ba1095de576411ddf693d',
	},
	{
		assetId: 'ZROUSD',
		encodedAssetId: '0xeab1f0a597440f80e490a45615f860cae60e8c85c615d96922a38a41ef99155e',
	},
] as const satisfies readonly StorkAssetRegistryEntry[]

export const storkEncodedAssetIdByAssetId = Object.fromEntries(
	storkAssetEntries.map((asset) => [
		asset.assetId,
		asset.encodedAssetId,
	]),
)

export enum StorkTokenSymbol {
	Aave = 'AAVE',
	Ada = 'ADA',
	Apt = 'APT',
	Arb = 'ARB',
	Ausd = 'AUSD',
	Avax = 'AVAX',
	Bera = 'BERA',
	Bnb = 'BNB',
	Btc = 'BTC',
	Cake = 'CAKE',
	Doge = 'DOGE',
	Edu = 'EDU',
	Eth = 'ETH',
	Fuel = 'FUEL',
	Hype = 'HYPE',
	Link = 'LINK',
	Mito = 'MITO',
	Mon = 'MON',
	Nacredx = 'NACREDX',
	Nalpha = 'NALPHA',
	Nbasis = 'NBASIS',
	Ncredit = 'NCREDIT',
	Nelixir = 'NELIXIR',
	Netf = 'NETF',
	Ninsto = 'NINSTO',
	Nopal = 'NOPAL',
	Npayfi = 'NPAYFI',
	Ntbill = 'NTBILL',
	Nusdy = 'NUSDY',
	Nwisdom = 'NWISDOM',
	Nyield = 'NYIELD',
	Op = 'OP',
	Plume = 'PLUME',
	Pol = 'POL',
	Pusd = 'PUSD',
	Pyth = 'PYTH',
	Red = 'RED',
	Sbtc = 'SBTC',
	Sei = 'SEI',
	Sol = 'SOL',
	Splume = 'SPLUME',
	Sui = 'SUI',
	Susd = 'SUSD',
	Susde = 'SUSDE',
	Susn = 'SUSN',
	Tia = 'TIA',
	Uni = 'UNI',
	Usdc = 'USDC',
	Usde = 'USDE',
	Usdt = 'USDT',
	Wbtc = 'WBTC',
	Wbnb = 'WBNB',
	Weeth = 'WEETH',
	Weth = 'WETH',
	Wsteth = 'WSTETH',
	Xau = 'XAU',
	Xaum = 'XAUM',
	Xrp = 'XRP',
	Zro = 'ZRO',
}

export type StorkTokenSymbolEntry = {
	symbol: StorkTokenSymbol
	assetId: string
}

export const storkTokenSymbolEntries = [
	{ symbol: StorkTokenSymbol.Aave, assetId: 'AAVEUSD' },
	{ symbol: StorkTokenSymbol.Ada, assetId: 'ADAUSD' },
	{ symbol: StorkTokenSymbol.Apt, assetId: 'APTUSD' },
	{ symbol: StorkTokenSymbol.Arb, assetId: 'ARBUSD' },
	{ symbol: StorkTokenSymbol.Ausd, assetId: 'AUSDUSD' },
	{ symbol: StorkTokenSymbol.Avax, assetId: 'AVAXUSD' },
	{ symbol: StorkTokenSymbol.Bera, assetId: 'BERAUSD' },
	{ symbol: StorkTokenSymbol.Bnb, assetId: 'BNBUSD' },
	{ symbol: StorkTokenSymbol.Btc, assetId: 'BTCUSD' },
	{ symbol: StorkTokenSymbol.Cake, assetId: 'CAKEUSD' },
	{ symbol: StorkTokenSymbol.Doge, assetId: 'DOGEUSD' },
	{ symbol: StorkTokenSymbol.Edu, assetId: 'EDUUSD' },
	{ symbol: StorkTokenSymbol.Eth, assetId: 'ETHUSD' },
	{ symbol: StorkTokenSymbol.Fuel, assetId: 'FUELUSD' },
	{ symbol: StorkTokenSymbol.Hype, assetId: 'HYPEUSD' },
	{ symbol: StorkTokenSymbol.Link, assetId: 'LINKUSD' },
	{ symbol: StorkTokenSymbol.Mito, assetId: 'MITOUSD' },
	{ symbol: StorkTokenSymbol.Mon, assetId: 'MONUSD' },
	{ symbol: StorkTokenSymbol.Nacredx, assetId: 'NACREDXUSD' },
	{ symbol: StorkTokenSymbol.Nalpha, assetId: 'NALPHAUSD' },
	{ symbol: StorkTokenSymbol.Nbasis, assetId: 'NBASISUSD' },
	{ symbol: StorkTokenSymbol.Ncredit, assetId: 'NCREDITUSD' },
	{ symbol: StorkTokenSymbol.Nelixir, assetId: 'NELIXIRUSD' },
	{ symbol: StorkTokenSymbol.Netf, assetId: 'NETFUSD' },
	{ symbol: StorkTokenSymbol.Ninsto, assetId: 'NINSTOUSD' },
	{ symbol: StorkTokenSymbol.Nopal, assetId: 'NOPALUSD' },
	{ symbol: StorkTokenSymbol.Npayfi, assetId: 'NPAYFIUSD' },
	{ symbol: StorkTokenSymbol.Ntbill, assetId: 'NTBILLUSD' },
	{ symbol: StorkTokenSymbol.Nusdy, assetId: 'NUSDYUSD' },
	{ symbol: StorkTokenSymbol.Nwisdom, assetId: 'NWISDOMUSD' },
	{ symbol: StorkTokenSymbol.Nyield, assetId: 'NYIELDUSD' },
	{ symbol: StorkTokenSymbol.Op, assetId: 'OPUSD' },
	{ symbol: StorkTokenSymbol.Plume, assetId: 'PLUMEUSD' },
	{ symbol: StorkTokenSymbol.Pol, assetId: 'POLUSD' },
	{ symbol: StorkTokenSymbol.Pusd, assetId: 'PUSDUSD' },
	{ symbol: StorkTokenSymbol.Pyth, assetId: 'PYTHUSD' },
	{ symbol: StorkTokenSymbol.Red, assetId: 'REDUSD' },
	{ symbol: StorkTokenSymbol.Sbtc, assetId: 'SBTCUSD' },
	{ symbol: StorkTokenSymbol.Sei, assetId: 'SEIUSD' },
	{ symbol: StorkTokenSymbol.Sol, assetId: 'SOLUSD' },
	{ symbol: StorkTokenSymbol.Splume, assetId: 'SPLUMEUSD' },
	{ symbol: StorkTokenSymbol.Sui, assetId: 'SUIUSD' },
	{ symbol: StorkTokenSymbol.Susd, assetId: 'SUSD' },
	{ symbol: StorkTokenSymbol.Susde, assetId: 'SUSDEUSD' },
	{ symbol: StorkTokenSymbol.Susn, assetId: 'SUSNUSD' },
	{ symbol: StorkTokenSymbol.Tia, assetId: 'TIAUSD' },
	{ symbol: StorkTokenSymbol.Uni, assetId: 'UNIUSD' },
	{ symbol: StorkTokenSymbol.Usdc, assetId: 'USDCUSD' },
	{ symbol: StorkTokenSymbol.Usde, assetId: 'USDEUSD' },
	{ symbol: StorkTokenSymbol.Usdt, assetId: 'USDTUSD' },
	{ symbol: StorkTokenSymbol.Wbtc, assetId: 'WBTCUSD' },
	{ symbol: StorkTokenSymbol.Wbnb, assetId: 'WBNBUSD' },
	{ symbol: StorkTokenSymbol.Weeth, assetId: 'WEETHUSD' },
	{ symbol: StorkTokenSymbol.Weth, assetId: 'WETHUSD' },
	{ symbol: StorkTokenSymbol.Wsteth, assetId: 'WSTETHUSD' },
	{ symbol: StorkTokenSymbol.Xau, assetId: 'XAUUSD' },
	{ symbol: StorkTokenSymbol.Xaum, assetId: 'XAUMUSD' },
	{ symbol: StorkTokenSymbol.Xrp, assetId: 'XRPUSD' },
	{ symbol: StorkTokenSymbol.Zro, assetId: 'ZROUSD' },
] as const satisfies readonly StorkTokenSymbolEntry[]

export const storkAssetIdByTokenSymbol = Object.fromEntries(
	storkTokenSymbolEntries.map((entry) => [entry.symbol, entry.assetId]),
) satisfies Record<StorkTokenSymbol, string>

export type StorkPushedAsset = {
	assetId: string
	maxStalenessSeconds: number
	minDeltaPercent: number
}

export type StorkPushedAssetsByNetwork = {
	[network: string]: {
		mainnet?: StorkPushedAsset[]
		testnet?: StorkPushedAsset[]
		dognet?: StorkPushedAsset[]
	}
}

export const storkPushedAssetsByNetwork = {
	'EDU Chain': {
		mainnet: [
			{ assetId: 'BTCUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'EDUUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'ETHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'USDCUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'USDTUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
		],
	},
	Fuel: {
		mainnet: [
			{ assetId: 'ETHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'FUELUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'STFUELUSD_RR', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'USDCUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
		],
	},
	Mitosis: {
		dognet: [
			{ assetId: 'ETHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'USDCUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'USDTUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
		],
		mainnet: [
			{ assetId: 'MAUSDTLISTAUSD_RR', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'MIBNBUSD_RR', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'MIETHUSD_RR', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'MITOUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'MIUSDCUSD_RR', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'USDCUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'USDTUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'WBNBUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'WEETHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'WETHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
		],
	},
	Monad: {
		mainnet: [
			{ assetId: 'AAVEUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'ADAUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'APTUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'ARBUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'AUSDUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'AVAXUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'BERAUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'BNBUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'BTCUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.02 },
			{ assetId: 'CAKEUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'DOGEUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'EARNAUSDAUSD_RR', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'ETHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.02 },
			{ assetId: 'HYPEUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'LINKUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'MONUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.02 },
			{ assetId: 'OPUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'POLUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'PYTHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'REDUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'SBTCUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'SEIUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'SOLUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'SUIUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'SUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'SUSDEUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'TIAUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'UNIUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'USDCUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'USDEUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'USDTUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'WBTCUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'WEETHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'WETHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'WSTETHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'XAUUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'XRPUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'ZROUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
		],
		testnet: [
			{ assetId: 'AAVEUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'ADAUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'APTUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'ARBUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'AVAXUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'BERAUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'BNBUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'BTCUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.02 },
			{ assetId: 'DOGEUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'ETHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.02 },
			{ assetId: 'HYPEUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'LINKUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'MONUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.02 },
			{ assetId: 'OPUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'POLUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'PYTHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'REDUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'SBTCUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'SEIUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'SOLUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'SUIUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'SUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'SUSDEUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'TIAUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'UNIUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'USDCUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'USDEUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'USDTUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'WBTCUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'WEETHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'WETHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'WSTETHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'XAUUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'XRPUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
			{ assetId: 'ZROUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.05 },
		],
	},
	Plume: {
		mainnet: [
			{ assetId: 'NACREDXUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'NALPHAUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'NBASISUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'NCREDITUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'NELIXIRUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'NETFUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'NINSTOUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'NOPALUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'NPAYFIUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'NTBILLUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'NUSDYUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'NWISDOMUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'NYIELDUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'PETHUSD_RR', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'PLUMEUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'PUSDUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'SPLUMEUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'SUPEROETHPWETH_RR', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'WETHUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
			{ assetId: 'XAUMUSD', maxStalenessSeconds: 3600, minDeltaPercent: 0.5 },
		],
	},
	TAC: {
		mainnet: [
			{ assetId: 'SUSNUSD', maxStalenessSeconds: 21600, minDeltaPercent: 1 },
		],
	},
} satisfies StorkPushedAssetsByNetwork

const storkPushedNetworkEnvToChainId: Record<string, Partial<Record<string, number>>> = {
	Monad: { mainnet: ChainId.Monad, testnet: ChainId.MonadTestnet },
	Plume: { mainnet: ChainId.Plume },
	'Plume Testnet': { mainnet: ChainId.PlumeTestnet },
}

const storkAssetChainEntries = Object.entries(storkPushedAssetsByNetwork).flatMap(
	([networkName, envs]) => (
		Object.entries(envs).flatMap(([env, assets]) => {
			const chainId = storkPushedNetworkEnvToChainId[networkName]?.[env]
			return chainId == null || !assets
				? []
			: assets.map((asset) => [asset.assetId, chainId])
		})
	),
)

export const storkChainIdsByAssetId = Object.fromEntries(
	Map.groupBy(storkAssetChainEntries, ([assetId]) => assetId)
		.entries()
		.map(([assetId, entries]) => [
			assetId,
			[...new Set(entries.map((entry) => entry[1]))],
		]),
) satisfies Record<string, readonly number[]>

export const storkAssetEntriesWithMeta: readonly StorkAssetDefinition[] = storkAssetEntries.map(
	(e) => ({
		...e,
		baseAsset: e.assetId.replace(/USD.*$/, ''),
		quoteAsset: StorkQuoteAsset.Usd,
		chainIds: storkChainIdsByAssetId[e.assetId] ?? [],
	}),
)

export const storkAssetsByAssetId: Record<string, StorkAssetDefinition> = Object.fromEntries(
	storkAssetEntriesWithMeta.map((a) => [a.assetId, a]),
)

export const storkPushedAssetIds = [
	...new Set(
		Object.values(storkPushedAssetsByNetwork)
			.flatMap((network) => Object.values(network))
			.flatMap((assets) => assets.map((asset) => asset.assetId)),
	),
]
