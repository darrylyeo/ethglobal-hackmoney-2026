import { Address } from '@tevm/voltaire/Address'

export const isValidAddress = (address: string) =>
	address.startsWith('0x') && Address.isValid(address)

/** Normalize to EIP-55 checksummed format. Use at boundaries: user input, API responses, URL params. */
export const normalizeAddress = (address: string) =>
	Address.isValid(address)
		? (Address.toChecksummed(Address.fromHex(address)) as `0x${string}`)
		: null

export const checksumAddress = normalizeAddress

export const formatAddress = (address: string, chars = 6) =>
	`${address.slice(0, chars + 2)}…${address.slice(-chars)}`

export const parseAccountAddressParam = (param: string) => {
	const decoded = decodeURIComponent(param)
	if (decoded.includes('@')) {
		const [addressPart, rest] = decoded.split('@')
		const normalized = normalizeAddress(addressPart)
		if (!normalized) return null
		const match = rest?.match(/^eip155:(\d+)#/)
		const chainId = match ? parseInt(match[1], 10) : undefined
		return {
			address: normalized,
			interopAddress: chainId != null ? decoded : undefined,
			chainId,
		}
	}
	const normalized = normalizeAddress(decoded)
	return normalized ? { address: normalized } : null
}
