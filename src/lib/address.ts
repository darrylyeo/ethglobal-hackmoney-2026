import { keccak256, toBytes } from 'viem'

export const isValidAddress = (address: string): boolean =>
	/^0x[a-fA-F0-9]{40}$/.test(address)

export const normalizeAddress = (address: string): `0x${string}` | null =>
	isValidAddress(address) ? (address.toLowerCase() as `0x${string}`) : null

export const checksumAddress = (address: string): `0x${string}` | null => {
	if (!isValidAddress(address)) return null
	const addr = address.toLowerCase().slice(2)
	const hash = keccak256(toBytes(addr)).slice(2)
	let checksummed = '0x'
	for (let i = 0; i < 40; i++) {
		checksummed += parseInt(hash[i], 16) >= 8 ? addr[i].toUpperCase() : addr[i]
	}
	return checksummed as `0x${string}`
}

export const formatAddress = (address: string, chars = 6): string =>
	`${address.slice(0, chars + 2)}…${address.slice(-chars)}`

export const parseAccountAddressParam = (
	param: string,
): { address: `0x${string}`; interopAddress?: string; chainId?: number } | null => {
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
