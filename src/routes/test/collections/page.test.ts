import { expect, test } from '@playwright/test'
test('page loads and shows Test collections heading', async ({ page }) => {
	await page.goto('/test/collections')
	await expect(
		page.getByRole('heading', { level: 1, name: 'Test collections' }),
	).toBeVisible({
		timeout: 15_000,
	})
})
test('page links to Networks and coins', async ({ page }) => {
	await page.goto('/test/collections')
	await expect(
		page.getByRole('link', { name: 'Networks and coins' }),
	).toBeVisible()
	await expect(
		page.getByRole('link', { name: 'Networks and coins' }),
	).toHaveAttribute('href', '/test/networks-coins')
})
