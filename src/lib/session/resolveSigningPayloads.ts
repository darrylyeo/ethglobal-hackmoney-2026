import {
	ActionType,
	TransferSpeed,
	type Action,
	type ActionParams,
} from '$/constants/actions.ts'
import { BridgeProtocolId } from '$/constants/bridge-protocol-intents.ts'
import { ChainId } from '$/constants/networks.ts'
import {
	encodeApproveCall,
	encodeTransferCall,
	MAX_UINT256,
} from '$/api/voltaire.ts'
import { addressToBytes32, encodeDepositForBurn, zeroBytes32 } from '$/api/cctp.ts'
import { getUsdcAddress } from '$/api/lifi.ts'
import { POOL_MANAGER_ADDRESS } from '$/constants/uniswap.ts'
import { encodeGatewayDeposit } from '$/api/gateway-execution.ts'
import {
	getCctpDomainId,
	getCctpMessageTransmitter,
	getCctpTokenMessenger,
	isCctpSupportedChain,
} from '$/lib/cctp.ts'
import {
	getGatewayMinterAddress,
	getGatewayWalletAddress,
	isGatewaySupportedChain,
} from '$/lib/gateway.ts'

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

export type ResolveSigningPayloadsOptions = {
	selectedChainId?: number | null
	isTestnet?: boolean
	swapQuoteTx?: {
		to: `0x${string}`
		data: `0x${string}`
		value: string
		chainId: number
		gasLimit?: string
	}
	/** LiFi bridge step(s) with transactionRequest; when set, used for Bridge + LiFi. */
	lifiBridgeTxs?: ReadonlyArray<{
		to: `0x${string}`
		data: `0x${string}`
		value?: string
		chainId: number
		gasLimit?: string
		label?: string
	}>
	/** Pre-built tx for AddLiquidity (mint step), RemoveLiquidity, CollectFees, or IncreaseLiquidity when caller has encoded calldata. */
	liquidityActionTx?: {
		to: `0x${string}`
		data: `0x${string}`
		value?: string
		chainId: number
		gasLimit?: string
		label?: string
	}
}

export const swapQuoteTxToSigningPayload = (
	tx: ResolveSigningPayloadsOptions['swapQuoteTx'],
	from: `0x${string}`,
	rpcUrls: Partial<Record<number, string>>,
): TransactionSigningPayload | null =>
	tx?.to && tx?.data
		? {
				stepIndex: 0,
				label: 'Swap',
				chainId: tx.chainId,
				from,
				to: tx.to,
				data: tx.data,
				value: tx.value ?? '0',
				gasLimit: tx.gasLimit,
				rpcUrl: rpcUrls[tx.chainId],
			}
		: null

