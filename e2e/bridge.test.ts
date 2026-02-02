import { expect, test } from '@playwright/test'
import { addMockWallet, injectMockWalletInPage } from './test-setup.js'

test.describe('Bridge UI (Spec 004)', () => {
	test.beforeEach(async ({ context, page }) => {
		await addMockWallet(context, page)
		await page.goto('/bridge/lifi')
		await injectMockWalletInPage(page)
	})

	test('select source chain, destination chain, enter amount and address', async ({
		page,
	}) => {
		await expect(page.locator('#main-content')).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.locator('#main-content')).toContainText(
			/USDC Bridge|Connect a wallet/,
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
		await page
			.getByText('Loading networks…')
			.waitFor({ state: 'hidden', timeout: 15_000 })
		await page.getByLabel('From chain').click()
		await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
		await page.getByLabel('To chain').click()
		await page
			.getByRole('option', { name: 'OP Mainnet' })
			.click({ force: true })
		await page.getByLabel('Amount').fill('1')
		await expect(page.getByLabel('From chain')).toContainText('Ethereum')
		await expect(page.getByLabel('To chain')).toContainText('OP Mainnet')
		await expect(page.getByLabel('Amount')).toHaveValue('1')
	})

	test('routes auto-fetch after chains and amount; quote result or no-routes or error visible', async ({
		page,
	}) => {
		await expect(page.locator('#main-content')).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.locator('#main-content')).toContainText(
			/USDC Bridge|Connect a wallet/,
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
		await page
			.getByText('Loading networks…')
			.waitFor({ state: 'hidden', timeout: 15_000 })
		await page.getByLabel('From chain').click()
		await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
		await page.getByLabel('To chain').click()
		await page
			.getByRole('option', { name: 'OP Mainnet' })
			.click({ force: true })
		await page.getByLabel('Amount').fill('1')
		await Promise.race([
			page
				.locator('[data-testid="quote-result"]')
				.waitFor({ state: 'visible', timeout: 50_000 }),
			page
				.locator('[data-no-routes]')
				.waitFor({ state: 'visible', timeout: 50_000 }),
			page
				.locator('[data-error-display]')
				.waitFor({ state: 'visible', timeout: 50_000 }),
		])
		const quoteVisible =
			(await page.locator('[data-testid="quote-result"]').count()) > 0
		const noRoutesVisible = (await page.locator('[data-no-routes]').count()) > 0
		const errorVisible =
			(await page.locator('[data-error-display]').count()) > 0
		expect(quoteVisible || noRoutesVisible || errorVisible).toBe(true)
		if (quoteVisible) {
			await expect(page.locator('[data-testid="quote-result"]')).toBeVisible()
		}
	})
})
