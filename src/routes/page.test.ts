import { expect, test } from '@playwright/test'

test('home page has expected h1', async ({ page }) => {
	await page.goto('/')
	await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
})

test('bridge: get quote flow selects options and shows result or error', async ({
	context,
	page,
}) => {
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
	await page.goto('/session?template=Bridge')
	await expect(
		page.getByRole('heading', { level: 1, name: 'USDC Bridge' }),
	).toBeVisible({
		timeout: 15_000,
	})
	await page.getByRole('button', { name: 'Connect Wallet' }).click()
	await page.locator('[data-wallet-provider-option]').click()
	await expect(page.locator('[data-wallet-address]')).toBeVisible({
		timeout: 10_000,
	})
	await page.getByRole('button', { name: 'LI.FI' }).click()
	await page
		.getByText('Loading networks…')
		.waitFor({ state: 'hidden', timeout: 15_000 })
	await expect(page.getByLabel('From chain')).toContainText('Ethereum', {
		timeout: 5_000,
	})
	await page.getByLabel('From chain').click()
	await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 })
	await page.getByTestId('option-Ethereum').click()
	await page.getByLabel('To chain').click()
	await page.getByTestId('option-OP Mainnet').click()
	await page.getByLabel('Amount').fill('1')
	await Promise.race([
		page.locator('[data-testid="quote-result"]').waitFor({
			state: 'visible',
			timeout: 25_000,
		}),
		page
			.locator('[data-no-routes]')
			.waitFor({ state: 'visible', timeout: 25_000 }),
		page.getByRole('alert').waitFor({ state: 'visible', timeout: 25_000 }),
	])
	const hasQuote =
		(await page.locator('[data-testid="quote-result"]').count()) > 0
	const hasNoRoutes = (await page.locator('[data-no-routes]').count()) > 0
	const hasAlert = (await page.getByRole('alert').count()) > 0
	expect(hasQuote || hasNoRoutes || hasAlert).toBe(true)
})
