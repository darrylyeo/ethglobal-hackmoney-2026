import { expect, test } from './fixtures/tevm.ts'
import {
	addGatewayMocks,
	addTevmWallet,
	ensureWalletConnected,
	selectChainOption,
	selectProtocolOption,
} from './support/test-setup.ts'

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
		await page.goto('/session?template=Bridge')
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 45_000 })
		await expect(page.locator('#main, main').first()).toBeVisible({
			timeout: 15_000,
		})
	})

	test('select Gateway, chain pair, enter amount and see balance or deposit message', async ({
		page,
	}) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.locator('#main').first()).toContainText(
			/USDC Bridge|Bridge|Connect a wallet/,
			{ timeout: 45_000 },
		)
		await ensureWalletConnected(page)
		await page.getByText('Loading networks…').waitFor({ state: 'hidden', timeout: 15_000 })
		await selectChainOption(page, 'From network', 'Ethereum')
		await selectChainOption(page, 'To network', 'Base')
		await selectProtocolOption(page, 'Circle Gateway')
		await page.getByRole('textbox', { name: 'Amount' }).fill('1')
		await expect(page.getByRole('textbox', { name: 'Amount' })).toHaveValue('1')
		await expect(
			page.getByText(/Unified USDC balance|Deposit first|Instant transfer|Loading unified balance/),
		).toBeVisible({ timeout: 20_000 })
		await expect(
			page.getByText(/Approve USDC \(Gateway\)|Deposit \(Gateway\)|Proposed Transaction/).first(),
		).toBeVisible({ timeout: 10_000 })
		await expect(
			page.getByRole('button', { name: /Sign & Broadcast|Sign and Submit/ }),
		).toBeVisible({ timeout: 5_000 })
	})
})
