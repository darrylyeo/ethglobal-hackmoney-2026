/**
 * Route-level coverage: happy-path and error/empty per core route.
 * Spec 039: Each core route has at least one happy-path and one error or empty-state test.
 */

import { expect, test } from '@playwright/test'

test.describe('Home (/)', () => {
	test('renders nav and key CTAs without errors', async ({ page }) => {
		await page.goto('/')
		await expect(page.locator('#main-content h1')).toBeVisible({
			timeout: 20_000,
		})
		await expect(
			page.getByRole('heading', { name: 'USDC Tools' }),
		).toBeVisible()
		await expect(page.getByRole('link', { name: 'Bridge' })).toBeVisible()
		await expect(page.getByRole('link', { name: 'Transfers' })).toBeVisible()
		await expect(page.getByRole('link', { name: 'About' })).toBeVisible()
	})
})

test.describe('Bridge (/bridge)', () => {
	test('unified bridge renders with protocol selection', async ({ page }) => {
		await page.goto('/bridge')
		await expect(page.locator('#main-content')).toBeAttached({
			timeout: 30_000,
		})
		await expect(
			page.getByRole('heading', { name: 'USDC Bridge', level: 1 }),
		).toBeVisible({ timeout: 50_000 })
		await expect(
			page.getByRole('heading', { name: 'Protocol Selection' }),
		).toBeVisible()
		await expect(page.getByLabel('From chain')).toBeAttached()
		await expect(page.getByLabel('To chain')).toBeAttached()
	})

	test('without wallet shows connect prompt', async ({ page }) => {
		await page.goto('/bridge')
		await expect(page.locator('#main-content')).toBeAttached({
			timeout: 30_000,
		})
		await expect(
			page.getByRole('button', { name: 'Connect Wallet' }),
		).toBeVisible({
			timeout: 15_000,
		})
	})
})

test.describe('Transfers (/transfers)', () => {
	test('transfers page renders with period selector and content area', async ({
		page,
	}) => {
		await page.goto('/transfers')
		await expect(page.locator('#main-content')).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
			timeout: 15_000,
		})
		await expect(
			page.getByText(/1h|6h|12h|1d|3d|7d|Transfers|Loading/),
		).toBeVisible({ timeout: 20_000 })
	})

	test('empty or loading state shows without crashing', async ({ page }) => {
		await page.goto('/transfers')
		await expect(page.locator('#main-content')).toBeAttached({
			timeout: 30_000,
		})
		await Promise.race([
			page.locator('[data-transfers-loading], [data-transfers-error]').waitFor({
				state: 'visible',
				timeout: 15_000,
			}),
			page
				.getByText(/1h|6h|12h|1d|3d|7d/)
				.waitFor({ state: 'visible', timeout: 15_000 }),
		])
	})
})

test.describe('Rooms (/rooms)', () => {
	test('rooms page renders create and join sections', async ({ page }) => {
		await page.goto('/rooms')
		await expect(page.locator('#main-content')).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.getByRole('heading', { name: 'Rooms' })).toBeVisible({
			timeout: 15_000,
		})
		await expect(
			page.getByRole('heading', { name: 'Create room' }),
		).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Join room' })).toBeVisible()
		await expect(
			page.getByRole('button', { name: /Create room/ }),
		).toBeVisible()
	})

	test('join room form accepts code input', async ({ page }) => {
		await page.goto('/rooms')
		await expect(page.locator('#main-content')).toBeAttached({
			timeout: 30_000,
		})
		const codeInput = page.getByLabel('Room code')
		await codeInput.fill('ABC123')
		await expect(codeInput).toHaveValue('ABC123')
	})
})
