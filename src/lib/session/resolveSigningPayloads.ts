import type { Action } from '$/constants/actions.ts'
import { ActionType } from '$/constants/actions.ts'
import { ChainId } from '$/constants/chain-id.ts'

export type TransactionSigningPayload = {
	stepIndex: number
	label?: string
	chainId: number
	from: `0x${string}`
	to?: `0x${string}`
	data?: `0x${string}`
	value?: string
	gasLimit?: string
	rpcUrl?: string
}

const zeroAddress = '0x0000000000000000000000000000000000000000' as `0x${string}`

export const resolveSigningPayloads = (
	action: Action,
	rpcUrls: Partial<Record<number, string>>,
	fromAddress: `0x${string}` | null,
): TransactionSigningPayload[] => {
	const from = fromAddress ?? zeroAddress
	const p = action.params as Record<string, unknown>

	switch (action.type) {
		case ActionType.Swap: {
			const chainId = (p.chainId as number) ?? ChainId.Ethereum
			return [
				{
					stepIndex: 0,
					label: 'Swap',
					chainId,
					from,
					to: zeroAddress,
					data: '0x' as `0x${string}`,
					value: '0',
					rpcUrl: rpcUrls[chainId],
				},
			]
		}
		case ActionType.Bridge: {
			const fromChainId = (p.fromChainId as number | null) ?? ChainId.Ethereum
			const toChainId = (p.toChainId as number | null) ?? ChainId.Optimism
			const payloads: TransactionSigningPayload[] = []
			if (fromChainId != null) {
				payloads.push({
					stepIndex: payloads.length,
					label: 'Deposit / Send',
					chainId: fromChainId,
					from,
					to: zeroAddress,
					data: '0x' as `0x${string}`,
					value: String((p.amount as bigint) ?? 0n),
					rpcUrl: rpcUrls[fromChainId],
				})
			}
			if (toChainId != null && toChainId !== fromChainId) {
				payloads.push({
					stepIndex: payloads.length,
					label: 'Claim / Receive',
					chainId: toChainId,
					from,
					to: zeroAddress,
					data: '0x' as `0x${string}`,
					value: '0',
					rpcUrl: rpcUrls[toChainId],
				})
			}
			if (payloads.length === 0) {
				payloads.push({
					stepIndex: 0,
					label: 'Bridge',
					chainId: fromChainId ?? toChainId ?? ChainId.Ethereum,
					from,
					to: zeroAddress,
					data: '0x' as `0x${string}`,
					value: '0',
					rpcUrl: rpcUrls[fromChainId ?? toChainId ?? ChainId.Ethereum],
				})
			}
			return payloads
		}
		case ActionType.Transfer: {
			const chainId = (p.chainId as number) ?? ChainId.Ethereum
			const to = (p.toActor as `0x${string}`) ?? zeroAddress
			return [
				{
					stepIndex: 0,
					label: 'Transfer',
					chainId,
					from,
					to,
					data: '0x' as `0x${string}`,
					value: String((p.amount as bigint) ?? 0n),
					rpcUrl: rpcUrls[chainId],
				},
			]
		}
		case ActionType.AddLiquidity: {
			const chainId = (p.chainId as number) ?? ChainId.Ethereum
			const rpcUrl = rpcUrls[chainId]
			return [
				{
					stepIndex: 0,
					label: 'Approve',
					chainId,
					from,
					to: zeroAddress,
					data: '0x' as `0x${string}`,
					value: '0',
					rpcUrl,
				},
				{
					stepIndex: 1,
					label: 'Add liquidity',
					chainId,
					from,
					to: zeroAddress,
					data: '0x' as `0x${string}`,
					value: '0',
					rpcUrl,
				},
			]
		}
		default: {
			const chainId = (p.chainId as number) ?? (p.fromChainId as number) ?? ChainId.Ethereum
			return [
				{
					stepIndex: 0,
					label: String(action.type),
					chainId,
					from,
					to: zeroAddress,
					data: '0x' as `0x${string}`,
					value: '0',
					rpcUrl: rpcUrls[chainId],
				},
			]
		}
	}
}
