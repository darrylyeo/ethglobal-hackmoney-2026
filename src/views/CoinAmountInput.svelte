<script lang="ts">
	// Types/constants
	import type { CoinInstance } from '$/constants/coin-instances.ts'


	// Props
	let {
		coins,
		coin = $bindable(coins[0]),
		min,
		max,
		value = $bindable(0n),
		isInvalid = $bindable(false),
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
		coin?: CoinInstance
		min: bigint
		max: bigint
		value?: bigint
		isInvalid?: boolean
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

	// (Derived)
	const effectiveCoin = $derived(
		coin ?? coins[0]
	)


	// Components
	import CoinInput from '$/views/CoinInput.svelte'
	import NumberInput from '$/views/NumberInput.svelte'
</script>


<div
	{...rootProps}
	class="coin-amount"
	data-row
	data-invalid={isInvalid ? '' : undefined}
>
	{#if effectiveCoin}
		<NumberInput
			{min}
			{max}
			decimals={effectiveCoin.decimals}
		bind:value
		bind:isInvalid
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
	{:else}
		<div
			class="number-input"
			data-column="gap-0"
			data-row-item="flexible"
			aria-hidden="true"
		></div>
	{/if}

	<CoinInput
		{coins}
		bind:value={coin}
		{disabled}
		ariaLabel="Token"
	/>
</div>
