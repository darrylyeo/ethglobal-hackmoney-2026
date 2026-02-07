/**
 * SIWE (EIP-4361): message construction via @tevm/voltaire/Siwe, signing via EIP-1193, verification via @tevm/voltaire/Siwe.
 */

import { Address } from '@tevm/voltaire/Address'
import { Hex } from '@tevm/voltaire/Hex'
import * as Siwe from '@tevm/voltaire/Siwe'
import { dev } from '$app/environment'
import type { EIP1193Provider } from '$/lib/wallet.ts'

export type { EIP1193Provider }

export type SiweMessageParams = {
	domain: string
	address: `0x${string}`
	statement: string
	uri: string
	nonce: string
	issuedAt: string
	expirationTime?: string
	chainId: number
	resources?: string[]
}

export const createSiweMessage = (params: SiweMessageParams): string =>
	Siwe.format(
		Siwe.create({
			domain: params.domain,
			address: Address.fromHex(params.address),
			uri: params.uri,
			chainId: params.chainId,
			statement: params.statement,
			nonce: params.nonce,
			issuedAt: params.issuedAt,
			expirationTime: params.expirationTime,
			resources: params.resources,
		}),
	)

const SIWE_DEBUG = typeof window !== 'undefined' && dev

export const verifySiweSignature = async (params: {
	message: string
	signature: `0x${string}`
	expectedAddress: `0x${string}`
}): Promise<boolean> => {
	const parsed = Siwe.parse(params.message)
	const expected = params.expectedAddress.toLowerCase()
	const messageAddress = Address.toHex(parsed.address).toLowerCase()
	if (messageAddress !== expected) {
		if (SIWE_DEBUG)
			console.debug('[SIWE] verify address mismatch', {
				expected: params.expectedAddress,
				messageAddress,
			})
		return false
	}
	const sigBytes = Hex.from(params.signature).toBytes()
	const result = Siwe.verifyMessage(parsed, sigBytes)
	if (SIWE_DEBUG) {
		console.debug('[SIWE] verify', {
			expected: params.expectedAddress,
			ok: result.valid,
			messagePreview:
				params.message.slice(0, 80) + (params.message.length > 80 ? '…' : ''),
		})
	}
	return result.valid
}

export const signSiweMessage = async (params: {
	provider: EIP1193Provider
	message: string
	address: `0x${string}`
}): Promise<`0x${string}`> => {
	if (SIWE_DEBUG) {
		console.debug('[SIWE] sign requested', {
			address: params.address,
			messagePreview:
				params.message.slice(0, 80) + (params.message.length > 80 ? '…' : ''),
		})
	}
	const sig = await params.provider.request({
		method: 'personal_sign',
		params: [params.message, params.address],
	})
	if (SIWE_DEBUG)
		console.debug('[SIWE] sign result', {
			signature: (sig as string).slice(0, 20) + '…',
		})
	return sig as `0x${string}`
}
