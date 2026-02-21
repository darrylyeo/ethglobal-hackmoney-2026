/**
 * E2E profile isolation fixture.
 * The context fixture is overridden to inject a dedicated test profile init script
 * so wallet connections and other profile-scoped localStorage don't pollute real profiles.
 *
 * Every test file should import { test, expect } from this module
 * (or from a fixture that extends it, e.g. tevm.ts).
 */

import { test as base, expect } from '@playwright/test'

export const E2E_PROFILE_ID = 'e2e-test-profile'

const profileInitScript = (profileId: string) => {
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

export const test = base.extend<object>({
	context: async ({ context }, use) => {
		await context.addInitScript(profileInitScript, E2E_PROFILE_ID)
		await use(context)
	},
})
export { expect }
