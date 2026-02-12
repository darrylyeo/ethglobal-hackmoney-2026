export enum DataSource {
	Local = 'Local',
	Cctp = 'Cctp',
	Covalent = 'Covalent',
	LiFi = 'LiFi',
	Llm = 'Llm',
	PartyKit = 'PartyKit',
	Stork = 'Stork',
	TokenLists = 'TokenLists',
	Sourcify = 'Sourcify',
	Spandex = 'Spandex',
	Uniswap = 'Uniswap',
	Voltaire = 'Voltaire',
	Yellow = 'Yellow',
}

export const dataSourceEntries: readonly { id: DataSource }[] = (
	Object.values(DataSource) as DataSource[]
).map((id) => ({ id }))

export const dataSourcesById = Object.fromEntries(
	dataSourceEntries.map((e) => [e.id, e]),
) as Record<DataSource, { id: DataSource }>
