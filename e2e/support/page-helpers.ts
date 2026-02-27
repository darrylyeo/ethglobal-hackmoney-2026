/**
 * E2E page interaction helpers: wallet connect, chain/protocol selectors.
 */

export const ensureWalletConnected = async (
	page: import('@playwright/test').Page,
) => {
	const walletAddress = page.locator('[data-wallet-address]')
	if (await walletAddress.count()) {
		if (await walletAddress.first().isVisible()) return
	}
	const connectTrigger = page.locator('[data-wallet-connect-trigger]')
	if (await connectTrigger.count()) {
		await connectTrigger.click()
		const providerOption = page.locator('[data-wallet-provider-option]').first()
		await providerOption.waitFor({ state: 'visible', timeout: 15_000 })
		await providerOption.click()
	}
	await walletAddress.waitFor({ state: 'visible', timeout: 20_000 })
}

export const selectChainOption = async (
	page: import('@playwright/test').Page,
	label: string,
	optionName: string | RegExp,
) => {
	const trigger = page.getByLabel(label)
	await trigger.scrollIntoViewIfNeeded()
	await trigger.click()
	const option = page.getByRole('option', { name: optionName }).first()
	await option.waitFor({ state: 'visible', timeout: 15_000 })
	await option.evaluate((el) => (el as HTMLElement).click())
	await page.keyboard.press('Escape')
}

export const selectProtocolOption = async (
	page: import('@playwright/test').Page,
	label: 'CCTP' | 'Circle CCTP' | 'LI.FI' | 'Gateway' | 'Circle Gateway',
) => {
	const option = page
		.getByRole('button', { name: new RegExp(`^${label}`) })
		.first()
	await option.waitFor({ state: 'visible', timeout: 15_000 })
	await option.scrollIntoViewIfNeeded()
	await option.click()
}
