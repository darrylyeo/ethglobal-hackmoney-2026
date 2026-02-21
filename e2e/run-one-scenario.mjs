/**
 * Run a single coverage scenario without the Playwright test runner.
 * Use when test runner fails (e.g. suite-is-null). Server must be running:
 *   deno task build && deno task preview
 * Then: deno task test:e2e:one-scenario [path]
 * Default path: /settings/profiles
 */

import { chromium } from 'npm:playwright'

const BASE_URL = (typeof Deno !== 'undefined' ? Deno.env.get('BASE_URL') : process?.env?.BASE_URL) ?? 'http://localhost:4173'
const E2E_PROFILE_ID = 'e2e-test-profile'

const profileInitScript = (profileId) => {
	const meta = {
		version: 1,
		activeProfileId: profileId,
		profiles: [{
			id: profileId,
			name: 'E2E Test',
			emoji: '🧪',
			createdAt: Date.now(),
			updatedAt: Date.now(),
		}],
	}
	localStorage.setItem('blockhead.v1:profiles', JSON.stringify(meta))
}

async function runSettingsProfiles(page) {
	await page.goto(`${BASE_URL}/settings/profiles`, { waitUntil: 'domcontentloaded', timeout: 15_000 })
	await page.getByText(/Loading\.\.\.|Loading…|Redirecting/).waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => {})
	await page.locator('#main, main').first().waitFor({ state: 'visible', timeout: 15_000 })
	await page.getByRole('heading', { name: 'Profiles', level: 1 }).waitFor({ state: 'visible', timeout: 15_000 })
	await page.getByRole('button', { name: '+ New Profile' }).waitFor({ state: 'visible', timeout: 15_000 })
}

const scenarios = {
	'/settings/profiles': runSettingsProfiles,
}

function exit(code) {
	if (typeof Deno !== 'undefined') Deno.exit(code)
	else process.exit(code)
}

async function main() {
	const path = (typeof Deno !== 'undefined' ? Deno.args[0] : process?.argv?.[2]) ?? '/settings/profiles'
	const run = scenarios[path]
	if (!run) {
		console.error('Unknown scenario path:', path)
		console.error('Available:', Object.keys(scenarios).join(', '))
		exit(1)
	}
	const browser = await chromium.launch()
	try {
		const context = await browser.newContext()
		await context.addInitScript(profileInitScript, E2E_PROFILE_ID)
		const page = await context.newPage()
		await run(page)
		console.log('Scenario passed:', path)
		exit(0)
	} catch (err) {
		console.error('Scenario failed:', err.message)
		exit(1)
	} finally {
		await browser.close()
	}
}

main()
