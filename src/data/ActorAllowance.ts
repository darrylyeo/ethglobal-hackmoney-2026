export type ActorAllowance$Id = {
	chainId: number
	address: `0x${string}`
	tokenAddress: `0x${string}`
	spenderAddress: `0x${string}`
}

export type ActorAllowance = {
	$id: ActorAllowance$Id
	allowance: bigint
	isLoading: boolean
	error: string | null
	lastChecked: number
}
