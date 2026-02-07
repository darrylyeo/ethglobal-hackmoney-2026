<script lang="ts">


	// Types/constants
	import type { RouteEntry, RoutePathInput } from './route-map.ts'


	// Context
	import { preloadData } from '$app/navigation'
	import { resolve } from '$app/paths'


	// Functions
	import { buildRoutePath } from './route-map.ts'


	// Components
	import Boundary from '$/components/Boundary.svelte'


	// Props
	let {
		route,
		entry,
		extraData = {},
	}: {
		route: RoutePathInput
		entry: RouteEntry | null
		extraData?: Record<string, unknown>,
	} = $props()


	// (Derived)
	const routeKey = $derived(route.path + '\0' + JSON.stringify(route.params))
	const loadPromise = $derived.by(() => {
		if (!entry) return Promise.reject(new Error('Route module not found.'))
		const [path, paramsStr] = routeKey.split('\0')
		return Promise.all([
			entry.load(),
			preloadData(
				resolve(
					buildRoutePath({
						path,
						params: JSON.parse(paramsStr ?? '{}') as Record<string, string>,
					}),
				),
			),
		]).then(
			([module, result]) => (
				result.type === 'loaded' && result.status === 200
					? { default: module.default, data: result.data }
					: Promise.reject(
							new Error(
								result.type === 'redirect'
									? `Redirected to ${result.location}`
									: `Route responded with status ${result.status}`,
							),
						)
			),
		)
	})
</script>


<Boundary>
	{#key routeKey}
		{@const {data, default: Page} = await loadPromise}

		<Page data={{ ...data, ...extraData }} />
	{/key}

	{#snippet Pending()}
		<p>Loading route data...</p>
	{/snippet}

	{#snippet Failed(error, retry)}
		<p>{error instanceof Error ? error.message : String(error)}</p>
		<button type="button" onclick={retry}>Retry</button>
	{/snippet}
</Boundary>
