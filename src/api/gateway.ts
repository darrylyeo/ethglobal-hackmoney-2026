/**
 * Circle Gateway API: balances, estimate, create transfer attestation.
 * https://developers.circle.com/gateway
 */

import { getGatewayApiBase } from '$/constants/gateway'

export type GatewayBalanceItem = {
	domain: number
	depositor: string
	balance: string
}

export type GatewayBalancesResponse = {
	token: 'USDC'
	balances: GatewayBalanceItem[]
}

export async function fetchGatewayBalances(
	depositor: `0x${string}`,
	isTestnet: boolean,
	options?: { domain?: number },
): Promise<GatewayBalancesResponse> {
	const base = getGatewayApiBase(isTestnet)
	const body = {
		token: 'USDC',
		sources: [
			options?.domain !== undefined
				? { depositor: depositor.toLowerCase(), domain: options.domain }
				: { depositor: depositor.toLowerCase() },
		],
	}
	const res = await fetch(`${base}/v1/balances`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
	if (!res.ok) {
		const text = await res.text()
		throw new Error(`Gateway balances failed: ${res.status} ${text}`)
	}
	return res.json() as Promise<GatewayBalancesResponse>
}

/** Sum of unified USDC balance across all domains for a depositor. */
export async function fetchGatewayUnifiedBalance(
	depositor: `0x${string}`,
	isTestnet: boolean,
): Promise<bigint> {
	const data = await fetchGatewayBalances(depositor, isTestnet)
	const total = data.balances.reduce(
		(acc, b) => acc + BigInt(b.balance),
		0n,
	)
	return total
}

export type GatewayTransferSpec = {
	version: 1
	sourceDomain: number
	destinationDomain: number
	sourceContract: `0x${string}`
	destinationContract: `0x${string}`
	sourceToken: `0x${string}`
	destinationToken: `0x${string}`
	sourceDepositor: `0x${string}`
	destinationRecipient: `0x${string}`
	sourceSigner: `0x${string}`
	destinationCaller: `0x${string}`
	value: string
	salt: `0x${string}`
	hookData?: `0x${string}`
}

export type GatewayBurnIntentRequest = {
	burnIntent: {
		maxBlockHeight: string
		maxFee: string
		spec: GatewayTransferSpec
	}
	signature: string
}

export type GatewayTransferResponse = {
	transferId: string
	attestation: string
	signature: string
	fees: {
		total: string
		token: string
		perIntent?: { transferSpecHash: string; domain: number; baseFee: string; transferFee: string }[]
	}
	expirationBlock: string
}

export async function createGatewayTransferAttestation(
	requests: GatewayBurnIntentRequest[],
	isTestnet: boolean,
): Promise<GatewayTransferResponse> {
	const base = getGatewayApiBase(isTestnet)
	const res = await fetch(`${base}/v1/transfer`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(requests),
	})
	if (!res.ok) {
		const text = await res.text()
		throw new Error(`Gateway transfer attestation failed: ${res.status} ${text}`)
	}
	return res.json() as Promise<GatewayTransferResponse>
}
