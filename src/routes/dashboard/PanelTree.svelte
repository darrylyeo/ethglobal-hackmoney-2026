<script lang="ts">
	// Types/constants
	import type { DashboardNode, DashboardPanelRoute } from '$/data/DashboardPanel'

	// Components
	import PanelView from './PanelView.svelte'

	// Props
	let {
		root,
		focusedPanelId,
		onFocus,
		onSplit,
		onRemove,
		onSwap,
		onUpdateRoute,
		onAppendHash,
		onSetSplitRatio,
		onToggleSplitDirection,
	}: {
		root: DashboardNode
		focusedPanelId: string
		onFocus: (panelId: string) => void
		onSplit: (panelId: string, direction: 'horizontal' | 'vertical') => void
		onRemove: (panelId: string) => void
		onSwap: (panelId: string) => void
		onUpdateRoute: (panelId: string, route: DashboardPanelRoute) => void
		onAppendHash: (panelId: string, hash: string) => void
		onSetSplitRatio: (splitId: string, ratio: number) => void
		onToggleSplitDirection: (splitId: string) => void
	} = $props()
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
	/>
{:else}
	<section data-split data-direction={root.direction}>
		<header data-split-controls>
			<button
				type="button"
				onclick={() => onToggleSplitDirection(root.id)}
			>
				Flip
			</button>
			<label data-split-range>
				<span>Ratio</span>
				<input
					type="range"
					min="0.2"
					max="0.8"
					step="0.05"
					value={root.ratio}
					oninput={(event) => {
						const target = event.currentTarget
						if (!(target instanceof HTMLInputElement)) return
						onSetSplitRatio(root.id, Number(target.value))
					}}
				/>
			</label>
		</header>
		<section
			data-split-pane
			style={`flex: ${root.ratio} 1 0;`}
		>
			<PanelTree
				root={root.first}
				{focusedPanelId}
				{onFocus}
				{onSplit}
				{onRemove}
				{onSwap}
				{onUpdateRoute}
				{onAppendHash}
				{onSetSplitRatio}
				{onToggleSplitDirection}
			/>
		</section>
		<section
			data-split-pane
			style={`flex: ${1 - root.ratio} 1 0;`}
		>
			<PanelTree
				root={root.second}
				{focusedPanelId}
				{onFocus}
				{onSplit}
				{onRemove}
				{onSwap}
				{onUpdateRoute}
				{onAppendHash}
				{onSetSplitRatio}
				{onToggleSplitDirection}
			/>
		</section>
	</section>
{/if}


<style>
	section[data-split] {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		height: 100%;
	}

	section[data-split][data-direction='horizontal'] {
		flex-direction: row;
		align-items: stretch;
	}

	section[data-split][data-direction='vertical'] {
		flex-direction: column;
	}

	header[data-split-controls] {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	label[data-split-range] {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	section[data-split] > section[data-split-pane] {
		min-width: 0;
		min-height: 0;
	}
</style>
