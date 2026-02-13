/**
 * E2E: Session page routes new action types to correct views.
 */

import { expect, test } from './fixtures/profile.ts'

const waitForMain = async (page: import('@playwright/test').Page) => {
	await expect(page.locator('#main').first()).toBeAttached({
		timeout: 15_000,
	})
}

test.describe('Session action routing', () => {
	test('session#createChannel renders Create Channel heading', async ({
		page,
	}) => {
		await page.goto('/session?template=createChannel')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { name: 'Create Channel', level: 1 }),
		).toBeVisible()
		await expect(page.getByText('channel action')).toBeVisible()
	})

	test('session#addChannelMember renders Add Member heading', async ({
		page,
	}) => {
		await page.goto('/session?template=addChannelMember')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { name: 'Add Member', level: 1 }),
		).toBeVisible()
		await expect(page.getByText('channel action')).toBeVisible()
	})

	test('session#closeChannel renders Close Channel heading', async ({
		page,
	}) => {
		await page.goto('/session?template=closeChannel')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { name: 'Close Channel', level: 1 }),
		).toBeVisible()
		await expect(page.getByText('channel action')).toBeVisible()
	})

	test('session#addLiquidity renders liquidity view', async ({ page }) => {
		await page.goto('/session?template=addLiquidity')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { level: 1 }).first(),
		).toBeVisible({ timeout: 20_000 })
	})

	test('session#removeLiquidity renders liquidity view', async ({ page }) => {
		await page.goto('/session?template=removeLiquidity')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { level: 1 }).first(),
		).toBeVisible({ timeout: 20_000 })
	})

	test('session#collectFees renders liquidity view', async ({ page }) => {
		await page.goto('/session?template=collectFees')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { level: 1 }).first(),
		).toBeVisible({ timeout: 20_000 })
	})

	test('session#increaseLiquidity renders liquidity view', async ({ page }) => {
		await page.goto('/session?template=increaseLiquidity')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { level: 1 }).first(),
		).toBeVisible({ timeout: 20_000 })
	})

	test('session#shareAddress renders Share Address heading', async ({
		page,
	}) => {
		await page.goto('/session?template=shareAddress')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { name: 'Share Address', level: 1 }),
		).toBeVisible()
		await expect(page.getByText('room action')).toBeVisible()
	})

	test('session#proposeTransfer renders Propose Transfer heading', async ({
		page,
	}) => {
		await page.goto('/session?template=proposeTransfer')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { name: 'Propose Transfer', level: 1 }),
		).toBeVisible()
		await expect(page.getByText('room action')).toBeVisible()
	})

	test('session#requestVerification renders Request Verification heading', async ({
		page,
	}) => {
		await page.goto('/session?template=requestVerification')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { name: 'Request Verification', level: 1 }),
		).toBeVisible()
		await expect(page.getByText('room action')).toBeVisible()
	})

	test('compound hash routes to session with multiple actions', async ({
		page,
	}) => {
		await page.goto(
			'/session?actions=createChannel%3A%7B%22actor%22%3A%7B%7D%7D%7CaddChannelMember%3A%7B%22actor%22%3A%7B%7D%7D',
		)
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { level: 1 }).first(),
		).toBeVisible({ timeout: 20_000 })
	})

	test('session with unsupported template shows default Swap fallback', async ({
		page,
	}) => {
		await page.goto('/session?template=unknownAction')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { name: 'Swap', level: 1 }),
		).toBeVisible()
	})
})
