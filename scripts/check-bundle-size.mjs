import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const clientDir = path.join(process.cwd(), '.svelte-kit/output/client')
const manifestPath = path.join(clientDir, '.vite/manifest.json')
const maxGzipBytes = 700 * 1024

function collectInitialPaths(manifest, pathByBasename, pathToEntry) {
	const appEntry = Object.values(manifest).find((e) =>
		e.file?.startsWith('_app/immutable/entry/'),
	)
	const node0 = Object.values(manifest).find((e) => e.name === 'nodes/0')
	const node2 = Object.values(manifest).find((e) => e.name === 'nodes/2')
	const startPaths = [appEntry, node0, node2]
		.filter(Boolean)
		.map((e) => path.join(clientDir, e.file))

	const resolve = (imp) =>
		pathByBasename[imp.replace(/^_/, '')] ?? pathByBasename[imp]
	const collected = new Set()
	const queue = [...startPaths]
	while (queue.length) {
		const p = queue.shift()
		if (collected.has(p)) continue
		collected.add(p)
		const entry = pathToEntry[p]
		if (entry?.imports) {
			for (const imp of entry.imports) {
				const resolved = resolve(imp)
				if (resolved) queue.push(resolved)
			}
		}
	}
	if (appEntry?.css) {
		for (const c of appEntry.css) {
			collected.add(path.join(clientDir, c))
		}
	}
	if (node0?.css) {
		for (const c of node0.css) {
			collected.add(path.join(clientDir, c))
		}
	}
	if (node2?.css) {
		for (const c of node2.css) {
			collected.add(path.join(clientDir, c))
		}
	}
	return collected
}

if (!fs.existsSync(clientDir)) {
	console.error('Run deno task build first')
	process.exit(1)
}

let paths
if (fs.existsSync(manifestPath)) {
	const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
	const pathByBasename = {}
	const pathToEntry = {}
	for (const entry of Object.values(manifest)) {
		if (!entry.file) continue
		const full = path.join(clientDir, entry.file)
		pathByBasename[path.basename(entry.file)] = full
		pathToEntry[full] = entry
	}
	for (const entry of Object.values(manifest)) {
		if (entry.css) {
			for (const c of entry.css) {
				const full = path.join(clientDir, c)
				pathByBasename[path.basename(c)] = full
			}
		}
	}
	paths = collectInitialPaths(manifest, pathByBasename, pathToEntry)
} else {
	const walk = (dir, acc = []) => {
		for (const name of fs.readdirSync(dir)) {
			const full = path.join(dir, name)
			if (fs.statSync(full).isDirectory()) walk(full, acc)
			else acc.push(full)
		}
		return acc
	}
	paths = new Set(walk(clientDir))
}

let total = 0
for (const f of paths) {
	if (!fs.existsSync(f)) continue
	const buf = fs.readFileSync(f)
	total += zlib.gzipSync(buf, { level: 9 }).length
}

const kb = (total / 1024).toFixed(1)
if (total > maxGzipBytes) {
	console.error(
		`Initial load gzip size ${kb}KB exceeds ${maxGzipBytes / 1024}KB`,
	)
	process.exit(1)
}
console.log(`Initial load gzip size: ${kb}KB`)
