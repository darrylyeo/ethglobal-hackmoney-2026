<script lang="ts">
	// Types/constants
	import type { IntentOption } from '$/constants/intents.ts'
	import {
		getCoinIconUrl,
		getSymbolForCoinEntity,
		isCoinEntityType,
	} from '$/lib/coin-icon.ts'
	import { getEntityColor } from '$/lib/entity-color.ts'
	import { resolveIntentForDrag } from '$/lib/intents.ts'
	import {
		clearIntentDragPreview,
		finalizeIntentDragPreview,
		intentDragPreviewState,
		selectIntentDragRoute,
	} from '$/state/intent-drag-preview.svelte.ts'
	import { getIntentNavigationStore } from '$/state/intent-navigation.svelte.ts'


	// Context
	import { goto } from '$app/navigation'


	// Functions
	const toActionSearch = (option: IntentOption) => (
		`?template=${option.sessionTemplate.actions[0]?.type ?? 'Swap'}`
	)

	const hasViewTransition = (
		value: Document,
	): value is Document & {
		startViewTransition: (update: () => void | Promise<void>) => { finished: Promise<unknown> }
	} => 'startViewTransition' in value

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
		const handler = getIntentNavigationStore().fn
		if (handler) {
			handler(path, hash)
			return
		}
		await goto(`${path}${hash}`)
	}


	// State
	let tooltipContentRef = $state<HTMLDivElement | null>(null)
	let prefersReducedMotion = $state(false)
	let pointerPosition = $state<{ x: number; y: number } | null>(null)
	let flowIconSrc = $state<string | undefined>(undefined)


	// (Derived)
	const sourcePayload = $derived(intentDragPreviewState.source?.payload ?? null)
	const targetPayload = $derived(intentDragPreviewState.target?.payload ?? null)

	const resolution = $derived(
		sourcePayload && targetPayload ?
			resolveIntentForDrag(sourcePayload.entity, targetPayload.entity)
		: null,
	)

	const isActive = $derived(intentDragPreviewState.status !== 'idle')
	const isInteractive = $derived(intentDragPreviewState.status === 'selected')
	const effectiveTargetRect = $derived(
		intentDragPreviewState.target?.rect ??
		(pointerPosition ?
			new DOMRect(pointerPosition.x - 0.5, pointerPosition.y - 0.5, 1, 1)
		: null),
	)

	$effect(() => {
		if (!sourcePayload || !isCoinEntityType(sourcePayload.entity.type)) {
			flowIconSrc = undefined
			return
		}
		const symbol = getSymbolForCoinEntity(
			sourcePayload.entity.type,
			sourcePayload.entity.id as Record<string, unknown>,
		)
		getCoinIconUrl(symbol).then((url) => { flowIconSrc = url })
	})

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
			if (!intentDragPreviewState.target) pointerPosition = null
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
	let lastSourceHighlight: HTMLElement | null = null
	let lastTargetHighlight: HTMLElement | null = null

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

	$effect(() => {
		const isActive = intentDragPreviewState.status !== 'idle'
		const source = intentDragPreviewState.source?.element ?? null
		const target = intentDragPreviewState.target?.element ?? null
		if (lastSourceHighlight && (lastSourceHighlight !== source || !isActive)) {
			lastSourceHighlight.removeAttribute('data-intent-drag-highlight')
		}
		if (lastTargetHighlight && (lastTargetHighlight !== target || !isActive)) {
			lastTargetHighlight.removeAttribute('data-intent-drag-highlight')
		}
		if (isActive && source) {
			source.dataset.intentDragHighlight = 'source'
		}
		if (isActive && target) {
			target.dataset.intentDragHighlight = 'target'
		}
		lastSourceHighlight = isActive && source ? source : null
		lastTargetHighlight = isActive && target ? target : null
	})


	// Actions
	const selectOption = async (option: IntentOption, index: number) => {
		selectIntentDragRoute(String(index))

		await runWithViewTransition(async () => {
			await navigateTo('/session', toActionSearch(option))
		})

		clearIntentDragPreview()
	}


	// Components
	import DragArrow from '$/components/DragArrow.svelte'
