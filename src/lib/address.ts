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
