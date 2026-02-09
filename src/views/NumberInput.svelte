<script lang="ts">
	// ID
	const _id = $props.id()


	// Props
	let {
		min,
		max,
		decimals,
		value = $bindable(0n),
		invalid = $bindable(false),
		withSlider = false,
		id,
		disabled,
		name,
		placeholder = '0.00',
		ariaLabel,
		ariaDescribedby,
		ariaInvalid,
		...rootProps
	}: {
		min: bigint
		max: bigint
		decimals: number
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


	// (Derived)
	const sliderMin = $derived(Number(min))
	const sliderMax = $derived(Number(max))
	const sliderValue = $derived(Number(value))


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
			invalid = false
			value = 0n
			return
		}
		if (isValidDecimalInput(cleaned, decimals)) {
			invalid = false
			value = parseDecimalToSmallest(cleaned, decimals)
			return
		}
		invalid = true
	}
</script>


<div
	{...rootProps}
	class="number-input"
	data-column="gap-0"
>
	<label
		data-row-item="flexible"
		data-column="gap-0"
		for={id ?? _id}
	>
		<div data-row="gap-2">
			<input
				id={id ?? _id}
				class="number-input-text"
				data-row-item="flexible"
				data-text="align-end font-monospace"
				type="text"
				inputmode="decimal"
				{placeholder}
				{disabled}
				{name}
				aria-label={ariaLabel}
				aria-describedby={ariaDescribedby}
				aria-invalid={ariaInvalid}
				bind:value={() => formatSmallestToDecimal(value, decimals), setAmountFromInput}
			/>
		</div>

		{#if withSlider}
			<input
				name={_id}
				class="number-input-slider"
				type="range"
				min={sliderMin}
				max={sliderMax}
				step="1"
				bind:value={() => String(sliderValue), (v) => {
					invalid = false
					value = BigInt(v)
				}}
				{disabled}
				aria-label={ariaLabel ? `${ariaLabel} range` : 'Amount range'}
				style={`--slider-progress:${
					sliderMax > sliderMin
						? ((sliderValue - sliderMin) / (sliderMax - sliderMin)) * 100
						: 0
				}%`}
			/>
		{/if}
	</label>
</div>


<style>
	.number-input {
		.number-input-slider {
			appearance: none;
			background-color: transparent;
			padding: 0;

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
