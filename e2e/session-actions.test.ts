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

	test('session#collectFees renders liquidity view', async ({ page }) => {
		await page.goto('/session#collectFees')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { level: 1 }).first(),
		).toBeVisible({ timeout: 20_000 })
	})

	test('session#increaseLiquidity renders liquidity view', async ({ page }) => {
		await page.goto('/session#increaseLiquidity')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { level: 1 }).first(),
		).toBeVisible({ timeout: 20_000 })
	})

	test('session#shareAddress renders Share Address heading', async ({
		page,
	}) => {
		await page.goto('/session#shareAddress')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { name: 'Share Address', level: 1 }),
		).toBeVisible()
		await expect(
			page.getByText('Room action. Protocol: PartyKit.'),
		).toBeVisible()
	})

	test('session#proposeTransfer renders Propose Transfer heading', async ({
		page,
	}) => {
		await page.goto('/session#proposeTransfer')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { name: 'Propose Transfer', level: 1 }),
		).toBeVisible()
		await expect(
			page.getByText('Room action. Protocol: PartyKit.'),
		).toBeVisible()
	})

	test('session#requestVerification renders Request Verification heading', async ({
		page,
	}) => {
		await page.goto('/session#requestVerification')
		await waitForMain(page)
		await expect(
			page.getByRole('heading', { name: 'Request Verification', level: 1 }),
		).toBeVisible()
		await expect(
			page.getByText('Room action. Protocol: PartyKit.'),
		).toBeVisible()
	})

	test('compound hash routes to session with multiple actions', async ({
		page,
	}) => {
		await page.goto(
			'/session#createChannel:%7B%22actor%22%3A%7B%7D%7D|addChannelMember:%7B%22actor%22%3A%7B%7D%7D',
		)
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
