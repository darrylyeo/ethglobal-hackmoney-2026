import devtoolsJson from 'vite-plugin-devtools-json'
import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'

export default defineConfig({
	plugins: [
		sveltekit(),
		devtoolsJson(),
	],
	optimizeDeps: {
		include: [
			'sigma',
			'sigma/rendering',
			'@sigma/node-image',
			'@sigma/edge-curve',
			'graphology-layout-forceatlas2',
			'graphology-layout-forceatlas2/worker',
		],
	},
	preview: { port: 4173 },
})
