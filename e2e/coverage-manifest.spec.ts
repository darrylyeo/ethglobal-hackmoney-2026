/**
 * Spec 053: structural enforcement for E2E coverage manifest.
 * Runs with Deno (no Node subprocess). In isolation: deno test --allow-read e2e/coverage-manifest.spec.ts
 */

import { assertEquals } from 'jsr:@std/assert'

const routesRoot = `${Deno.cwd()}/src/routes`

async function walk(dir: string, files: string[] = []): Promise<string[]> {
	for await (const entry of Deno.readDir(dir)) {
		const next = `${dir}/${entry.name}`
		if (entry.isDirectory) {
			await walk(next, files)
		} else {
			files.push(next)
		}
	}
	return files
}

function routeFromFile(filePath: string): string | null {
	const relative = filePath.slice(routesRoot.length).replace(/\\/g, '/')
	if (!relative.endsWith('+page.svelte')) return null
	if (relative === '/+page.svelte') return '/'
	return relative.replace(/\/\+page\.svelte$/, '')
}

async function listAppRoutes(): Promise<string[]> {
	const files = await walk(routesRoot)
	return files
		.map(routeFromFile)
		.filter((r): r is string => Boolean(r))
		.sort()
}

const raw = await Deno.readTextFile(`${Deno.cwd()}/e2e/support/coverage-manifest.ts`)

const routeKeysMatch = raw.match(
	/routeBranchRequirements:\s*Record<string,\s*string\[\]>\s*=\s*\{([^}]+)\}/s,
)
const requirementsBlock = routeKeysMatch ? routeKeysMatch[1] : ''
const manifestRoutes = [...requirementsBlock.matchAll(/\s*'([^']+)':\s*\[/g)].map(
	(m) => m[1],
)

const scenarioRouteBranch = [
	...raw.matchAll(/\broute:\s*'([^']+)'[\s\S]*?\bbranch:\s*'([^']+)'/g),
].map((m) => ({ route: m[1], branch: m[2] }))

const scenarioMap = new Map<string, Set<string>>()
for (const { route, branch } of scenarioRouteBranch) {
	const set = scenarioMap.get(route) ?? new Set<string>()
	set.add(branch)
	scenarioMap.set(route, set)
}

const requiredBranches = new Map<string, string[]>()
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

Deno.test('coverage structural check passes', async () => {
	const appRoutes = new Set(await listAppRoutes())
	const manifestSet = new Set(manifestRoutes)

	const missingInManifest = [...appRoutes].filter((r) => !manifestSet.has(r))
	const unknownInManifest = [...manifestSet].filter((r) => !appRoutes.has(r))

	assertEquals(
		missingInManifest,
		[],
		`Missing routes in manifest: ${missingInManifest.join(', ')}`,
	)
	assertEquals(
		unknownInManifest,
		[],
		`Unknown routes in manifest: ${unknownInManifest.join(', ')}`,
	)

	for (const [route, branches] of requiredBranches) {
		const scenarioBranches = scenarioMap.get(route) ?? new Set<string>()
		const missing = branches.filter((b) => !scenarioBranches.has(b))
		const extra = [...scenarioBranches].filter((b) => !branches.includes(b))
		assertEquals(
			missing,
			[],
			`Missing scenarios for ${route}: ${missing.join(', ')}`,
		)
		assertEquals(
			extra,
			[],
			`Unexpected scenarios for ${route}: ${extra.join(', ')}`,
		)
	}
})
