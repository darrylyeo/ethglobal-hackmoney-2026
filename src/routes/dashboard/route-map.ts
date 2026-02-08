export type RoutePathInput = {
	path: string
	params: Record<string, string>
}

export type RouteModule = {
	default: typeof import('svelte').SvelteComponent
}

type RouteSegment =
	| { type: 'static'; value: string }
	| { type: 'param'; name: string }
	| { type: 'rest'; name: string }

export type RouteEntry = {
	path: string
	load: () => Promise<RouteModule>
	segments: RouteSegment[]
	paramKeys: string[]
}

const routeImports = import.meta.glob<RouteModule>(
	'/src/routes/**/+page.svelte',
)

const toRoutePath = (filePath: string) =>
	filePath.replace('/src/routes', '').replace('/+page.svelte', '') || '/'

const toSegments = (routePath: string) =>
	routePath === '/'
		? []
		: routePath
				.split('/')
				.filter(Boolean)
				.map((segment) => {
					const match = /^\[(\.\.\.)?(.+)\]$/.exec(segment)
					return match
						? match[1]
							? { type: 'rest', name: match[2] }
							: { type: 'param', name: match[2] }
						: { type: 'static', value: segment }
				})

const allRouteEntries: RouteEntry[] = Object.entries(routeImports).map(
	([filePath, load]) => {
		const path = toRoutePath(filePath)
		const segments = toSegments(path)
		return {
			path,
			load,
			segments,
			paramKeys: segments.flatMap((segment) =>
				segment.type === 'static' ? [] : [segment.name],
			),
		}
	},
)

export const routeEntries: RouteEntry[] = allRouteEntries

export const defaultRoutePath = '/dashboard'

export const routeEntriesForPanel: RouteEntry[] = allRouteEntries.filter(
	(entry) => entry.path !== '/',
)

export const buildRoutePath = (route: RoutePathInput) =>
	route.path === '/'
		? '/'
		: '/' +
			toSegments(route.path)
				.map((segment) =>
					segment.type === 'static'
						? segment.value
						: (route.params[segment.name] ?? ''),
				)
				.join('/')
				.replace(/\/+$/, '')

export const matchRoutePath = (path: string) => {
	const normalized = path === '/' ? [] : path.split('/').filter(Boolean)
	return routeEntries
		.map((entry) => {
			const params: Record<string, string> = {}
			const isMatch = entry.segments.every((segment, index) => {
				const part = normalized[index]
				if (segment.type === 'static') return segment.value === part
				if (segment.type === 'param') {
					if (!part) return false
					params[segment.name] = part
					return true
				}
				const rest = normalized.slice(index)
				if (rest.length === 0) return false
				params[segment.name] = rest.join('/')
				return true
			})
			return isMatch &&
				(normalized.length === entry.segments.length ||
					entry.segments.some((segment) => segment.type === 'rest'))
				? { entry, params }
				: null
		})
		.find((entry) => entry !== null)
}

export const parsePanelHref = (href: string, origin: string) =>
	(() => {
		try {
			return new URL(href, origin)
		} catch {
			return null
		}
	})()

export const toPanelNavigation = (href: string, origin: string) =>
	(() => {
		const url = parsePanelHref(href, origin)
		if (!url || url.origin !== origin) return null
		if (url.pathname === '/' || url.pathname === '') return null
		const match = matchRoutePath(url.pathname)
		return match
			? {
					route: {
						path: match.entry.path,
						params: match.params,
					},
					hash: url.hash.length > 0 ? url.hash : null,
				}
			: null
	})()

