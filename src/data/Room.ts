export type Room$Id = { id: string }

export type Room = {
	$id: Room$Id
	createdAt: number
	createdBy: string
	name?: string,
}
