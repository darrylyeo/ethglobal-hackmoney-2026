export enum DataSourceId {
	ChainList = 'ChainList',
	Local = 'Local',
	Cctp = 'Cctp',
	Farcaster = 'Farcaster',
	Covalent = 'Covalent',
	LiFi = 'LiFi',
	Llm = 'Llm',
	PartyKit = 'PartyKit',
	Stork = 'Stork',
	TokenLists = 'TokenLists',
	Sourcify = 'Sourcify',
	Etherscan = 'Etherscan',
	Blockscout = 'Blockscout',
	Spandex = 'Spandex',
	Sqd = 'Sqd',
	Uniswap = 'Uniswap',
	Helios = 'Helios',
	Voltaire = 'Voltaire',
	Yellow = 'Yellow',
	Eips = 'Eips',
	Caips = 'Caips',
	Eip7824 = 'Eip7824',
}

export type DataSource = {
	id: DataSourceId
	label: string
}

export type WithSource<T> = T & { $source: DataSourceId }

export const dataSources = [
	{ id: DataSourceId.ChainList, label: 'Chain List' },
	{ id: DataSourceId.Local, label: 'Local' },
	{ id: DataSourceId.Cctp, label: 'CCTP' },
	{ id: DataSourceId.Farcaster, label: 'Farcaster' },
	{ id: DataSourceId.Covalent, label: 'Covalent' },
	{ id: DataSourceId.LiFi, label: 'LiFi' },
	{ id: DataSourceId.Llm, label: 'LLM' },
	{ id: DataSourceId.PartyKit, label: 'PartyKit' },
	{ id: DataSourceId.Stork, label: 'Stork' },
	{ id: DataSourceId.TokenLists, label: 'Token Lists' },
	{ id: DataSourceId.Sourcify, label: 'Sourcify' },
	{ id: DataSourceId.Etherscan, label: 'Etherscan' },
	{ id: DataSourceId.Blockscout, label: 'Blockscout' },
	{ id: DataSourceId.Spandex, label: 'Spandex' },
	{ id: DataSourceId.Sqd, label: 'Sqd' },
	{ id: DataSourceId.Uniswap, label: 'Uniswap' },
	{ id: DataSourceId.Helios, label: 'Helios' },
	{ id: DataSourceId.Voltaire, label: 'Voltaire' },
	{ id: DataSourceId.Yellow, label: 'Yellow' },
	{ id: DataSourceId.Eips, label: 'EIPs' },
	{ id: DataSourceId.Caips, label: 'CAIPs' },
	{ id: DataSourceId.Eip7824, label: 'EIP-7824' },
] as const satisfies readonly DataSource[]

export const dataSourcesById = Object.fromEntries(
	dataSources.map((e) => [e.id, e]),
) as Record<DataSourceId, DataSource>
