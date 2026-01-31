<script lang="ts">
	// Functions
	import { Button } from 'bits-ui'
	import {
		parseDecimalToSmallest,
		formatSmallestToDecimal,
		isValidDecimalInput,
	} from '$/lib/format'

	// Props
	let {
		value = $bindable(''),
		decimals = 6,
		balance = null,
		symbol = 'USDC',
		disabled = false,
		id,
	}: {
		value?: string
		decimals?: number
		balance?: bigint | null
		symbol?: string
		disabled?: boolean
		id?: string
	} = $props()

	// (Derived)
	const balanceFormatted = $derived(
		balance !== null ? formatSmallestToDecimal(balance, decimals, 4) : null,
	)
	const amountSmallest = $derived(parseDecimalToSmallest(value, decimals))
	const exceedsBalance = $derived(
		balance !== null && amountSmallest > balance,
	)
	const isValid = $derived(isValidDecimalInput(value, decimals))

	// Actions
	const handleMax = () => {
		if (balance !== null) {
			value = formatSmallestToDecimal(balance, decimals)
		}
	}
	const handleInput = (e: Event) => {
		const input = e.target as HTMLInputElement
		value = input.value.replace(/[^0-9.,]/g, '').replace(/,/g, '')
	}
</script>

<div data-amount-input data-error={exceedsBalance || !isValid ? true : undefined}>
	<div data-amount-input-row>
		<input
			{id}
			type="text"
			inputmode="decimal"
			autocomplete="off"
			{disabled}
			{value}
			oninput={handleInput}
			placeholder="0.00"
		/>
		<span data-amount-symbol>{symbol}</span>
	</div>
	{#if balanceFormatted !== null}
		<div data-amount-balance>
			<span>Balance: {balanceFormatted} {symbol}</span>
			<Button.Root type="button" onclick={handleMax} {disabled}>Max</Button.Root>
		</div>
	{/if}
	{#if exceedsBalance}
		<p data-amount-error role="alert">Insufficient balance</p>
	{/if}
	{#if !exceedsBalance && !isValid && value !== ''}
		<p data-amount-error role="alert">Invalid amount</p>
	{/if}
</div>

<style>
	[data-amount-input] {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	[data-amount-input][data-error] [data-amount-input-row] {
		border-color: var(--color-error, #ef4444);
	}

	[data-amount-input-row] {
		display: flex;
		align-items: center;
		gap: 0.5em;
		border: 1px solid var(--color-border);
		border-radius: 0.5em;
		padding: 0.5em 0.75em;
		background: var(--color-bg-page);
	}

	[data-amount-input-row] input {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		font: inherit;
	}

	[data-amount-symbol] {
		opacity: 0.7;
		font-size: 0.875em;
	}

	[data-amount-balance] {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
		font-size: 0.875em;
		opacity: 0.8;
	}

	[data-amount-error] {
		font-size: 0.875em;
		color: var(--color-error, #ef4444);
		margin: 0;
	}
</style>
