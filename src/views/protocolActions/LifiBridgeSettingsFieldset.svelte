<script lang="ts">
	// Types/constants
	import { ActionType, type Action } from '$/constants/actions.ts'
	import { slippagePresets } from '$/constants/slippage.ts'
	import {
		formatSlippagePercent,
		parseSlippagePercent,
	} from '$/lib/slippage.ts'


	// Props
	let { action = $bindable() }: { action: Action } = $props()


	// State
	let customInput = $state('')


	// (Derived)
	const p = $derived(
		action.type === ActionType.Bridge
			? (action.params as { slippage: number })
			: null,
	)
</script>

{#if action.type === ActionType.Bridge && p}
	<div data-card data-column="gap-2">
		<h3>LI.FI settings</h3>
		<div data-row="gap-1">
			{#each slippagePresets as preset (preset.id)}
				<button
					type="button"
					data-selected={p.slippage === preset.value ? '' : undefined}
					onclick={() => {
						customInput = ''
						action = { ...action, params: { ...action.params, slippage: preset.value } } as Action
					}}
				>
					{formatSlippagePercent(preset.value)}
				</button>
			{/each}
		</div>
		<label data-column="gap-2">
			<span>Custom %</span>
			<input
				type="text"
				placeholder="Custom %"
				value={customInput || (p.slippage ? formatSlippagePercent(p.slippage) : '')}
				oninput={(e) => {
					customInput = (e.currentTarget as HTMLInputElement).value
				}}
				onchange={() => {
					const next = parseSlippagePercent(customInput)
					if (next !== null) {
						action = { ...action, params: { ...action.params, slippage: next } } as Action
						customInput = ''
					}
				}}
			/>
		</label>
	</div>
{/if}
