/**
 * Interop address helpers (EIP-7930 / ERC-7828) via @wonderland/interop-addresses.
 * Used for address formatting, parsing, and transport across constants, entity ids, and drag payloads.
 */

import {
	decodeAddress,
	encodeAddress,
	formatName,
	type InteroperableAddressText,
} from '@wonderland/interop-addresses'

const EIP155_VERSION = 1 as const
const CHAIN_TYPE = 'eip155' as const

export const toInteropAddressText = (
	chainId: number,
	address: `0x${string}`,
): InteroperableAddressText => ({
	version: EIP155_VERSION,
	chainType: CHAIN_TYPE,
	chainReference: String(chainId),
	address,
})

export const toInteropName = (
	chainId: number,
	address: `0x${string}`,
	opts?: { includeChecksum?: boolean },
): string => formatName(toInteropAddressText(chainId, address), opts)

export const toInteropHex = (
	chainId: number,
	address: `0x${string}`,
): `0x${string}` =>
	encodeAddress(toInteropAddressText(chainId, address), {
		format: 'hex',
	}) as `0x${string}`

export const interopFormatConfig = {
	includeChecksum: true as const,
}

export const fromInteropBinary = (
	hex: `0x${string}`,
): InteroperableAddressText =>
	decodeAddress(hex, { representation: 'text' }) as InteroperableAddressText
