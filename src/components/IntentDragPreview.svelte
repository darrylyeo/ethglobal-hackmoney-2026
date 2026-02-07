<script lang="ts">


	// Types/constants
	import {
		actionSpecs,
		type IntentOption,
	} from '$/constants/intents.ts'


	// Context
	import { goto } from '$app/navigation'


	// Functions
	import { resolveIntentForDrag } from '$/lib/intents.ts'
	import { stringify } from '$/lib/stringify.ts'
	import {
		clearIntentDragPreview,
		finalizeIntentDragPreview,
		intentDragPreviewState,
		selectIntentDragRoute,
	} from '$/state/intent-drag-preview.svelte'
	import { getIntentNavigationStore } from '$/state/intent-navigation.svelte'

	const toActionHash = (option: IntentOption) => (
		`#${option.actions
			.map(({ protocolAction, payload }) => {
				const sessionAction = actionSpecs[protocolAction.action].sessionAction
				const encoded = Object.keys(payload).length > 0
					? `${sessionAction}:${encodeURIComponent(stringify(payload))}`
					: sessionAction
				return encoded
			})
			.join('|')}`
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

	const selectOption = async (option: IntentOption, index: number) => {
		selectIntentDragRoute(String(index))

		await runWithViewTransition(async () => {
			await navigateTo('/session', toActionHash(option))
		})

		clearIntentDragPreview()
	}


	// Components
	import DragArrow from '$/components/DragArrow.svelte'


	// State
	let tooltipContentRef = $state<HTMLDivElement | null>(null)
	let prefersReducedMotion = $state(false)
	let pointerPosition = $state<{ x: number; y: number } | null>(null)


	// (Derived)
	const sourcePayload = $derived(intentDragPreviewState.source?.payload ?? null)
	const targetPayload = $derived(intentDragPreviewState.target?.payload ?? null)

	const resolution = $derived(
		sourcePayload && targetPayload
			? resolveIntentForDrag(sourcePayload.entity, targetPayload.entity)
			: null,
	)

	const isActive = $derived(intentDragPreviewState.status !== 'idle')
	const isInteractive = $derived(intentDragPreviewState.status === 'selected')
	const effectiveTargetRect = $derived(
		intentDragPreviewState.target?.rect ??
			(pointerPosition
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
				data-card="padding-3 radius-6"
				data-column="gap-3"
				data-state={intentDragPreviewState.status}
				data-interactive={isInteractive ? 'true' : 'false'}
				bind:this={tooltipContentRef}
			>
				{#if resolution?.matched}
					<header data-row="gap-4">
						<strong>{resolution.intent.label}</strong>
						<span data-muted>
							{resolution.options.length} option{resolution.options.length === 1 ? '' : 's'}
						</span>
					</header>

					{#if resolution.options.length > 0}
						<ol data-list="unstyled" data-column="gap-2">
							{#each resolution.options as option, i (i)}
								<li>
									<button
										type="button"
										data-row="gap-4"
										onclick={() => selectOption(option, i)}
										disabled={!isInteractive}
									>
										<span
											data-intent-transition={intentDragPreviewState.selectedRouteId === String(i) ? 'route' : undefined}
										>
											{option.label}
										</span>
										<small data-muted>
											{option.actions.length} {option.actions.length === 1 ? 'step' : 'steps'}
										</small>
									</button>
								</li>
							{/each}
						</ol>
					{:else if resolution.error}
						<p data-muted>{resolution.error instanceof Error ? resolution.error.message : String(resolution.error)}</p>
					{:else}
						<p data-muted>No options available.</p>
					{/if}
				{:else if sourcePayload && targetPayload}
					<header data-row="gap-4">
						<strong data-muted>No matching intent</strong>
					</header>
					<p data-muted>These entities can't be combined.</p>
				{:else}
					<header data-row="gap-4">
						<strong data-muted>Drop on a target</strong>
					</header>
				{/if}
			</div>
		{/snippet}
	</DragArrow>
{/if}


<style>
	.intent-drag-tooltip {
		min-width: 240px;
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-md);
		color: var(--color-fg);
		pointer-events: none;
	}

	.intent-drag-tooltip[data-interactive='true'] {
		pointer-events: auto;
	}

	.intent-drag-tooltip header {
		align-items: baseline;
	}

	.intent-drag-tooltip ol {
		margin: 0;
		padding: 0;
	}

	.intent-drag-tooltip button {
		width: 100%;
		align-items: baseline;
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
