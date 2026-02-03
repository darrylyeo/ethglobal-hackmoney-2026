<script lang="ts">
	// Types/constants
	import type { IntentRoute, IntentRouteStep } from '$/lib/intents/routes'
	import type { IntentDragPayload } from '$/lib/intents/types'
	import { DataSource } from '$/constants/data-sources'
	import { NetworkType, networksByChainId } from '$/constants/networks'
	import { defaultBridgeSettings } from '$/state/bridge-settings.svelte'
	import { defaultSwapSettings } from '$/state/swap-settings.svelte'

	// Context
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { goto } from '$app/navigation'
	import { page } from '$app/state'

	// Functions
	import { computePosition, flip, offset, shift } from '@floating-ui/dom'
	import { tick } from 'svelte'
	import { buildIntentRoutes } from '$/lib/intents/routes'
	import { resolveIntent } from '$/lib/intents/resolve-intent'
	import { stringify } from '$/lib/stringify'
	import {
		clearIntentDragPreview,
		finalizeIntentDragPreview,
		intentDragPreviewState,
		selectIntentDragRoute,
	} from '$/state/intent-drag-preview.svelte'
	import {
		getDashboardState,
		setDashboardFocus,
		setDashboardRoot,
	} from '$/collections/dashboard-panels'
	import { listPanelIds, splitPanel, updatePanel } from '$/routes/dashboard/panel-tree'

	// State
	import { actorCoinsCollection } from '$/collections/actor-coins'
	import { bridgeRoutesCollection } from '$/collections/bridge-routes'
	import { swapQuotesCollection } from '$/collections/swap-quotes'
	import { tokenListCoinsCollection } from '$/collections/token-list-coins'

	const isTestnetChain = (chainId: number) => (
		networksByChainId[chainId]?.type === NetworkType.Testnet
	)
	const toCenter = (rect: DOMRect) => ({
		x: rect.left + rect.width / 2,
		y: rect.top + rect.height / 2,
	})
	const withPlacement = (
		payload: IntentDragPayload,
		placement: 'from' | 'to',
	): IntentDragPayload => ({
		...payload,
		context: {
			...payload.context,
			placement,
		},
	})
	const toParamsHash = (params: Record<string, unknown>) => (
		`#${encodeURIComponent(stringify(params))}`
	)
	const buildCurvePath = (
		from: { x: number; y: number },
		to: { x: number; y: number },
	) => {
		const bend = Math.max(120, Math.abs(to.x - from.x) * 0.45)
		const direction = from.x <= to.x ? 1 : -1
		const c1x = from.x + bend * direction
		const c2x = to.x - bend * direction
		return `M ${from.x} ${from.y} C ${c1x} ${from.y}, ${c2x} ${to.y}, ${to.x} ${to.y}`
	}
	const isDashboardPath = (path: string) => (
		path.startsWith('/dashboard')
	)
	const hasViewTransition = (
		value: Document,
	): value is Document & {
		startViewTransition: (
			update: () => void | Promise<void>,
		) => { finished: Promise<unknown> }
	} => (
		'startViewTransition' in value
	)
	const runWithViewTransition = async (action: () => void | Promise<void>) => {
		if (typeof document === 'undefined' || prefersReducedMotion) {
			await action()
			return
		}
		if (!hasViewTransition(document)) {
			await action()
			return
		}
		document.startViewTransition(() => action())
	}
	const openInDashboard = (path: string, hash: string) => {
		const state = getDashboardState()
		if (!state) return
		const previousPanelIds = listPanelIds(state.root)
		const nextRoot = splitPanel(state.root, state.focusedPanelId, 'vertical', () => ({
			path,
			params: {},
		}))
		const nextPanelIds = listPanelIds(nextRoot)
		const newPanelId =
			nextPanelIds.find((id) => !previousPanelIds.includes(id)) ?? null
		const updatedRoot = newPanelId
			? updatePanel(nextRoot, newPanelId, (panel) => ({
					...panel,
					hashHistory: [hash],
				}))
			: nextRoot
		setDashboardRoot(updatedRoot)
		if (newPanelId) setDashboardFocus(newPanelId)
	}
	const navigateTo = async (
		path: string,
		params: Record<string, unknown>,
	) => {
		const hash = toParamsHash(params)
		const currentPath = page.url.pathname
		if (isDashboardPath(currentPath)) {
			openInDashboard(path, hash)
			return
		}
		await goto(`${path}${hash}`)
	}
	const tokenMatch = (address: string, tokenAddress: string) => (
		address.toLowerCase() === tokenAddress.toLowerCase()
	)
	const getTransferTokenMeta = (
		chainId: number,
		tokenAddress: string,
	) =>
		(
			tokenListCoins.find(
				(token) =>
					token.chainId === chainId &&
					tokenMatch(token.address, tokenAddress),
			)
			?? actorCoins.find(
				(coin) =>
					coin.$id.chainId === chainId &&
					tokenMatch(coin.$id.tokenAddress, tokenAddress),
			)
			?? null
		)
	const buildSwapParams = (step: Extract<IntentRouteStep, { type: 'swap' }>) => ({
		chainId: step.chainId,
		tokenIn: step.quote.tokenIn,
		tokenOut: step.quote.tokenOut,
		amount: step.quote.amountIn,
		slippage: defaultSwapSettings.slippage,
		isTestnet: isTestnetChain(step.chainId),
	})
	const buildBridgeParams = (
		step: Extract<IntentRouteStep, { type: 'bridge' }>,
	) => ({
		slippage: step.rowId.slippage ?? defaultBridgeSettings.slippage,
		isTestnet: isTestnetChain(step.fromChainId),
		sortBy: defaultBridgeSettings.sortBy,
		fromChainId: step.fromChainId,
		toChainId: step.toChainId,
		amount: step.route.fromAmount,
		useCustomRecipient: false,
		customRecipient: '',
		protocolIntent: null,
	})
	const buildTransferParams = (
		step: Extract<IntentRouteStep, { type: 'transfer' }>,
	) => {
		const token = getTransferTokenMeta(step.chainId, step.tokenAddress)
		return {
			fromActor: step.fromActor,
			toActor: step.toActor,
			chainId: step.chainId,
			amount: 0n,
			tokenSymbol: token?.symbol ?? 'USDC',
			tokenDecimals: token?.decimals ?? 6,
			tokenAddress: step.tokenAddress,
			mode: step.mode,
		}
	}
	const buildIntentParams = (route: IntentRoute) =>
		(
			sourcePayload && targetPayload ?
				{
					from: withPlacement(sourcePayload, 'from'),
					to: withPlacement(targetPayload, 'to'),
					routeId: route.id,
				}
			: {}
		)
	const buildRouteNavigation = (route: IntentRoute) => {
		if (route.steps.length === 1 && route.steps[0]?.type === 'swap') {
			return { path: '/swap', params: buildSwapParams(route.steps[0]) }
		}
		if (route.steps.length === 1 && route.steps[0]?.type === 'bridge') {
			return { path: '/bridge', params: buildBridgeParams(route.steps[0]) }
		}
		if (route.steps.length === 1 && route.steps[0]?.type === 'transfer') {
			return { path: '/transfer', params: buildTransferParams(route.steps[0]) }
		}
		return { path: '/test/intents', params: buildIntentParams(route) }
	}
	const selectRoute = async (route: IntentRoute) => {
		selectIntentDragRoute(route.id)
		await tick()
		await runWithViewTransition(async () => {
			const navigation = buildRouteNavigation(route)
			await navigateTo(navigation.path, navigation.params)
		})
		clearIntentDragPreview()
	}

	const swapQuotesQuery = useLiveQuery((q) =>
		q
			.from({ row: swapQuotesCollection })
			.where(({ row }) => eq(row.$source, DataSource.Uniswap))
			.select(({ row }) => ({ row })),
	)
	const bridgeRoutesQuery = useLiveQuery((q) =>
		q
			.from({ row: bridgeRoutesCollection })
			.where(({ row }) => eq(row.$source, DataSource.LiFi))
			.select(({ row }) => ({ row })),
	)
	const tokenListQuery = useLiveQuery((q) =>
		q
			.from({ row: tokenListCoinsCollection })
			.where(({ row }) => eq(row.$source, DataSource.TokenLists))
			.select(({ row }) => ({ row })),
	)
	const actorCoinsQuery = useLiveQuery((q) =>
		q
			.from({ row: actorCoinsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Voltaire))
			.select(({ row }) => ({ row })),
	)

	let arrowPath = $state('')
	let midPoint = $state<{ x: number; y: number } | null>(null)
	let tooltipElement = $state<HTMLDivElement | null>(null)
	let tooltipStyle = $state('')
	let prefersReducedMotion = $state(false)

	// (Derived)
	const sourcePayload = $derived(intentDragPreviewState.source?.payload ?? null)
	const targetPayload = $derived(intentDragPreviewState.target?.payload ?? null)
	const swapQuotes = $derived((swapQuotesQuery.data ?? []).map((r) => r.row))
	const tokenListCoins = $derived((tokenListQuery.data ?? []).map((r) => r.row))
	const actorCoins = $derived((actorCoinsQuery.data ?? []).map((r) => r.row))
	const bridgeRouteOptions = $derived(
		(bridgeRoutesQuery.data ?? []).flatMap((entry) =>
			entry.row.routes.map((route) => ({
				rowId: entry.row.$id,
				route,
			})),
		),
	)
	const resolution = $derived(
		sourcePayload && targetPayload
			? resolveIntent(sourcePayload.entity, targetPayload.entity)
			: null,
	)
	const routes = $derived(
		resolution && resolution.status === 'valid'
			? buildIntentRoutes(resolution, {
					swapQuotes,
					bridgeRoutes: bridgeRouteOptions,
				})
			: [],
	)
	const isActive = $derived(intentDragPreviewState.status !== 'idle')
	const isInteractive = $derived(intentDragPreviewState.status === 'selected')

	$effect(() => {
		if (typeof window === 'undefined') return
		const media = window.matchMedia('(prefers-reduced-motion: reduce)')
		const update = () => {
			prefersReducedMotion = media.matches
		}
		update()
		media.addEventListener('change', update)
		return () => media.removeEventListener('change', update)
	})

	$effect(() => {
		if (!intentDragPreviewState.source || !intentDragPreviewState.target) {
			arrowPath = ''
			midPoint = null
			return
		}
		const from = toCenter(intentDragPreviewState.source.rect)
		const to = toCenter(intentDragPreviewState.target.rect)
		arrowPath = buildCurvePath(from, to)
		midPoint = {
			x: (from.x + to.x) / 2,
			y: (from.y + to.y) / 2,
		}
	})

	$effect(() => {
		if (!tooltipElement || !midPoint || !isActive) {
			tooltipStyle = ''
			return
		}
		let cancelled = false
		const virtualReference = {
			getBoundingClientRect: () => ({
				x: midPoint.x,
				y: midPoint.y,
				width: 0,
				height: 0,
				top: midPoint.y,
				left: midPoint.x,
				right: midPoint.x,
				bottom: midPoint.y,
			}),
		}
		void computePosition(virtualReference, tooltipElement, {
			placement: 'top',
			middleware: [offset(12), flip(), shift({ padding: 8 })],
		}).then(({ x, y }) => {
			if (cancelled) return
			tooltipStyle = `position: fixed; left: ${x}px; top: ${y}px;`
		})
		return () => {
			cancelled = true
		}
	})

	$effect(() => {
		if (typeof window === 'undefined') return
		const onDragEnd = () => {
			finalizeIntentDragPreview()
		}
		window.addEventListener('dragend', onDragEnd)
		window.addEventListener('drop', onDragEnd)
		return () => {
			window.removeEventListener('dragend', onDragEnd)
			window.removeEventListener('drop', onDragEnd)
		}
	})

	$effect(() => {
		if (!isInteractive) return
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return
			clearIntentDragPreview()
		}
		const onPointerDown = (event: PointerEvent) => {
			if (!tooltipElement) return
			const path = event.composedPath()
			if (path.includes(tooltipElement)) return
			clearIntentDragPreview()
		}
		document.addEventListener('keydown', onKeyDown)
		document.addEventListener('pointerdown', onPointerDown)
		return () => {
			document.removeEventListener('keydown', onKeyDown)
			document.removeEventListener('pointerdown', onPointerDown)
		}
	})

	let lastSource: HTMLElement | null = null
	let lastTarget: HTMLElement | null = null

	$effect(() => {
		const source = intentDragPreviewState.source?.element ?? null
		const target = intentDragPreviewState.target?.element ?? null
		const shouldApply = intentDragPreviewState.status === 'selected'
		if (lastSource && lastSource !== source) {
			lastSource.removeAttribute('data-intent-transition')
		}
		if (lastTarget && lastTarget !== target) {
			lastTarget.removeAttribute('data-intent-transition')
		}
		if (shouldApply && source && !prefersReducedMotion) {
			source.dataset.intentTransition = 'source'
		} else if (source) {
			source.removeAttribute('data-intent-transition')
		}
		if (shouldApply && target && !prefersReducedMotion) {
			target.dataset.intentTransition = 'target'
		} else if (target) {
			target.removeAttribute('data-intent-transition')
		}
		lastSource = source
		lastTarget = target
	})
