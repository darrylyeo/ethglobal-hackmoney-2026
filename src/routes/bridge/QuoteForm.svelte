<script lang='ts'>
	// Functions
	import { Select, Button } from 'bits-ui'
	import {
		validateBridgeAmount,
		USDC_MIN_AMOUNT,
		USDC_MAX_AMOUNT,
	} from '$/constants/bridge-limits'
	import { parseDecimalToSmallest, isValidDecimalInput } from '$/lib/format'

	// Components
	import AmountInput from './AmountInput.svelte'

	// Props
	let {
		networkItems,
		fromChain = $bindable('1'),
		toChain = $bindable('10'),
		amount = $bindable('1'),
		fromAddress,
		balance = null,
		loading = false,
		onSubmit,
	}: {
		networkItems: { value: string; label: string }[]
		fromChain?: string
		toChain?: string
		amount?: string
		fromAddress: string
		balance?: bigint | null
		loading?: boolean
		onSubmit: () => void
	} = $props()

	// (Derived)
	const amountSmallest = $derived(parseDecimalToSmallest(amount, 6))
	const amountValidation = $derived(
		!isValidDecimalInput(amount, 6)
			? { isValid: false as const, error: 'invalid' as const }
			: validateBridgeAmount(amountSmallest, USDC_MIN_AMOUNT, USDC_MAX_AMOUNT),
	)
	const exceedsBalance = $derived(
		balance !== null && amountSmallest > balance,
	)
	const canSubmit = $derived(
		amountValidation.isValid && !exceedsBalance,
	)
</script>

<form
	aria-labelledby='quote-heading'
	data-column='gap-4'
	onsubmit={(e) => {
		e.preventDefault()
		if (!canSubmit) return
		onSubmit()
	}}
>
	<fieldset data-column='gap-4' aria-describedby='quote-desc'>
		<legend class='sr-only'>Quote parameters</legend>
		<p id='quote-desc' class='sr-only'>Source and destination chain, amount, and sender address.</p>
		<div data-row='gap-4' data-form-row>
			<div data-column='gap-2'>
				<label for='from-chain'>From chain</label>
				<Select.Root
					type='single'
					bind:value={fromChain}
					items={networkItems}
					name='fromChain'
				>
					<Select.Trigger id='from-chain' aria-label='From chain'>
						{networkItems.find((i) => i.value === fromChain)?.label ?? 'Select'}
					</Select.Trigger>
					<Select.Portal>
						<Select.Content>
							<Select.Viewport>
								{#each networkItems as item, i (`from-${i}-${item.value}`)}
									<Select.Item value={item.value} label={item.label}>
										<span data-testid={`option-${item.label}`}>{item.label}</span>
									</Select.Item>
								{/each}
							</Select.Viewport>
						</Select.Content>
					</Select.Portal>
				</Select.Root>
			</div>
			<div data-column='gap-2'>
				<label for='to-chain'>To chain</label>
				<Select.Root
					type='single'
					bind:value={toChain}
					items={networkItems}
					name='toChain'
				>
					<Select.Trigger id='to-chain' aria-label='To chain'>
						{networkItems.find((i) => i.value === toChain)?.label ?? 'Select'}
					</Select.Trigger>
					<Select.Portal>
						<Select.Content>
							<Select.Viewport>
								{#each networkItems as item, i (`to-${i}-${item.value}`)}
									<Select.Item value={item.value} label={item.label}>
										<span data-testid={`option-${item.label}`}>{item.label}</span>
									</Select.Item>
								{/each}
							</Select.Viewport>
						</Select.Content>
					</Select.Portal>
				</Select.Root>
			</div>
		</div>
		<div data-column='gap-2'>
			<label for='amount'>Amount</label>
			<AmountInput
				id='amount'
				bind:value={amount}
				decimals={6}
				{balance}
				symbol='USDC'
				disabled={loading}
			/>
			{#if amountValidation.error === 'too_low'}
				<p data-amount-validation-error role='alert'>
					Minimum amount is {amountValidation.minAmount} USDC
				</p>
			{:else if amountValidation.error === 'too_high'}
				<p data-amount-validation-error role='alert'>
					Maximum amount is {amountValidation.maxAmount} USDC
				</p>
			{/if}
		</div>
		<div data-column='gap-2'>
			<label for='from-address'>From address</label>
			<input id='from-address' type='text' autocomplete='off' value={fromAddress} readonly />
		</div>
		<Button.Root
			type='submit'
			disabled={loading || !canSubmit}
			aria-busy={loading || undefined}
			aria-describedby={loading ? 'quote-loading-status' : undefined}
		>
			{#if loading}
				<span aria-hidden='true'>⏳</span>
				<span id='quote-loading-status' class='sr-only'>Loading, please wait</span>
			{/if}
			{loading ? 'Loading…' : 'Get Quote'}
		</Button.Root>
	</fieldset>
</form>
