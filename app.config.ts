import {defineConfig} from '@solidjs/start/config'

export default defineConfig({
	// For now SSR has to be disabled because it causes effects to sometimes not
	// run, so the app doesn't work.
	ssr: false,

	solid: {
		babel: {
			plugins: [['@babel/plugin-proposal-decorators', {version: '2023-11'}]],
		},
	},
	vite: {
		build: {target: 'esnext'},
	},
	server: {
		prerender: {crawlLinks: true},
		esbuild: {options: {target: 'esnext'}},
	},
})
