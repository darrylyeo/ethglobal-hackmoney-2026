import { error } from '@sveltejs/kit'
import { parseNetworkNameParam } from '$/constants/networks'

const TX_HASH = /^0x[a-fA-F0-9]{64}$/

export function load({ params }) {
	const parsed = parseNetworkNameParam(params.name)
	if (!parsed) throw error(404, 'Network not found')
	const txHash = params.transactionId
	if (!txHash || !TX_HASH.test(txHash))
		throw error(404, 'Invalid transaction hash')
	return {
		nameParam: params.name,
		transactionId: txHash as `0x${string}`,
		chainId: parsed.chainId,
		config: parsed.config,
		slug: parsed.slug,
		caip2: parsed.caip2,
	}
}
