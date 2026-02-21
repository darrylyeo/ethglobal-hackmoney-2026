<script lang="ts">
	// Types/constants
	import type {
		PanelRoute,
		PanelTreeNode,
		SplitNode,
	} from '$/data/PanelTree.ts'


	// Props
	let {
		root,
		focusedPanelId,
		splitRatioOverrides = {},
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
		onSetSplitRatio,
		onSetSplitRatioOverride,
		onClearSplitRatioOverride,
		onToggleSplitDirection,
		parentSplit,
		indexInParent,
	}: {
		root: PanelTreeNode,
		focusedPanelId: string,
		splitRatioOverrides?: Record<string, number>,
		onFocus: (panelId: string) => void,
		onSplit: (panelId: string, direction: 'horizontal' | 'vertical') => void,
		onRemove: (panelId: string) => void,
		onSwap: (panelId: string) => void,
		onUpdateRoute: (panelId: string, route: PanelRoute) => void,
		onAppendHash: (panelId: string, hash: string) => void,
		onSetPanelHash: (panelId: string, hash: string, replace?: boolean) => void,
		onNavigate: (
			panelId: string,
			route: PanelRoute,
			hash: string | null,
		) => void,
		onOpenInNewPanel: (
			panelId: string,
			route: PanelRoute,
			hash: string | null,
		) => void,
		onSetSplitRatio: (splitId: string, ratio: number) => void,
		onSetSplitRatioOverride?: (splitId: string, value: number) => void,
		onClearSplitRatioOverride?: (splitId: string) => void,
		onToggleSplitDirection: (splitId: string) => void,
		excludeRoutePaths?: string[],
		parentSplit?: SplitNode,
		indexInParent?: 0 | 1,
	} = $props()


	// (Derived)
	const displayRatio = $derived(
		root.type === 'split' ?
			(splitRatioOverrides[root.id] ?? root.ratio)
		: 0.5,
	)


	// Components
	import { Tooltip } from 'bits-ui'
	import PanelView from './Panel.svelte'
	import PanelTree from './PanelTree.svelte'
</script>


{#if root.type === 'panel'}
	<PanelView
		panel={root}
		isFocused={focusedPanelId === root.id}
		{excludeRoutePaths}
		{onFocus}
		{onSplit}
		{onRemove}
		{onSwap}
		{onUpdateRoute}
		{onAppendHash}
		{onSetPanelHash}
		{onNavigate}
		{onOpenInNewPanel}
		parent={parentSplit}
		indexInParent={indexInParent}
	/>
{:else}
	<section
		class="split-tree direction-{root.direction}"
		style="--ratio: {displayRatio}; --ratio-min: 0.2; --ratio-max: 0.8; --col-1: {displayRatio}fr; --col-2: {1 -
			displayRatio}fr"
	>
		<section class="split-tree-pane">
			<PanelTree
				root={root.first}
				{focusedPanelId}
				{excludeRoutePaths}
				{splitRatioOverrides}
				{onFocus}
				{onSplit}
				{onRemove}
				{onSwap}
				{onUpdateRoute}
				{onAppendHash}
				{onSetPanelHash}
				{onNavigate}
				{onOpenInNewPanel}
				{onSetSplitRatio}
				{onSetSplitRatioOverride}
				{onClearSplitRatioOverride}
				{onToggleSplitDirection}
				parentSplit={root}
				indexInParent={0}
			/>
		</section>
		<div
			class="split-tree-gutter"
			data-row
		>
			<Tooltip.Root delayDuration={80}>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							type="button"
							class="split-tree-gutter-trigger"
							aria-label="Split controls"
						></button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Portal>
					<Tooltip.Content
						side={root.direction === 'horizontal' ? 'top' : 'left'}
						align="center"
						sideOffset={8}
						collisionPadding={8}
					>
						<div data-row="gap-2 wrap start">
							<button
								type="button"
								onclick={() => onToggleSplitDirection(root.id)}
							>
								Flip
							</button>
							<button type="button" onclick={() => onSwap(root.first.id)}>
								Swap
							</button>
						</div>
						<Tooltip.Arrow />
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		</div>
		<section class="split-tree-pane">
			<PanelTree
				root={root.second}
				{focusedPanelId}
				{excludeRoutePaths}
				{splitRatioOverrides}
				{onFocus}
				{onSplit}
				{onRemove}
				{onSwap}
				{onUpdateRoute}
				{onAppendHash}
				{onSetPanelHash}
				{onNavigate}
				{onOpenInNewPanel}
				{onSetSplitRatio}
				{onSetSplitRatioOverride}
				{onClearSplitRatioOverride}
				{onToggleSplitDirection}
				parentSplit={root}
				indexInParent={1}
			/>
		</section>
		<input
			type="range"
			data-pressable="no-scale"
			min="0.2"
			max="0.8"
			step="0.01"
			bind:value={() => displayRatio, (v) =>
				onSetSplitRatioOverride?.(root.id, Number(v))}
			onmousedown={() => onSetSplitRatioOverride?.(root.id, displayRatio)}
			onmouseup={() => {
				onSetSplitRatio(root.id, displayRatio)
				onClearSplitRatioOverride?.(root.id)
			}}
			ontouchend={() => {
				onSetSplitRatio(root.id, displayRatio)
				onClearSplitRatioOverride?.(root.id)
			}}
			aria-label="Split ratio"
		/>
	</section>
{/if}


