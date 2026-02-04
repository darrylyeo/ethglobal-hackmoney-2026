<script lang="ts">
	// Types/constants
	import type { IntentRoute, IntentRouteStep } from '$/lib/intents/routes'
	import type { IntentDragPayload, IntentResolution } from '$/lib/intents/types'
	import { DataSource } from '$/constants/data-sources'
	import { NetworkType, networksByChainId } from '$/constants/networks'
	import { defaultBridgeSettings } from '$/state/bridge-settings.svelte'
	import { defaultSwapSettings } from '$/state/swap-settings.svelte'

	// Context
	import { goto } from '$app/navigation'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'

	// Functions
	import { buildIntentRoutes } from '$/lib/intents/routes'
	import { resolveIntent } from '$/lib/intents/resolve-intent'
	import { stringify } from '$/lib/stringify'
	import {
		clearIntentDragPreview,
		finalizeIntentDragPreview,
		intentDragPreviewState,
		selectIntentDragRoute,
	} from '$/state/intent-drag-preview.svelte'
	import { intentNavigationStore } from '$/state/intent-navigation.svelte'
	import { tick } from 'svelte'

	// Components
	import DragArrow from '$/components/DragArrow.svelte'

	// State
	import { actorCoinsCollection } from '$/collections/actor-coins'
	import { bridgeRoutesCollection } from '$/collections/bridge-routes'
	import { swapQuotesCollection } from '$/collections/swap-quotes'
	import { tokenListCoinsCollection } from '$/collections/token-list-coins'

	const isTestnetChain = (chainId: number) => (
		Object.values(networksByChainId).find(
			(entry) => entry?.id === chainId,
		)?.type === NetworkType.Testnet
	)
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
	const toActionHash = (
		actions: {
			action: 'swap' | 'bridge' | 'transfer' | 'intent'
			params: Record<string, unknown>
		}[],
	) => (
		`#${actions.map((entry) => (
			Object.keys(entry.params).length > 0 ?
				`${entry.action}:${encodeURIComponent(stringify(entry.params))}`
			:
				entry.action
		)).join('|')}`
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
	const navigateTo = async (path: string, hash: string) => {
		const handler = intentNavigationStore.fn
		if (handler) {
			handler(path, hash)
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
	const buildRouteNavigation = (
		route: IntentRoute,
		resolution: IntentResolution | null,
	) => {
		if (route.steps.length > 0) {
			const actions = route.steps.map((step) => (
				step.type === 'swap' ?
					{ action: 'swap', params: buildSwapParams(step) }
				: step.type === 'bridge' ?
					{ action: 'bridge', params: buildBridgeParams(step) }
				:
					{ action: 'transfer', params: buildTransferParams(step) }
			)) satisfies {
				action: 'swap' | 'bridge' | 'transfer'
				params: Record<string, unknown>
			}[]
			return { path: '/session', hash: toActionHash(actions) }
		}
		if (route.steps.length === 0 && resolution?.status === 'valid' && resolution.kind) {
			const { from, to } = resolution
			const fd = from.dimensions
			const td = to.dimensions
			if (resolution.kind === 'swap' && fd.chainId !== null && fd.tokenAddress && td.tokenAddress) {
				return {
					path: '/session',
					hash: toActionHash([
						{
							action: 'swap',
							params: {
								chainId: fd.chainId,
								tokenIn: fd.tokenAddress,
								tokenOut: td.tokenAddress,
								amount: 0n,
								slippage: defaultSwapSettings.slippage,
								isTestnet: isTestnetChain(fd.chainId),
							},
						},
					]),
				}
			}
			if (resolution.kind === 'bridge' && fd.chainId !== null && td.chainId !== null && fd.actor) {
				return {
					path: '/session',
					hash: toActionHash([
						{
							action: 'bridge',
							params: {
								...defaultBridgeSettings,
								fromChainId: fd.chainId,
								toChainId: td.chainId,
								amount: 0n,
								isTestnet: isTestnetChain(fd.chainId),
							},
						},
					]),
				}
			}
			if (
				resolution.kind === 'transfer' &&
				fd.actor &&
				td.actor &&
				fd.chainId !== null &&
				fd.tokenAddress
			) {
				const token = getTransferTokenMeta(fd.chainId, fd.tokenAddress)
				return {
					path: '/session',
					hash: toActionHash([
						{
							action: 'transfer',
							params: {
								fromActor: fd.actor,
								toActor: td.actor,
								chainId: fd.chainId,
								amount: 0n,
								tokenSymbol: token?.symbol ?? 'USDC',
								tokenDecimals: token?.decimals ?? 6,
								tokenAddress: fd.tokenAddress,
								mode: 'direct' as const,
							},
						},
					]),
				}
			}
		}
		return {
			path: '/test/intents',
			hash: toActionHash([
				{
					action: 'intent',
					params: buildIntentParams(route),
				},
			]),
		}
	}
	const selectRoute = async (route: IntentRoute) => {
		selectIntentDragRoute(route.id)
		await tick()
		await runWithViewTransition(async () => {
			const navigation = buildRouteNavigation(route, resolution)
			await navigateTo(navigation.path, navigation.hash)
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

	let tooltipContentRef = $state<HTMLDivElement | null>(null)
	let prefersReducedMotion = $state(false)
	let pointerPosition = $state<{ x: number; y: number } | null>(null)

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
	const displayRoutes = $derived(
		(
			resolution?.status === 'valid' &&
			resolution.kind &&
			(resolution.kind === 'swap' ||
				resolution.kind === 'bridge' ||
				resolution.kind === 'transfer')
				? [
						{
							id: `open-${resolution.kind}`,
							label: resolution.kind.replaceAll('+', ' + '),
							steps: [] as IntentRouteStep[],
						} satisfies IntentRoute,
					]
				: []
		).concat(routes),
	)
	const isActive = $derived(intentDragPreviewState.status !== 'idle')
	const isInteractive = $derived(intentDragPreviewState.status === 'selected')
	const effectiveTargetRect = $derived(
		intentDragPreviewState.target?.rect
			?? (pointerPosition
				? new DOMRect(pointerPosition.x - 0.5, pointerPosition.y - 0.5, 1, 1)
				: null),
	)

	// Effects
	$effect(() => {
		if (typeof window === 'undefined') return
		if (intentDragPreviewState.status !== 'dragging') {
			pointerPosition = null
			return
		}
		const onDrag = (e: DragEvent) => {
			pointerPosition = { x: e.clientX, y: e.clientY }
		}
		window.addEventListener('drag', onDrag)
		return () => {
			window.removeEventListener('drag', onDrag)
			pointerPosition = null
		}
	})

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
			if (!tooltipContentRef) return
			const path = event.composedPath()
			if (path.includes(tooltipContentRef)) return
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


{#if isActive && intentDragPreviewState.source && effectiveTargetRect}
	<DragArrow
		sourceRect={intentDragPreviewState.source.rect}
		targetRect={effectiveTargetRect}
		gap={8}
		interactive={isInteractive}
	>
		{#snippet tooltipContent()}
			<div
				class="intent-drag-tooltip"
				data-state={intentDragPreviewState.status}
				data-interactive={isInteractive ? 'true' : 'false'}
				bind:this={tooltipContentRef}
			>
				{#if resolution && resolution.status === 'valid' && resolution.kind}
					<header>
						<strong>
							{resolution.kind.replaceAll('+', ' + ')}
						</strong>
							<span data-muted>{routes.length} route{routes.length === 1 ? '' : 's'}</span>
					</header>
							{#if routes.length > 0}
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
					{:else}
						<p data-muted>No routes available yet.</p>
					{/if}
				{:else if resolution}
					<header>
						<strong data-muted>Intent unavailable</strong>
					</header>
					<p data-muted>{resolution.reason ?? 'Select compatible entities.'}</p>
				{/if}
			</div>
		{/snippet}
	</DragArrow>
{/if}


<style>
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

	.intent-drag-tooltip[data-interactive='true'] {
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
