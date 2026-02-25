/**
 * EIP-8004 Trustless Agent: normalized agent from Identity Registry + registration document.
 * https://eips.ethereum.org/EIPS/eip-8004
 */

export type Eip8004Agent$Id = {
	chainId: number
	identityId: string
}

export type Eip8004AgentService = {
	type: string
	url?: string
	name?: string
}

export type Eip8004Agent = {
	$id: Eip8004Agent$Id
	contractAddress: `0x${string}`
	registrationUri: string
	name?: string
	description?: string
	image?: string
	contactEndpoint?: string
	services?: Eip8004AgentService[]
	fetchedAt: number
}

export const eip8004AgentIdToString = (id: Eip8004Agent$Id): string =>
	`${id.chainId}:${id.identityId}`

export const eip8004AgentIdFromString = (
	s: string,
): Eip8004Agent$Id | null => {
	const colon = s.indexOf(':')
	if (colon < 0) return null
	const chainId = parseInt(s.slice(0, colon), 10)
	const identityId = s.slice(colon + 1)
	return Number.isInteger(chainId) && identityId.length > 0
		? { chainId, identityId }
		: null
}
