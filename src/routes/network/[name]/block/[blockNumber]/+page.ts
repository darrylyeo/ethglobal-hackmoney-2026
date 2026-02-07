import { error } from '@sveltejs/kit'
import { parseNetworkNameParam } from '$/lib/patterns.ts'

const DECIMAL_ONLY = /^\d+$/

export function load({ params }) {
	const parsed = parseNetworkNameParam(params.name)
	if (!parsed) throw error(404, 'Network not found')
	const blockParam = params.blockNumber
	if (!blockParam || !DECIMAL_ONLY.test(blockParam))
		throw error(404, 'Block number must be decimal')
	const blockNumber = parseInt(blockParam, 10)
	if (!Number.isSafeInteger(blockNumber) || blockNumber < 0)
		throw error(404, 'Invalid block number')
	return {
		nameParam: params.name,
		blockNumberParam: blockParam,
		blockNumber,
		chainId: parsed.chainId,
		config: parsed.config,
		slug: parsed.slug,
		caip2: parsed.caip2,
	}
}
