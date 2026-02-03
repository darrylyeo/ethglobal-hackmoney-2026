export type CctpAllowance$Id = {
	apiHost: string
}

export type CctpAllowance = {
	$id: CctpAllowance$Id
	allowance: number | null
	lastUpdated: string | null
	fetchedAt: number
	isLoading: boolean
	error: string | null
}
