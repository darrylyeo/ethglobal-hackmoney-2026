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
		url: 'https://raw.githubusercontent.com/bgd-labs/aave-address-book/main/tokenlist.json',
	},
	{
		id: TokenListId.Compound,
		url: 'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json',
	},
] as const satisfies readonly TokenList[]

export const tokenListUrls: readonly string[] = tokenLists
	.map((list) => list.url)

