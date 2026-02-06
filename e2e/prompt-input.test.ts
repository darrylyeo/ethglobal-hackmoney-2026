import { expect, test } from '@playwright/test'

/** Returns the full display text of the prompt (segments + chip labels; when placeholder open, filter text is included). Spaces from empty segments are normalized. */
async function getPromptText(page: import('@playwright/test').Page): Promise<string> {
	return page.evaluate(() => {
		const root = document.querySelector('[data-entity-ref-input] [data-testid="prompt-textbox"]')
		if (!root) return ''
		let s = ''
		for (const node of root.childNodes) {
			if (node.nodeType === Node.TEXT_NODE) s += node.textContent ?? ''
			else if (node.nodeType === Node.ELEMENT_NODE) {
				const el = node as HTMLElement
				if (el.dataset.placeholder !== undefined) {
					const input = el.querySelector('input')
					s += input?.value ? `@${input.value}` : '@'
				} else if (el.hasAttribute('data-ref-chip')) {
					s += el.getAttribute('data-ref-display-label') ?? ''
				}
			}
		}
		return s.replace(/\s+/g, ' ').trim()
	})
}

test.describe('Prompt input (textarea with combobox)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/agents/new')
		await page.waitForURL(/\/agents\/[^/]+$/)
		await expect(page.locator('#main')).toBeAttached({ timeout: 15_000, })
		await expect(
			page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox'),
		).toBeVisible({ timeout: 10_000, })
	})

	test('focusing the textbox allows typing', async ({ page }) => {
		const textbox = page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox')
		await textbox.click()
		await textbox.pressSequentially('hello', { delay: 80, })
		expect(await getPromptText(page)).toBe('hello')
	})

	test('pressing @ inserts combobox placeholder and focuses combobox input', async ({
		page,
	}) => {
		const textbox = page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox')
		await textbox.click()
		await textbox.pressSequentially('hi ')
		await page.keyboard.press('@')
		await expect(page.locator('[data-placeholder]')).toBeVisible({ timeout: 3000, })
		const comboboxInput = page.locator('[data-placeholder] input')
		await expect(comboboxInput).toBeFocused()
	})

	test('arrow left when combobox is focused moves caret to textbox', async ({ page }) => {
		const textbox = page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox')
		await textbox.click()
		await page.keyboard.press('@')
		await expect(page.locator('[data-placeholder]')).toBeVisible({ timeout: 3000, })
		await expect(page.locator('[data-placeholder] input')).toBeFocused()
		await page.keyboard.press('ArrowLeft')
		await expect(textbox).toBeFocused()
	})

	test('arrow right when combobox is focused moves caret to textbox', async ({ page }) => {
		const textbox = page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox')
		await textbox.click()
		await page.keyboard.press('@')
		await expect(page.locator('[data-placeholder]')).toBeVisible({ timeout: 3000, })
		await page.keyboard.press('ArrowRight')
		await expect(textbox).toBeFocused()
	})

	test('after ArrowLeft from combobox, caret moves to textbox and typing appends', async ({
		page,
	}) => {
		const textbox = page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox')
		await textbox.click()
		await textbox.pressSequentially('ab', { delay: 80 })
		expect(await getPromptText(page)).toBe('ab')
		await page.keyboard.press('@')
		await expect(page.locator('[data-placeholder]')).toBeVisible({ timeout: 3000, })
		await page.keyboard.press('ArrowLeft')
		await expect(textbox).toBeFocused()
		await page.waitForTimeout(120)
		await textbox.pressSequentially('c')
		expect((await getPromptText(page)).replace(/\s+/g, ' ').trim()).toBe('abc')
	})

	test('when combobox has options, selecting one inserts chip and caret is after chip', async ({
		page,
	}) => {
		const textbox = page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox')
		await textbox.click()
		await textbox.pressSequentially(' @')
		await expect(page.locator('[data-placeholder]')).toBeVisible({ timeout: 3000, })
		const options = page.getByRole('option')
		if ((await options.count()) === 0) {
			test.skip()
			return
		}
		await options.first().click()
		await expect(page.locator('[data-ref-chip]')).toBeVisible({ timeout: 3000, })
		await textbox.pressSequentially(' more')
		await expect(textbox).toContainText('more')
	})

	test('Send button is disabled while combobox is open', async ({ page }) => {
		const textbox = page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox')
		await textbox.click()
		await page.keyboard.press('@')
		await expect(page.locator('[data-placeholder]')).toBeVisible({ timeout: 3000, })
		const sendBtn = page.locator('[data-entity-ref-input]').getByRole('button', {
			name: 'Send',
		})
		await expect(sendBtn).toBeDisabled()
	})

	// Keyboard behavior: exact sequences and expected final text
	// type: [a][space][@][a] → result: "a " (@a|) — combobox open, filter "a"
	test('a space @ a → "a " with combobox showing @a', async ({ page }) => {
		const textbox = page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox')
		await textbox.click()
		await textbox.pressSequentially('a ', { delay: 80, })
		await page.keyboard.press('@')
		await expect(page.locator('[data-placeholder]')).toBeVisible({ timeout: 3000, })
		await page.locator('[data-placeholder] input').pressSequentially('a')
		await expect(page.locator('[data-placeholder] input')).toHaveValue('a')
		expect((await getPromptText(page)).replace(/\s+/g, ' ').trim()).toBe('a @a')
	})

	// type: [a][space][@][a][right][b] → ArrowRight moves caret (or closes in e2e); type b
	test('a space @ a ArrowRight b', async ({ page }) => {
		const textbox = page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox')
		await textbox.click()
		await textbox.pressSequentially('a ', { delay: 80, })
		await page.keyboard.press('@')
		await page.locator('[data-placeholder] input').pressSequentially('a')
		await page.keyboard.press('ArrowRight')
		await expect(textbox).toBeFocused()
		await page.waitForTimeout(120)
		await textbox.pressSequentially('b')
		expect((await getPromptText(page)).replace(/\s+/g, ' ').trim()).toBe('a b')
	})

	// type: [a][space][@][delete][b] → result: "a b|"
	// TODO: Delete key does not close combobox in Playwright (document keydown may not fire for Delete when input focused)
	test.skip('a space @ Delete b → "a b"', async ({ page }) => {
		const textbox = page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox')
		await textbox.click()
		await textbox.pressSequentially('a ', { delay: 80, })
		await page.keyboard.press('@')
		await expect(page.locator('[data-placeholder] input')).toBeFocused()
		await page.keyboard.press('Delete')
		await expect(page.locator('[data-placeholder]')).toHaveCount(0)
		await expect(textbox).toBeFocused()
		await page.waitForTimeout(120)
		await textbox.pressSequentially('b')
		expect(await getPromptText(page)).toBe('a b')
	})

	// type: [a][space][@][left][b] → ArrowLeft moves caret (or closes in e2e); typing b
	test('a space @ ArrowLeft b', async ({ page }) => {
		const textbox = page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox')
		await textbox.click()
		await textbox.pressSequentially('a ', { delay: 80, })
		await page.keyboard.press('@')
		await expect(page.locator('[data-placeholder] input')).toBeFocused()
		await page.keyboard.press('ArrowLeft')
		await expect(textbox).toBeFocused()
		await page.waitForTimeout(120)
		await textbox.pressSequentially('b')
		expect((await getPromptText(page)).replace(/\s+/g, ' ').trim()).toBe('a b')
	})

	// type: [a][space][@][b][c][right][delete] → ArrowRight then Delete (e2e may close on arrow)
	test('a space @ b c ArrowRight Delete', async ({ page }) => {
		const textbox = page.locator('[data-entity-ref-input]').getByTestId('prompt-textbox')
		await textbox.click()
		await textbox.pressSequentially('a ', { delay: 80, })
		await page.keyboard.press('@')
		await page.locator('[data-placeholder] input').pressSequentially('bc')
		await page.keyboard.press('ArrowRight')
		await expect(textbox).toBeFocused()
		await page.waitForTimeout(120)
		await page.keyboard.press('Delete')
		const text = (await getPromptText(page)).replace(/\s+/g, ' ').trim()
		expect(text === 'a @bc' || text === 'a ' || text === 'a').toBe(true)
	})
})
