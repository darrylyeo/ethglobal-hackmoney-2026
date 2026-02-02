export enum TokenListId {
	Uniswap = 'Uniswap',
	Aave = 'Aave',
	Compound = 'Compound',
}

export type TokenList = {
	id: TokenListId
	url: string
}

export const tokenLists = [
	{
		id: TokenListId.Uniswap,
		url: 'https://tokens.uniswap.org',
	},
	{
		id: TokenListId.Aave,
		url: 'https://tokenlist.aave.com',
	},
	{
		id: TokenListId.Compound,
		url: 'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json',
	},
] as const satisfies readonly TokenList[]

export const tokenListUrls = tokenLists.map((list) => list.url)
