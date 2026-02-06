export type Trace = {
	index: number
	type?: string
	from?: string
	to?: string
	value?: string
	gas?: bigint
	gasUsed?: bigint
	input?: string
	output?: string
	error?: string
	children?: Trace[]
}
