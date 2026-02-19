/**
 * E2E: Navigation links for new action types.
 * Verifies home page route cards and sidebar action links.
 */

import { expect, test, useProfileIsolation } from './fixtures/profile.ts'

test.describe('Actions page action links', () => {
	test.beforeEach(async ({ context, page }) => {
		await useProfileIsolation(context)
		await page.goto('/actions')
		await expect(
			page.getByRole('heading', { name: 'Actions', level: 1 }),
		).toBeVisible({ timeout: 20_000 })
	})

	for (const { name, href } of [
		{ name: 'Add Liquidity', href: '/session?template=AddLiquidity' },
		{ name: 'Bridge', href: '/session?template=Bridge' },
		{ name: 'Create Channel', href: '/session?template=CreateChannel' },
		{ name: 'Swap', href: '/session?template=Swap' },
		{ name: 'Transfer', href: '/session?template=Transfer' },
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
	test.beforeEach(async ({ context, page }) => {
		await useProfileIsolation(context)
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
		'Create Channel',
	]) {
		test(`sidebar contains "${title}" link`, async ({ page }) => {
			const link = page.getByRole('link', { name: title, exact: true }).first()
			await expect(link).toBeAttached()
		})
	}

	test('sidebar Farcaster link points to /farcaster', async ({ page }) => {
		const link = page.getByRole('link', { name: 'Farcaster', exact: true }).first()
		await expect(link).toBeAttached()
		expect(await link.getAttribute('href')).toContain('/farcaster')
	})
})
