import { error } from '@sveltejs/kit'
import { parseNetworkNameParam } from '$/constants/networks.ts'

export function load({ params }) {
	const parsed = parseNetworkNameParam(params.name)
	if (!parsed) throw error(404, 'Network not found')
	return {
		nameParam: params.name,
		chainId: parsed.chainId,
		config: parsed.config,
		slug: parsed.slug,
		caip2: parsed.caip2,
	}
}
