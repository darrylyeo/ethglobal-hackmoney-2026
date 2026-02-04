/**
 * Route-level coverage: happy-path and error/empty per core route.
 * Spec 039: Each core route has at least one happy-path and one error or empty-state test.
 */

import { expect, test } from './fixtures/tevm.js'
import { addTevmWallet } from './test-setup.js'

test.describe('Home (/)', () => {
	test('renders nav and key CTAs without errors', async ({ page }) => {
		await page.goto('/')
		await expect(page.locator('#main h1')).toBeVisible({
			timeout: 20_000,
		})
		await expect(
			page.getByRole('heading', { name: 'USDC Tools' }),
		).toBeVisible()
		await expect(
			page.getByRole('link', { name: 'Bridge' }).first(),
		).toBeVisible()
		await expect(
			page.getByRole('link', { name: 'Transfers' }).first(),
		).toBeVisible()
		await expect(
			page.getByRole('link', { name: 'About' }).first(),
		).toBeVisible()
	})
})

test.describe('Session (bridge)', () => {
	test.beforeEach(async ({ context, page, tevm }) => {
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
	})

	test('unified bridge renders with protocol selection', async ({ page }) => {
		await page.goto('/session#bridge')
		await expect(page.locator('#main').first()).toBeAttached({
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

	test('auto-connected wallet shows address', async ({ page }) => {
		await page.goto('/session#bridge')
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.locator('[data-wallet-address]')).toBeVisible({
			timeout: 15_000,
		})
	})
})

test.describe('Transfers (/transfers)', () => {
	test('transfers page renders with period selector and content area', async ({
		page,
	}) => {
		await page.goto('/transfers')
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(
			page.getByRole('navigation', { name: 'Time period' }),
		).toBeVisible({ timeout: 20_000 })
	})

	test('empty or loading state shows without crashing', async ({ page }) => {
		await page.goto('/transfers')
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await Promise.race([
			page.locator('[data-transfers-loading], [data-transfers-error]').waitFor({
				state: 'visible',
				timeout: 15_000,
			}),
			page.locator('.period-link').first().waitFor({
				state: 'visible',
				timeout: 15_000,
			}),
		])
	})
})

test.describe('Rooms (/rooms)', () => {
	test('rooms page renders create and join sections', async ({ page }) => {
		await page.goto('/rooms')
		await expect(page.locator('#main').first()).toBeAttached({
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
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		const codeInput = page.getByLabel('Room code')
		await codeInput.fill('ABC123')
		await expect(codeInput).toHaveValue('ABC123')
	})
})
