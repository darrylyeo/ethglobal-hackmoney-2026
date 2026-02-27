/**
 * EIP-8004 service: normalized entity from Identity Registry + registration document.
 * https://eips.ethereum.org/EIPS/eip-8004
 */

export type Eip8004Service$Id = {
	chainId: number
	identityId: string
}

export type Eip8004ServiceCapability = {
	type: string
	url?: string
	name?: string
}

export type Eip8004Service = {
	$id: Eip8004Service$Id
	contractAddress: `0x${string}`
	registrationUri: string
	name?: string
	description?: string
	image?: string
	contactEndpoint?: string
	services?: Eip8004ServiceCapability[]
	fetchedAt: number
}

export const eip8004ServiceIdToString = (id: Eip8004Service$Id): string =>
	`${id.chainId}:${id.identityId}`

export const eip8004ServiceIdFromString = (
	s: string,
): Eip8004Service$Id | null => {
	const colon = s.indexOf(':')
	if (colon < 0) return null
	const chainId = parseInt(s.slice(0, colon), 10)
	const identityId = s.slice(colon + 1)
	return Number.isInteger(chainId) && identityId.length > 0
		? { chainId, identityId }
		: null
}
