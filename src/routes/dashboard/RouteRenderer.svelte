<script lang="ts">
	// Types/constants
	import type { DashboardPanelRoute } from '$/data/DashboardPanel'
	import type { RouteEntry, RouteModule } from './route-map'

	// Context
	import { preloadData } from '$app/navigation'
	import { resolve } from '$app/paths'

	// Functions
	import { buildRoutePath } from './route-map'

	// Props
	let {
		route,
		entry,
	}: {
		route: DashboardPanelRoute
		entry: RouteEntry | null
	} = $props()

	// State
	let status = $state<'idle' | 'loading' | 'loaded' | 'error'>('idle')
	let error = $state<string | null>(null)
	let data = $state<Record<string, unknown> | null>(null)
	let component = $state<RouteModule['default'] | null>(null)
	let loadToken = 0

	$effect(() => {
		loadToken++
		const token = loadToken
		if (!entry) {
			status = 'error'
			error = 'Route module not found.'
			component = null
			data = null
			return
		}
		const href = resolve(buildRoutePath(route))
		status = 'loading'
		error = null
		component = null
		data = null
		void (async () => {
			try {
				const [module, result] = await Promise.all([
					entry.load(),
					preloadData(href),
				])
				if (loadToken !== token) return
				component = module.default
				if (result.type === 'loaded' && result.status === 200) {
					status = 'loaded'
					data = result.data
					return
				}
				status = 'error'
				error = result.type === 'redirect' ?
					`Redirected to ${result.location}`
				:
					`Route responded with status ${result.status}`
			} catch (e) {
				if (loadToken !== token) return
				status = 'error'
				error = e instanceof Error ? e.message : String(e)
			}
		})()
	})
</script>


{#if status === 'loading'}
	<p>Loading route data...</p>
{:else if status === 'error'}
	<p>{error ?? 'Route failed to load.'}</p>
{:else if component}
	{@const PanelRoute = component}
	<PanelRoute data={data ?? {}} />
{:else}
	<p>Select a route to render.</p>
{/if}
