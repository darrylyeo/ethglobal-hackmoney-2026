/**
 * Generates deno.test.importmap.json so Deno test can resolve Vite-style `?url` asset imports.
 * Run before `deno test` when using --import-map=deno.test.importmap.json.
 * Usage: deno run -A scripts/test/generate-importmap.ts
 */

const urlSpecifierRe = /\$\/assets\/[^'"]+\.svg\?url/g

async function* walk(dir: string): AsyncGenerator<string> {
	for await (const e of Deno.readDir(dir)) {
		const full = `${dir}/${e.name}`
		if (e.isDirectory && e.name !== 'node_modules' && e.name !== '.git') {
			yield* walk(full)
		} else if (e.isFile && (e.name.endsWith('.ts') || e.name.endsWith('.svelte'))) {
			yield full
		}
	}
}

const root = new URL('../..', import.meta.url).pathname.slice(0, -1)
const seen = new Set<string>()
for await (const file of walk(`${root}/src`)) {
	const text = await Deno.readTextFile(file)
	for (const m of text.matchAll(urlSpecifierRe)) {
		seen.add(m[0])
	}
}

const baseImports: Record<string, string> = {
	'$/': './src/',
	'@total-typescript/ts-reset': 'npm:@total-typescript/ts-reset',
	'bun:ffi': './shims/bun-ffi.js',
	clsx: 'npm:clsx',
	cookie: 'npm:cookie',
	'set-cookie-parser': 'npm:set-cookie-parser',
}
const imports: Record<string, string> = { ...baseImports }

const stub = './src/test-stubs/asset-url.ts'
for (const spec of [...seen].sort()) {
	const assetPath = spec.replace(/^\$\//, '').replace(/\.svg\?url$/, '.svg')
	imports[spec] = `${stub}?path=../${assetPath}`
}

await Deno.writeTextFile(
	`${root}/deno.test.importmap.json`,
	JSON.stringify({ imports }, null, 2) + '\n',
)
