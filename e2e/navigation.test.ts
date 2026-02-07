/**
 * E2E: Navigation links for new action types.
 * Verifies home page route cards and sidebar action links.
 */

import { expect, test } from '@playwright/test'

test.describe('Home page action links', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
		await expect(
			page.getByRole('heading', { name: 'USDC Tools', level: 1 }),
		).toBeVisible({ timeout: 20_000 })
	})

	for (const { name, href } of [
		{ name: 'Add Liquidity', href: '/session#addLiquidity' },
		{ name: 'Remove Liquidity', href: '/session#removeLiquidity' },
		{ name: 'Create Channel', href: '/session#createChannel' },
		{ name: 'Bridge', href: '/session#bridge' },
		{ name: 'Swap', href: '/session#swap' },
		{ name: 'Transfer', href: '/session#transfer' },
	]) {
		test(`home page has "${name}" link pointing to ${href}`, async ({
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
		'Create Channel',
		'Close Channel',
	]) {
		test(`sidebar contains "${title}" link`, async ({ page }) => {
			const link = page.getByRole('link', { name: title, exact: true }).first()
			await expect(link).toBeAttached()
		})
	}
})
