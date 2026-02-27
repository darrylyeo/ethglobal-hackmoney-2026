/**
 * Standalone structural check for spec 053: manifest vs app routes and
 * branch-scenario parity. Run without Playwright: deno run -A e2e/coverage-structural-check.mjs
 */

import fs from 'node:fs'
import path from 'node:path'

const routesRoot = path.join(process.cwd(), 'src', 'routes')

const walk = (dir, files = []) => {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, entry.name)
		if (entry.isDirectory()) walk(p, files)
		else files.push(p)
	}
	return files
}

const routeFromFile = (filePath) => {
	const relative = path.relative(routesRoot, filePath).replace(/\\/g, '/')
	if (!relative.endsWith('+page.svelte')) return null
	if (relative === '+page.svelte') return '/'
	return '/' + relative.replace(/\/\+page\.svelte$/, '')
}

const listAppRoutes = () =>
	walk(routesRoot)
		.map(routeFromFile)
		.filter(Boolean)
		.sort()

const manifestPath = path.join(process.cwd(), 'e2e', 'support', 'coverage-manifest.ts')
const raw = fs.readFileSync(manifestPath, 'utf8')

const routeKeysMatch = raw.match(/routeBranchRequirements:\s*Record<string,\s*string\[\]>\s*=\s*\{([^}]+)\}/s)
const requirementsBlock = routeKeysMatch ? routeKeysMatch[1] : ''
const manifestRoutes = [...requirementsBlock.matchAll(/\s*'([^']+)':\s*\[/g)].map((m) => m[1])

const scenarioRouteBranch = [...raw.matchAll(/\broute:\s*'([^']+)'[\s\S]*?\bbranch:\s*'([^']+)'/g)].map((m) => ({
	route: m[1],
	branch: m[2],
}))

const scenarioMap = new Map()
for (const { route, branch } of scenarioRouteBranch) {
	const set = scenarioMap.get(route) ?? new Set()
	set.add(branch)
	scenarioMap.set(route, set)
}

const requiredBranches = new Map()
for (const line of requirementsBlock.split('\n')) {
	const routeMatch = line.match(/\s*'([^']+)':\s*\[([^\]]+)\]/)
	if (routeMatch) {
		const branches = routeMatch[2]
			.split(',')
			.map((s) => s.replace(/^[\s']+|[\s']+$/g, ''))
			.filter(Boolean)
		requiredBranches.set(routeMatch[1], branches)
	}
}

const appRoutes = new Set(listAppRoutes())
const manifestSet = new Set(manifestRoutes)

const missingInManifest = [...appRoutes].filter((r) => !manifestSet.has(r))
const unknownInManifest = [...manifestSet].filter((r) => !appRoutes.has(r))

let failed = false

if (missingInManifest.length) {
	console.error('Missing routes in manifest:', missingInManifest.join(', '))
	failed = true
}
if (unknownInManifest.length) {
	console.error('Unknown routes in manifest:', unknownInManifest.join(', '))
	failed = true
}

for (const [route, branches] of requiredBranches) {
	const scenarioBranches = scenarioMap.get(route) ?? new Set()
	const missing = branches.filter((b) => !scenarioBranches.has(b))
	const extra = [...scenarioBranches].filter((b) => !branches.includes(b))
	if (missing.length) {
		console.error(`Missing scenarios for ${route}: ${missing.join(', ')}`)
		failed = true
	}
	if (extra.length) {
		console.error(`Unexpected scenarios for ${route}: ${extra.join(', ')}`)
		failed = true
	}
}

if (failed) process.exit(1)
console.log('Coverage structural check passed: manifest matches routes, every branch has a scenario.')

if (process.env.COVERAGE_STRUCTURAL_SELF_TEST === '1') {
	const fakeUnknown = [...manifestSet, '/__fake_route__']
	const wouldFailUnknown = fakeUnknown.filter((r) => !appRoutes.has(r))
	if (!wouldFailUnknown.length) {
		console.error('Self-test failed: expected unknown route to be detected')
		process.exit(1)
	}
	console.log('Self-test passed: invalid manifest would be rejected.')
}
