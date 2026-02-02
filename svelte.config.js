import adapter from '@sveltejs/adapter-auto'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
export default {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess({
		script: true,
	}),

	vitePlugin: {
		inspector: {
			toggleKeyCombo: 'shift-i',
		},
	},

	compilerOptions: {
		experimental: {
			async: true,
		},
	},


	kit: {
		adapter: adapter(),

		alias: {
			'$': './src',
		},

		experimental: {
			remoteFunctions: true,
		},
	},
}
