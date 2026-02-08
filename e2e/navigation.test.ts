/**
 * E2E: Navigation links for new action types.
 * Verifies home page route cards and sidebar action links.
 */

import { expect, test } from './fixtures/profile.ts'

test.describe('Actions page action links', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/actions')
		await expect(
			page.getByRole('heading', { name: 'Actions', level: 1 }),
		).toBeVisible({ timeout: 20_000 })
	})

	for (const { name, href } of [
		{ name: 'Add Liquidity', href: '/session#/addLiquidity' },
		{ name: 'Remove Liquidity', href: '/session#/removeLiquidity' },
		{ name: 'Collect Fees', href: '/session#/collectFees' },
		{ name: 'Increase Liquidity', href: '/session#/increaseLiquidity' },
		{ name: 'Create Channel', href: '/session#/createChannel' },
		{ name: 'Share Address', href: '/session#/shareAddress' },
		{ name: 'Bridge', href: '/session#/Bridge' },
		{ name: 'Swap', href: '/session#/Swap' },
		{ name: 'Transfer', href: '/session#/Transfer' },
	]) {
		test(`actions page has "${name}" link pointing to ${href}`, async ({
			page,
		}) => {
			const link = page.getByRole('link', { name, exact: true }).first()
			await expect(link).toBeVisible()
			const linkHref = await link.getAttribute('href')
			expect(linkHref).toContain(href)
		})
	}
})

test.describe('Sidebar action links', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
		await expect(page.locator('nav').first()).toBeVisible({
			timeout: 20_000,
		})
	})

	for (const title of [
		'Transfer',
		'Swap',
		'Bridge',
		'Add Liquidity',
		'Remove Liquidity',
		'Collect Fees',
		'Increase Liquidity',
		'Create Channel',
		'Close Channel',
		'Share Address',
		'Propose Transfer',
		'Request Verification',
	]) {
		test(`sidebar contains "${title}" link`, async ({ page }) => {
			const link = page.getByRole('link', { name: title, exact: true }).first()
			await expect(link).toBeAttached()
		})
	}
})
