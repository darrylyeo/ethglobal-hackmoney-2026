import { defineConfig } from '@playwright/test'

export default defineConfig({
	timeout: 60_000,
	testDir: 'e2e',
	testMatch: '**/*.test.ts',
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'on-first-retry',
		actionTimeout: 15_000,
	},
	webServer: {
		command: 'pnpm run build:vite && pnpm run preview:vite',
		url: 'http://localhost:4173/',
		timeout: 300_000,
		reuseExistingServer: true,
	},
	reporter: [['html', { open: 'never', }], ['list'],],
	fullyParallel: true,
	expect: { timeout: 10_000, },
})