</script>


{#if isActive && intentDragPreviewState.source && effectiveTargetRect}
	{#if resolution?.matched || (sourcePayload && targetPayload)}
		<DragArrow
			sourceRect={intentDragPreviewState.source.rect}
			targetRect={effectiveTargetRect}
			gap={8}
			interactive={isInteractive}
			{flowIconSrc}
		>
			{#snippet TooltipContent()}
				<div
					class="intent-drag-tooltip"
					data-card="padding-3"
					data-column="gap-3"
					data-state={intentDragPreviewState.status}
					data-interactive={isInteractive ?
						'true'
					: 'false'}
					bind:this={tooltipContentRef}
				>
					{#if resolution?.matched}
						<header data-row="gap-4 align-baseline">
							<strong>{resolution.intent.label}</strong>
							<span data-text="muted">
								{resolution.options.length} option{resolution.options.length === 1 ?
									''
								: 's'}
							</span>
						</header>

						{#if resolution.options.length > 0}
							<ol data-list="unstyled" data-column="gap-2">
								{#each resolution.options as option, i (i)}
									<li>
										<button
											type="button"
											data-block
											data-text="muted"
											data-row="gap-4 align-baseline"
											onclick={() => selectOption(option, i)}
											disabled={!isInteractive}
										>
											<span
												data-intent-transition={intentDragPreviewState.selectedRouteId === String(i) ?
												'route'
											: undefined}
											>
												{option.name}
											</span>
											<small data-text="muted">
												{option.sessionTemplate.actions.length} {option.sessionTemplate.actions.length === 1 ?
													'step'
												: 'steps'}
											</small>
										</button>
									</li>
								{/each}
							</ol>
						{:else if resolution.error}
							<p data-text="muted">{resolution.error instanceof Error ?
								resolution.error.message
							: String(resolution.error)}</p>
						{:else}
							<p data-text="muted">No options available.</p>
						{/if}
					{:else if sourcePayload && targetPayload}
						<header data-row="gap-4">
							<strong data-text="muted">No matching intent</strong>
						</header>
						<p data-text="muted">These entities can't be combined.</p>
					{/if}
				</div>
			{/snippet}
		</DragArrow>
	{:else}
		<DragArrow
			sourceRect={intentDragPreviewState.source.rect}
			targetRect={effectiveTargetRect}
			gap={8}
			interactive={isInteractive}
			sourceColor={sourcePayload ?
				getEntityColor(sourcePayload.entity)
			: undefined}
			targetColor={targetPayload ?
				getEntityColor(targetPayload.entity)
			: undefined}
			{flowIconSrc}
		/>
	{/if}
{/if}


<style>
	.intent-drag-tooltip {
		min-width: 240px;
		pointer-events: none;
	}

	.intent-drag-tooltip[data-interactive='true'] {
		pointer-events: auto;
	}

	@keyframes intent-drag-glow {
		0%, 100% {
			filter:
				brightness(1.12)
				drop-shadow(0 0 6px color-mix(in oklab, var(--color-accent) 50%, transparent))
				drop-shadow(0 0 24px color-mix(in oklab, var(--color-accent) 35%, transparent));
		}
		50% {
			filter:
				brightness(1.12)
				drop-shadow(0 0 12px color-mix(in oklab, var(--color-accent) 55%, transparent))
				drop-shadow(0 0 40px color-mix(in oklab, var(--color-accent) 40%, transparent));
		}
	}

	:global([data-intent-drag-highlight='source']),
	:global([data-intent-drag-highlight='target']) {
		animation: intent-drag-glow 1.6s ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		:global([data-intent-drag-highlight='source']),
		:global([data-intent-drag-highlight='target']) {
			animation: none;
			filter:
				brightness(1.12)
				drop-shadow(0 0 10px color-mix(in oklab, var(--color-accent) 50%, transparent))
				drop-shadow(0 0 32px color-mix(in oklab, var(--color-accent) 35%, transparent));
		}
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
