import { expect, test } from '@playwright/test'
test('page loads and shows Networks and coins heading', async ({ page }) => {
	await page.goto('/test/networks-coins')
	await expect(
		page.getByRole('heading', { level: 1, name: 'Networks and coins' }),
	).toBeVisible({
		timeout: 15_000,
	})
})
test('after networks load, Networks section lists Ethereum with ID 1', async ({
	page,
}) => {
	await page.goto('/test/networks-coins')
	await page.getByText('Loading networks…').waitFor({
		state: 'hidden',
		timeout: 10_000,
	})
	await expect(
		page.getByRole('heading', { level: 2, name: 'Networks' }),
	).toBeVisible()
	await expect(
		page.locator("section:has(h2:has-text('Networks')) ul li").filter({
			hasText: 'Ethereum',
		}),
	).toContainText('(ID: 1)', { timeout: 5_000 })
})
test('after coins load, USDC coins section lists USDC on chain 1 with address', async ({
	page,
}) => {
	await page.goto('/test/networks-coins')
	await page.getByText('Loading coins…').waitFor({
		state: 'hidden',
		timeout: 10_000,
	})
	await expect(
		page.getByRole('heading', { level: 2, name: 'USDC coins' }),
	).toBeVisible()
	const firstCoin = page
		.locator("section:has(h2:has-text('USDC coins')) ul li")
		.first()
	await expect(firstCoin).toContainText('USDC', { timeout: 5_000 })
	await expect(firstCoin).toContainText('on chain')
	await expect(firstCoin).toContainText('0x', { timeout: 5_000 })
})
