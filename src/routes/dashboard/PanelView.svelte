<script lang="ts">
	// Types/constants
	import type { DashboardPanelNode, DashboardPanelRoute } from '$/data/DashboardPanel'

	// Functions
	import { buildRoutePath, routeEntries } from './route-map'

	// Components
	import RouteRenderer from './RouteRenderer.svelte'

	// Props
	let {
		panel,
		isFocused,
		onFocus,
		onSplit,
		onRemove,
		onSwap,
		onUpdateRoute,
		onAppendHash,
	}: {
		panel: DashboardPanelNode
		isFocused: boolean
		onFocus: (panelId: string) => void
		onSplit: (panelId: string, direction: 'horizontal' | 'vertical') => void
		onRemove: (panelId: string) => void
		onSwap: (panelId: string) => void
		onUpdateRoute: (panelId: string, route: DashboardPanelRoute) => void
		onAppendHash: (panelId: string, hash: string) => void
	} = $props()

	// (Derived)
	const routeEntry = $derived(
		routeEntries.find((entry) => entry.path === panel.route.path) ?? null,
	)
	const paramKeys = $derived(routeEntry?.paramKeys ?? [])
	const resolvedPath = $derived(buildRoutePath(panel.route))

	// State
	let hashInput = $state('')

	// Actions
	const updateParam = (key: string, value: string) => (
		onUpdateRoute(panel.id, {
			path: panel.route.path,
			params: {
				...panel.route.params,
				[key]: value,
			},
		})
	)

	const setRoutePath = (path: string) => (
		onUpdateRoute(panel.id, {
			path,
			params: {},
		})
	)

	const addHash = () => (
		hashInput.trim().length === 0 ?
			undefined
		:
			(() => {
				const normalized =
					hashInput.startsWith('#') ? hashInput : `#${hashInput}`
				onAppendHash(panel.id, normalized)
				hashInput = ''
			})()
	)
</script>


<section data-panel data-focused={isFocused}>
	<header data-panel-header>
		<div data-panel-title>
			<strong>Panel</strong>
			<span>{resolvedPath}</span>
		</div>
		<div data-panel-controls>
			<button
				type="button"
				aria-pressed={isFocused}
				onclick={() => onFocus(panel.id)}
			>
				Focus
			</button>
			<button type="button" onclick={() => onSplit(panel.id, 'horizontal')}>
				Split H
			</button>
			<button type="button" onclick={() => onSplit(panel.id, 'vertical')}>
				Split V
			</button>
			<button type="button" onclick={() => onSwap(panel.id)}>
				Swap
			</button>
			<button type="button" onclick={() => onRemove(panel.id)}>
				Remove
			</button>
		</div>
	</header>

	<section data-panel-config>
		<label>
			<span>Route</span>
			<select
				value={panel.route.path}
				onchange={(event) => {
					const target = event.currentTarget
					if (!(target instanceof HTMLSelectElement)) return
					setRoutePath(target.value)
				}}
			>
				{#each routeEntries as entry (entry.path)}
					<option value={entry.path}>{entry.path}</option>
				{/each}
			</select>
		</label>

		{#if paramKeys.length > 0}
			<div data-panel-params>
				{#each paramKeys as key (key)}
					<label>
						<span>{key}</span>
						<input
							type="text"
							value={panel.route.params[key] ?? ''}
							oninput={(event) => {
								const target = event.currentTarget
								if (!(target instanceof HTMLInputElement)) return
								updateParam(key, target.value)
							}}
						/>
					</label>
				{/each}
			</div>
		{/if}

		<form
			data-panel-hash
			onsubmit={(event) => {
				event.preventDefault()
				addHash()
			}}
		>
			<label>
				<span>Hash</span>
				<input
					type="text"
					placeholder="#section"
					bind:value={hashInput}
				/>
			</label>
			<button type="submit">Add</button>
		</form>
	</section>

	<section data-panel-body>
		<RouteRenderer route={panel.route} entry={routeEntry} />
	</section>

	{#if panel.hashHistory.length > 0}
		<footer data-panel-history>
			<span>History</span>
			<ul>
				{#each panel.hashHistory as hash, index (index)}
					<li>{index + 1}. {hash}</li>
				{/each}
			</ul>
		</footer>
	{/if}
</section>


<style>
	section[data-panel] {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		border: 1px solid color-mix(in oklab, currentColor 20%, transparent);
		background: color-mix(in oklab, currentColor 4%, transparent);
		min-height: 100%;
	}

	section[data-panel][data-focused='true'] {
		border-color: color-mix(in oklab, currentColor 45%, transparent);
		box-shadow: 0 0 0 2px color-mix(in oklab, currentColor 15%, transparent);
	}

	header[data-panel-header] {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	div[data-panel-title] {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: baseline;
		flex-wrap: wrap;
	}

	div[data-panel-controls] {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	section[data-panel-config] {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	section[data-panel-config] > label,
	section[data-panel-config] label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	div[data-panel-params] {
		display: grid;
		gap: 0.5rem;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	}

	form[data-panel-hash] {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: flex-end;
	}

	section[data-panel-body] {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-height: 220px;
	}

	footer[data-panel-history] {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
	}

	footer[data-panel-history] ul {
		margin: 0;
		padding-left: 1.25rem;
	}
</style>
