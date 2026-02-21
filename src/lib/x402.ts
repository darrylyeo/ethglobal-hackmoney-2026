/**
 * Minimal x402 (HTTP 402 Payment Required) support for agent chat.
 * When a request returns 402, use the payment provider to complete payment and retry.
 */

import type { EIP1193Provider } from '$/lib/wallet.ts'

export type X402PaymentInstructions = {
	chainId?: number
	to?: `0x${string}`
	value?: string
	data?: `0x${string}`
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null

export const parse402Body = (body: unknown): X402PaymentInstructions | null => {
	if (!isRecord(body)) return null
	return {
		chainId: typeof body.chainId === 'number' ? body.chainId : undefined,
		to:
			typeof body.to === 'string' && body.to.startsWith('0x')
				? (body.to as `0x${string}`)
				: undefined,
		value: typeof body.value === 'string' ? body.value : undefined,
		data:
			typeof body.data === 'string' && body.data.startsWith('0x')
				? (body.data as `0x${string}`)
				: undefined,
	}
}

export const pay402 = async (
	provider: EIP1193Provider,
	instructions: X402PaymentInstructions,
): Promise<string> => {
	const { to, value, data } = instructions
	if (!to) throw new Error('x402: missing payment recipient (to)')
	const txHash = (await provider.request({
		method: 'eth_sendTransaction',
		params: [
			{
				to,
				value: value ?? '0x0',
				data: data ?? '0x',
			},
		],
	})) as string
	return txHash
}

export const PAYMENT_WALLET_REQUIRED_MESSAGE =
	'Connect a wallet for agent payments (Payment account in this conversation) to pay for this request.'

export const fetchWith402 = async (
	input: RequestInfo | URL,
	init?: RequestInit,
	options?: { getPaymentProvider?: () => EIP1193Provider | null },
): Promise<Response> => {
	const res = await fetch(input, init)
	if (res.status !== 402) return res
	const provider = options?.getPaymentProvider?.() ?? null
	if (!provider) {
		throw new Error(PAYMENT_WALLET_REQUIRED_MESSAGE)
	}
	const body = await res.json().catch(() => null)
	const instructions = parse402Body(body)
	if (!instructions?.to) {
		throw new Error(
			'Payment required (402): could not parse x402 payment instructions.',
		)
	}
	try {
		await pay402(provider, instructions)
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e)
		throw new Error(`Agent payment failed: ${msg}`)
	}
	return fetch(input, {
		...init,
		headers: {
			...init?.headers,
			'X-Payment-Proof': 'sent',
		},
	})
}
