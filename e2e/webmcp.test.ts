/**
 * Spec 108 optional AC: when Chrome has WebMCP flag (or polyfill), app registers
 * tools and they are listable. Verifies registration via window.__webmcpToolCount
 * set by register.ts after provideContext.
 */

import { expect, test } from './fixtures/profile.ts'

test.describe('WebMCP tool registration', () => {
	test('when navigator.modelContext is available, tools are registered and listable', async ({
		page,
	}) => {
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		const result = await page.evaluate(() => {
			const nav = navigator as Navigator & { modelContext?: unknown }
			const hasMc = 'modelContext' in nav && nav.modelContext != null
			const count = (window as unknown as { __webmcpToolCount?: number }).__webmcpToolCount
			return { hasModelContext: hasMc, toolCount: count }
		})
		if (result.hasModelContext) {
			expect(typeof result.toolCount).toBe('number')
			expect(result.toolCount).toBeGreaterThan(0)
		}
	})
})
