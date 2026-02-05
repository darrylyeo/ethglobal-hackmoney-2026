<script lang="ts">
	// Types/constants
	import type {
		DashboardPanelNode,
		DashboardPanelRoute,
	} from '$/data/DashboardPanel'

	// Functions
	import { routeEntries, toPanelNavigation } from './route-map'

	// Components
	import SvelteKitRoute from './SvelteKitRoute.svelte'

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
		onSetPanelHash,
		onNavigate,
		onOpenInNewPanel,
	}: {
		panel: DashboardPanelNode
		isFocused: boolean
		onFocus: (panelId: string) => void
		onSplit: (panelId: string, direction: 'horizontal' | 'vertical') => void
		onRemove: (panelId: string) => void
		onSwap: (panelId: string) => void
		onUpdateRoute: (panelId: string, route: DashboardPanelRoute) => void
		onAppendHash: (panelId: string, hash: string) => void
		onSetPanelHash: (panelId: string, hash: string, replace?: boolean) => void
		onNavigate: (
			panelId: string,
			route: DashboardPanelRoute,
			hash: string | null,
		) => void
		onOpenInNewPanel: (
			panelId: string,
			route: DashboardPanelRoute,
			hash: string | null,
		) => void
	} = $props()

	// (Derived)
	const routeEntry = $derived(
		routeEntries.find((entry) => entry.path === panel.route.path) ?? null,
	)
	const paramKeys = $derived(routeEntry?.paramKeys ?? [])
	const routeKey = $derived(
		panel.route.path + '\0' + JSON.stringify(panel.route.params),
	)
	const panelHash = $derived(panel.hashHistory.at(-1) ?? null)
	const setPanelHash = (hash: string, replace = true) =>
		onSetPanelHash(panel.id, hash, replace)

	// State
	let hashInput = $state('')

	// Actions
	const updateParam = (key: string, value: string) =>
		onUpdateRoute(panel.id, {
			path: panel.route.path,
			params: {
				...panel.route.params,
				[key]: value,
			},
		})

	const setRoutePath = (path: string) =>
		onUpdateRoute(panel.id, {
			path,
			params: {},
		})

	const commitHash = () =>
		hashInput.trim().length === 0
			? undefined
			: (() => {
					const normalized = hashInput.startsWith('#')
						? hashInput
						: `#${hashInput}`
					onAppendHash(panel.id, normalized)
					hashInput = ''
				})()

	const handlePanelClick = (event: MouseEvent) =>
		event.defaultPrevented || event.button !== 0
			? undefined
			: (() => {
					const target = event.target
					if (!(target instanceof Element)) return
					const link = target.closest('a')
					if (!(link instanceof HTMLAnchorElement)) return
					if (link.target === '_blank' || link.hasAttribute('download')) return
					const navigation = toPanelNavigation(link.href, location.origin)
					if (!navigation) return
					event.preventDefault()
					const action =
						event.metaKey || event.ctrlKey ? onOpenInNewPanel : onNavigate
					action(panel.id, navigation.route, navigation.hash)
				})()
</script>

<section
	class="dashboard-panel"
	data-focused={isFocused}
	role="group"
	aria-label="Panel"
	onpointerdown={() => onFocus(panel.id)}
	onfocusin={() => onFocus(panel.id)}
>
	<header class="dashboard-panel-header">
		<div class="dashboard-panel-title">
			<select
				class="dashboard-panel-route"
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

			{#if paramKeys.length > 0}
				{#each paramKeys as key (key)}
					<input
						type="text"
						placeholder={key}
						value={panel.route.params[key] ?? ''}
						oninput={(event) => {
							const target = event.currentTarget
							if (!(target instanceof HTMLInputElement)) return
							updateParam(key, target.value)
						}}
					/>
				{/each}
			{/if}

			<input
				type="text"
				class="dashboard-panel-hash"
				placeholder="#hash"
				bind:value={hashInput}
				onchange={commitHash}
				onblur={commitHash}
			/>
		</div>
		<div class="dashboard-panel-controls">
			<button type="button" onclick={() => onSplit(panel.id, 'horizontal')}>
				Split →
			</button>
			<button type="button" onclick={() => onSplit(panel.id, 'vertical')}>
				Split ↓
			</button>
			<button type="button" onclick={() => onSwap(panel.id)}>Swap ↔</button>
			<button type="button" onclick={() => onRemove(panel.id)}>Close</button>
		</div>
	</header>

	<section
		class="dashboard-panel-body"
		data-scroll-container="block"
		data-sticky-container
		role="presentation"
		tabindex="-1"
		onclick={handlePanelClick}
		onkeydown={() => undefined}
	>
		<section data-scroll-item class="dashboard-panel-route-body">
			{#key routeKey}
				<SvelteKitRoute
					route={panel.route}
					entry={routeEntry}
					extraData={{
						embeddedInPanel: true,
						panelHash: panelHash ?? null,
						setPanelHash,
					}}
				/>
			{/key}
		</section>
	</section>

	{#if panel.hashHistory.length > 0}
		<footer class="dashboard-panel-history">
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
	.dashboard-panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid color-mix(in oklab, currentColor 18%, transparent);
		background: color-mix(in oklab, currentColor 3%, transparent);
		contain: layout paint;
		height: 100%;
		min-height: 0;

		&[data-focused='true'] {
			border-color: color-mix(in oklab, currentColor 45%, transparent);
			box-shadow: 0 0 0 1px color-mix(in oklab, currentColor 22%, transparent);
		}
	}

	.dashboard-panel-header {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.dashboard-panel-title {
		display: flex;
		gap: 0.35rem;
		align-items: center;
		flex-wrap: wrap;
		flex: 1;
		min-width: 0;
	}

	.dashboard-panel-title > select.dashboard-panel-route {
		min-width: 6rem;
	}

	.dashboard-panel-title > input.dashboard-panel-hash {
		min-width: 5rem;
	}

	.dashboard-panel-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.dashboard-panel-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1 1 0;
		min-height: 0;
	}

	.dashboard-panel-route-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-height: 0;
	}

	.dashboard-panel-history {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
	}

	.dashboard-panel-history ul {
		margin: 0;
		padding-left: 1.25rem;
	}
</style>
