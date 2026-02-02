import { expect, test } from '@playwright/test'

const MOBILE = { width: 375, height: 667 }
const DESKTOP = { width: 1280, height: 800 }

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
	{ path: '/bridge/lifi', name: 'bridge' },
	{ path: '/transfers', name: 'transfers' },
	{ path: '/rooms', name: 'rooms' },
] as const

for (const { path, name } of CORE_ROUTES) {
	test(`responsive: ${name} mobile (${MOBILE.width}px) – no overflow, text readable`, async ({
		page,
	}) => {
		await page.setViewportSize(MOBILE)
		await page.goto(path)
		await expect(page.locator('#main-content')).toBeAttached({
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
		await expect(page.locator('#main-content')).toBeAttached({
			timeout: 15_000,
		})
		await assertNoHorizontalOverflow(page)
		await assertTextReadable(page)
	})
}
