import { rpcUrls } from '$/constants/rpc-endpoints.ts'
import type { EIP1193Provider } from '$/lib/wallet.ts'
import {
	createHttpProvider,
	encodeApproveCall,
	getErc20Allowance,
	MAX_UINT256,
} from './voltaire.ts'

export type ApprovalState =
	| 'unknown'
	| 'checking'
	| 'needed'
	| 'approving'
	| 'approved'
	| 'error'

export type ApprovalInfo = {
	state: ApprovalState
	currentAllowance: bigint
	requiredAmount: bigint
	error?: string
}

export async function checkApproval(
	chainId: number,
	tokenAddress: `0x${string}`,
	owner: `0x${string}`,
	spender: `0x${string}`,
	amount: bigint,
): Promise<ApprovalInfo> {
	try {
		const rpcUrl = rpcUrls[chainId]
		if (!rpcUrl) throw new Error(`No RPC for chain ${chainId}`)

		const provider = createHttpProvider(rpcUrl)
		const allowance = await getErc20Allowance(
			provider,
			tokenAddress,
			owner,
			spender,
		)

		return {
			state: allowance >= amount ? 'approved' : 'needed',
			currentAllowance: allowance,
			requiredAmount: amount,
		}
	} catch (e) {
		return {
			state: 'error',
			currentAllowance: 0n,
			requiredAmount: amount,
			error: e instanceof Error ? e.message : String(e),
		}
	}
}

export async function sendApproval(
	walletProvider: EIP1193Provider,
	chainId: number,
	tokenAddress: `0x${string}`,
	spender: `0x${string}`,
	amount: bigint,
	unlimited = false,
): Promise<`0x${string}`> {
	const approveAmount = unlimited ? MAX_UINT256 : amount
	const data = encodeApproveCall(spender, approveAmount)

	const txHash = (await walletProvider.request({
		method: 'eth_sendTransaction',
		params: [
			{
				to: tokenAddress,
				data,
				chainId: `0x${chainId.toString(16)}`,
			},
		],
	})) as `0x${string}`

	return txHash
}

export async function waitForApprovalConfirmation(
	chainId: number,
	txHash: `0x${string}`,
	maxAttempts = 60,
	intervalMs = 2000,
): Promise<boolean> {
	const rpcUrl = rpcUrls[chainId]
	if (!rpcUrl) throw new Error(`No RPC for chain ${chainId}`)

	const provider = createHttpProvider(rpcUrl)

	for (let i = 0; i < maxAttempts; i++) {
		const receipt = (await provider.request({
			method: 'eth_getTransactionReceipt',
			params: [txHash],
		})) as { status: string } | null

		if (receipt) return receipt.status === '0x1'

		await new Promise((r) => setTimeout(r, intervalMs))
	}

	throw new Error('Approval confirmation timeout')
}

export async function getTxReceiptStatus(
	chainId: number,
	txHash: string,
): Promise<'pending' | 'completed' | 'failed'> {
	const rpcUrl = rpcUrls[chainId]
	if (!rpcUrl) return 'pending'
	const provider = createHttpProvider(rpcUrl)
	const receipt = (await provider.request({
		method: 'eth_getTransactionReceipt',
		params: [txHash],
	})) as { status?: string } | null
	if (!receipt) return 'pending'
	return receipt.status === '0x1' ? 'completed' : 'failed'
}
