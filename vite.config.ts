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
			'@antv/g6',
			'@antv/layout',
			'@antv/util',
			'@antv/g-math',
			'sigma',
			'sigma/rendering',
			'@sigma/node-image',
			'@sigma/edge-curve',
			'graphology-layout-forceatlas2',
			'graphology-layout-forceatlas2/worker',
		],
	},
	ssr: {
		noExternal: [
			/^@antv\//
		],
	},
	preview: {
		port: 4173,
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
