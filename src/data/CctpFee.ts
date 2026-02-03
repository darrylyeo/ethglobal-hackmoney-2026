export type CctpFee$Id = {
	apiHost: string
	fromDomain: number
	toDomain: number
}

export type CctpFeeItem = {
	finalityThreshold: number
	minimumFee: number
}

export type CctpFee = {
	$id: CctpFee$Id
	rows: CctpFeeItem[]
	fetchedAt: number
	isLoading: boolean
	error: string | null
}
