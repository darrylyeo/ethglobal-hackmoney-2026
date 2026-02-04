<script lang="ts">
	// Types/constants
	import type { Snippet } from 'svelte'
	import { getBoxToBoxArrow } from 'perfect-arrows'

	// Components
	import { Tooltip } from 'bits-ui'

	// Props
	let {
		sourceRect,
		targetRect,
		gap = 8,
		arrowHeadSize = 12,
		tooltipContent,
		interactive = false,
	}: {
		sourceRect: DOMRect
		targetRect: DOMRect
		gap?: number
		arrowHeadSize?: number
		tooltipContent: Snippet
		interactive?: boolean
	} = $props()

	// (Derived)
	const arrowData = $derived(
		getBoxToBoxArrow(
			sourceRect.left,
			sourceRect.top,
			sourceRect.width,
			sourceRect.height,
			targetRect.left,
			targetRect.top,
			targetRect.width,
			targetRect.height,
			{
				padStart: gap,
				padEnd: arrowHeadSize,
			},
		),
	)
	const pathD = $derived(
		`M ${arrowData[0]} ${arrowData[1]} Q ${arrowData[2]} ${arrowData[3]} ${arrowData[4]} ${arrowData[5]}`,
	)
	const midPoint = $derived({
		x: 0.25 * arrowData[0] + 0.5 * arrowData[2] + 0.25 * arrowData[4],
		y: 0.25 * arrowData[1] + 0.5 * arrowData[3] + 0.25 * arrowData[5],
	})
	const tooltipSide = $derived(
		(() => {
			const midX = midPoint.x
			const midY = midPoint.y
			const dx = arrowData[2] - midX
			const dy = arrowData[3] - midY
			return Math.abs(dy) > Math.abs(dx) ?
				(dy < 0 ? 'bottom' : 'top')
			:	(dx > 0 ? 'left' : 'right')
		})(),
	)
</script>

<div
	class="drag-arrow-overlay"
	data-interactive={interactive ? 'true' : 'false'}
	aria-hidden={interactive ? 'false' : 'true'}
>
	<svg class="drag-arrow-svg" aria-hidden="true">
		<defs>
			<marker
				id="drag-arrow-head"
				markerWidth="12"
				markerHeight="12"
				viewBox="0 0 12 12"
				refX="10"
				refY="6"
				orient="auto"
			>
				<path d="M 0 0 L 12 6 L 0 12 z" fill="currentColor" />
			</marker>
		</defs>
		<path
			class="drag-arrow-path"
			d={pathD}
			marker-end="url(#drag-arrow-head)"
			vector-effect="non-scaling-stroke"
		/>
	</svg>

	<Tooltip.Root
		open={true}
		delayDuration={0}
		disableHoverableContent={false}
	>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<div
					{...props}
					role="presentation"
					style="position: fixed; left: {midPoint.x}px; top: {midPoint.y}px; width: 0; height: 0; pointer-events: none;"
				></div>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Portal>
			<Tooltip.Content
				class={!interactive ? 'drag-arrow-tooltip-no-events' : undefined}
				side={tooltipSide}
				sideOffset={12}
				avoidCollisions={true}
				collisionPadding={8}
			>
				{@render tooltipContent()}
			</Tooltip.Content>
		</Tooltip.Portal>
	</Tooltip.Root>
</div>

<style>
	.drag-arrow-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		pointer-events: none;
		color: var(--color-accent);
	}

	.drag-arrow-svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		color: inherit;
	}

	.drag-arrow-path {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	:global(.drag-arrow-tooltip-no-events) {
		pointer-events: none;
	}
</style>
