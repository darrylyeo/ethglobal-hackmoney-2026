import { expect, test } from './fixtures/tevm.js'
import {
	addGatewayMocks,
	addTevmWallet,
	ensureWalletConnected,
	selectProtocolOption,
} from './test-setup.js'

test.describe('Gateway Bridge (Spec 074)', () => {
	test.beforeEach(async ({ context, page, tevm }) => {
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await addGatewayMocks(page)
		await page.goto('/session#bridge')
	})

	test('select Gateway, chain pair, enter amount and see balance or deposit message', async ({
		page,
	}) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.locator('#main').first()).toContainText(
			/USDC Bridge|Connect a wallet/,
			{ timeout: 45_000 },
		)
		await ensureWalletConnected(page)
		await page.getByLabel('From chain').click()
		await page.getByRole('option', { name: 'Arc Testnet' }).waitFor({ state: 'visible', timeout: 10_000 })
		await page.getByRole('option', { name: 'Arc Testnet' }).click({ force: true })
		await page.getByLabel('To chain').click()
		await page.getByRole('option', { name: 'Base Sepolia' }).waitFor({ state: 'visible', timeout: 10_000 })
		await page.getByRole('option', { name: 'Base Sepolia' }).click({ force: true })
		await selectProtocolOption(page, 'Gateway')
		await page.getByRole('textbox', { name: 'Amount' }).fill('1')
		await expect(page.getByRole('textbox', { name: 'Amount' })).toHaveValue('1')
		await expect(
			page.getByText(/Unified USDC balance|Deposit first|Instant transfer|Loading unified balance/),
		).toBeVisible({ timeout: 20_000 })
		await expect(
			page.getByRole('button', { name: 'Sign and Submit' }),
		).toBeVisible({ timeout: 5_000 })
	})
})
