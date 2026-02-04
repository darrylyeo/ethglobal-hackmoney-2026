import { expect, test } from '@playwright/test'

async function addMockWallet(context: {
	addInitScript: (fn: () => void) => Promise<void>
}) {
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
}

test.describe('bridge flow', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/session#bridge')
		await expect(page.locator('#main')).toBeAttached({
			timeout: 30_000,
		})
		await expect(
			page.getByRole('heading', { level: 1, name: 'USDC Bridge' }),
		).toBeVisible({ timeout: 45_000 })
	})

	test.describe('with mock wallet', () => {
		test.beforeEach(async ({ context, page }) => {
			await addMockWallet(context)
			await page.goto('/session#bridge')
			await expect(page.locator('#main')).toBeAttached({
				timeout: 30_000,
			})
			await expect(
				page.getByRole('heading', { level: 1, name: 'USDC Bridge' }),
			).toBeVisible({ timeout: 45_000 })
			await page.getByRole('button', { name: 'Connect Wallet' }).click()
			await page.locator('[data-wallet-provider-option]').click()
			await expect(page.locator('[data-wallet-address]')).toBeVisible({
				timeout: 10_000,
			})
			await page.getByRole('button', { name: 'LI.FI' }).click()
			await page
				.getByText('Loading networks…')
				.waitFor({ state: 'hidden', timeout: 15_000 })
		})

		test('select source and destination chain, enter amount', async ({
			page,
		}) => {
			await expect(page.getByLabel('From chain')).toContainText('Ethereum', {
				timeout: 5_000,
			})
			await page.getByLabel('From chain').click()
			await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 })
			await page
				.getByRole('option', { name: 'Ethereum' })
				.click({ force: true })
			await page.getByLabel('To chain').click()
			await page
				.getByRole('option', { name: 'OP Mainnet' })
				.click({ force: true })
			await page.getByLabel('Amount').fill('1')
		})

		test('wait for result or no-routes', async ({ page }) => {
			await expect(page.getByLabel('From chain')).toContainText('Ethereum', {
				timeout: 5_000,
			})
			await page.getByLabel('From chain').click()
			await page
				.getByRole('option', { name: 'Ethereum' })
				.click({ force: true })
			await page.getByLabel('To chain').click()
			await page
				.getByRole('option', { name: 'OP Mainnet' })
				.click({ force: true })
			await page.getByLabel('Amount').fill('1')
			await Promise.race([
				page
					.locator('[data-testid="quote-result"]')
					.waitFor({ state: 'visible', timeout: 25_000 }),
				page
					.locator('[data-no-routes]')
					.waitFor({ state: 'visible', timeout: 25_000 }),
				page
					.locator('[data-error-display]')
					.waitFor({ state: 'visible', timeout: 25_000 }),
			])
			const hasResult =
				(await page.locator('[data-testid="quote-result"]').count()) > 0 ||
				(await page.locator('[data-no-routes]').count()) > 0 ||
				(await page.locator('[data-error-display]').count()) > 0
			expect(hasResult).toBe(true)
		})
	})
})
