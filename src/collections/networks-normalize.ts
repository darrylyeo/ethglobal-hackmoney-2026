import type { Network } from '$/constants/networks'

export const normalizeNetwork = (entry: Network): Network => ({
	id: entry.id,
	name: entry.name,
})
