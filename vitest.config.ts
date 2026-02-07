import { defineConfig } from 'vitest/config'
import { sveltekit } from '@sveltejs/kit/vite'

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: [
			'src/api/**/*.spec.ts',
			'src/constants/**/*.spec.ts',
			'src/lib/**/*.spec.ts',
			'src/lib/**/*.test.ts',
			'src/state/**/*.spec.ts',
		],
		exclude: [
			'**/voltaire.spec.ts',
			'**/txStatus.spec.ts',
			'**/identity-resolve.spec.ts',
		],
	},
})

