<script lang="ts">
	// Types/constants
	import type { Coin } from '$/constants/coins.ts'


	// Props
	let {
		coin,
		min,
		max,
		value = $bindable(0n),
		isInvalid = $bindable(false),
		id,
		disabled,
		name,
		placeholder = '0.00',
		ariaLabel,
		ariaDescribedby,
		ariaInvalid,
		...rootProps
	}: {
		coin: Coin
		min: bigint
		max: bigint
		value?: bigint
		isInvalid?: boolean
		id?: string
		disabled?: boolean
		name?: string
		placeholder?: string
		ariaLabel?: string
		ariaDescribedby?: string
		ariaInvalid?: boolean | 'grammar' | 'spelling'
		[key: string]: unknown
	} = $props()


	// Functions
	import {
		formatSmallestToDecimal,
		isValidDecimalInput,
		parseDecimalToSmallest,
	} from '$/lib/format.ts'


	// Actions
	const setAmountFromInput = (raw: string) => {
		const cleaned = raw.replace(/[^0-9.,]/g, '').replace(/,/g, '')
		if (cleaned === '') {
			isInvalid = false
			value = 0n
			return
		}
		if (isValidDecimalInput(cleaned, coin.decimals)) {
			isInvalid = false
			value = parseDecimalToSmallest(cleaned, coin.decimals)
			return
		}
		isInvalid = true
	}
</script>


<div
	{...rootProps}
	class="token-amount"
	data-stack
	data-invalid={isInvalid ? '' : undefined}
>
	<input
		{id}
		class="token-amount-input"
		type="text"
		inputmode="decimal"
		{placeholder}
		{disabled}
		{name}
		aria-label={ariaLabel}
		aria-describedby={ariaDescribedby}
		aria-invalid={ariaInvalid}
		bind:value={() =>
			value === 0n ? '' : formatSmallestToDecimal(value, coin.decimals), setAmountFromInput}
	/>
</div>
