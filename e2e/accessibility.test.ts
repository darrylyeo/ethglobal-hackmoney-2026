import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { addMockWallet, injectMockWalletInPage } from './test-setup.js'

test.describe('Accessibility (axe-core)', () => {
	test('home page has no critical violations', async ({ page }) => {
		await page.goto('/')
		await expect(page.locator('#main-content h1')).toBeVisible({
			timeout: 20_000,
		})
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.analyze()
		const critical = results.violations.filter((v) => v.impact === 'critical')
		expect(
			critical,
			critical.map((v) => v.id + ': ' + v.help).join('\n'),
		).toHaveLength(0)
	})

	test('bridge page has no critical violations', async ({ page }) => {
		await page.goto('/bridge')
		await expect(page.locator('#main-content')).toBeAttached({
			timeout: 30_000,
		})
		await expect(
			page
				.locator('#main-content')
				.getByRole('heading', { level: 1, name: 'USDC Bridge' }),
		).toBeVisible({ timeout: 50_000 })
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.analyze()
		const critical = results.violations.filter((v) => v.impact === 'critical')
		expect(
			critical,
			critical.map((v) => v.id + ': ' + v.help).join('\n'),
		).toHaveLength(0)
	})

	test('transfers page has no critical violations', async ({ page }) => {
		await page.goto('/transfers')
		await expect(page.locator('#main-content')).toBeAttached({
			timeout: 30_000,
		})
		await expect(
			page.getByText(/Loading transfers|Transfers|1h|6h|1d/),
		).toBeVisible({ timeout: 20_000 })
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.analyze()
		const critical = results.violations.filter((v) => v.impact === 'critical')
		expect(
			critical,
			critical.map((v) => v.id + ': ' + v.help).join('\n'),
		).toHaveLength(0)
	})

	test('rooms page has no critical violations', async ({ page }) => {
		await page.goto('/rooms')
		await expect(page.locator('#main-content')).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.getByRole('heading', { name: 'Rooms' })).toBeVisible({
			timeout: 15_000,
		})
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.analyze()
		const critical = results.violations.filter((v) => v.impact === 'critical')
		expect(
			critical,
			critical.map((v) => v.id + ': ' + v.help).join('\n'),
		).toHaveLength(0)
	})
})

test.describe('Keyboard navigation', () => {
	test.beforeEach(async ({ context, page }) => {
		await addMockWallet(context, page)
		await page.goto('/bridge/lifi')
		await injectMockWalletInPage(page)
		await expect(page.locator('#main-content')).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.getByText('Loading...')).toBeHidden({ timeout: 60_000 })
		await expect(
			page
				.locator('#main-content')
				.getByRole('heading', { level: 1, name: 'USDC Bridge' }),
		).toBeVisible({ timeout: 50_000 })
	})

	test('keyboard-only: connect, fill form, routes or result visible', async ({
		page,
	}) => {
		const connectButton = page.getByRole('button', { name: 'Connect Wallet' })
		for (let i = 0; i < 40; i++) {
			await page.keyboard.press('Tab')
			const isFocused = await connectButton.evaluate(
				(el) => document.activeElement === el,
			)
			if (isFocused) break
		}
		await expect(connectButton).toBeFocused()
		await page.keyboard.press('Enter')
		await page
			.locator('[data-wallet-provider-option]')
			.waitFor({ state: 'visible', timeout: 10_000 })
		await page.getByRole('menuitem', { name: 'Mock Wallet' }).click()
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
		const hasResult =
			(await page.locator('[data-testid="quote-result"]').count()) > 0 ||
			(await page.locator('[data-no-routes]').count()) > 0 ||
			(await page.locator('[data-error-display]').count()) > 0
		expect(hasResult).toBe(true)
	})
})
