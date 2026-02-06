import type { PageLoad } from './$types.ts'

export const load: PageLoad = ({ params }) => ({
	addressParam: params.address,
})
