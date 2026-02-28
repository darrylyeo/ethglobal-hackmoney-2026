<script lang="ts">
	// Types/constants
	import type { Snippet } from 'svelte'
	import {
		computeArrow,
		arrowToPathD,
		arrowMidPoint,
		arrowTooltipAnchor,
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
		sourceColor,
		targetColor,
		TooltipContent,
		isInteractive = false,
		flowIconSrc,
	}: {
		sourceRect: DOMRect
		targetRect: DOMRect
		gap?: number
		arrowHeadSize?: number
		sourceColor?: string
		targetColor?: string
		TooltipContent?: Snippet
		isInteractive?: boolean
		flowIconSrc?: string
	} = $props()

	// (Derived)
	const arrowData = $derived(
		computeArrow(sourceRect, targetRect, { padStart: gap, padEnd: arrowHeadSize })
	)
	const pathD = $derived(
		arrowToPathD(arrowData)
	)
	const tooltipOffset = 16
	const arcMid = $derived(
		arrowMidPoint(arrowData)
	)
	const tooltipAnchor = $derived(
		arrowTooltipAnchor(arrowData, tooltipOffset)
	)
	const tooltipSide = $derived.by(() => {
		const dx = tooltipAnchor.x - arcMid.x
		const dy = tooltipAnchor.y - arcMid.y
		return Math.abs(dy) > Math.abs(dx) ?
			dy < 0 ?
				'bottom'
				: 'top'
			: dx > 0 ?
				'left'
				: 'right'
	})
</script>


<div
	class="drag-arrow-overlay"
	data-interactive={isInteractive ? 'true' : 'false'}
	aria-hidden={isInteractive ? 'false' : 'true'}
>
	<FlowArrow
		{sourceRect}
		{targetRect}
		{gap}
		{arrowHeadSize}
		{sourceColor}
		{targetColor}
		{flowIconSrc}
	/>

{#if TooltipContent}
	<Tooltip.Root open={true} delayDuration={0} disableHoverableContent={false}>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<div
					{...props}
					role="presentation"
					style="position: fixed; left: {tooltipAnchor.x}px; top: {tooltipAnchor.y}px; width: 0; height: 0; pointer-events: none;"
				></div>
			{/snippet}
		</Tooltip.Trigger>

		<Tooltip.Portal>
			<Tooltip.Content
				class={!isInteractive ? 'drag-arrow-tooltip-no-events' : undefined}
				side={tooltipSide}
				sideOffset={12}
				avoidCollisions={true}
				collisionPadding={8}
			>
				{@render TooltipContent()}
			</Tooltip.Content>
		</Tooltip.Portal>
	</Tooltip.Root>
{/if}
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
