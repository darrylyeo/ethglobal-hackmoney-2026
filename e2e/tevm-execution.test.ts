import { expect, test } from './fixtures/tevm.ts'
import { addTevmWallet } from './support/wallet-mock.ts'
import {
	ensureWalletConnected,
	selectChainOption,
	selectProtocolOption,
} from './support/page-helpers.ts'
import {
	addLifiRoutesMock,
	addLifiRoutesMockToContext,
} from './support/api-mocks.ts'

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

const buildActionSearch = (
	action: 'Swap' | 'Transfer' | 'AddLiquidity',
	params: Record<string, unknown>,
) => `?actions=${encodeURIComponent(`${action}:${JSON.stringify(params)}`)}`

test.describe('E2E Tevm walletless execution', () => {
	test('swap executes via tevm with logs', async ({
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
		const search = buildActionSearch('Swap', {
			chainId: tevm.chainId,
			tokenIn: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
			tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
			amount: 1,
		})
		await page.goto(`/session${search}`)
		await expect(page.locator('#main')).toBeAttached({ timeout: 30_000 })
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 60_000 })
		await ensureWalletConnected(page)
		const swapButton = page.getByRole('button', { name: 'Sign & Broadcast' })
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
		await addLifiRoutesMockToContext(context)
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await page.goto('/session?template=Bridge')
		await addLifiRoutesMock(page)
		await expect(page.locator('#main')).toBeAttached({ timeout: 30_000 })
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 60_000 })
		await ensureWalletConnected(page)
		await page
			.getByText('Loading networks…')
			.waitFor({ state: 'hidden', timeout: 15_000 })
		await selectChainOption(page, 'From network', 'Ethereum')
		await selectChainOption(page, 'To network', 'OP Mainnet')
		await selectProtocolOption(page, 'LI.FI')
		await page.getByRole('textbox', { name: 'Amount' }).fill('1')
		const fetchBtn = page.getByRole('button', { name: 'Fetch quote' })
		await expect(fetchBtn).toBeEnabled({ timeout: 15_000 })
		await fetchBtn.click()
		await expect(
			page.getByText(/step\(s\) ready|No transaction|Fetch again|Fetching/),
		).toBeVisible({ timeout: 30_000 })
		const sendButton = page.getByRole('button', { name: 'Sign & Broadcast' })
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
		const search = buildActionSearch('Transfer', {
			fromActor: tevm.walletAddress,
			toActor: tevm.recipientAddress,
			chainId: tevm.chainId,
			amount: '1',
			mode: 'direct',
		})
		await page.goto(`/session${search}`)
		await expect(page.locator('#main')).toBeAttached({ timeout: 30_000 })
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 60_000 })
		await ensureWalletConnected(page)
		const transferButton = page.getByRole('button', { name: 'Sign & Broadcast' })
		await expect(transferButton).toBeEnabled({ timeout: 20_000 })
		await transferButton.click()
		const txHash = await getTxHash(
			page.locator('#main [data-tx-hash]').first(),
			'transfer',
		)
		expect(txHash).toMatch(/^0x[a-fA-F0-9]+$/)
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
		const search = buildActionSearch('AddLiquidity', {
			chainId: tevm.chainId,
			amount0: '1',
			amount1: '2',
		})
		await page.goto(`/session${search}`)
		await expect(page.locator('#main')).toBeAttached({ timeout: 30_000 })
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 60_000 })
		await ensureWalletConnected(page)
		const addButton = page.getByRole('button', { name: 'Sign & Broadcast' })
		await expect(addButton).toBeEnabled({ timeout: 20_000 })
		await addButton.click()
		const txHash = await getTxHash(
			page.locator('[data-tx-hash]'),
			'liquidity',
		)
		expect(txHash).toMatch(/^0x/)
	})
})
