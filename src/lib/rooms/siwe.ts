/**
 * SIWE (EIP-4361): message construction, signing via EIP-1193, verification via viem.
 */

import { dev } from '$env/dynamic/public'
import { recoverMessageAddress } from 'viem'

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

export const createSiweMessage = (params: SiweMessageParams): string => {
	const lines = [
		`${params.domain} wants you to sign in with your Ethereum account:`,
		params.address,
		'',
		params.statement,
		'',
		`URI: ${params.uri}`,
		`Version: 1`,
		`Chain ID: ${params.chainId}`,
		`Nonce: ${params.nonce}`,
		`Issued At: ${params.issuedAt}`,
	]
	if (params.expirationTime) {
		lines.push(`Expiration Time: ${params.expirationTime}`)
	}
	if (params.resources?.length) {
		lines.push('Resources:')
		params.resources.forEach((r) => lines.push(`- ${r}`))
	}
	return lines.join('\n')
}

const SIWE_DEBUG = typeof window !== 'undefined' && dev

export const verifySiweSignature = async (params: {
	message: string
	signature: `0x${string}`
	expectedAddress: `0x${string}`
}): Promise<boolean> => {
	const recovered = await recoverMessageAddress({
		message: params.message,
		signature: params.signature,
	})
	const ok = recovered.toLowerCase() === params.expectedAddress.toLowerCase()
	if (SIWE_DEBUG) {
		console.debug('[SIWE] verify', {
			expected: params.expectedAddress,
			recovered,
			ok,
			messagePreview:
				params.message.slice(0, 80) + (params.message.length > 80 ? '…' : ''),
		})
	}
	return ok
}

export type EIP1193Provider = {
	request: (args: { method: string, params?: unknown[] }) => Promise<unknown>
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
