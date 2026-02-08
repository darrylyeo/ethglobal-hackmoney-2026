import adapter from '@sveltejs/adapter-static'
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
		prerender: {
			entries: ['*'],
		},

		alias: {
			'$': './src',
		},

		experimental: {
			remoteFunctions: true,
		},
	},
}
