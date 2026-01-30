import { expect, test } from '@playwright/test'

test('page loads and shows USDC Bridge heading', async ({ page }) => {
	await page.goto('/')
	await expect(page.getByRole('heading', { level: 1, name: 'USDC Bridge' })).toBeVisible({
		timeout: 15_000,
	})
})

test('after networks load, From chain select shows a real network (not empty)', async ({
	page,
}) => {
	await page.goto('/')
	await expect(page.getByRole('heading', { level: 1, name: 'USDC Bridge' })).toBeVisible({
		timeout: 15_000,
	})
	await page.getByText('Loading networks…').waitFor({ state: 'hidden', timeout: 10_000 })
	await page.getByLabel('From chain').click()
	await expect(page.getByTestId('option-Ethereum')).toBeVisible({ timeout: 5_000 })
})

test('after networks load, To chain dropdown lists Ethereum and OP Mainnet', async ({
	page,
}) => {
	await page.goto('/')
	await page.getByText('Loading networks…').waitFor({ state: 'hidden', timeout: 10_000 })
	await page.getByLabel('To chain').click()
	await expect(page.getByTestId('option-Ethereum')).toBeVisible({ timeout: 5_000 })
	await expect(page.getByTestId('option-OP Mainnet')).toBeVisible({ timeout: 5_000 })
})
