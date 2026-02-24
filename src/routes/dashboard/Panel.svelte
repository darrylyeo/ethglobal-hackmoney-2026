<script lang="ts">
	// Types/constants
	import type {
		DashboardPanelNode,
		DashboardPanelRoute,
		DashboardSplitNode,
	} from '$/data/DashboardPanel.ts'
	import { SplitDirection } from '$/data/PanelTree.ts'

	// Props
	let {
		panel,
		isFocused,
		excludeRoutePaths = [],
		onFocus,
		onSplit,
		onRemove,
		onSwap,
		onUpdateRoute,
		onAppendHash,
		onSetPanelHash,
		onNavigate,
		onOpenInNewPanel,
		parent,
		indexInParent,
	}: {
		panel: DashboardPanelNode,
		isFocused: boolean,
		excludeRoutePaths?: string[],
		onFocus: (panelId: string) => void,
		onSplit: (panelId: string, direction: SplitDirection) => void,
		onRemove: (panelId: string) => void,
		onSwap: (panelId: string) => void,
		onUpdateRoute: (panelId: string, route: DashboardPanelRoute) => void,
		onAppendHash: (panelId: string, hash: string) => void,
		onSetPanelHash: (panelId: string, hash: string, replace?: boolean) => void,
		onNavigate: (
			panelId: string,
			route: DashboardPanelRoute,
			hash: string | null,
		) => void,
		onOpenInNewPanel: (
			panelId: string,
			route: DashboardPanelRoute,
			hash: string | null,
		) => void,
		parent?: DashboardSplitNode,
		indexInParent?: 0 | 1,
	} = $props()

	// (Derived)
	const routeEntry = $derived(
		routeEntriesForPanel.find((entry) => entry.path === panel.route.path) ?? null,
	)
	const paramKeys = $derived(routeEntry?.paramKeys ?? [])

	// Functions
	import { routeEntriesForPanel, toPanelNavigation } from './route-map.ts'

	const setPanelRoute = (path: string, params: Record<string, string>) =>
		onUpdateRoute(panel.id, { path, params })

	// State
	let hashInput = $state(
		'',
	)

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
					const raw = hashInput.trim()
					const hash = raw.startsWith('#/')
						? raw
						: raw.startsWith('#')
							? `#/${raw.slice(1)}`
							: `#/${raw}`
					onAppendHash(panel.id, hash)
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

	const handleDragOver = (event: DragEvent) => {
		const dt = event.dataTransfer
		if (
			dt?.types.includes('text/uri-list') ||
			dt?.types.includes('text/plain')
		) {
			event.preventDefault()
			dt.dropEffect = 'link'
		}
	}

	const handleDrop = (event: DragEvent) => {
		const raw =
			event.dataTransfer?.getData('text/uri-list')?.trim().split(/\r?\n/)[0] ??
			event.dataTransfer?.getData('text/plain')?.trim()
		if (!raw) return
		event.preventDefault()
		const navigation = toPanelNavigation(raw, location.origin)
		if (navigation) onNavigate(panel.id, navigation.route, navigation.hash)
	}

	// Components
	import SvelteKitRoute from './SvelteKitRoute.svelte'
</script>


<section
	class="dashboard-panel"
	data-column
	data-scroll-container="block"
	class:focused={isFocused}
	role="group"
	aria-label="Panel"
	onpointerdown={() => onFocus(panel.id)}
	onfocusin={() => onFocus(panel.id)}
	ondragover={handleDragOver}
	ondrop={handleDrop}
