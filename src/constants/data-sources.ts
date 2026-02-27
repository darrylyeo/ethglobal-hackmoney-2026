export enum DataSourceId {
	Local = 'Local',
	Blockscout = 'Blockscout',
	Caips = 'Caips',
	Cctp = 'Cctp',
	ChainList = 'ChainList',
	Covalent = 'Covalent',
	Eip7824 = 'Eip7824',
	Eips = 'Eips',
	Etherscan = 'Etherscan',
	Farcaster = 'Farcaster',
	Helios = 'Helios',
	LiFi = 'LiFi',
	Llm = 'Llm',
	PartyKit = 'PartyKit',
	Sourcify = 'Sourcify',
	Spandex = 'Spandex',
	Sqd = 'Sqd',
	Stork = 'Stork',
	TokenLists = 'TokenLists',
	Uniswap = 'Uniswap',
	Voltaire = 'Voltaire',
	Yellow = 'Yellow',
}

export type DataSource = {
	id: DataSourceId
	label: string
}

export type WithSource<T> = T & { $source: DataSourceId }

export const dataSources = [
	{
		id: DataSourceId.Local,
		label: 'Local',
	},
	{
		id: DataSourceId.Blockscout,
		label: 'Blockscout',
	},
	{
		id: DataSourceId.Caips,
		label: 'CAIPs',
	},
	{
		id: DataSourceId.Cctp,
		label: 'CCTP',
	},
	{
		id: DataSourceId.ChainList,
		label: 'Chain List',
	},
	{
		id: DataSourceId.Covalent,
		label: 'Covalent',
	},
	{
		id: DataSourceId.Eip7824,
		label: 'EIP-7824',
	},
	{
		id: DataSourceId.Eips,
		label: 'EIPs',
	},
	{
		id: DataSourceId.Etherscan,
		label: 'Etherscan',
	},
	{
		id: DataSourceId.Farcaster,
		label: 'Farcaster',
	},
	{
		id: DataSourceId.Helios,
		label: 'Helios',
	},
	{
		id: DataSourceId.LiFi,
		label: 'LiFi',
	},
	{
		id: DataSourceId.Llm,
		label: 'LLM',
	},
	{
		id: DataSourceId.PartyKit,
		label: 'PartyKit',
	},
	{
		id: DataSourceId.Sourcify,
		label: 'Sourcify',
	},
	{
		id: DataSourceId.Spandex,
		label: 'Spandex',
	},
	{
		id: DataSourceId.Sqd,
		label: 'Sqd',
	},
	{
		id: DataSourceId.Stork,
		label: 'Stork',
	},
	{
		id: DataSourceId.TokenLists,
		label: 'Token Lists',
	},
	{
		id: DataSourceId.Uniswap,
		label: 'Uniswap',
	},
	{
		id: DataSourceId.Voltaire,
		label: 'Voltaire',
	},
	{
		id: DataSourceId.Yellow,
		label: 'Yellow',
	},
] as const satisfies readonly DataSource[]

export const dataSourcesById = Object.fromEntries(
	dataSources.map((e) => [e.id, e]),
) as Record<DataSourceId, DataSource>
