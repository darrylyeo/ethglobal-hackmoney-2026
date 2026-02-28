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
	let customInput = $state(
		''
	)

	// (Derived)
	const p = $derived(
		action.type === ActionType.Bridge ?
			(action.params as { slippage: number })
			: null
	)


	// Components
	import Select from '$/components/Select.svelte'
</script>

{#if action.type === ActionType.Bridge && p}
	<div
		data-card
		data-column
	>
		<h3>
			LI.FI settings
		</h3>
		<label data-column>
			<span>
				Slippage
			</span>

			<Select
				items={slippagePresets}
				getItemId={(x) => x.id}
				getItemLabel={(x) => formatSlippagePercent(x.value)}
				bind:value={() => {
					const preset = slippagePresets.find(
						(pr) => Math.abs(pr.value - p.slippage) < 1e-9,
					)
					return preset?.id ?? ''
				}, (v: string | string[]) => {
					const id = typeof v === 'string' ? v : v?.[0]
					const preset = slippagePresets.find((pr) => pr.id === id)
					if (preset) {
						customInput = ''
						action = { ...action, params: { ...action.params, slippage: preset.value } } as Action
					}
				}}
				placeholder={formatSlippagePercent(p.slippage)}
				ariaLabel="Slippage"
			/>
		</label>

		<label data-column>
			<span>
				Custom %
			</span>

			<input
				type="text"
				data-text="font-monospace"
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
