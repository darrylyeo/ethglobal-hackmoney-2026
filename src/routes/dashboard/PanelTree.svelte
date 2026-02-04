<script lang="ts">
	// Types/constants
	import type { DashboardNode, DashboardPanelRoute } from '$/data/DashboardPanel'

	// Props
	let {
		root,
		focusedPanelId,
		splitRatioOverrides = {},
		onFocus,
		onSplit,
		onRemove,
		onSwap,
		onUpdateRoute,
		onAppendHash,
		onNavigate,
		onOpenInNewPanel,
		onSetSplitRatio,
		onSetSplitRatioOverride,
		onClearSplitRatioOverride,
		onToggleSplitDirection,
	}: {
		root: DashboardNode
		focusedPanelId: string
		splitRatioOverrides?: Record<string, number>
		onFocus: (panelId: string) => void
		onSplit: (panelId: string, direction: 'horizontal' | 'vertical') => void
		onRemove: (panelId: string) => void
		onSwap: (panelId: string) => void
		onUpdateRoute: (panelId: string, route: DashboardPanelRoute) => void
		onAppendHash: (panelId: string, hash: string) => void
		onNavigate: (panelId: string, route: DashboardPanelRoute, hash: string | null) => void
		onOpenInNewPanel: (
			panelId: string,
			route: DashboardPanelRoute,
			hash: string | null,
		) => void
		onSetSplitRatio: (splitId: string, ratio: number) => void
		onSetSplitRatioOverride?: (splitId: string, value: number) => void
		onClearSplitRatioOverride?: (splitId: string) => void
		onToggleSplitDirection: (splitId: string) => void
	} = $props()

	const displayRatio = $derived(
		root.type === 'split' ?
			(splitRatioOverrides[root.id] ?? root.ratio)
		:
			0.5,
	)

	// Components
	import { Tooltip } from 'bits-ui'
	import PanelTree from './PanelTree.svelte'
	import PanelView from './PanelView.svelte'
</script>


