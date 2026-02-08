import { test as base, expect, useProfileIsolation } from './profile.ts'
import { createServer } from 'node:http'
import { createMemoryClient, http } from 'tevm'
import { mainnet } from 'tevm/common'
import { SimpleContract } from 'tevm/contract'
import { createHttpHandler } from 'tevm/server'
import type { Log, TransactionReceipt } from 'viem'
import { parseEther } from 'viem'
import {
	E2E_TEVM_CHAIN_ID,
	E2E_TEVM_CONTRACT_ADDRESS,
	E2E_TEVM_PROVIDER_NAME,
	E2E_TEVM_PROVIDER_RDNS,
	E2E_TEVM_RECIPIENT_ADDRESS,
	E2E_TEVM_WALLET_ADDRESS,
} from '$/tests/tevmConfig.ts'

type TevmFixture = {
	rpcUrl: string
	chainId: number
	walletAddress: `0x${string}`
	recipientAddress: `0x${string}`
	contractAddress: `0x${string}`
	providerRdns: string
	providerName: string
	getBalance: (address: `0x${string}`) => Promise<bigint>
	getReceipt: (txHash: `0x${string}`) => Promise<TransactionReceipt>
	getLogs: (args: {
		address?: `0x${string}`
		fromBlock?: bigint
		toBlock?: bigint
	}) => Promise<Log[]>
}

export const test = base.extend<{ tevm: TevmFixture; _profile: void }>({
	_profile: async ({ context }, use) => {
		await useProfileIsolation(context)
		await use(undefined)
	},
	tevm: [
		async ({ _profile }, use, testInfo) => {
			const forkUrl = process.env.E2E_TEVM_FORK_URL
			const client = createMemoryClient({
				common: mainnet,
				mining: { auto: true, },
			...(forkUrl
				? {
						fork: {
							transport: http(forkUrl)({}),
							blockTag: process.env.E2E_TEVM_FORK_BLOCK_TAG ?? '0x1',
						},
					}
				: {}),
			})
			await client.tevmReady()
			await client.tevmSetAccount({
				address: E2E_TEVM_WALLET_ADDRESS,
				balance: parseEther('100'),
			})
			await client.tevmSetAccount({
				address: E2E_TEVM_RECIPIENT_ADDRESS,
				balance: parseEther('10'),
			})
			await client.tevmSetAccount({
				address: E2E_TEVM_CONTRACT_ADDRESS,
				deployedBytecode: SimpleContract.deployedBytecode,
			})
			await client.impersonateAccount({ address: E2E_TEVM_WALLET_ADDRESS })
			await client.impersonateAccount({ address: E2E_TEVM_RECIPIENT_ADDRESS })

			const port = 8545 + testInfo.workerIndex
			const handler = createHttpHandler(client)
			const server = createServer((req, res) => {
				res.setHeader('Access-Control-Allow-Origin', '*')
				res.setHeader('Access-Control-Allow-Headers', 'content-type')
				res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
				if (req.method === 'OPTIONS') {
					res.writeHead(204)
					res.end()
					return
				}
				handler(req, res)
			})
			await new Promise<void>((resolve) => {
				server.listen(port, () => resolve())
			})
			const rpcUrl = `http://127.0.0.1:${port}`

			const delay = (ms: number) =>
				new Promise<void>((resolve) => {
					setTimeout(resolve, ms)
				})
			const getReceipt = async (txHash: `0x${string}`) => {
				const deadline = Date.now() + 30_000
				while (Date.now() < deadline) {
					try {
						return await client.getTransactionReceipt({ hash: txHash })
					} catch (error) {
						if (
							error instanceof Error &&
							error.name === 'TransactionReceiptNotFoundError'
						) {
							await delay(250)
							continue
						}
						throw error
					}
				}
				return await client.getTransactionReceipt({ hash: txHash })
			}

			await use({
				rpcUrl,
				chainId: E2E_TEVM_CHAIN_ID,
				walletAddress: E2E_TEVM_WALLET_ADDRESS,
				recipientAddress: E2E_TEVM_RECIPIENT_ADDRESS,
				contractAddress: E2E_TEVM_CONTRACT_ADDRESS,
				providerRdns: E2E_TEVM_PROVIDER_RDNS,
				providerName: E2E_TEVM_PROVIDER_NAME,
				getBalance: (address) => client.getBalance({ address }),
				getReceipt,
				getLogs: (args) => client.getLogs(args),
			})

			await new Promise<void>((resolve) => {
				server.close(() => resolve())
			})
		},
		{ scope: 'worker' },
	],
})

export { expect }
