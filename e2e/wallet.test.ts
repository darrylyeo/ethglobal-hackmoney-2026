import { expect, test } from '@playwright/test'
import { addMockWallet, injectMockWalletInPage } from './test-setup.js'

test.describe('Wallet provider & balances (Spec 005)', () => {
	test('network toggle switches between Mainnet/Testnet label', async ({
		page,
	}) => {
		await page.goto('/bridge')
		await expect(page.locator('[data-wallet-network-label]')).toHaveText(
			'Mainnet',
			{
				timeout: 15_000,
			},
		)
		await page.locator('[data-wallet-network-testnet]').click()
		await expect(page.locator('[data-wallet-network-label]')).toHaveText(
			'Testnet',
			{
				timeout: 5_000,
			},
		)
		await page.locator('[data-wallet-network-mainnet]').click()
		await expect(page.locator('[data-wallet-network-label]')).toHaveText(
			'Mainnet',
			{
				timeout: 5_000,
			},
		)
	})

	test('connect wallet button opens popover', async ({ page }) => {
		await page.goto('/bridge')
		await page.locator('[data-wallet-connect-trigger]').click()
		await expect(page.locator('[data-wallet-popover]')).toBeVisible({
			timeout: 10_000,
		})
	})

	test.describe('with mock wallet', () => {
		test.beforeEach(async ({ context, page }) => {
			await addMockWallet(context, page)
			await page.goto('/bridge')
			await injectMockWalletInPage(page)
			await expect(page.locator('#main')).toBeAttached({
				timeout: 30_000,
			})
			await expect(page.locator('#main')).toContainText(
				/USDC Bridge|Connect a wallet/,
				{ timeout: 45_000 },
			)
		})

		test.skip('after connection address displays in header', async ({
			page,
		}) => {
			await page.locator('[data-wallet-connect-trigger]').click()
			await page
				.locator('[data-wallet-provider-option]')
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page.locator('[data-wallet-provider-option]').click()
			await expect(page.locator('[data-wallet-address]')).toContainText(
				'0x1234',
				{
					timeout: 20_000,
				},
			)
			await expect(page.locator('[data-wallet-address]')).toContainText('7890')
		})

		test.skip('disconnect button clears connection', async ({ page }) => {
			await page.locator('[data-wallet-connect-trigger]').click()
			await page.locator('[data-wallet-provider-option]').click()
			await expect(page.locator('[data-wallet-address]')).toBeVisible({
				timeout: 20_000,
			})
			await page.locator('[data-wallet-menu-trigger]').click()
			await page.locator('[data-wallet-disconnect]').click()
			await expect(page.locator('[data-wallet-connect-trigger]')).toBeVisible()
			await expect(page.locator('[data-wallet-address]')).not.toBeVisible()
		})

		test.skip('balances section appears after connection', async ({ page }) => {
			await page.locator('[data-wallet-connect-trigger]').click()
			await page.locator('[data-wallet-provider-option]').click()
			await expect(page.locator('[data-wallet-address]')).toBeVisible({
				timeout: 20_000,
			})
			await expect(page.locator('[data-balances-grid]')).toBeVisible({
				timeout: 30_000,
			})
			await expect(page.locator('[data-balance-item]').first()).toBeVisible({
				timeout: 10_000,
			})
		})
	})
})
