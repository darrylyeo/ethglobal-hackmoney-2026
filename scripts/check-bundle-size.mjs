import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const clientDir = '.svelte-kit/output/client'
const maxGzipBytes = 700 * 1024

function walk(dir, acc = []) {
	for (const name of fs.readdirSync(dir)) {
		const full = path.join(dir, name)
		if (fs.statSync(full).isDirectory()) walk(full, acc)
		else acc.push(full)
	}
	return acc
}

if (!fs.existsSync(clientDir)) {
	console.error('Run pnpm build first')
	process.exit(1)
}

const files = walk(clientDir)
let total = 0
for (const f of files) {
	const buf = fs.readFileSync(f)
	total += zlib.gzipSync(buf, { level: 9 }).length
}

const kb = (total / 1024).toFixed(1)
if (total > maxGzipBytes) {
	console.error(`Bundle gzip size ${kb}KB exceeds ${maxGzipBytes / 1024}KB`)
	process.exit(1)
}
console.log(`Bundle gzip size: ${kb}KB`)
