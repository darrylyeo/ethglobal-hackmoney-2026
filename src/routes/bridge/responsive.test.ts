import { expect, test } from '@playwright/test'

const VIEWPORTS = [
	{ name: 'iPhone SE', width: 375, height: 667 },
	{ name: 'iPhone 14 Pro Max', width: 430, height: 932 },
	{ name: 'iPad', width: 768, height: 1024 },
	{ name: 'desktop', width: 1280, height: 800 },
] as const

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
	const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
	const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
	expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
}

async function assertTextReadable(page: import('@playwright/test').Page) {
	const bodyFontSizePx = await page.evaluate(() => {
		const style = window.getComputedStyle(document.body)
		return parseFloat(style.fontSize)
	})
	expect(bodyFontSizePx).toBeGreaterThanOrEqual(14)
}

for (const { name, width, height } of VIEWPORTS) {
	test(`${name} (${width}px): bridge page works, no overflow, text readable`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height })
		await page.goto('/bridge')
		await expect(page.locator('#main-content')).toBeAttached({ timeout: 15_000 })
		await assertNoHorizontalOverflow(page)
		await assertTextReadable(page)
	})
}
