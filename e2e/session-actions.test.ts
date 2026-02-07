/**
 * E2E: Session page routes new action types to correct views.
 */

import { expect, test } from '@playwright/test'

const waitForMain = async (page: import('@playwright/test').Page) => {
	await expect(page.locator('#main').first()).toBeAttached({
		timeout: 15_000,
	})
}

test.describe('Session action routing', () => {
	test('session#createChannel renders Create Channel heading', async ({
		page,
	}) => {
		await page.goto('/session#createChannel')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { name: 'Create Channel', level: 1 }),
		).toBeVisible()
		await expect(
			page.getByText('Yellow Network channel action. Protocol: Yellow.'),
		).toBeVisible()
	})

	test('session#addChannelMember renders Add Channel Member heading', async ({
		page,
	}) => {
		await page.goto('/session#addChannelMember')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { name: 'Add Channel Member', level: 1 }),
		).toBeVisible()
		await expect(
			page.getByText('Yellow Network channel action. Protocol: Yellow.'),
		).toBeVisible()
	})

	test('session#closeChannel renders Close Channel heading', async ({
		page,
	}) => {
		await page.goto('/session#closeChannel')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { name: 'Close Channel', level: 1 }),
		).toBeVisible()
		await expect(
			page.getByText('Yellow Network channel action. Protocol: Yellow.'),
		).toBeVisible()
	})

	test('session#addLiquidity renders liquidity view', async ({ page }) => {
		await page.goto('/session#addLiquidity')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { level: 1 }).first(),
		).toBeVisible({ timeout: 20_000 })
	})

	test('session#removeLiquidity renders liquidity view', async ({ page }) => {
		await page.goto('/session#removeLiquidity')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { level: 1 }).first(),
		).toBeVisible({ timeout: 20_000 })
	})

	test('session with unsupported hash shows fallback', async ({ page }) => {
		await page.goto('/session#unknownAction')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { name: 'Session' }),
		).toBeVisible()
		await expect(
			page.getByText('Unsupported session action.'),
		).toBeVisible()
	})
})