export const resolveSigningPayloads = (
	action: Action,
	rpcUrls: Partial<Record<number, string>>,
	fromAddress: `0x${string}` | null,
	options?: ResolveSigningPayloadsOptions,
): TransactionSigningPayload[] => {
	const from = fromAddress ?? zeroAddress
	const p = (options?.validatedParams ?? action.params) as Record<string, unknown>
	const fallbackChainId = options?.selectedChainId ?? null

	switch (action.type) {
		case ActionType.Swap: {
			const swapPayload =
				options?.swapQuoteTx &&
				swapQuoteTxToSigningPayload(options.swapQuoteTx, from, rpcUrls)
			return swapPayload ? [swapPayload] : []
		}
		case ActionType.Bridge: {
			const lifiTxs = options?.lifiBridgeTxs
			if (lifiTxs && lifiTxs.length > 0) {
				return lifiTxs.map((tx, i) => ({
					stepIndex: i,
					label: tx.label ?? (i === 0 ? 'Deposit / Send' : 'Claim / Receive'),
					chainId: tx.chainId,
					from,
					to: tx.to,
					data: tx.data,
					value: tx.value ?? '0',
					gasLimit: tx.gasLimit,
					rpcUrl: rpcUrls[tx.chainId],
				}))
			}
			const fromChainId =
				(p.fromChainId as number | null) ?? fallbackChainId ?? ChainId.Ethereum
			const toChainId = (p.toChainId as number | null) ?? ChainId.Optimism
			const amount = (p.amount as bigint) ?? 0n
			const protocolIntent = p.protocolIntent as BridgeProtocolId | null
			const isTestnet = options?.isTestnet ?? (p.isTestnet as boolean) ?? false
			const transferSpeed = (p.transferSpeed as TransferSpeed) ?? TransferSpeed.Fast
			const useCustomRecipient = (p.useCustomRecipient as boolean) ?? false
			const customRecipient = (p.customRecipient as `0x${string}`) ?? zeroAddress
			const mintRecipient = useCustomRecipient && customRecipient !== zeroAddress
				? customRecipient
				: from
			if (
				protocolIntent === BridgeProtocolId.Gateway &&
				fromChainId != null &&
				toChainId != null &&
				isGatewaySupportedChain(fromChainId, isTestnet) &&
				isGatewaySupportedChain(toChainId, isTestnet) &&
				amount > 0n
			) {
				const walletAddr = getGatewayWalletAddress(fromChainId, isTestnet)
				const minterAddr = getGatewayMinterAddress(toChainId, isTestnet)
				const usdc = getUsdcAddress(fromChainId)
				if (walletAddr && minterAddr && usdc) {
					const depositData = encodeGatewayDeposit(usdc, amount)
					return [
						{
							stepIndex: 0,
							label: 'Approve USDC (Gateway)',
							chainId: fromChainId,
							from,
							to: usdc,
							data: encodeApproveCall(walletAddr, MAX_UINT256) as `0x${string}`,
							value: '0',
							rpcUrl: rpcUrls[fromChainId],
						},
						{
							stepIndex: 1,
							label: 'Deposit (Gateway)',
							chainId: fromChainId,
							from,
							to: walletAddr,
							data: depositData,
							value: '0',
							rpcUrl: rpcUrls[fromChainId],
						},
						{
							stepIndex: 2,
							label: 'Mint (Gateway)',
							chainId: toChainId,
							from,
							to: minterAddr,
							data: '0x' as `0x${string}`,
							value: '0',
							rpcUrl: rpcUrls[toChainId],
						},
					]
				}
			}
			if (
				protocolIntent === BridgeProtocolId.Cctp &&
				fromChainId != null &&
				toChainId != null &&
				isCctpSupportedChain(fromChainId) &&
				isCctpSupportedChain(toChainId) &&
				amount > 0n
			) {
				const tokenMessenger = getCctpTokenMessenger(fromChainId, isTestnet)
				const destinationDomain = getCctpDomainId(toChainId)
				const burnToken = getUsdcAddress(fromChainId)
				if (tokenMessenger && destinationDomain != null && burnToken) {
					const minFinalityThreshold = transferSpeed === TransferSpeed.Fast ? 1000 : 2000
					const maxFee = (amount * 10n) / 10000n
					const mintRecipientBytes32 = addressToBytes32(mintRecipient)
					const burnData = encodeDepositForBurn(
						amount,
						destinationDomain,
						mintRecipientBytes32,
						burnToken,
						zeroBytes32(),
						maxFee,
						minFinalityThreshold,
					)
					const payloads: TransactionSigningPayload[] = [
						{
							stepIndex: 0,
							label: 'Approve USDC (CCTP)',
							chainId: fromChainId,
							from,
							to: burnToken,
							data: encodeApproveCall(tokenMessenger, MAX_UINT256) as `0x${string}`,
							value: '0',
							rpcUrl: rpcUrls[fromChainId],
						},
						{
							stepIndex: 1,
							label: 'Burn (CCTP)',
							chainId: fromChainId,
							from,
							to: tokenMessenger,
							data: burnData,
							value: '0',
							rpcUrl: rpcUrls[fromChainId],
						},
					]
					const messageTransmitter = getCctpMessageTransmitter(toChainId, isTestnet)
					if (messageTransmitter) {
						payloads.push({
							stepIndex: 2,
							label: 'Mint (CCTP)',
							chainId: toChainId,
							from,
							to: messageTransmitter,
							data: '0x' as `0x${string}`,
							value: '0',
							rpcUrl: rpcUrls[toChainId],
						})
					}
					return payloads
				}
			}
			return []
		}
		case ActionType.Transfer: {
			const chainId =
				((p.chainId as number) ?? fallbackChainId ?? ChainId.Ethereum) || ChainId.Ethereum
			const tokenAddress = ((p.tokenAddress as string) ?? zeroAddress) as `0x${string}`
			const toActor = (p.toActor as `0x${string}`) ?? zeroAddress
			const amount = (p.amount as bigint) ?? 0n
			const isNative =
				tokenAddress === zeroAddress && toActor !== zeroAddress && amount > 0n
			const isErc20 =
				tokenAddress !== zeroAddress && toActor !== zeroAddress && amount > 0n
			if (!isNative && !isErc20) return []
			return [
				{
					stepIndex: 0,
					label: 'Transfer',
					chainId,
					from,
					to: isNative ? toActor : tokenAddress,
					data: isErc20
						? (encodeTransferCall(toActor, amount) as `0x${string}`)
						: ('0x' as `0x${string}`),
					value: isNative ? String(amount) : '0',
					rpcUrl: rpcUrls[chainId],
				},
			]
		}
		case ActionType.AddLiquidity: {
			const chainId =
				((p.chainId as number) ?? fallbackChainId ?? ChainId.Ethereum) || ChainId.Ethereum
			const rpcUrl = rpcUrls[chainId]
			const token0 = (p.token0 as `0x${string}`) ?? zeroAddress
			const token1 = (p.token1 as `0x${string}`) ?? zeroAddress
			const spender = POOL_MANAGER_ADDRESS[chainId as keyof typeof POOL_MANAGER_ADDRESS] ?? zeroAddress
			if (spender === zeroAddress && !options?.liquidityActionTx) return []
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
			const liquidityTx = options?.liquidityActionTx
			if (liquidityTx?.to && liquidityTx?.data) {
				payloads.push({
					stepIndex: payloads.length,
					label: liquidityTx.label ?? 'Add liquidity',
					chainId: liquidityTx.chainId,
					from,
					to: liquidityTx.to,
					data: liquidityTx.data,
					value: liquidityTx.value ?? '0',
					gasLimit: liquidityTx.gasLimit,
					rpcUrl: rpcUrls[liquidityTx.chainId],
				})
			}
			return payloads
		}
		case ActionType.RemoveLiquidity:
		case ActionType.CollectFees:
		case ActionType.IncreaseLiquidity: {
			const liquidityTx = options?.liquidityActionTx
			if (!liquidityTx?.to || !liquidityTx?.data) return []
			const chainId =
				((p.chainId as number) ?? fallbackChainId ?? ChainId.Ethereum) || ChainId.Ethereum
			const label =
				action.type === ActionType.RemoveLiquidity
					? 'Remove liquidity'
					: action.type === ActionType.CollectFees
						? 'Collect fees'
						: 'Increase liquidity'
			return [
				{
					stepIndex: 0,
					label: liquidityTx.label ?? label,
					chainId: liquidityTx.chainId,
					from,
					to: liquidityTx.to,
					data: liquidityTx.data,
					value: liquidityTx.value ?? '0',
					gasLimit: liquidityTx.gasLimit,
					rpcUrl: rpcUrls[liquidityTx.chainId],
				},
			]
		}
		default:
			return []
	}
}
