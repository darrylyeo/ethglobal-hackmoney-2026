export type UniswapPosition = {
	id: string
	chainId: number
	poolId: string
	owner: `0x${string}`
	tickLower: number
	tickUpper: number
	liquidity: bigint
	token0Owed: bigint
	token1Owed: bigint,
}

