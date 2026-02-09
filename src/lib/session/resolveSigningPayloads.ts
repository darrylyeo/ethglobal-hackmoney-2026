import type { Action } from '$/constants/actions.ts'
import { ActionType } from '$/constants/actions.ts'
import { ChainId } from '$/constants/chain-id.ts'
import {
	encodeApproveCall,
	encodeTransferCall,
	MAX_UINT256,
} from '$/api/voltaire.ts'
import { POOL_MANAGER_ADDRESS } from '$/constants/uniswap.ts'

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
			const tokenAddress = ((p.tokenAddress as string) ?? zeroAddress) as `0x${string}`
			const toActor = (p.toActor as `0x${string}`) ?? zeroAddress
			const amount = (p.amount as bigint) ?? 0n
			const data =
				tokenAddress !== zeroAddress && toActor !== zeroAddress && amount > 0n
					? (encodeTransferCall(toActor, amount) as `0x${string}`)
					: ('0x' as `0x${string}`)
			return [
				{
					stepIndex: 0,
					label: 'Transfer',
					chainId,
					from,
					to: tokenAddress,
					data,
					value: '0',
					rpcUrl: rpcUrls[chainId],
				},
			]
		}
		case ActionType.AddLiquidity: {
			const chainId = (p.chainId as number) ?? ChainId.Ethereum
			const rpcUrl = rpcUrls[chainId]
			const token0 = (p.token0 as `0x${string}`) ?? zeroAddress
			const token1 = (p.token1 as `0x${string}`) ?? zeroAddress
			const spender = POOL_MANAGER_ADDRESS[chainId as keyof typeof POOL_MANAGER_ADDRESS] ?? zeroAddress
			const payloads: TransactionSigningPayload[] = []
			if (token0 !== zeroAddress && spender !== zeroAddress) {
				payloads.push({
					stepIndex: payloads.length,
					label: 'Approve token0',
					chainId,
					from,
					to: token0,
					data: encodeApproveCall(spender, MAX_UINT256) as `0x${string}`,
					value: '0',
					rpcUrl,
				})
			}
			if (token1 !== zeroAddress && spender !== zeroAddress) {
				payloads.push({
					stepIndex: payloads.length,
					label: 'Approve token1',
					chainId,
					from,
					to: token1,
					data: encodeApproveCall(spender, MAX_UINT256) as `0x${string}`,
					value: '0',
					rpcUrl,
				})
			}
			payloads.push({
				stepIndex: payloads.length,
				label: 'Add liquidity',
				chainId,
				from,
				to: spender !== zeroAddress ? spender : zeroAddress,
				data: '0x' as `0x${string}`,
				value: '0',
				rpcUrl,
			})
			return payloads.length > 0 ? payloads : [{
				stepIndex: 0,
				label: 'Add liquidity',
				chainId,
				from,
				to: zeroAddress,
				data: '0x' as `0x${string}`,
				value: '0',
				rpcUrl,
			}]
		}
		case ActionType.RemoveLiquidity:
		case ActionType.CollectFees:
		case ActionType.IncreaseLiquidity: {
			const chainId = (p.chainId as number) ?? ChainId.Ethereum
			const rpcUrl = rpcUrls[chainId]
			const label =
				action.type === ActionType.RemoveLiquidity
					? 'Remove liquidity'
					: action.type === ActionType.CollectFees
						? 'Collect fees'
						: 'Increase liquidity'
			return [
				{
					stepIndex: 0,
					label,
					chainId,
					from,
					to: (POOL_MANAGER_ADDRESS[chainId as keyof typeof POOL_MANAGER_ADDRESS] ?? zeroAddress) as `0x${string}`,
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
