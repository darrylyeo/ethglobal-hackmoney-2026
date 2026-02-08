<script lang="ts">
	// Types/constants
	import { ActionType, type Action } from '$/constants/actions.ts'
	import type { Network } from '$/constants/networks.ts'
	import {
		formatSmallestToDecimal,
		isValidDecimalInput,
		parseDecimalToSmallest,
	} from '$/lib/format.ts'


	// Props
	let {
		action = $bindable(),
		filteredNetworks,
	}: {
		action: Action
		filteredNetworks: readonly Network[]
	} = $props()


	// State
	let invalid = $state(false)


	// Components
	import NetworkInput from '$/views/NetworkInput.svelte'
</script>

{#if action.type === ActionType.Bridge}
	{@const p = (action.params as { fromChainId: number | null; toChainId: number | null; amount: bigint })}
	<div data-column="gap-3">
	<label data-column="gap-0">
		<span>From network</span>
		<NetworkInput
			networks={filteredNetworks}
			bind:value={p.fromChainId}
			ariaLabel="From network"
		/>
	</label>
	<label data-column="gap-0">
		<span>To network</span>
		<NetworkInput
			networks={filteredNetworks}
			bind:value={p.toChainId}
			ariaLabel="To network"
		/>
	</label>
	<label data-column="gap-0">
		<span>Amount</span>
		<input
			type="text"
			inputmode="decimal"
			placeholder="0.00"
			value={p.amount > 0n ? formatSmallestToDecimal(p.amount, 6) : ''}
			oninput={(e) => {
				const raw = (e.currentTarget as HTMLInputElement).value
				if (raw === '') {
					invalid = false
					action = { ...action, params: { ...action.params, amount: 0n } } as Action
					return
				}
				if (isValidDecimalInput(raw, 6)) {
					invalid = false
					action = { ...action, params: { ...action.params, amount: parseDecimalToSmallest(raw, 6) } } as Action
					return
				}
				invalid = true
			}}
		/>
	</label>
	</div>
{/if}
