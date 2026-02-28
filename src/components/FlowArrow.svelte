<script lang="ts">
	// Types/constants
	import {
		arrowPathLength,
		computeArrow,
		arrowToPathD,
		FLOW_ICON_COUNT,
		FLOW_MIN_DURATION_S,
		FLOW_SPEED_PX_S,
	} from '$/lib/flow-arrow.ts'


	// Props
	let {
		sourceRect,
		targetRect,
		gap = 8,
		arrowHeadSize = 12,
		strokeColor,
		sourceColor,
		targetColor,
		strokeWidth = 2,
		flowIconSrc,
		flowIconSize = 20,
		relative = false,
	}: {
		sourceRect: { left: number; top: number; width: number; height: number }
		targetRect: { left: number; top: number; width: number; height: number }
		gap?: number
		arrowHeadSize?: number
		strokeColor?: string
		sourceColor?: string
		targetColor?: string
		strokeWidth?: number
		flowIconSrc?: string
		flowIconSize?: number
		relative?: boolean
	} = $props()

	// (Derived)
	const arrowData = $derived(
		computeArrow(sourceRect, targetRect, { padStart: gap, padEnd: arrowHeadSize })
	)
	const pathD = $derived(
		arrowToPathD(arrowData)
	)
	const markerId = $derived(
		`flow-arrow-head-${Math.round(arrowData[0])}-${Math.round(arrowData[1])}`
	)
	const flowDurationS = $derived(
		Math.max(FLOW_MIN_DURATION_S, arrowPathLength(arrowData) / FLOW_SPEED_PX_S)
	)
	const useGradient = $derived(
		!!(sourceColor ?? targetColor)
	)
	const gradientStart = $derived(
		sourceColor ?? 'var(--color-accent)'
	)
	const gradientEnd = $derived(
		targetColor ?? 'var(--color-accent)'
	)
	const gradientId = $derived(
		`flow-arrow-gradient-${Math.round(arrowData[0])}-${Math.round(arrowData[1])}-${Math.round(arrowData[4])}-${Math.round(arrowData[5])}`
	)
</script>


<svg
	class="flow-arrow-svg"
	class:flow-arrow-svg--relative={relative}
	aria-hidden="true"
	style:color={strokeColor}
>
	<defs>
		{#if useGradient}
			<linearGradient
				id={gradientId}
				gradientUnits="userSpaceOnUse"
				x1={arrowData[0]}
				y1={arrowData[1]}
				x2={arrowData[4]}
				y2={arrowData[5]}
			>
				<stop offset="0" stop-color={gradientStart} />
				<stop offset="1" stop-color={gradientEnd} />
			</linearGradient>
		{/if}

		<marker
			id={markerId}
			markerWidth="12"
			markerHeight="12"
			viewBox="0 0 12 12"
			refX="10"
			refY="6"
			orient="auto"
		>
			<path
				d="M 0 0 L 12 6 L 0 12 z"
				fill={useGradient ? gradientEnd : 'currentColor'}
			/>
		</marker>
	</defs>

	<path
		class="flow-arrow-path"
		d={pathD}
		marker-end="url(#{markerId})"
		vector-effect="non-scaling-stroke"
		stroke={useGradient ? `url(#${gradientId})` : undefined}
		style:stroke-width="{strokeWidth}px"
	/>
</svg>

{#if flowIconSrc}
	<div
		class="flow-arrow-icons"
		class:flow-arrow-icons--relative={relative}
		style:--flow-path="path('{pathD}')"
		style:--flow-count="{FLOW_ICON_COUNT}"
		style:--flow-dur="{flowDurationS}s"
		style:--flow-size="{flowIconSize}px"
	>
		{#each { length: FLOW_ICON_COUNT } as _, i (i)}
			<img
				class="flow-arrow-icon"
				src={flowIconSrc}
				alt=""
				style:animation-delay="{-(flowDurationS / FLOW_ICON_COUNT) * i}s"
			/>
		{/each}
	</div>
{/if}


<style>
	.flow-arrow-svg {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		color: var(--color-accent);
		overflow: visible;
	}

	.flow-arrow-svg--relative {
		position: absolute;
	}

	.flow-arrow-path {
		fill: none;
		stroke: currentColor;
		stroke-width: 2px;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.flow-arrow-icons {
		position: fixed;
		inset: 0;
		pointer-events: none;
		perspective: 600px;
	}

	.flow-arrow-icons--relative {
		position: absolute;
	}

	.flow-arrow-icon {
		position: absolute;
		top: 0;
		left: 0;
		width: var(--flow-size, 20px);
		height: var(--flow-size, 20px);
		offset-path: var(--flow-path);
		offset-anchor: center;
		offset-rotate: 0deg;
		animation:
			flow-along var(--flow-dur, 1.8s) linear infinite,
			flow-tumble calc(var(--flow-dur, 1.8s) * 0.7) linear infinite;
		will-change: offset-distance, transform;
	}

	@keyframes flow-along {
		from { offset-distance: 0%; }
		to { offset-distance: 100%; }
	}

	@keyframes flow-tumble {
		0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
		25% { transform: rotateX(90deg) rotateY(45deg) rotateZ(90deg); }
		50% { transform: rotateX(180deg) rotateY(135deg) rotateZ(180deg); }
		75% { transform: rotateX(270deg) rotateY(225deg) rotateZ(270deg); }
		100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
	}

	@media (prefers-reduced-motion: reduce) {
		.flow-arrow-icon {
			animation: none;
			offset-distance: 50%;
			transform: none;
		}

		.flow-arrow-icons > .flow-arrow-icon:not(:first-child) {
			display: none;
		}
	}
</style>
