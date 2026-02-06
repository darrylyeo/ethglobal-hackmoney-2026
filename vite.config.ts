import devtoolsJson from 'vite-plugin-devtools-json'
import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { env } from 'node:process'

export default defineConfig(({ mode }) => ({
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
	preview: {
		port: 5000,
	},
	server: {
		...mode === 'development' && {
			allowedHosts: [
				'localhost',
				'127.0.0.1',
				'0.0.0.0',
				...(
					env.VITE_DEV_ALLOWED_HOSTS
						?.split(',')
						.map((h) => h.trim())
						.filter(Boolean)
					?? []
				),
			],
		},
	},
}))
