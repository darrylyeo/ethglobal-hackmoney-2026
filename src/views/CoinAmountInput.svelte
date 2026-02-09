<script lang="ts">
	// Types/constants
	import type { Coin } from '$/constants/coins.ts'


	// Props
	let {
		coins,
		coin = $bindable(coins[0]),
		min,
		max,
		value = $bindable(0n),
		invalid = $bindable(false),
		id,
		disabled,
		name,
		placeholder = '0.00',
		withSlider = false,
		ariaLabel,
		ariaDescribedby,
		ariaInvalid,
		...rootProps
	}: {
		coins: readonly [Coin, ...Coin[]]
		coin?: Coin
		min: bigint
		max: bigint
		value?: bigint
		invalid?: boolean
		withSlider?: boolean
		id?: string
		disabled?: boolean
		name?: string
		placeholder?: string
		ariaLabel?: string
		ariaDescribedby?: string
		ariaInvalid?: boolean | 'grammar' | 'spelling'
		[key: string]: unknown
	} = $props()


	// Components
	import CoinInput from '$/views/CoinInput.svelte'
	import NumberInput from '$/views/NumberInput.svelte'
</script>


<div
	{...rootProps}
	class="coin-amount"
	data-row="gap-2"
	data-invalid={invalid ? '' : undefined}
>
	<NumberInput
		{min}
		{max}
		decimals={coin.decimals}
		bind:value
		bind:invalid
		{withSlider}
		{id}
		{disabled}
		{name}
		{placeholder}
		{ariaLabel}
		{ariaDescribedby}
		{ariaInvalid}
		data-row-item="flexible"
	/>

	<CoinInput
		{coins}
		bind:value={coin}
		{disabled}
		ariaLabel="Token"
	/>
</div>