>
	<header
		data-row="wrap"
		data-sticky
		data-scroll-container="inline"
	>
		<div data-row="wrap start" data-row-item="flexible" class="dashboard-panel-title">
			<select
				class="dashboard-panel-route"
				aria-label="Panel route"
				bind:value={() => panel.route.path, setRoutePath}
			>
				{#each routeEntriesForPanel.filter(
					(entry) =>
						!entry.path.includes('[') &&
						!excludeRoutePaths.includes(entry.path),
				) as entry (entry.path)}
					<option value={entry.path}>{entry.path}</option>
				{/each}
			</select>

			{#if paramKeys.length > 0}
				{#each paramKeys as key (key)}
					<input
						type="text"
						placeholder={key}
						bind:value={() => panel.route.params[key] ?? '', (v) => updateParam(key, v)}
					/>
				{/each}
			{/if}

			<!-- <input
				type="text"
				class="dashboard-panel-hash"
				placeholder="#hash"
				bind:value={hashInput}
				onchange={commitHash}
				onblur={commitHash}
			/> -->
		</div>

		<div data-row="wrap start" class="dashboard-panel-controls">
			<button type="button" onclick={() => onSplit(panel.id, SplitDirection.Horizontal)} title="Split horizontal">
				<span class="dashboard-panel-btn-text">Split </span><span class="dashboard-panel-btn-icon" aria-hidden="true">→</span>
			</button>
			<button type="button" onclick={() => onSplit(panel.id, SplitDirection.Vertical)} title="Split vertical">
				<span class="dashboard-panel-btn-text">Split </span><span class="dashboard-panel-btn-icon" aria-hidden="true">↓</span>
			</button>
			<button type="button" onclick={() => onSwap(panel.id)} title="Swap">
				<span class="dashboard-panel-btn-text">Swap </span><span class="dashboard-panel-btn-icon" aria-hidden="true">
					{parent != null && indexInParent != null ?
						indexInParent === 0 && parent.direction === SplitDirection.Horizontal ?
							'⇄'
						: indexInParent === 1 && parent.direction === SplitDirection.Horizontal ?
							'⇆'
						: indexInParent === 0 && parent.direction === SplitDirection.Vertical ?
							'⇵'
						: '⇅'
					: '⇄'}
				</span>
			</button>
			<button type="button" onclick={() => onRemove(panel.id)} title="Close">
				<span class="dashboard-panel-btn-text">Close</span><span class="dashboard-panel-btn-icon" aria-hidden="true">×</span>
			</button>
		</div>
	</header>

	<div
		class="dashboard-panel-body"
		data-column
		role="presentation"
		tabindex="-1"
		onclick={handlePanelClick}
		onkeydown={() => undefined}
	>
		{#key panel.route.path + '\0' + JSON.stringify(panel.route.params)}
			<SvelteKitRoute
				route={panel.route}
				entry={routeEntry}
				extraData={{
					embeddedInPanel: true,
					setPanelRoute,
				}}
			/>
		{/key}
	</div>

	{#if panel.hashHistory.length > 0}
		<footer
			data-sticky
			data-column
			class="dashboard-panel-history"
		>
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
		container-type: inline-size;
		container-name: panel;
		padding: 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid color-mix(in oklab, currentColor 18%, transparent);
		background: color-mix(in oklab, currentColor 3%, transparent);
		contain: layout paint;
		height: 100%;
		min-height: 0;
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		gap: 0.5rem;

		&.focused {
			border-color: color-mix(in oklab, currentColor 45%, transparent);
			box-shadow: 0 0 0 1px color-mix(in oklab, currentColor 22%, transparent);
		}
	}

	.dashboard-panel-title {
		min-width: 0;

		> select.dashboard-panel-route,
		> input[type='text'] {
			field-sizing: content;
		}

		> select.dashboard-panel-route {
			min-width: 6rem;
		}
	}

	.dashboard-panel-body {
		min-height: 0;
	}

	.dashboard-panel-route-body {
		min-height: 0;
	}

	.dashboard-panel-history {
		font-size: 0.85rem;
	}

	.dashboard-panel-controls {
		@container panel (max-width: 16rem) {
			& .dashboard-panel-btn-text {
				display: none;
			}

			& button {
				padding-inline: 0.5em;
				min-inline-size: 2rem;
			}
		}
	}
</style>
