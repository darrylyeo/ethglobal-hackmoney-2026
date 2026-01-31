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
	const hasError = $derived(exceedsBalance || (!isValid && value !== ''))
	const describedBy = $derived(
		id
			? [id + '-hint', hasError ? id + '-error' : null].filter(Boolean).join(' ') || undefined
			: undefined,
	)

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

<div data-amount-input data-column="gap-2" data-error={exceedsBalance || !isValid ? true : undefined}>
	<div data-amount-input-row data-row="gap-2 align-center">
		<input
			{id}
			type="text"
			inputmode="decimal"
			autocomplete="off"
			aria-describedby={describedBy}
			aria-invalid={hasError || undefined}
			{disabled}
			{value}
			oninput={handleInput}
			placeholder="0.00"
		/>
		<span data-muted>{symbol}</span>
	</div>
	{#if id}
		<p id={id + '-hint'} class="sr-only">Enter the amount of USDC to bridge</p>
	{/if}
	{#if balanceFormatted !== null}
		<div data-row="gap-2 align-center" data-muted>
			<span>Balance: {balanceFormatted} {symbol}</span>
			<Button.Root type="button" onclick={handleMax} {disabled}>Max</Button.Root>
		</div>
	{/if}
	{#if exceedsBalance}
		<p id={id ? id + '-error' : undefined} data-error role="alert">Insufficient balance</p>
	{:else if !isValid && value !== ''}
		<p id={id ? id + '-error' : undefined} data-error role="alert">Invalid amount</p>
	{/if}
</div>

<style>
	[data-amount-input][data-error] [data-amount-input-row] {
		border-color: var(--color-error, #ef4444);
	}

	[data-amount-input-row] {
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
</style>