<style>
	.split-tree {
		--split-gutter-size: 1rem;
		--ratio-track: calc(100% - var(--split-gutter-size));
		--ratio-thumb-offset: calc(
			50% - var(--ratio) * var(--ratio-track) - var(--split-gutter-size) / 2
		);

		display: grid;
		height: 100%;
		position: relative;

		&.direction-horizontal {
			grid-template:
				1fr
				/ minmax(0, var(--col-1)) var(--split-gutter-size) minmax(
					0,
					var(--col-2)
				);

			& > input[type='range'] {
				cursor: ew-resize;

				clip-path: inset(
					0 calc((1 - var(--ratio)) * var(--ratio-track)) 0
						calc(var(--ratio) * var(--ratio-track))
				);

				&::-webkit-slider-thumb,
				&::-moz-range-thumb {
					cursor: ew-resize;
					width: var(--split-gutter-size);
					height: 100%;
					margin: 0;
					box-sizing: border-box;
				}

				&:active::-webkit-slider-thumb,
				&:active::-moz-range-thumb {
					width: 100%;
					transform: translateX(var(--ratio-thumb-offset));
				}
			}
		}

		&.direction-vertical {
			grid-template:
				minmax(0, var(--col-1)) var(--split-gutter-size) minmax(0, var(--col-2))
				/ 1fr;

			& > input[type='range'] {
				cursor: ns-resize;
				writing-mode: vertical-lr;

				clip-path: inset(
					calc(var(--ratio) * var(--ratio-track)) 0
						calc((1 - var(--ratio)) * var(--ratio-track)) 0
				);

				&::-webkit-slider-thumb,
				&::-moz-range-thumb {
					cursor: ns-resize;
					width: 100%;
					height: var(--split-gutter-size);
					margin: 0;
					box-sizing: border-box;
				}

				&:active::-webkit-slider-thumb,
				&:active::-moz-range-thumb {
					height: 100%;
					transform: translateY(var(--ratio-thumb-offset));
				}
			}
		}

		& > .split-tree-pane {
			position: relative;
			z-index: 0;
		}

		& > input[type='range'] {
			position: absolute;
			inset: 0;
			padding-inline-start: calc(
				var(--ratio-min) * var(--ratio-track) + var(--split-gutter-size) / 2
			);
			padding-inline-end: calc(
				100% - var(--ratio-max) * var(--ratio-track) -
					var(--split-gutter-size) / 2
			);
			margin-inline: -0.75em;
			z-index: 1;
			appearance: none;
			background: none;

			&::-webkit-slider-runnable-track,
			&::-moz-range-track {
				width: 100%;
				height: 100%;
				background: transparent;
			}

			&::-webkit-slider-thumb,
			&::-moz-range-thumb {
				appearance: none;
				-webkit-appearance: none;
				border: 1px solid var(--color-border);
				background: var(--color-bg);
				border-radius: 0;
			}
		}
	}

	.split-tree-gutter-trigger {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-bg);
		padding: 0;
	}
</style>
