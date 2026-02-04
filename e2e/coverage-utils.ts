import fs from 'node:fs'
import path from 'node:path'

const routesRoot = path.join(process.cwd(), 'src', 'routes')

const walk = (dir: string, files: string[] = []) => {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const nextPath = path.join(dir, entry.name)
		if (entry.isDirectory()) {
			walk(nextPath, files)
		} else {
			files.push(nextPath)
		}
	}
	return files
}

const routeFromFile = (filePath: string) => {
	const relative = path.relative(routesRoot, filePath).replace(/\\/g, '/')
	if (!relative.endsWith('+page.svelte')) return null
	if (relative === '+page.svelte') return '/'
	const withoutSuffix = relative.replace(/\/\+page\.svelte$/, '')
	return `/${withoutSuffix}`
}

export const listAppRoutes = () => {
	const files = walk(routesRoot)
	return files
		.map(routeFromFile)
		.filter((route): route is string => Boolean(route))
		.sort()
}
