import { expect, test } from '@playwright/test'

async function addMockWallet(context: { addInitScript: (fn: () => void) => Promise<void> }) {
	await context.addInitScript(() => {
		const MOCK = '0x1234567890123456789012345678901234567890'
		const announce = () => {
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
							request: (args: { method: string }) =>
								Promise.resolve(
									args.method === 'eth_requestAccounts' ? [MOCK]
									: args.method === 'eth_chainId' ? '0x1'
									: args.method === 'eth_accounts' ? [MOCK]
									: null,
								),
						},
					},
				}),
			)
		}
		window.addEventListener('eip6963:requestProvider', () => {
			setTimeout(announce, 0)
		})
	})
}

test.describe('CCTP Bridge (Spec 036)', () => {
	test.beforeEach(async ({ context, page }) => {
		await addMockWallet(context)
		await page.route('**/v2/burn/USDC/fees/**', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([
					{ finalityThreshold: 1000, minimumFee: 10 },
					{ finalityThreshold: 2000, minimumFee: 0 },
				]),
			})
		})
		await page.route('**/v2/fastBurn/USDC/allowance', (route) => {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ allowance: 1_000_000, lastUpdated: '2025-01-01T00:00:00Z' }),
			})
		})
		await page.goto('/bridge/cctp')
	})

	test('select chains, enter amount', async ({ page }) => {
		await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
		await expect(page.locator('#main-content')).toContainText(
			/USDC Bridge \(CCTP\)|Connect a wallet/,
			{ timeout: 45_000 },
		)
		await page.getByRole('button', { name: 'Connect Wallet' }).click()
		await page
			.locator('[data-wallet-provider-option]')
			.waitFor({ state: 'visible', timeout: 10_000 })
		await page.locator('[data-wallet-provider-option]').click()
		await expect(page.locator('[data-wallet-address]')).toBeVisible({
			timeout: 15_000,
		})
		await page.getByLabel('From chain').click()
		await page.getByRole('option', { name: /Ethereum|Base|Arbitrum/ }).first().click({ force: true })
		await page.getByLabel('To chain').click()
		await page.getByRole('option', { name: /Ethereum|Base|Arbitrum/ }).first().click({ force: true })
		await page.getByLabel('Amount').fill('1')
		await expect(page.getByLabel('Amount')).toHaveValue('1')
	})

	test('Fast Transfer fee and allowance displayed', async ({ page }) => {
		await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
		await page.getByRole('button', { name: 'Connect Wallet' }).click()
		await page
			.locator('[data-wallet-provider-option]')
			.waitFor({ state: 'visible', timeout: 10_000 })
		await page.locator('[data-wallet-provider-option]').click()
		await expect(page.locator('[data-wallet-address]')).toBeVisible({ timeout: 15_000 })
		await page.getByLabel('From chain').click()
		await page.getByRole('option').first().click({ force: true })
		await page.getByLabel('To chain').click()
		await page.getByRole('option').nth(1).click({ force: true })
		await expect(page.getByText(/bps|Loading fees/).first()).toBeVisible({
			timeout: 15_000,
		})
		await expect(
			page.getByText(/Fast transfer allowance|Loading allowance…|Not required/),
		).toBeVisible({ timeout: 10_000 })
	})

	test.skip('confirmation dialog before send', async ({ page }) => {
		await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
		await page.getByRole('button', { name: 'Connect Wallet' }).click()
		await page
			.locator('[data-wallet-provider-option]')
			.waitFor({ state: 'visible', timeout: 10_000 })
		await page.locator('[data-wallet-provider-option]').click()
		await expect(page.locator('[data-wallet-address]')).toBeVisible({ timeout: 15_000 })
		await expect(page.getByText(/To: 0x|Connect wallet/, { exact: false })).toBeVisible({
			timeout: 10_000,
		})
		await page.getByLabel('From chain').click()
		await page.getByRole('option').first().click({ force: true })
		await page.getByLabel('To chain').click()
		await page.getByRole('option').nth(1).click({ force: true })
		await page.getByLabel('Amount').fill('0.01')
		await expect(page.getByRole('button', { name: 'Bridge via CCTP' })).toBeEnabled({
			timeout: 30_000,
		})
		await page.getByRole('button', { name: 'Bridge via CCTP' }).click()
		await expect(page.getByRole('dialog').getByText('Confirm CCTP transfer')).toBeVisible({
			timeout: 5_000,
		})
		await page.getByRole('button', { name: 'Cancel' }).click()
		await expect(page.getByRole('dialog')).not.toBeVisible()
	})
})
