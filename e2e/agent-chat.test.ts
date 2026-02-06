import { expect, test } from '@playwright/test'

const MOCK_LLM_RESPONSE = 'E2E mock response.'

function addMockLlmRoute(
	page: import('@playwright/test').Page,
	body: { text?: string } = { text: MOCK_LLM_RESPONSE },
) {
	return page.route('**/api-proxy/**', (route) => {
		const url = route.request().url()
		if (
			route.request().method() === 'POST' &&
			(url.includes('opencode') || url.includes('zen'))
		) {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					choices: [
						{
							message: {
								content: body.text ?? MOCK_LLM_RESPONSE,
							},
						},
					],
				}),
			})
			return
		}
		route.continue()
	})
}

test.describe('Agent chat', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/agents/new')
		await page.waitForURL(/\/agents\/[^/]+$/)
		await expect(page.locator('#main')).toBeAttached({ timeout: 15_000 })
		await expect(
			page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox'),
		).toBeVisible({ timeout: 10_000 })
	})

	test('new conversation shows prompt input and Send', async ({ page }) => {
		await expect(
			page.locator('[data-entity-ref-input]').getByRole('button', { name: 'Send' }),
		).toBeVisible()
		await expect(page.getByPlaceholder(/Untitled|conversation/)).toBeAttached()
	})

	// Requires PUBLIC_OPENCODE_API_KEY set at build (can be placeholder "e2e"); we mock the proxy so no real key is used.
	test('typing and sending shows generating then mock response', async ({
		page,
	}) => {
		await addMockLlmRoute(page)
		const textbox = page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox')
		await textbox.click()
		await textbox.pressSequentially('What is 2+2?', { delay: 50 })
		await page.locator('[data-entity-ref-input]').getByRole('button', { name: 'Send', }).click()
		await expect(
			page.locator('[data-status="generating"]').or(page.getByText(MOCK_LLM_RESPONSE)),
		).toBeVisible({ timeout: 8000 })
		await expect(page.getByText(MOCK_LLM_RESPONSE)).toBeVisible({ timeout: 15_000 })
	})

	test('after send, assistant response is in a turn card', async ({ page }) => {
		await addMockLlmRoute(page)
		const textbox = page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox')
		await textbox.click()
		await textbox.pressSequentially('Hello', { delay: 50 })
		await page.locator('[data-entity-ref-input]').getByRole('button', { name: 'Send', }).click()
		await expect(page.getByText(MOCK_LLM_RESPONSE)).toBeVisible({ timeout: 15_000 })
		await expect(page.locator('.turn-card')).toBeAttached()
	})
})
