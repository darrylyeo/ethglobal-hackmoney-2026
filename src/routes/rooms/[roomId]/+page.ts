import type { PageLoad } from './$types.ts'

export const load: PageLoad = ({ params }) => ({
	roomId: params.roomId,
})
