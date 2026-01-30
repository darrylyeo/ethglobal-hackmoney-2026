import { expect, test } from '@playwright/test'

test('home page has expected h1', async ({ page }) => {
	await page.goto('/')
	await expect(page.locator('h1')).toBeVisible({ timeout: 15000 })
})

test('bridge: get quote flow selects options and shows result or error', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByRole('heading', { level: 1, name: 'USDC Bridge' })).toBeVisible({ timeout: 15000 })
	await page.getByText('Loading networks…').waitFor({ state: 'hidden', timeout: 10_000 })
	await page.getByLabel('From chain').click()
	await page.getByTestId('option-Ethereum').waitFor({ state: 'visible', timeout: 5000 })
	await page.getByTestId('option-Ethereum').click()
	await page.getByLabel('To chain').click()
	await page.getByTestId('option-OP Mainnet').waitFor({ state: 'visible', timeout: 5000 })
	await page.getByTestId('option-OP Mainnet').click()
	await page.getByRole('button', { name: 'Get Quote' }).click()
	await Promise.race([
		page.locator('[data-testid="quote-result"]').waitFor({ state: 'visible', timeout: 15000 }),
		page.getByRole('alert').waitFor({ state: 'visible', timeout: 15000 }),
	])
	const hasQuote = (await page.locator('[data-testid="quote-result"]').count()) > 0
	const hasAlert = (await page.getByRole('alert').count()) > 0
	expect(hasQuote || hasAlert).toBe(true)
})