{#if root.type === 'panel'}
	<PanelView
		panel={root}
		isFocused={focusedPanelId === root.id}
		onFocus={onFocus}
		onSplit={onSplit}
		onRemove={onRemove}
		onSwap={onSwap}
		onUpdateRoute={onUpdateRoute}
		onAppendHash={onAppendHash}
		onNavigate={onNavigate}
		onOpenInNewPanel={onOpenInNewPanel}
	/>
{:else}
	<section
		class="dashboard-split"
		data-direction={root.direction}
		style="--ratio: {displayRatio}; --ratio-min: 0.2; --ratio-max: 0.8"
	>
		<section
			class="dashboard-split-pane"
			style={`flex: ${displayRatio} 1 0;`}
		>
			<PanelTree
				root={root.first}
				{focusedPanelId}
				{splitRatioOverrides}
				{onFocus}
				{onSplit}
				{onRemove}
				{onSwap}
				{onUpdateRoute}
				{onAppendHash}
				{onNavigate}
				{onOpenInNewPanel}
				{onSetSplitRatio}
				{onSetSplitRatioOverride}
				{onClearSplitRatioOverride}
				{onToggleSplitDirection}
			/>
		</section>
		<div
			class="dashboard-split-gutter"
			data-direction={root.direction}
		>
			<Tooltip.Root delayDuration={80}>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							type="button"
							class="dashboard-gutter-trigger"
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
						<div
							class="dashboard-split-tooltip"
							data-row="gap-2"
						>
							<button
								type="button"
								onclick={() => onToggleSplitDirection(root.id)}
							>
								Flip
							</button>
							<button
								type="button"
								onclick={() => onSwap(root.first.id)}
							>
								Swap
							</button>
						</div>
						<Tooltip.Arrow />
					</Tooltip.Content>
				</Tooltip.Portal>
			</Tooltip.Root>
		</div>
		<input
			type="range"
			class="dashboard-split-ratio"
			min="0.2"
			max="0.8"
			step="0.01"
			value={displayRatio}
			onmousedown={() => onSetSplitRatioOverride?.(root.id, displayRatio)}
			oninput={(event) => {
				const target = event.currentTarget
				if (!(target instanceof HTMLInputElement)) return
				onSetSplitRatioOverride?.(root.id, Number(target.value))
			}}
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
		<section
			class="dashboard-split-pane"
			style={`flex: ${1 - displayRatio} 1 0;`}
		>
			<PanelTree
				root={root.second}
				{focusedPanelId}
				{splitRatioOverrides}
				{onFocus}
				{onSplit}
				{onRemove}
				{onSwap}
				{onUpdateRoute}
				{onAppendHash}
				{onNavigate}
				{onOpenInNewPanel}
				{onSetSplitRatio}
				{onSetSplitRatioOverride}
				{onClearSplitRatioOverride}
				{onToggleSplitDirection}
			/>
		</section>
	</section>
{/if}


<style>
	.dashboard-split {
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
		--split-gutter-size: 1.5rem;

		&[data-direction='horizontal'] {
			flex-direction: row;
			align-items: stretch;
		}

		&[data-direction='vertical'] {
			flex-direction: column;
		}
	}

	.dashboard-split-ratio {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		z-index: 1;
		box-sizing: border-box;
		appearance: none;
		-webkit-appearance: none;
		background: transparent;
	}

	.dashboard-split[data-direction='horizontal'] .dashboard-split-ratio {
		padding-inline-start: calc(
			var(--ratio-min) * (100% - var(--split-gutter-size))
			+ var(--split-gutter-size) / 2
		);
		padding-inline-end: calc(
			100%
			- var(--ratio-max) * (100% - var(--split-gutter-size))
			- var(--split-gutter-size) / 2
		);
	}

	.dashboard-split[data-direction='vertical'] .dashboard-split-ratio {
		padding-block-start: calc(
			var(--ratio-min) * (100% - var(--split-gutter-size))
			+ var(--split-gutter-size) / 2
		);
		padding-block-end: calc(
			100%
			- var(--ratio-max) * (100% - var(--split-gutter-size))
			- var(--split-gutter-size) / 2
		);
	}

	.dashboard-split[data-direction='horizontal'] .dashboard-split-ratio:not(:active) {
		clip-path: inset(
			0
			calc((1 - var(--ratio)) * (100% - var(--split-gutter-size)))
			0
			calc(var(--ratio) * (100% - var(--split-gutter-size)))
		);
	}

	.dashboard-split[data-direction='vertical'] .dashboard-split-ratio:not(:active) {
		clip-path: inset(
			calc(var(--ratio) * (100% - var(--split-gutter-size)))
			0
			calc((1 - var(--ratio)) * (100% - var(--split-gutter-size)))
			0
		);
	}

	.dashboard-split-ratio::-webkit-slider-runnable-track,
	.dashboard-split-ratio::-moz-range-track {
		width: 100%;
		height: 100%;
		background: transparent;
	}

	.dashboard-split-ratio::-webkit-slider-thumb,
	.dashboard-split-ratio::-moz-range-thumb {
		appearance: none;
		-webkit-appearance: none;
		cursor: ew-grab;
		border: 1px solid var(--color-border);
		background: var(--color-bg);
		border-radius: 0;
	}

	.dashboard-split[data-direction='horizontal'] .dashboard-split-ratio {
		cursor: ew-grab;
	}

	.dashboard-split[data-direction='horizontal'] .dashboard-split-ratio::-webkit-slider-thumb {
		width: var(--split-gutter-size);
		height: 100%;
		margin: 0;
		box-sizing: border-box;
	}

	.dashboard-split[data-direction='horizontal'] .dashboard-split-ratio:active::-webkit-slider-thumb {
		width: 100%;
		transform: translateX(
			calc(
				50%
				- var(--ratio) * (100% - var(--split-gutter-size))
				- var(--split-gutter-size) / 2
			)
		);
	}

	.dashboard-split[data-direction='horizontal'] .dashboard-split-ratio::-moz-range-thumb {
		width: var(--split-gutter-size);
		height: 100%;
		box-sizing: border-box;
	}

	.dashboard-split[data-direction='horizontal'] .dashboard-split-ratio:active::-moz-range-thumb {
		width: 100%;
		transform: translateX(
			calc(
				50%
				- var(--ratio) * (100% - var(--split-gutter-size))
				- var(--split-gutter-size) / 2
			)
		);
	}

	.dashboard-split[data-direction='vertical'] .dashboard-split-ratio {
		cursor: ns-grab;
		writing-mode: vertical-lr;
	}

	.dashboard-split[data-direction='vertical'] .dashboard-split-ratio::-webkit-slider-thumb {
		width: 100%;
		height: var(--split-gutter-size);
		margin: 0;
		box-sizing: border-box;
	}

	.dashboard-split[data-direction='vertical'] .dashboard-split-ratio:active::-webkit-slider-thumb {
		height: 100%;
		transform: translateY(
			calc(
				50%
				- var(--ratio) * (100% - var(--split-gutter-size))
				- var(--split-gutter-size) / 2
			)
		);
	}

	.dashboard-split[data-direction='vertical'] .dashboard-split-ratio::-moz-range-thumb {
		width: 100%;
		height: var(--split-gutter-size);
		box-sizing: border-box;
	}

	.dashboard-split[data-direction='vertical'] .dashboard-split-ratio:active::-moz-range-thumb {
		height: 100%;
		transform: translateY(
			calc(
				50%
				- var(--ratio) * (100% - var(--split-gutter-size))
				- var(--split-gutter-size) / 2
			)
		);
	}

	.dashboard-split-gutter {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 var(--split-gutter-size);
	}

	.dashboard-split-gutter[data-direction='horizontal'] {
		inline-size: var(--split-gutter-size);
		block-size: 100%;
	}

	.dashboard-split-gutter[data-direction='vertical'] {
		block-size: var(--split-gutter-size);
		inline-size: 100%;
	}

	.dashboard-gutter-trigger {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-bg);
		padding: 0;
	}

	.dashboard-split-tooltip {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.dashboard-split > .dashboard-split-pane {
		min-width: 0;
		min-height: 0;
		overflow: hidden;
		position: relative;
		z-index: 0;
	}

	.dashboard-split-ratio:active {
		cursor: grabbing;
	}

	.dashboard-split[data-direction='horizontal'] .dashboard-split-ratio:active {
		cursor: ew-resize;
	}

	.dashboard-split[data-direction='vertical'] .dashboard-split-ratio:active {
		cursor: ns-resize;
	}
</style>
