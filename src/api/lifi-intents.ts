/**
 * LI.FI order server (OIF-compatible) quotes for NEAR Intents.
 * Swap: same-chain one input / one output. Bridge: cross-chain same coin.
 */

import { toInteropHex } from '$/constants/interop.ts'
import { getUsdcAddress } from '$/api/lifi.ts'

const ORDER_SERVER_BASE = 'https://order.li.fi'
const QUOTE_PATH = '/quote/request'

type OifAddress = `0x${string}`
type OifAmount = string

type OifInput = {
	user: OifAddress
	asset: OifAddress
	amount: OifAmount
}

type OifOutput = {
	receiver: OifAddress
	asset: OifAddress
	amount?: OifAmount
}

type GetQuoteRequest = {
	user: OifAddress
	intent: {
		intentType: 'oif-swap'
		inputs: OifInput[]
		outputs: OifOutput[]
		swapType: 'exact-input'
		minValidUntil?: number
	}
	/** Order types supported by the client (OIF-compatible; required by order server). */
	supportedTypes: string[]
}

type GetQuoteResponse = {
	quotes: {
		validUntil: number
		quoteId: `quote_${string}`
		preview: { inputs: OifInput[]; outputs: OifOutput[] }
		metadata?: { exclusiveFor: string | null }
		partialFill: false
	}[]
}

export type IntentsQuote = {
	validUntil: number
	quoteId: `quote_${string}`
	preview: { inputs: OifInput[]; outputs: OifOutput[] }
	metadata?: { exclusiveFor: string | null }
}

async function postQuoteRequest(body: GetQuoteRequest): Promise<GetQuoteResponse> {
	const res = await fetch(`${ORDER_SERVER_BASE}${QUOTE_PATH}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
	if (!res.ok) {
		const text = await res.text()
		throw new Error(`Order server quote failed: ${res.status} ${text}`)
	}
	return res.json() as Promise<GetQuoteResponse>
}

export type GetIntentsQuoteParams = {
	chainId: number
	tokenIn: `0x${string}`
	tokenOut: `0x${string}`
	amount: bigint
	userAddress: `0x${string}`
}

export async function getIntentsQuote(
	params: GetIntentsQuoteParams,
): Promise<IntentsQuote | null> {
	const { chainId, tokenIn, tokenOut, amount, userAddress } = params
	const user = toInteropHex(chainId, userAddress)
	const request: GetQuoteRequest = {
		user,
		intent: {
			intentType: 'oif-swap',
			inputs: [
				{
					user,
					asset: toInteropHex(chainId, tokenIn),
					amount: amount.toString(),
				},
			],
			outputs: [
				{
					receiver: user,
					asset: toInteropHex(chainId, tokenOut),
				},
			],
			swapType: 'exact-input',
		},
		supportedTypes: ['oif-escrow-v0'],
	}
	const response = await postQuoteRequest(request)
	const first = response.quotes[0]
	return first
		? {
				validUntil: first.validUntil,
				quoteId: first.quoteId,
				preview: first.preview,
				metadata: first.metadata,
			}
		: null
}

export type GetIntentsBridgeQuoteParams = {
	fromChainId: number
	toChainId: number
	amount: bigint
	fromAddress: `0x${string}`
	toAddress: `0x${string}`
}

export async function getIntentsBridgeQuote(
	params: GetIntentsBridgeQuoteParams,
): Promise<IntentsQuote | null> {
	const { fromChainId, toChainId, amount, fromAddress, toAddress } = params
	const fromToken = getUsdcAddress(fromChainId)
	const toToken = getUsdcAddress(toChainId)
	const user = toInteropHex(fromChainId, fromAddress)
	const receiver = toInteropHex(toChainId, toAddress)
	const request: GetQuoteRequest = {
		user,
		intent: {
			intentType: 'oif-swap',
			inputs: [
				{
					user,
					asset: toInteropHex(fromChainId, fromToken),
					amount: amount.toString(),
				},
			],
			outputs: [
				{
					receiver,
					asset: toInteropHex(toChainId, toToken),
				},
			],
			swapType: 'exact-input',
		},
		supportedTypes: ['oif-escrow-v0'],
	}
	const response = await postQuoteRequest(request)
	const first = response.quotes[0]
	return first
		? {
				validUntil: first.validUntil,
				quoteId: first.quoteId,
				preview: first.preview,
				metadata: first.metadata,
			}
		: null
}
