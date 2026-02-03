import { expect, test } from '@playwright/test'
import { addMockWallet, injectMockWalletInPage } from './test-setup.js'

test.describe('Unified Bridge (Spec 037)', () => {
	test.beforeEach(async ({ context, page }) => {
		await addMockWallet(context, page)
		await page.goto('/bridge')
		await injectMockWalletInPage(page)
	})

	test('unified bridge renders with chain selects, amount, protocol section', async ({
		page,
	}) => {
		await expect(page.locator('#main')).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.locator('#main')).toContainText(
			/USDC Bridge|Connect a wallet/,
			{ timeout: 45_000 },
		)
		await expect(
			page.getByRole('heading', { name: 'Bridge USDC' }),
		).toBeVisible()
		await expect(page.getByLabel('From chain')).toBeAttached()
		await expect(page.getByLabel('To chain')).toBeAttached()
		await expect(page.getByRole('textbox', { name: 'Amount' })).toBeAttached()
		await expect(
			page.getByRole('heading', { name: 'Protocol Selection' }),
		).toBeVisible()
	})

	test('chain pair supported by both defaults to CCTP badge', async ({
		page,
	}) => {
		await expect(page.locator('#main')).toBeAttached({
			timeout: 30_000,
		})
		await page.getByRole('button', { name: 'Connect Wallet' }).click()
		await page
			.locator('[data-wallet-provider-option]')
			.waitFor({ state: 'visible', timeout: 10_000 })
		await page.locator('[data-wallet-provider-option]').click()
		await expect(page.locator('[data-wallet-address]')).toBeVisible({
			timeout: 15_000,
		})
		await page.getByLabel('From chain').focus()
		await page.getByLabel('From chain').press('ArrowDown')
		await page
			.getByRole('option', { name: 'Ethereum' })
			.waitFor({ state: 'visible', timeout: 10_000 })
		await page
			.getByRole('option', { name: 'Ethereum' })
			.evaluate((el) => (el as HTMLElement).click())
		await page.keyboard.press('Escape')
		await page.getByLabel('To chain').focus()
		await page.getByLabel('To chain').press('ArrowDown')
		await page.getByRole('option').first().waitFor({ state: 'visible', timeout: 10_000 })
		await page.keyboard.press('ArrowDown')
		await page.keyboard.press('Enter')
		await expect(
			page.locator('[data-protocol="cctp"]'),
		).toContainText('CCTP')
		await expect(
			page.getByText(/Defaulting to CCTP|Preferring CCTP/),
		).toBeVisible()
	})

	test.fixme('chain pair that only LI.FI supports selects LI.FI', async ({
		page,
	}) => {
		await expect(page.locator('#main')).toBeAttached({
			timeout: 30_000,
		})
		await page.getByRole('button', { name: 'Connect Wallet' }).click()
		await page
			.locator('[data-wallet-provider-option]')
			.waitFor({ state: 'visible', timeout: 10_000 })
		await page.locator('[data-wallet-provider-option]').click()
		await expect(page.locator('[data-wallet-address]')).toBeVisible({
			timeout: 15_000,
		})
		await page.locator('#main').evaluate((el) => {
			el.querySelector<HTMLElement>('[data-to-chain]')?.scrollIntoView({
				block: 'center',
			})
		})
		await page.getByLabel('From chain').focus()
		await page.getByLabel('From chain').press('ArrowDown')
		await page.getByLabel('From chain').fill('Celo')
		await page
			.getByRole('option', { name: 'Celo' })
			.waitFor({ state: 'visible', timeout: 15_000 })
		await page.keyboard.press('Enter')
		await page.getByLabel('To chain').focus()
		await page.getByLabel('To chain').press('ArrowDown')
		await page.getByLabel('To chain').fill('ZKsync')
		const zkOption = page.getByRole('option', { name: 'ZKsync Era' }).first()
		await zkOption.waitFor({ state: 'visible', timeout: 10_000 })
		await zkOption.evaluate((el) => (el as HTMLElement).click())
		await expect(
			page.locator('[data-protocol="lifi"]'),
		).toContainText('LI.FI')
		await expect(page.getByText(/Only LI.FI supports this pair/)).toBeVisible()
	})

	test('shared pair defaults to CCTP, then Prefer LI.FI shows LI.FI, Continue goes to /bridge/lifi', async ({
		page,
	}) => {
		await expect(page.locator('#main')).toBeAttached({
			timeout: 30_000,
		})
		await page.getByRole('button', { name: 'Connect Wallet' }).click()
		await page
			.locator('[data-wallet-provider-option]')
			.waitFor({ state: 'visible', timeout: 10_000 })
		await page.locator('[data-wallet-provider-option]').click()
		await expect(page.locator('[data-wallet-address]')).toBeVisible({
			timeout: 15_000,
		})
		await page.getByLabel('From chain').focus()
		await page.getByLabel('From chain').press('ArrowDown')
		await page
			.getByRole('option', { name: 'Ethereum' })
			.waitFor({ state: 'visible', timeout: 10_000 })
		await page
			.getByRole('option', { name: 'Ethereum' })
			.evaluate((el) => (el as HTMLElement).click())
		await page.keyboard.press('Escape')
		await page.getByLabel('To chain').focus()
		await page.getByLabel('To chain').press('ArrowDown')
		await page.getByRole('option').first().waitFor({ state: 'visible', timeout: 10_000 })
		await page.keyboard.press('ArrowDown')
		await page.keyboard.press('Enter')
		await expect(
			page.locator('[data-protocol="cctp"]'),
		).toContainText('CCTP')
		await page.getByRole('button', { name: 'Prefer LI.FI' }).click()
		await expect(
			page.locator('[data-protocol="lifi"]'),
		).toContainText('LI.FI')
		await page.getByRole('textbox', { name: 'Amount' }).fill('1')
		await page.getByRole('button', { name: 'Continue to LI.FI' }).click()
		await expect(page).toHaveURL(/\/bridge\/lifi/)
	})
})

test.describe('Unified Bridge routing (Spec 037)', () => {
	test('/bridge/lifi renders LI.FI bridge UI', async ({ page }) => {
		await page.goto('/bridge/lifi')
		await expect(page.locator('#main')).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.locator('#main')).toContainText(
			/USDC Bridge|Connect a wallet/,
		)
		await expect(page.getByLabel('From chain')).toBeAttached()
		await expect(page.getByLabel('To chain')).toBeAttached()
	})

	test('/bridge/cctp renders CCTP bridge UI', async ({ page }) => {
		await page.goto('/bridge/cctp')
		await expect(page.locator('#main')).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.locator('#main')).toContainText(
			/USDC Bridge \(CCTP\)|Connect a wallet/,
		)
		await expect(page.getByLabel('From chain')).toBeAttached()
		await expect(page.getByLabel('To chain')).toBeAttached()
	})

	test('/bridge renders unified bridge UI', async ({ page }) => {
		await page.goto('/bridge')
		await expect(page.locator('#main')).toBeAttached({
			timeout: 30_000,
		})
		await expect(
			page.getByRole('heading', { name: 'Protocol Selection' }),
		).toBeVisible()
	})
})
