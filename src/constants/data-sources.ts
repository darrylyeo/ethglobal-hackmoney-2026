export enum DataSource {
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
}

export const dataSourceEntries: readonly { id: DataSource }[] = (
	Object.values(DataSource) as DataSource[]
).map((id) => ({ id }))

export const dataSourcesById = Object.fromEntries(
	dataSourceEntries.map((e) => [e.id, e]),
) as Record<DataSource, { id: DataSource }>
