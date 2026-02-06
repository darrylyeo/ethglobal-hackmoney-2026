import { expect, test } from '@playwright/test'
import {
	coverageScenarios,
	routeBranchRequirements,
} from './coverage-manifest.ts'
import { listAppRoutes } from './coverage-utils.ts'

test('coverage manifest matches app routes', () => {
	const appRoutes = new Set(listAppRoutes())
	const manifestRoutes = new Set(Object.keys(routeBranchRequirements))

	const missingInManifest = [...appRoutes].filter(
		(route) => !manifestRoutes.has(route),
	)
	const unknownInManifest = [...manifestRoutes].filter(
		(route) => !appRoutes.has(route),
	)

	expect(
		missingInManifest,
		`Missing routes: ${missingInManifest.join(', ')}`,
	).toEqual([])
	expect(
		unknownInManifest,
		`Unknown routes: ${unknownInManifest.join(', ')}`,
	).toEqual([])
})

test('coverage manifest has scenarios for every branch', () => {
	const scenarioMap = new Map<string, Set<string>>()
	for (const scenario of coverageScenarios) {
		const existing = scenarioMap.get(scenario.route) ?? new Set<string>()
		existing.add(scenario.branch)
		scenarioMap.set(scenario.route, existing)
	}

	for (const [route, branches] of Object.entries(routeBranchRequirements)) {
		const scenarioBranches = scenarioMap.get(route) ?? new Set<string>()
		const missing = branches.filter((branch) => !scenarioBranches.has(branch))
		const extra = [...scenarioBranches].filter(
			(branch) => !branches.includes(branch),
		)

		expect(
			missing,
			`Missing branches for ${route}: ${missing.join(', ')}`,
		).toEqual([])
		expect(
			extra,
			`Unexpected branches for ${route}: ${extra.join(', ')}`,
		).toEqual([])
	}
})

for (const scenario of coverageScenarios) {
	test(`${scenario.route} :: ${scenario.branch}`, async ({ context, page }) => {
		if (scenario.setup) {
			await scenario.setup(context, page)
		}
		await page.goto(scenario.path)
		await scenario.assert(page)
	})
}
