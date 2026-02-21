<script lang="ts">
	// Types/constants
	import {
		dashboardsCollection,
		ensureDefaultRow,
	} from '$/collections/Dashboards.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Context
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'


	// Context
	const defaultRowQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardsCollection })
				.where(({ row }) => eq(row.$id.id, '__default__'))
				.select(({ row }) =>
					'defaultDashboardId' in row ?
						{ defaultDashboardId: row.defaultDashboardId }
					: { defaultDashboardId: undefined as string | undefined },
				),
		[],
	)


	// (Derived)
	const defaultDashboardId = $derived(
		defaultRowQuery.data?.[0]?.defaultDashboardId ?? 'default',
	)


	// Actions
	$effect(() => {
		ensureDefaultRow()
		goto(resolve(`/dashboard/${defaultDashboardId}`), { replaceState: true })
	})
</script>


<main data-sticky-container>
	<p>Redirecting to dashboard…</p>
</main>
