import { expect, test } from '@playwright/test'

test.describe('WalletProvider', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/bridge/lifi')
		await expect(page.locator('#main')).toBeAttached({
			timeout: 30_000,
		})
		await expect(
			page.getByRole('heading', { level: 1, name: 'USDC Bridge' }),
		).toBeVisible({
			timeout: 45_000,
		})
	})

	test.describe('with mock wallet', () => {
		test.beforeEach(async ({ context, page }) => {
			await context.addInitScript(() => {
				const MOCK = '0x1234567890123456789012345678901234567890'
				window.addEventListener('eip6963:requestProvider', () => {
					window.dispatchEvent(
						new CustomEvent('eip6963:announceProvider', {
							detail: {
								info: {
									uuid: 'mock-wallet-uuid',
									name: 'Mock Wallet',
									icon: '',
									rdns: 'com.mock',
								},
								provider: {
									request: async ({ method }: { method: string }) => {
										if (method === 'eth_requestAccounts') return [MOCK]
										return null
									},
								},
							},
						}),
					)
				})
			})
			await page.goto('/bridge/lifi')
		})

		test('after connection address displays in header', async ({ page }) => {
			await page.locator('[data-wallet-connect-trigger]').click()
			await page
				.locator('[data-wallet-provider-option]')
				.waitFor({ timeout: 10_000 })
			await page.locator('[data-wallet-provider-option]').click()
			await expect(page.locator('[data-wallet-address]')).toContainText(
				'0x1234',
			)
			await expect(page.locator('[data-wallet-address]')).toContainText('7890')
		})

		test('disconnect button clears connection', async ({ page }) => {
			await page.locator('[data-wallet-connect-trigger]').click()
			await page.locator('[data-wallet-provider-option]').click()
			await expect(page.locator('[data-wallet-address]')).toBeVisible({
				timeout: 10_000,
			})
			await page.locator('[data-wallet-disconnect]').click()
			await expect(page.locator('[data-wallet-connect-trigger]')).toBeVisible()
			await expect(page.locator('[data-wallet-address]')).not.toBeVisible()
		})

		test('balances section appears after connection', async ({ page }) => {
			await expect(page.locator('[data-balances-grid]')).not.toBeVisible()
			await page.locator('[data-wallet-connect-trigger]').click()
			await page.locator('[data-wallet-provider-option]').click()
			await expect(page.locator('[data-balances-grid]')).toBeVisible({
				timeout: 15_000,
			})
			await expect(page.locator('[data-balance-item]').first()).toBeVisible({
				timeout: 15_000,
			})
		})
	})

	test('displays mainnet label by default', async ({ page }) => {
		await expect(page.locator('[data-wallet-network-label]')).toHaveText(
			'Mainnet',
			{
				timeout: 10_000,
			},
		)
	})

	test('network toggle switches to testnet', async ({ page }) => {
		await page.locator('[data-wallet-network-testnet]').click()
		await expect(page.locator('[data-wallet-network-label]')).toHaveText(
			'Testnet',
			{
				timeout: 10_000,
			},
		)
	})

	test('network toggle switches back to mainnet', async ({ page }) => {
		await page.locator('[data-wallet-network-testnet]').click()
		await expect(page.locator('[data-wallet-network-label]')).toHaveText(
			'Testnet',
			{
				timeout: 10_000,
			},
		)
		await page.locator('[data-wallet-network-mainnet]').click()
		await expect(page.locator('[data-wallet-network-label]')).toHaveText(
			'Mainnet',
			{
				timeout: 10_000,
			},
		)
	})

	test('connect wallet button is visible', async ({ page }) => {
		await expect(page.locator('[data-wallet-connect-trigger]')).toBeVisible()
		await expect(page.locator('[data-wallet-connect-trigger]')).toHaveText(
			'Connect Wallet',
		)
	})

	test('connect wallet button opens popover', async ({ page }) => {
		await page.click('[data-wallet-connect-trigger]')
		await expect(page.locator('[data-wallet-popover]')).toBeVisible()
	})

	test('popover shows no wallets message when none detected', async ({
		page,
	}) => {
		await page.click('[data-wallet-connect-trigger]')
		await expect(page.locator('[data-wallet-empty]')).toBeVisible()
		await expect(page.locator('[data-wallet-empty]')).toContainText(
			'No wallets found',
		)
	})

	test('balances section not visible when not connected', async ({ page }) => {
		await expect(page.locator('[data-balances-grid]')).not.toBeVisible()
	})
})
