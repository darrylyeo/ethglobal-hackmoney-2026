/**
 * End-to-end bridge test with real mainnet funds using Voltaire.
 * Uses low-cost L2s (Base, Optimism) for testing.
 *
 * Usage:
 *   PRIVATE_KEY=0x... deno run -A scripts/_e2e-bridge-mainnet.ts
 *
 * Requirements:
 *   - Private key with USDC balance on source chain
 *   - Small amount (e.g. 1 USDC = 1000000 units)
 */

import { createConfig, getQuote, getStatus } from '@lifi/sdk'
import { PrivateKeySignerImpl } from '@tevm/voltaire/signers'
import { ercTokensBySymbolByChainId } from '../src/constants/coins.ts'
import { ChainId } from '../src/constants/networks.ts'

createConfig({ integrator: 'ethglobal-hackmoney-26', })

const RPC_URLS: Record<number, string> = {
	[ChainId.Base]: 'https://mainnet.base.org',
	[ChainId.Optimism]: 'https://mainnet.optimism.io',
	[ChainId.Arbitrum]: 'https://arb1.arbitrum.io/rpc',
}

// Simple JSON-RPC client
class JsonRpcProvider {
	constructor(private url: string) {}

	async request<T = unknown>(args: {
		method: string
		params?: unknown[]
	}): Promise<T> {
		const response = await fetch(this.url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: Date.now(),
				method: args.method,
				params: args.params ?? [],
			}),
		})
		const json = await response.json()
		if (json.error) throw new Error(json.error.message)
		return json.result as T
	}
}

const ERC20_ABI = [
	{
		name: 'approve',
		type: 'function',
		inputs: [
			{ name: 'spender', type: 'address' },
			{ name: 'amount', type: 'uint256' },
		],
		outputs: [{ type: 'bool', }],
	},
	{
		name: 'allowance',
		type: 'function',
		inputs: [
			{ name: 'owner', type: 'address' },
			{ name: 'spender', type: 'address' },
		],
		outputs: [{ type: 'uint256', }],
	},
,] as const

