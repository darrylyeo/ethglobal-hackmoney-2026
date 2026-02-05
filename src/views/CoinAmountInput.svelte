<script lang="ts">
	// Types/constants
	import type { Coin } from '$/constants/coins'


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
	const sliderMin = $derived(Number(min))
	const sliderMax = $derived(Number(max))
	const sliderValue = $derived(Number(value))


	// Functions
	import {
		formatSmallestToDecimal,
		isValidDecimalInput,
		parseDecimalToSmallest,
	} from '$/lib/format'


	// Actions
	const onTextInput = (event: Event & { currentTarget: HTMLInputElement }) => {
		const cleaned = event.currentTarget.value
			.replace(/[^0-9.,]/g, '')
			.replace(/,/g, '')
		if (cleaned === '') {
			invalid = false
			value = 0n
			return
		}
		if (isValidDecimalInput(cleaned, coin.decimals)) {
			invalid = false
			value = parseDecimalToSmallest(cleaned, coin.decimals)
			return
		}
		invalid = true
	}
	const onSliderInput = (
		event: Event & { currentTarget: HTMLInputElement },
	) => {
		invalid = false
		value = BigInt(event.currentTarget.value)
	}


	// Components
	import CoinInput from '$/views/CoinInput.svelte'
</script>


<div
	{...rootProps}
	class="coin-amount"
	data-stack
	data-invalid={invalid ? '' : undefined}
>
	<div class="coin-amount-row">
		<input
			{id}
			class="coin-amount-input"
			type="text"
			inputmode="decimal"
			{placeholder}
			{disabled}
			{name}
			aria-label={ariaLabel}
			aria-describedby={ariaDescribedby}
			aria-invalid={ariaInvalid}
			value={formatSmallestToDecimal(value, coin.decimals)}
			oninput={onTextInput}
		/>
		<div class="coin-amount-select">
			<CoinInput {coins} bind:value={coin} {disabled} ariaLabel="Token" />
		</div>
	</div>
	<input
		class="coin-amount-slider"
		type="range"
		min={sliderMin}
		max={sliderMax}
		step="1"
		value={sliderValue}
		{disabled}
		aria-label={ariaLabel ? `${ariaLabel} range` : 'Amount range'}
		oninput={onSliderInput}
		style={`--slider-progress:${
			sliderMax > sliderMin
				? ((sliderValue - sliderMin) / (sliderMax - sliderMin)) * 100
				: 0
		}%`}
	/>
</div>




<style>
	.coin-amount {
		display: grid;
		gap: 0.25em;

		> .coin-amount-row {
			display: flex;
			gap: 0.5em;
			align-items: center;

			> .coin-amount-input {
				flex: 1;
				padding-bottom: 1.1em;
			}

			> .coin-amount-select {
				flex: 0 0 auto;
			}
		}

		> .coin-amount-slider {
			appearance: none;
			background: transparent;
			padding: 0;
			margin-top: -1.15em;
			height: 1.25em;

			&::-webkit-slider-runnable-track {
				height: 0.3em;
				border-radius: 999px;
				background: linear-gradient(
					to right,
					var(--color-accent) 0%,
					var(--color-accent) var(--slider-progress),
					var(--color-border) var(--slider-progress),
					var(--color-border) 100%
				);
			}

			&::-webkit-slider-thumb {
				appearance: none;
				width: 0.9em;
				height: 0.9em;
				margin-top: -0.3em;
				border-radius: 999px;
				background-color: var(--color-bg);
				border: 1px solid var(--color-border);
				box-shadow: var(--shadow-sm);
			}

			&::-moz-range-track {
				height: 0.3em;
				border-radius: 999px;
				background: linear-gradient(
					to right,
					var(--color-accent) 0%,
					var(--color-accent) var(--slider-progress),
					var(--color-border) var(--slider-progress),
					var(--color-border) 100%
				);
			}

			&::-moz-range-thumb {
				width: 0.9em;
				height: 0.9em;
				border-radius: 999px;
				background-color: var(--color-bg);
				border: 1px solid var(--color-border);
				box-shadow: var(--shadow-sm);
			}
		}
	}
</style>