</script>


{#if isActive && intentDragPreviewState.source && intentDragPreviewState.target}
	<div
		class="intent-drag-overlay"
		data-interactive={isInteractive ? 'true' : 'false'}
		aria-hidden={isInteractive ? 'false' : 'true'}
	>
		<svg class="intent-drag-arrow" aria-hidden="true">
			<defs>
				<marker
					id="intent-arrow"
					markerWidth="12"
					markerHeight="12"
					viewBox="0 0 12 12"
					refX="10"
					refY="6"
					orient="auto"
				>
					<path d="M 0 0 L 12 6 L 0 12 z" />
				</marker>
			</defs>
			{#if arrowPath}
				<path
					d={arrowPath}
					marker-end="url(#intent-arrow)"
					vector-effect="non-scaling-stroke"
				/>
			{/if}
		</svg>

		{#if midPoint}
			<div
				class="intent-drag-tooltip"
				data-state={intentDragPreviewState.status}
				bind:this={tooltipElement}
				style={tooltipStyle}
			>
				{#if resolution && resolution.status === 'valid' && resolution.kind}
					<header>
						<strong>
							{resolution.kind.replaceAll('+', ' + ')}
						</strong>
						<span data-muted>{routes.length} route{routes.length === 1 ? '' : 's'}</span>
					</header>
					{#if routes.length === 0}
						<p data-muted>No routes available yet.</p>
					{:else}
						<ol>
							{#each routes as route (route.id)}
								<li>
									<button
										type="button"
										onclick={() => selectRoute(route)}
										disabled={!isInteractive}
									>
										<span
											data-intent-transition={
												intentDragPreviewState.selectedRouteId === route.id
													? 'route'
													: undefined
											}
										>
											{route.label}
										</span>
										<small data-muted>
											{route.steps.length} {route.steps.length === 1 ? 'step' : 'steps'}
										</small>
									</button>
								</li>
							{/each}
						</ol>
					{/if}
				{:else if resolution}
					<header>
						<strong data-muted>Intent unavailable</strong>
					</header>
					<p data-muted>{resolution.reason ?? 'Select compatible entities.'}</p>
				{:else}
					<header>
						<strong data-muted>Drag to preview intents</strong>
					</header>
				{/if}
			</div>
		{/if}
	</div>
{/if}


<style>
	.intent-drag-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		pointer-events: none;
		color: var(--color-accent);
	}

	.intent-drag-arrow {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		stroke: currentColor;
		stroke-width: 2;
		fill: currentColor;
	}

	.intent-drag-tooltip {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem;
		min-width: 240px;
		border-radius: 0.75rem;
		background: var(--color-bg-card);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-md);
		color: var(--color-fg);
		pointer-events: none;
	}

	.intent-drag-overlay[data-interactive='true'] .intent-drag-tooltip {
		pointer-events: auto;
	}

	.intent-drag-tooltip header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: baseline;
	}

	.intent-drag-tooltip ol {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.intent-drag-tooltip button {
		width: 100%;
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid transparent;
		background: var(--color-bg-muted);
		color: inherit;
		cursor: pointer;
	}

	.intent-drag-tooltip button:disabled {
		cursor: default;
		opacity: 0.6;
	}

	.intent-drag-tooltip button:not(:disabled):hover {
		border-color: color-mix(in oklab, var(--color-accent) 35%, transparent);
	}

	:global([data-intent-transition='source']) {
		view-transition-name: intent-source;
		view-transition-group: intent-source;
	}

	:global([data-intent-transition='target']) {
		view-transition-name: intent-target;
		view-transition-group: intent-target;
	}

	:global([data-intent-transition='route']) {
		view-transition-name: intent-route;
		view-transition-group: intent-route;
	}

	@media (prefers-reduced-motion: reduce) {
		:global([data-intent-transition='source']),
		:global([data-intent-transition='target']),
		:global([data-intent-transition='route']) {
			view-transition-name: none;
			view-transition-group: normal;
		}
	}
</style>