type BridgeParams = {
	fromChain: ChainId
	toChain: ChainId
	fromAmount: string
	privateKey: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function runBridge(params: BridgeParams) {
	const { fromChain, toChain, fromAmount, privateKey } = params

	// Create signer
	const signer = PrivateKeySignerImpl.fromPrivateKey({ privateKey })
	const fromAddress = signer.address as `0x${string}`

	console.log(`\n--- E2E Bridge Test ---`)
	console.log(`From: ${fromAddress}`)
	console.log(`Route: ${fromChain} → ${toChain}`)
	console.log(`Amount: ${fromAmount} (smallest units)`)

	// Get USDC addresses
	const fromToken = ercTokensBySymbolByChainId[fromChain]?.USDC?.address
	const toToken = ercTokensBySymbolByChainId[toChain]?.USDC?.address
	if (!fromToken || !toToken) {
		throw new Error(`USDC not configured for chains ${fromChain} or ${toChain}`)
	}

	// 1. Get quote
	console.log(`\n1. Fetching quote...`)
	const quote = await getQuote({
		fromChain,
		toChain,
		fromToken,
		toToken,
		fromAmount,
		fromAddress,
	})
	console.log(`   Tool: ${quote.tool}`)
	console.log(`   Estimated output: ${quote.estimate.toAmount}`)
	console.log(`   Approval address: ${quote.estimate.approvalAddress}`)

	// Create provider for source chain
	const rpcUrl = RPC_URLS[fromChain]
	if (!rpcUrl) throw new Error(`No RPC URL for chain ${fromChain}`)
	const provider = new JsonRpcProvider(rpcUrl)

	// 2. Check and set allowance
	if (quote.estimate.approvalAddress) {
		console.log(`\n2. Checking allowance...`)
		const allowanceData = encodeFunctionCall(ERC20_ABI, 'allowance', [
			fromAddress,
			quote.estimate.approvalAddress,
		])
		const allowanceResult = await provider.request({
			method: 'eth_call',
			params: [{ to: fromToken, data: allowanceData, }, 'latest', ],
		})
		const currentAllowance = BigInt(allowanceResult as string)
		const requiredAmount = BigInt(fromAmount)

		console.log(`   Current allowance: ${currentAllowance}`)
		console.log(`   Required: ${requiredAmount}`)

		if (currentAllowance < requiredAmount) {
			console.log(`   Approving tokens...`)
			const approveData = encodeFunctionCall(ERC20_ABI, 'approve', [
				quote.estimate.approvalAddress,
				requiredAmount,
			])

			// Get nonce and gas price
			const nonce = await provider.request({
				method: 'eth_getTransactionCount',
				params: [fromAddress, 'latest', ],
			})
			const gasPrice = await provider.request({
				method: 'eth_gasPrice',
				params: [],
			})

			const approveTx = {
				to: fromToken,
				data: approveData,
				nonce: Number(nonce),
				gasLimit: 100000n,
				gasPrice: BigInt(gasPrice as string),
				chainId: fromChain,
			}

			const signedApprove = await signer.signTransaction(approveTx)
			const approveTxHash = await provider.request({
				method: 'eth_sendRawTransaction',
				params: [signedApprove],
			})
			console.log(`   Approve tx: ${approveTxHash}`)

			// Wait for approval confirmation
			await waitForReceipt(provider, approveTxHash as string)
			console.log(`   Approval confirmed!`)
		} else {
			console.log(`   Allowance sufficient, skipping approval`)
		}
	}

	// 3. Execute bridge transaction
	console.log(`\n3. Executing bridge transaction...`)
	const txRequest = quote.transactionRequest
	if (!txRequest) {
		throw new Error('Quote missing transactionRequest')
	}

	const nonce = await provider.request({
		method: 'eth_getTransactionCount',
		params: [fromAddress, 'latest'],
	})

	const bridgeTx = {
		to: txRequest.to,
		data: txRequest.data,
		value: BigInt(txRequest.value ?? 0),
		nonce: Number(nonce),
		gasLimit: BigInt(txRequest.gasLimit ?? 500000),
		gasPrice: BigInt(
			txRequest.gasPrice ??
				((await provider.request({
					method: 'eth_gasPrice',
					params: [],
				})) as string),
		),
		chainId: fromChain,
	}

	const signedBridge = await signer.signTransaction(bridgeTx)
	const bridgeTxHash = await provider.request({
		method: 'eth_sendRawTransaction',
		params: [signedBridge],
	})
	console.log(`   Bridge tx: ${bridgeTxHash}`)

	// 4. Wait for source chain confirmation
	console.log(`\n4. Waiting for source chain confirmation...`)
	await waitForReceipt(provider, bridgeTxHash as string)
	console.log(`   Source chain confirmed!`)

	// 5. Monitor bridge status
	console.log(`\n5. Monitoring bridge status...`)
	let status: { status: string } = { status: 'PENDING' }
	let attempts = 0
	const maxAttempts = 60

	while (
		status.status !== 'DONE' &&
		status.status !== 'FAILED' &&
		attempts < maxAttempts
	) {
		await sleep(5000)
		status = await getStatus({
			txHash: bridgeTxHash as string,
			fromChain,
			toChain,
			bridge: quote.tool,
		})
		attempts++
		console.log(
			`   Status: ${status.status} (attempt ${attempts}/${maxAttempts})`,
		)
	}

	if (status.status === 'DONE') {
		console.log(`\n✓ Bridge completed successfully!`)
	} else if (status.status === 'FAILED') {
		console.log(`\n✗ Bridge failed!`)
	} else {
		console.log(`\n? Bridge status unknown after ${maxAttempts} attempts`)
	}

	return { txHash: bridgeTxHash, status }
}

async function waitForReceipt(
	provider: JsonRpcProvider,
	txHash: string,
	maxAttempts = 30,
) {
	for (let i = 0; i < maxAttempts; i++) {
		const receipt = await provider.request({
			method: 'eth_getTransactionReceipt',
			params: [txHash],
		})
		if (receipt) return receipt
		await sleep(2000)
	}
	throw new Error(
		`Transaction ${txHash} not confirmed after ${maxAttempts} attempts`,
	)
}

function encodeFunctionCall(
	abi: typeof ERC20_ABI,
	functionName: string,
	args: unknown[],
): `0x${string}` {
	// Simple ABI encoding for approve/allowance
	const fn = abi.find((item) => item.name === functionName)
	if (!fn) throw new Error(`Function ${functionName} not found in ABI`)

	// Function selector (first 4 bytes of keccak256 of signature)
	const sig = `${functionName}(${fn.inputs.map((i) => i.type).join(',')})`
	const selector = keccak256Selector(sig)

	// Encode parameters
	const encoded = args
		.map((arg) => {
			if (typeof arg === 'string' && arg.startsWith('0x')) {
				return arg.slice(2).padStart(64, '0')
			}
			if (typeof arg === 'bigint') {
				return arg.toString(16).padStart(64, '0')
			}
			throw new Error(`Unsupported arg type: ${typeof arg}`)
		})
		.join('')

	return `0x${selector}${encoded}` as `0x${string}`
}

function keccak256Selector(sig: string): string {
	// Import keccak from Voltaire
	// For now, hardcode the common selectors
	const selectors: Record<string, string> = {
		'approve(address,uint256)': '095ea7b3',
		'allowance(address,address)': 'dd62ed3e',
	}
	return (
		selectors[sig] ??
		(() => {
			throw new Error(`Unknown selector: ${sig}`)
		})()
	)
}

// Quote-only mode for testing without executing
async function runQuoteOnly(
	fromChain: ChainId,
	toChain: ChainId,
	fromAmount: string,
	fromAddress: `0x${string}`,
) {
	console.log(`\n--- Quote Only (No Execution) ---`)
	console.log(`From: ${fromAddress}`)
	console.log(`Route: ${fromChain} → ${toChain}`)
	console.log(`Amount: ${fromAmount} (smallest units)`)

	const fromToken = ercTokensBySymbolByChainId[fromChain]?.USDC?.address
	const toToken = ercTokensBySymbolByChainId[toChain]?.USDC?.address
	if (!fromToken || !toToken) {
		throw new Error(`USDC not configured for chains ${fromChain} or ${toChain}`)
	}

	console.log(`\nFetching quote...`)
	const quote = await getQuote({
		fromChain,
		toChain,
		fromToken,
		toToken,
		fromAmount,
		fromAddress,
	})

	console.log(`\n✓ Quote received:`)
	console.log(`  Tool: ${quote.tool}`)
	console.log(`  Estimated output: ${quote.estimate.toAmount}`)
	console.log(`  Approval address: ${quote.estimate.approvalAddress}`)
	console.log(`  Has transaction data: ${!!quote.transactionRequest}`)

	return quote
}

// Main
const quoteOnly = Deno.args.includes('--quote-only')
const privateKey = Deno.env.get('PRIVATE_KEY')

if (quoteOnly) {
	// Quote-only mode: test the quote flow without a real wallet
	const testAddress =
		'0x0000000000000000000000000000000000000001' as `0x${string}`
	runQuoteOnly(ChainId.Base, ChainId.Optimism, '1000000', testAddress)
		.then(() => console.log('\n✓ Quote test passed'))
		.catch((error) => {
			console.error('\nError:', error)
			Deno.exit(1)
		})
} else {
	if (!privateKey) {
		console.error('Error: PRIVATE_KEY environment variable required')
		console.error('')
		console.error('Usage:')
		console.error(
			'  Quote only (no wallet): deno run -A scripts/_e2e-bridge-mainnet.ts --quote-only',
		)
		console.error(
			'  Full E2E:               PRIVATE_KEY=0x... deno run -A scripts/_e2e-bridge-mainnet.ts',
		)
		console.error('')
		console.error('Requirements for full E2E:')
		console.error('  - Private key with USDC balance on Base')
		console.error('  - Native token (ETH) for gas on Base')
		console.error('  - Amount: 1 USDC (1000000 smallest units)')
		Deno.exit(1)
	}

	// Full E2E: Bridge 1 USDC from Base to Optimism (low gas costs)
	runBridge({
		fromChain: ChainId.Base,
		toChain: ChainId.Optimism,
		fromAmount: '1000000', // 1 USDC
		privateKey,
	})
		.then((result) => {
			console.log('\nResult:', JSON.stringify(result, null, 2))
		})
		.catch((error) => {
			console.error('\nError:', error)
			Deno.exit(1)
		})
}
