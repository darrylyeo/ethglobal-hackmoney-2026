/**
 * E2E: Farcaster routes, nav, and core functionality.
 * Hits live Farcaster Client API and Hub (Pinata/Standard Crypto).
 */

import { expect, test } from './fixtures/profile.ts'

test.describe('Farcaster', () => {
	test('nav has Farcaster link', async ({ page }) => {
		await page.goto('/')
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 30_000 })
		await expect(page.locator('nav').first()).toBeVisible({ timeout: 20_000 })
		const farcasterLink = page.getByRole('link', { name: 'Farcaster', exact: true })
		await expect(farcasterLink.first()).toBeAttached()
	})

	test('/farcaster index shows heading and channels or loading', async ({ page }) => {
		await page.goto('/farcaster')
		await expect(page).toHaveURL(/\/farcaster/)
		await expect(page.getByRole('heading', { name: 'Farcaster' })).toBeVisible({ timeout: 10_000 })
		await expect(page.locator('.farcaster-page')).toBeVisible()
		await expect(
			page.getByText(/Channels|Loading channels/).first(),
		).toBeVisible({ timeout: 30_000 })
	})

	test('/farcaster index has channel links or empty state when loaded', async ({ page }) => {
		await page.goto('/farcaster')
		await expect(page.locator('.farcaster-page')).toBeVisible({ timeout: 10_000 })
		await expect(
			page.getByText(/Channels|Loading channels/).first(),
		).toBeVisible({ timeout: 30_000 })
		await expect(
			page.locator('a[href^="/farcaster/channel/"]').or(page.getByText(/Channels \(\d+\)/)).first(),
		).toBeVisible({ timeout: 45_000 })
	})

	test('/farcaster/channel/[channelId] loads channel page', async ({ page }) => {
		await page.goto('/farcaster/channel/farcaster')
		await expect(page).toHaveURL(/\/farcaster\/channel\/farcaster/)
		await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 })
		await expect(
			page.locator('main').getByText(/farcaster|Loading channel|Channel not found/).first(),
		).toBeVisible({ timeout: 30_000 })
	})

	test('/farcaster/channel shows casts or load more when loaded', async ({
		page,
	}) => {
		await page.goto('/farcaster/channel/farcaster')
		await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 })
		await expect(
			page.getByText(/Casts|Loading cast|Load more casts/).first(),
		).toBeVisible({ timeout: 45_000 })
	})

	test('/farcaster/user/[fid] loads user profile', async ({ page }) => {
		await page.goto('/farcaster/user/3')
		await expect(page).toHaveURL(/\/farcaster\/user\/3/)
		await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 })
		await expect(
			page.getByText(/@|User 3|Casts|Loading/).first(),
		).toBeVisible({ timeout: 30_000 })
	})

	test('/farcaster/user shows casts section', async ({ page }) => {
		await page.goto('/farcaster/user/3')
		await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 })
		await expect(
			page.getByText(/Casts|Load more casts|Loading cast/).first(),
		).toBeVisible({ timeout: 45_000 })
	})

	test('/farcaster/cast/[fid]/[hash] loads or shows not found', async ({
		page,
	}) => {
		await page.goto('/farcaster/cast/3/0x0000000000000000000000000000000000000000000000000000000000000000')
		await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 })
		await expect(
			page.getByText(/Loading cast|Cast not found|Replies|ago/).first(),
		).toBeVisible({ timeout: 30_000 })
	})

	test('navigating from Farcaster to channel works', async ({ page }) => {
		await page.goto('/farcaster')
		await expect(page.locator('.farcaster-page')).toBeVisible({ timeout: 10_000 })
		const channelLink = page.locator('a[href^="/farcaster/channel/"]').first()
		const hasChannelLink = await channelLink.isVisible().catch(() => false)
		if (hasChannelLink) {
			await channelLink.click()
			await expect(page).toHaveURL(/\/farcaster\/channel\//)
		} else {
			await page.goto('/farcaster/channel/farcaster')
			await expect(page).toHaveURL(/\/farcaster\/channel\/farcaster/)
		}
		await expect(page.locator('main').first()).toBeVisible()
	})

	test('/farcaster/session?template=CreatePost shows create post form', async ({
		page,
	}) => {
		await page.goto('/farcaster/session?template=CreatePost')
		await expect(page).toHaveURL(/\/farcaster\/session/)
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 45_000 })
		await expect(page.getByPlaceholder('Create post')).toBeVisible({
			timeout: 15_000,
		})
	})

	test('/farcaster/session?template=ReplyToPost shows reply to post form', async ({
		page,
	}) => {
		await page.goto('/farcaster/session?template=ReplyToPost')
		await expect(page).toHaveURL(/\/farcaster\/session/)
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 45_000 })
		await expect(page.getByPlaceholder('Reply to post')).toBeVisible({
			timeout: 15_000,
		})
	})
})
