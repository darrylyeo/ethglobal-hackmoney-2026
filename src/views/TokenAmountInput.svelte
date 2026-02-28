<script lang="ts">
	// Types/constants
	import type { CoinInstance } from '$/constants/coin-instances.ts'


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
		coin: CoinInstance
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


	// State
	let focused = $state(
		false
	)
	let displayValue = $state(
		''
	)

	// (Derived)
	$effect(() => {
		if (!focused) displayValue = value === 0n ? '' : formatSmallestToDecimal(value, coin.decimals)
	})


	// Actions
	const setAmountFromInput = (raw: string) => {
		const cleaned = raw.replace(/[^0-9.,]/g, '').replace(/,/g, '')
		const [intPart = '', fracPart = ''] = cleaned.split('.')
		const truncated = fracPart === '' ? intPart : `${intPart}.${fracPart.slice(0, coin.decimals)}`
		displayValue = truncated
		if (truncated === '') {
			isInvalid = false
			value = 0n
			return
		}
		if (isValidDecimalInput(truncated, coin.decimals)) {
			isInvalid = false
			value = parseDecimalToSmallest(truncated, coin.decimals)
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
		data-text="font-monospace"
		type="text"
		inputmode="decimal"
		{placeholder}
		{disabled}
		{name}
		aria-label={ariaLabel}
		aria-describedby={ariaDescribedby}
		aria-invalid={ariaInvalid}
		bind:value={displayValue}
		oninput={(e) => setAmountFromInput(e.currentTarget.value)}
		onfocus={() => (focused = true)}
		onblur={() => (focused = false)}
	/>
</div>
