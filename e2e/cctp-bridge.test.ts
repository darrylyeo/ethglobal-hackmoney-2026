import { expect, test } from './fixtures/tevm.js'
import {
	addCctpMocks,
	addTevmWallet,
	ensureWalletConnected,
} from './test-setup.js'

test.describe('CCTP Bridge (Spec 036)', () => {
	test.beforeEach(async ({ context, page, tevm }) => {
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await addCctpMocks(page)
		await page.goto('/bridge/cctp')
	})

	test('select chains, enter amount', async ({ page }) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.locator('#main').first()).toContainText(
			/USDC Bridge \(CCTP\)|Connect a wallet/,
			{ timeout: 45_000 },
		)
		await ensureWalletConnected(page)
		await page.getByText('Loading networks…').waitFor({ state: 'hidden', timeout: 15_000 })
		await page.getByLabel('From chain').focus()
		await page.getByLabel('From chain').press('ArrowDown')
		await page.getByRole('option').first().waitFor({ state: 'visible', timeout: 10_000 })
		await page.keyboard.press('Enter')
		await page.getByLabel('To chain').focus()
		await page.getByLabel('To chain').press('ArrowDown')
		await page.getByRole('option').first().waitFor({ state: 'visible', timeout: 10_000 })
		await page.keyboard.press('ArrowDown')
		await page.keyboard.press('Enter')
		await page.getByRole('textbox', { name: 'Amount' }).fill('1')
		await expect(page.getByRole('textbox', { name: 'Amount' })).toHaveValue('1')
	})

	test('Fast Transfer fee and allowance displayed', async ({ page }) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await ensureWalletConnected(page)
		await page.getByLabel('From chain').focus()
		await page.getByLabel('From chain').press('ArrowDown')
		await page.getByRole('option').first().waitFor({ state: 'visible', timeout: 10_000 })
		await page.keyboard.press('Enter')
		await page.getByLabel('To chain').focus()
		await page.getByLabel('To chain').press('ArrowDown')
		await page.getByRole('option').first().waitFor({ state: 'visible', timeout: 10_000 })
		await page.keyboard.press('ArrowDown')
		await page.keyboard.press('Enter')
		await expect(page.getByText(/bps|Loading fees/).first()).toBeVisible({
			timeout: 15_000,
		})
		await expect(
			page.getByText(/Fast transfer allowance|Loading allowance…|Not required/),
		).toBeVisible({ timeout: 10_000 })
	})

	test.skip('confirmation dialog before send', async ({ page }) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await page.getByRole('button', { name: 'Connect Wallet' }).click()
		await page
			.locator('[data-wallet-provider-option]')
			.waitFor({ state: 'visible', timeout: 10_000 })
		await page.locator('[data-wallet-provider-option]').click()
		await expect(page.locator('[data-wallet-address]')).toBeVisible({
			timeout: 15_000,
		})
		await expect(
			page.getByText(/To: 0x|Connect wallet/, { exact: false }),
		).toBeVisible({
			timeout: 10_000,
		})
		await page.getByLabel('From chain').click()
		await page.getByRole('option').first().click({ force: true })
		await page.getByLabel('To chain').click()
		await page.getByRole('option').nth(1).click({ force: true })
		await page.getByRole('textbox', { name: 'Amount' }).fill('0.01')
		await expect(
			page.getByRole('button', { name: 'Bridge via CCTP' }),
		).toBeEnabled({
			timeout: 30_000,
		})
		await page.getByRole('button', { name: 'Bridge via CCTP' }).click()
		await expect(
			page.getByRole('dialog').getByText('Confirm CCTP transfer'),
		).toBeVisible({
			timeout: 5_000,
		})
		await page.getByRole('button', { name: 'Cancel' }).click()
		await expect(page.getByRole('dialog')).not.toBeVisible()
	})
})
