<script lang="ts">


	// State
	import {
		createDashboard,
		dashboardPanelsCollection,
		deleteDashboard,
		renameDashboard,
		setDefaultDashboardId,
	} from '$/collections/dashboard-panels.ts'
	import { eq, not, useLiveQuery } from '@tanstack/svelte-db'
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'


	// (Derived)
	const dashboardsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardPanelsCollection })
				.where(({ row }) => not(eq(row.$id.id, '__default__')))
				.select(({ row }) => ({
					id: row.$id.id,
					name: 'name' in row ? row.name : undefined,
				})),
		[],
	)
	const defaultRowQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: dashboardPanelsCollection })
				.where(({ row }) => eq(row.$id.id, '__default__'))
				.select(({ row }) =>
					'defaultDashboardId' in row
						? { defaultDashboardId: row.defaultDashboardId }
						: { defaultDashboardId: undefined as string | undefined },
				),
		[],
	)
	const dashboards = $derived(dashboardsQuery.data ?? [])
	const defaultId = $derived(
		defaultRowQuery.data?.[0]?.defaultDashboardId ?? 'default',
	)


	// State
	let renameId = $state<string | null>(null)
	let renameValue = $state('')


	// Actions
	const handleCreate = () => {
		const id = createDashboard()
		goto(resolve(`/dashboard?d=${id}`))
	}

	const handleSetDefault = (id: string) => setDefaultDashboardId(id)

	const handleDelete = (id: string) => deleteDashboard(id)

	const startRename = (id: string, currentName?: string) => (
		(renameId = id),
		(renameValue = currentName ?? '')
	)

	const commitRename = () => {
		if (renameId == null) return
		renameDashboard(renameId, renameValue.trim() || 'Unnamed')
		renameId = null
	}

	const displayName = (d: { id: string, name?: string }) =>
		d.name ?? (d.id === 'default' ? 'My Dashboard' : 'Unnamed')
</script>


<svelte:head>
	<title>Dashboards</title>
</svelte:head>


<main
	class="dashboards"
	id="main"
	data-sticky-container
	data-column
>
	<header data-row="gap-2 wrap">
		<h1>Dashboards</h1>
		<button type="button" onclick={handleCreate}>New dashboard</button>
		<a href={resolve('/dashboard')}>Open default</a>
	</header>

	<ul data-column="gap-2">
		{#each dashboards as dashboard (dashboard.id)}
			<li
				data-row="gap-2 wrap"
				class="dashboard-row"
			>
				{#if renameId === dashboard.id}
					<form
						data-row="gap-2"
						class="dashboard-rename-form"
						onsubmit={(e) => (e.preventDefault(), commitRename())}
					>
						<input
							type="text"
							class="dashboard-rename-input"
							bind:value={renameValue}
							onkeydown={(e) => e.key === 'Escape' && (renameId = null)}
							aria-label="Dashboard name"
						/>
						<button type="submit">Save</button>
						<button
							type="button"
							onclick={() => (renameId = null)}
						>
							Cancel
						</button>
					</form>
				{:else}
					<a
						href={resolve(`/dashboard?d=${dashboard.id}`)}
						class="dashboard-name-link"
					>
						{displayName(dashboard)}
					</a>
					{#if dashboard.id === defaultId}
						<span aria-hidden="true">★ default</span>
					{/if}
					<button
						type="button"
						class="dashboard-edit-name"
						onclick={(e) => (e.preventDefault(), e.stopPropagation(), startRename(dashboard.id, dashboard.name))}
						aria-label="Edit name"
					>
						Edit name
					</button>
					{#if dashboard.id !== defaultId}
						<button
							type="button"
							onclick={() => handleSetDefault(dashboard.id)}
						>
							Set default
						</button>
					{/if}
					<button
						type="button"
						disabled={dashboards.length <= 1}
						onclick={() => handleDelete(dashboard.id)}
						title={dashboards.length <= 1 ? 'At least one dashboard required' : 'Delete'}
					>
						Delete
					</button>
				{/if}
			</li>
		{/each}
	</ul>
</main>


<style>
	.dashboards {
		padding: 1rem;
	}

	.dashboard-row {
		list-style: none;
		padding: 0.5rem;
		border-radius: 0.35rem;
		border: 1px solid color-mix(in oklab, currentColor 20%, transparent);
		background: color-mix(in oklab, currentColor 4%, transparent);
	}

	.dashboard-rename-form {
		flex: 1 1 auto;
		min-width: 0;
	}

	.dashboard-rename-input {
		min-width: 10rem;
	}
</style>
