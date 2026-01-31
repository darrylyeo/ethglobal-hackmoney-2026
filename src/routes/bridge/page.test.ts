import { expect, test } from '@playwright/test'

test('bridge page loads and shows USDC Bridge heading', async ({ page }) => {
	await page.goto('/bridge')
	await expect(page.getByRole('heading', { level: 1, name: 'USDC Bridge' }))
		.toBeVisible({
			timeout: 15_000,
		})
})
test('after networks load, From chain select shows a real network (not empty)', async ({ page }) => {
	await page.goto('/bridge')
	await expect(page.getByRole('heading', { level: 1, name: 'USDC Bridge' }))
		.toBeVisible({
			timeout: 15_000,
		})
	await page.getByText('Loading networks…').waitFor({
		state: 'hidden',
		timeout: 10_000,
	})
	await expect(page.getByLabel('From chain')).toContainText('Ethereum', {
		timeout: 5_000,
	})
	await page.getByLabel('From chain').click()
	await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 })
	await expect(page.getByTestId('option-Ethereum')).toBeVisible({
		timeout: 5_000,
	})
})
test('after networks load, To chain dropdown lists Ethereum and OP Mainnet', async ({ page }) => {
	await page.goto('/bridge')
	await page.getByText('Loading networks…').waitFor({
		state: 'hidden',
		timeout: 10_000,
	})
	await expect(page.getByLabel('From chain')).toContainText('Ethereum', {
		timeout: 5_000,
	})
	await page.getByLabel('From chain').click()
	await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 })
	await page.getByTestId('option-Ethereum').waitFor({
		state: 'visible',
		timeout: 5_000,
	})
	await page.getByTestId('option-Ethereum').click()
	await page.getByLabel('To chain').click()
	const listbox = page.getByRole('listbox')
	await expect(listbox.getByRole('option', { name: 'Ethereum' })).toBeVisible({
		timeout: 5_000,
	})
	await expect(listbox.getByRole('option', { name: 'OP Mainnet' })).toBeVisible(
		{ timeout: 5_000 },
	)
})
