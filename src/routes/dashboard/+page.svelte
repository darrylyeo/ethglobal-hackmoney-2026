<script lang="ts">
	// State
	import {
		dashboardsCollection,
		ensureDefaultRow,
	} from '$/collections/Dashboards.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'


	// (Derived)
	const defaultRowQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardsCollection })
				.where(({ row }) => eq(row.$id.id, '__default__'))
				.select(({ row }) =>
					'defaultDashboardId' in row
						? { defaultDashboardId: row.defaultDashboardId }
						: { defaultDashboardId: undefined as string | undefined },
				),
		[],
	)
	const defaultId = $derived(
		defaultRowQuery.data?.[0]?.defaultDashboardId ?? 'default',
	)


	// Actions
	$effect(() => {
		ensureDefaultRow()
		goto(resolve(`/dashboard/${defaultId}`), { replaceState: true })
	})
</script>


<main data-sticky-container>
	<p>Redirecting to dashboard…</p>
</main>
