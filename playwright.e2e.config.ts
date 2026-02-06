import { defineConfig } from '@playwright/test'

export default defineConfig({
	timeout: 60_000,
	testDir: 'e2e',
	testMatch: '**/*.test.ts',
	workers: 1,
	use: {
		baseURL: 'http://localhost:4173',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'on-first-retry',
	},
	webServer: {
		command: 'deno task build && deno task preview',
		env: {
			PUBLIC_TEVM_RPC_URL: 'http://127.0.0.1:8545',
		},
		url: 'http://localhost:4173/',
		timeout: 240_000,
		reuseExistingServer: true,
	},
})
