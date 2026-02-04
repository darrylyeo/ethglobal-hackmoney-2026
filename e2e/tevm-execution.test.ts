import { expect, test } from './fixtures/tevm.js'
import {
	addLifiRoutesMock,
	addTevmWallet,
	ensureWalletConnected,
	selectChainOption,
	selectProtocolOption,
} from './test-setup.js'

const isHexHash = (value: string | null): value is `0x${string}` =>
	typeof value === 'string' && value.startsWith('0x')

const getTxHash = async (
	locator: import('@playwright/test').Locator,
	label: string,
) => {
	await locator.waitFor({ state: 'visible', timeout: 20_000 })
	const value = await locator.getAttribute('data-tx-hash')
	if (!isHexHash(value)) throw new Error(`Missing ${label} tx hash.`)
	return value
}

const buildActionHash = (
	action: 'swap' | 'bridge' | 'transfer' | 'liquidity',
	params: Record<string, unknown>,
) => `#${action}:${encodeURIComponent(JSON.stringify(params))}`

test.describe('E2E Tevm walletless execution', () => {
	test('swap executes via tevm with logs', async ({ context, page, tevm }) => {
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await page.goto('/session#swap')
		await ensureWalletConnected(page)
		await page.getByRole('textbox', { name: 'Token in' }).fill('1')
		const swapButton = page.getByRole('button', { name: 'Sign and Submit' })
		await expect(swapButton).toBeEnabled({ timeout: 20_000 })
		await swapButton.click()
		const txHash = await getTxHash(page.locator('[data-tx-hash]'), 'swap')
		expect(txHash).toMatch(/^0x/)
	})

	test('bridge executes via tevm with logs', async ({
		context,
		page,
		tevm,
	}) => {
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await page.goto('/session#bridge')
		await addLifiRoutesMock(page)
		await ensureWalletConnected(page)
		await selectProtocolOption(page, 'LI.FI')
		await selectChainOption(page, 'From chain', 'Ethereum')
		await selectChainOption(page, 'To chain', 'OP Mainnet')
		await page.getByRole('textbox', { name: 'Amount' }).fill('1')
		await page
			.locator('[data-testid="quote-result"]')
			.waitFor({ state: 'visible', timeout: 50_000 })
		await page
			.getByLabel(/I understand this transaction is irreversible/)
			.click()
		const sendButton = page.getByRole('button', { name: 'Sign and Submit' })
		await expect(sendButton).toBeEnabled({ timeout: 20_000 })
		await sendButton.click()
		const txHash = await getTxHash(
			page.locator('[data-tx-hash]').first(),
			'bridge',
		)
		expect(txHash).toMatch(/^0x/)
	})

	test('transfer executes via tevm with balance delta', async ({
		context,
		page,
		tevm,
	}) => {
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		const hash = buildActionHash('transfer', {
			fromActor: tevm.walletAddress,
			toActor: tevm.recipientAddress,
			chainId: tevm.chainId,
			amount: '1',
			mode: 'direct',
		})
		const beforeSender = await tevm.getBalance(tevm.walletAddress)
		const beforeRecipient = await tevm.getBalance(tevm.recipientAddress)
		await page.goto(`/session${hash}`)
		await ensureWalletConnected(page)
		const transferButton = page.getByRole('button', { name: 'Sign and Submit' })
		await expect(transferButton).toBeEnabled({ timeout: 20_000 })
		await transferButton.click()
		const txHash = await getTxHash(
			page.locator('[data-tx-hash]').first(),
			'transfer',
		)
		const afterSender = await tevm.getBalance(tevm.walletAddress)
		const afterRecipient = await tevm.getBalance(tevm.recipientAddress)
		expect(afterRecipient - beforeRecipient).toBe(1n)
		expect(beforeSender - afterSender).toBeGreaterThanOrEqual(1n)
	})

	test('liquidity executes via tevm with logs', async ({
		context,
		page,
		tevm,
	}) => {
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		const hash = buildActionHash('liquidity', {
			chainId: tevm.chainId,
			amount0: '1',
			amount1: '2',
		})
		await page.goto(`/session${hash}`)
		await ensureWalletConnected(page)
		const addButton = page.getByRole('button', { name: 'Add Liquidity' })
		await expect(addButton).toBeEnabled({ timeout: 20_000 })
		await addButton.click()
		const txHash = await getTxHash(
			page.locator('[data-e2e-liquidity-status]'),
			'liquidity',
		)
		await expect(page.locator('[data-e2e-liquidity-status]')).toContainText(
			'Liquidity added.',
		)
		expect(txHash).toMatch(/^0x/)
	})
})
