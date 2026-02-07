<script lang="ts">


	// Types/constants
	import type { Snippet } from 'svelte'
	import {
		computeArrow,
		arrowToPathD,
		arrowMidPoint,
	} from '$/lib/flow-arrow.ts'


	// Components
	import { Tooltip } from 'bits-ui'
	import FlowArrow from '$/components/FlowArrow.svelte'


	// Props
	let {
		sourceRect,
		targetRect,
		gap = 8,
		arrowHeadSize = 12,
		tooltipContent,
		interactive = false,
		flowIconSrc,
	}: {
		sourceRect: DOMRect
		targetRect: DOMRect
		gap?: number
		arrowHeadSize?: number
		tooltipContent: Snippet
		interactive?: boolean
		flowIconSrc?: string
	} = $props()


	// (Derived)
	const arrowData = $derived(
		computeArrow(sourceRect, targetRect, { padStart: gap, padEnd: arrowHeadSize }),
	)
	const pathD = $derived(
		arrowToPathD(arrowData),
	)
	const midPoint = $derived(
		arrowMidPoint(arrowData),
	)
	const tooltipSide = $derived(
		(() => {
			const midX = midPoint.x
			const midY = midPoint.y
			const dx = arrowData[2] - midX
			const dy = arrowData[3] - midY
			return Math.abs(dy) > Math.abs(dx)
				? dy < 0
					? 'bottom'
					: 'top'
				: dx > 0
					? 'left'
					: 'right'
		})(),
	)
</script>


<div
	class="drag-arrow-overlay"
	data-interactive={interactive ? 'true' : 'false'}
	aria-hidden={interactive ? 'false' : 'true'}
>
	<FlowArrow
		{sourceRect}
		{targetRect}
		{gap}
		{arrowHeadSize}
		{flowIconSrc}
	/>

	<Tooltip.Root open={true} delayDuration={0} disableHoverableContent={false}>
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

	:global(.drag-arrow-tooltip-no-events) {
		pointer-events: none;
	}
</style>
