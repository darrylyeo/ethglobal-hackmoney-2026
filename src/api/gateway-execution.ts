/**
 * Gateway execution: deposit (if needed), sign burn intent, get attestation, mint on destination.
 */

import type { EIP1193Provider } from '$/lib/wallet.ts'
import { Abi, encodeFunction } from '@tevm/voltaire/Abi'
import {
	checkApproval,
	sendApproval,
	waitForApprovalConfirmation,
} from '$/api/approval.ts'
import { getUsdcAddress } from '$/api/lifi.ts'
import {
	createGatewayTransferAttestation,
	fetchGatewayUnifiedBalance,
	type GatewayBurnIntentRequest,
	type GatewayTransferSpec,
} from '$/api/gateway.ts'
import {
	getGatewayDomainId,
	getGatewayMinterAddress,
	getGatewayWalletAddress,
} from '$/lib/gateway.ts'
import { createProviderForChain, getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'
import { switchWalletChain } from '$/lib/wallet.ts'

const GATEWAY_WALLET_DEPOSIT_ABI = Abi([
	{
		type: 'function',
		name: 'deposit',
		stateMutability: 'nonpayable',
		inputs: [
			{ type: 'address', name: 'token' },
			{ type: 'uint256', name: 'value' },
		],
		outputs: [],
	},
]) as unknown as Abi

export const encodeGatewayDeposit = (
	token: `0x${string}`,
	amount: bigint,
): `0x${string}` =>
	encodeFunction(GATEWAY_WALLET_DEPOSIT_ABI, 'deposit', [
		token,
		amount,
	]) as `0x${string}`

const GATEWAY_MINTER_MINT_ABI = Abi([
	{
		type: 'function',
		name: 'gatewayMint',
		stateMutability: 'nonpayable',
		inputs: [
			{ type: 'bytes', name: 'attestationPayload' },
			{ type: 'bytes', name: 'signature' },
		],
		outputs: [],
	},
]) as unknown as Abi

function padAddress(addr: `0x${string}`): `0x${string}` {
	return (`0x${addr.slice(2).toLowerCase().padStart(64, '0')}`) as `0x${string}`
}

const EIP712_DOMAIN = { name: 'GatewayWallet', version: '1' }
const EIP712_TYPES = {
	EIP712Domain: [
		{ name: 'name', type: 'string' },
		{ name: 'version', type: 'string' },
	],
	TransferSpec: [
		{ name: 'version', type: 'uint32' },
		{ name: 'sourceDomain', type: 'uint32' },
		{ name: 'destinationDomain', type: 'uint32' },
		{ name: 'sourceContract', type: 'bytes32' },
		{ name: 'destinationContract', type: 'bytes32' },
		{ name: 'sourceToken', type: 'bytes32' },
		{ name: 'destinationToken', type: 'bytes32' },
		{ name: 'sourceDepositor', type: 'bytes32' },
		{ name: 'destinationRecipient', type: 'bytes32' },
		{ name: 'sourceSigner', type: 'bytes32' },
		{ name: 'destinationCaller', type: 'bytes32' },
		{ name: 'value', type: 'uint256' },
		{ name: 'salt', type: 'bytes32' },
		{ name: 'hookData', type: 'bytes' },
	],
	BurnIntent: [
		{ name: 'maxBlockHeight', type: 'uint256' },
		{ name: 'maxFee', type: 'uint256' },
		{ name: 'spec', type: 'TransferSpec' },
	],
} as const

const MAX_UINT256 = 2n ** 256n - 1n
const MAX_FEE = 2_010000n

function buildTransferSpec(params: {
	fromChainId: number
	toChainId: number
	amount: bigint
	sourceDepositor: `0x${string}`
	destinationRecipient: `0x${string}`
	sourceSigner: `0x${string}`
	isTestnet: boolean
}): GatewayTransferSpec {
	const walletSource = getGatewayWalletAddress(params.fromChainId, params.isTestnet)
	const minterDest = getGatewayMinterAddress(params.toChainId, params.isTestnet)
	const usdcSource = getUsdcAddress(params.fromChainId)
	const usdcDest = getUsdcAddress(params.toChainId)
	if (!walletSource || !minterDest)
		throw new Error('Gateway wallet/minter not found for chain pair')
	const salt = (`0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')}`) as `0x${string}`
	return {
		version: 1,
		sourceDomain: getGatewayDomainId(params.fromChainId)!,
		destinationDomain: getGatewayDomainId(params.toChainId)!,
		sourceContract: walletSource,
		destinationContract: minterDest,
		sourceToken: usdcSource,
		destinationToken: usdcDest,
		sourceDepositor: params.sourceDepositor,
		destinationRecipient: params.destinationRecipient,
		sourceSigner: params.sourceSigner,
		destinationCaller: '0x0000000000000000000000000000000000000000' as `0x${string}`,
		value: params.amount.toString(),
		salt,
		hookData: '0x' as `0x${string}`,
	}
}

function burnIntentMessageForEip712(spec: GatewayTransferSpec) {
	return {
		maxBlockHeight: MAX_UINT256.toString(),
		maxFee: MAX_FEE.toString(),
		spec: {
			version: spec.version,
			sourceDomain: spec.sourceDomain,
			destinationDomain: spec.destinationDomain,
			sourceContract: padAddress(spec.sourceContract),
			destinationContract: padAddress(spec.destinationContract),
			sourceToken: padAddress(spec.sourceToken),
			destinationToken: padAddress(spec.destinationToken),
			sourceDepositor: padAddress(spec.sourceDepositor),
			destinationRecipient: padAddress(spec.destinationRecipient),
			sourceSigner: padAddress(spec.sourceSigner),
			destinationCaller: padAddress(spec.destinationCaller),
			value: spec.value,
			salt: spec.salt,
			hookData: spec.hookData ?? '0x',
		},
	}
}

function burnIntentRequestForApi(spec: GatewayTransferSpec, signature: string): GatewayBurnIntentRequest {
	const message = burnIntentMessageForEip712(spec)
	return {
		burnIntent: {
			maxBlockHeight: message.maxBlockHeight,
			maxFee: message.maxFee,
			spec: {
				version: spec.version,
				sourceDomain: spec.sourceDomain,
				destinationDomain: spec.destinationDomain,
				sourceContract: message.spec.sourceContract,
				destinationContract: message.spec.destinationContract,
				sourceToken: message.spec.sourceToken,
				destinationToken: message.spec.destinationToken,
				sourceDepositor: message.spec.sourceDepositor,
				destinationRecipient: message.spec.destinationRecipient,
				sourceSigner: message.spec.sourceSigner,
				destinationCaller: message.spec.destinationCaller,
				value: spec.value,
				salt: spec.salt,
				hookData: spec.hookData ?? '0x',
			},
		},
		signature,
	}
}

export async function executeGatewayDeposit(
	walletProvider: EIP1193Provider,
	fromChainId: number,
	amount: bigint,
	depositor: `0x${string}`,
	isTestnet: boolean,
): Promise<`0x${string}`> {
	const gatewayWallet = getGatewayWalletAddress(fromChainId, isTestnet)
	const usdc = getUsdcAddress(fromChainId)
	if (!gatewayWallet) throw new Error('Gateway wallet not found for source chain')
	const approval = await checkApproval(fromChainId, usdc, depositor, gatewayWallet, amount)
	if (approval.state === 'needed') {
		const approveHash = await sendApproval(
			walletProvider,
			fromChainId,
			usdc,
			gatewayWallet,
			amount,
			true,
		)
		await waitForApprovalConfirmation(fromChainId, approveHash)
	}
	const data = encodeFunction(GATEWAY_WALLET_DEPOSIT_ABI, 'deposit', [usdc, amount]) as `0x${string}`
	const txHash = (await walletProvider.request({
		method: 'eth_sendTransaction',
		params: [
			{
				to: gatewayWallet,
				data,
				chainId: `0x${fromChainId.toString(16)}`,
			},
		],
	})) as `0x${string}`
	return txHash
}

/** Wait for Gateway API to reflect deposit (poll unified balance). */
export async function waitForGatewayBalance(
	depositor: `0x${string}`,
	amount: bigint,
	isTestnet: boolean,
	options: { intervalMs?: number; maxAttempts?: number } = {},
): Promise<void> {
	const { intervalMs = 5000, maxAttempts = 24 } = options
	for (let i = 0; i < maxAttempts; i++) {
		const balance = await fetchGatewayUnifiedBalance(depositor, isTestnet)
		if (balance >= amount) return
		await new Promise((r) => setTimeout(r, intervalMs))
	}
	throw new Error(
		'Deposit confirmed; Gateway balance may take a few minutes to update. Please try again shortly.',
	)
}

export async function signGatewayBurnIntent(
	walletProvider: EIP1193Provider,
	fromChainId: number,
	spec: GatewayTransferSpec,
	signerAddress: `0x${string}`,
): Promise<string> {
	const message = burnIntentMessageForEip712(spec)
	const typedData = {
		types: EIP712_TYPES,
		domain: EIP712_DOMAIN,
		primaryType: 'BurnIntent' as const,
		message,
	}
	const signature = (await walletProvider.request({
		method: 'eth_signTypedData_v4',
		params: [signerAddress, JSON.stringify(typedData)],
	})) as string
	return signature
}

export async function executeGatewayMint(
	walletProvider: EIP1193Provider,
	toChainId: number,
	attestationHex: string,
	signatureHex: string,
	isTestnet: boolean,
): Promise<`0x${string}`> {
	const minter = getGatewayMinterAddress(toChainId, isTestnet)
	if (!minter) throw new Error('Gateway minter not found for destination chain')
	const attestationBytes = (attestationHex.startsWith('0x') ? attestationHex : `0x${attestationHex}`) as `0x${string}`
	const signatureBytes = (signatureHex.startsWith('0x') ? signatureHex : `0x${signatureHex}`) as `0x${string}`
	const data = encodeFunction(GATEWAY_MINTER_MINT_ABI, 'gatewayMint', [
		attestationBytes,
		signatureBytes,
	]) as `0x${string}`
	const txHash = (await walletProvider.request({
		method: 'eth_sendTransaction',
		params: [
			{
				to: minter,
				data,
				chainId: `0x${toChainId.toString(16)}`,
			},
		],
	})) as `0x${string}`
	return txHash
}

export type GatewayExecutionParams = {
	walletProvider: EIP1193Provider
	senderAddress: `0x${string}`
	fromChainId: number
	toChainId: number
	amount: bigint
	recipient: `0x${string}`
	isTestnet: boolean
	needsDeposit: boolean
}

export type GatewayExecutionResult = {
	depositTxHash?: `0x${string}`
	mintTxHash: `0x${string}`
}

export async function executeGatewayTransfer(
	params: GatewayExecutionParams,
	onStatus?: (
		step: 'deposit' | 'sign' | 'attestation' | 'mint',
		status: 'pending' | 'done' | 'error',
		detail?: string,
	) => void,
): Promise<GatewayExecutionResult> {
	const {
		walletProvider,
		senderAddress,
		fromChainId,
		toChainId,
		amount,
		recipient,
		isTestnet,
		needsDeposit,
	} = params

	let depositTxHash: `0x${string}` | undefined
	if (needsDeposit) {
		onStatus?.('deposit', 'pending')
		await switchWalletChain(walletProvider, fromChainId)
		depositTxHash = await executeGatewayDeposit(
			walletProvider,
			fromChainId,
			amount,
			senderAddress,
			isTestnet,
		)
		onStatus?.('deposit', 'done', depositTxHash)
		const rpcUrl = getEffectiveRpcUrl(fromChainId)
		if (rpcUrl) {
			const provider = createProviderForChain(fromChainId)
			for (let i = 0; i < 60; i++) {
				const receipt = (await provider.request({
					method: 'eth_getTransactionReceipt',
					params: [depositTxHash],
				})) as { status?: string } | null
				if (receipt?.status === '0x1') break
				await new Promise((r) => setTimeout(r, 2000))
			}
		}
		await waitForGatewayBalance(senderAddress, amount, isTestnet)
	}

	onStatus?.('sign', 'pending')
	const spec = buildTransferSpec({
		fromChainId,
		toChainId,
		amount,
		sourceDepositor: senderAddress,
		destinationRecipient: recipient,
		sourceSigner: senderAddress,
		isTestnet,
	})
	const signature = await signGatewayBurnIntent(
		walletProvider,
		fromChainId,
		spec,
		senderAddress,
	)
	onStatus?.('sign', 'done')

	onStatus?.('attestation', 'pending')
	const request = burnIntentRequestForApi(spec, signature)
	const response = await createGatewayTransferAttestation([request], isTestnet)
	onStatus?.('attestation', 'done')

	onStatus?.('mint', 'pending')
	await switchWalletChain(walletProvider, toChainId)
	const mintTxHash = await executeGatewayMint(
		walletProvider,
		toChainId,
		response.attestation,
		response.signature,
		isTestnet,
	)
	onStatus?.('mint', 'done', mintTxHash)

	return { depositTxHash, mintTxHash }
}
