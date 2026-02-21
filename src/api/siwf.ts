/**
 * Sign In with Farcaster (SIWF) – Connect API.
 * Uses @farcaster/auth-client for relay, channel, and signature verification.
 */

import {
	createAppClient,
	viemConnector,
	type StatusAPIResponse,
} from '@farcaster/auth-client'
import { FARCASTER_CONNECT_URL } from '$/constants/farcaster.ts'
import { ChainId } from '$/constants/networks.ts'
import { getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'

const ethereumRpcUrl = getEffectiveRpcUrl(ChainId.Ethereum)
const siwfClient = createAppClient({
	relay: FARCASTER_CONNECT_URL,
	ethereum: viemConnector(ethereumRpcUrl ? { rpcUrl: ethereumRpcUrl } : undefined),
})

export type SiwfChannel = {
	channelToken: string
	url: string
	nonce: string
}

export type SiwfStatusPending = {
	state: 'pending'
	nonce: string
}

export type SiwfStatusCompleted = {
	state: 'completed'
	nonce: string
	url: string
	message?: string
	signature?: `0x${string}`
	authMethod?: 'custody' | 'authAddress'
	fid?: number
	username?: string
	bio?: string
	displayName?: string
	pfpUrl?: string
	verifications?: string[]
	custody?: `0x${string}`
	signatureParams?: { nonce?: string; domain?: string }
}

export type SiwfStatus = SiwfStatusPending | SiwfStatusCompleted

export const createSiwfChannel = async (
	domain: string,
	siweUri: string,
	options?: {
		nonce?: string
		notBefore?: string
		expirationTime?: string
		requestId?: string
		redirectUrl?: string
	},
): Promise<SiwfChannel> => {
	const result = await siwfClient.createChannel({
		domain,
		siweUri,
		...options,
	})
	if (result.isError) throw new Error(result.error?.message ?? 'SIWF error')
	const { channelToken, url, nonce } = result.data
	return { channelToken, url, nonce }
}

export const getSiwfStatus = async (
	channelToken: string,
): Promise<SiwfStatus> => {
	const result = await siwfClient.status({ channelToken })
	if (result.isError) throw new Error(result.error?.message ?? 'SIWF error')
	return mapStatusResponse(result)
}

const mapStatusResponse = (res: { data: StatusAPIResponse }): SiwfStatus =>
	res.data.state === 'pending'
		? { state: 'pending', nonce: res.data.nonce }
		: {
				state: 'completed',
				nonce: res.data.nonce,
				url: res.data.url,
				message: res.data.message,
				signature: res.data.signature,
				authMethod: res.data.authMethod,
				fid: res.data.fid,
				username: res.data.username,
				bio: res.data.bio,
				displayName: res.data.displayName,
				pfpUrl: res.data.pfpUrl,
				verifications: res.data.verifications,
				custody: res.data.custody,
				signatureParams: res.data.signatureParams,
		  }

/** Verifies SIWF signature before storing auth state. Throws if verification fails. */
export const verifySiwfCompleted = async (
	s: SiwfStatusCompleted,
): Promise<{ fid: number }> => {
	const { message, signature, signatureParams } = s
	if (!message || !signature || !signatureParams?.domain || !signatureParams?.nonce)
		throw new Error('SIWF: missing message, signature, or params')
	const result = await siwfClient.verifySignInMessage({
		nonce: signatureParams.nonce,
		domain: signatureParams.domain,
		message,
		signature,
	})
	if (result.isError) throw new Error(result.error?.message ?? 'SIWF error')
	if (!result.success || !result.fid) throw new Error('SIWF verification failed')
	return { fid: result.fid }
}
