import { expect, test } from './fixtures/tevm.ts'

const MOBILE = { width: 375, height: 667, }
const DESKTOP = { width: 1280, height: 800, }

async function assertNoHorizontalOverflow(
	page: import('@playwright/test').Page,
) {
	const scrollWidth = await page.evaluate(
		() => document.documentElement.scrollWidth,
	)
	const clientWidth = await page.evaluate(
		() => document.documentElement.clientWidth,
	)
	expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
}

async function assertTextReadable(page: import('@playwright/test').Page) {
	const bodyFontSizePx = await page.evaluate(() => {
		const style = window.getComputedStyle(document.body)
		return parseFloat(style.fontSize)
	})
	expect(bodyFontSizePx).toBeGreaterThanOrEqual(14)
}

const CORE_ROUTES = [
	{ path: '/', name: 'home' },
	{ path: '/session?template=Bridge', name: 'bridge' },
	{ path: '/coin/USDC', name: 'usdc' },
	{ path: '/rooms', name: 'rooms' },
	{ path: '/rooms/e2e0001', name: 'rooms-room' },
] as const

for (const { path, name } of CORE_ROUTES) {
	test(`responsive: ${name} mobile (${MOBILE.width}px) – no overflow, text readable`, async ({
		page,
	}) => {
		await page.setViewportSize(MOBILE)
		await page.goto(path)
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 30_000 })
		await expect(page.locator('#main, main').first()).toBeVisible({
			timeout: 15_000,
		})
		await assertNoHorizontalOverflow(page)
		await assertTextReadable(page)
	})
	test(`responsive: ${name} desktop (${DESKTOP.width}px) – no overflow, text readable`, async ({
		page,
	}) => {
		await page.setViewportSize(DESKTOP)
		await page.goto(path)
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 30_000 })
		await expect(page.locator('#main, main').first()).toBeVisible({
			timeout: 15_000,
		})
		await assertNoHorizontalOverflow(page)
		await assertTextReadable(page)
	})
}
