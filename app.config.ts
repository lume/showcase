import {defineConfig} from '@solidjs/start/config'

export default defineConfig({
	vite: {
		// Ensure output code is as close to hand-written as possible
		build: {target: 'esnext'},
	},
	server: {
		// Enable SSG for all routes
		prerender: {crawlLinks: true},
		// Ensure output code is as close to hand-written as possible
		esbuild: {options: {target: 'esnext'}},
	},
})
