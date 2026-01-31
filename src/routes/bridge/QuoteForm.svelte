<script lang='ts'>
	// Functions
	import { Select } from 'bits-ui'
	import {
		validateBridgeAmount,
		USDC_MIN_AMOUNT,
		USDC_MAX_AMOUNT,
	} from '$/constants/bridge-limits'
	import type { Network } from '$/constants/networks'
	import { parseDecimalToSmallest, isValidDecimalInput } from '$/lib/format'

	// Components
	import LoadingButton from '$/components/LoadingButton.svelte'
	import AmountInput from './AmountInput.svelte'

	// Props
	let {
		networks,
		fromNetwork = $bindable(),
		toNetwork = $bindable(),
		amount = $bindable('1'),
		fromAddress,
		balance = null,
		loading = false,
		onSubmit,
	}: {
		networks: Network[]
		fromNetwork: Network
		toNetwork: Network
		amount?: string
		fromAddress: string
		balance?: bigint | null
		loading?: boolean
		onSubmit: () => void
	} = $props()

	// (Derived)
	const networkItems = $derived(
		networks.map((n) => ({ value: String(n.id), label: n.name })),
	)
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
		if (!canSubmit || loading) return
		onSubmit()
	}}
>
	<fieldset data-column='gap-4' aria-describedby='quote-desc' disabled={loading}>
		<legend class='sr-only'>Quote parameters</legend>
		<p id='quote-desc' class='sr-only'>Source and destination network, amount, and sender address.</p>
		<div data-row='gap-4' data-form-row>
			<div data-column='gap-2'>
				<label for='from-network'>From network</label>
				<Select.Root
					type='single'
					value={String(fromNetwork.id)}
					onValueChange={(v) => {
						fromNetwork = networks.find((n) => String(n.id) === v) ?? fromNetwork
					}}
					items={networkItems}
					name='fromNetwork'
					disabled={loading}
				>
					<Select.Trigger id='from-network' aria-label='From network'>
						<span data-row="gap-2 align-center">
							<img
								src="/networks/{fromNetwork.id}.svg"
								alt=""
								width="20"
								height="20"
								class="network-icon"
								loading="lazy"
								decoding="async"
								onerror={(e) => ((e.currentTarget as HTMLImageElement).hidden = true)}
							/>
							<span>{fromNetwork.name}</span>
						</span>
					</Select.Trigger>
					<Select.Portal>
						<Select.Content>
							<Select.Viewport>
								{#each networkItems as item, i (`from-${i}-${item.value}`)}
									<Select.Item value={item.value} label={item.label}>
										<img
											src="/networks/{item.value}.svg"
											alt=""
											width="20"
											height="20"
											class="network-icon"
											loading="lazy"
											decoding="async"
											onerror={(e) => ((e.currentTarget as HTMLImageElement).hidden = true)}
										/>
										<span data-testid={`option-${item.label}`}>{item.label}</span>
									</Select.Item>
								{/each}
							</Select.Viewport>
						</Select.Content>
					</Select.Portal>
				</Select.Root>
			</div>
			<div data-column='gap-2'>
				<label for='to-network'>To network</label>
				<Select.Root
					type='single'
					value={String(toNetwork.id)}
					onValueChange={(v) => {
						toNetwork = networks.find((n) => String(n.id) === v) ?? toNetwork
					}}
					items={networkItems}
					name='toNetwork'
					disabled={loading}
				>
					<Select.Trigger id='to-network' aria-label='To network'>
						<span data-row="gap-2 align-center">
							<img
								src="/networks/{toNetwork.id}.svg"
								alt=""
								width="20"
								height="20"
								class="network-icon"
								loading="lazy"
								decoding="async"
								onerror={(e) => ((e.currentTarget as HTMLImageElement).hidden = true)}
							/>
							<span>{toNetwork.name}</span>
						</span>
					</Select.Trigger>
					<Select.Portal>
						<Select.Content>
							<Select.Viewport>
								{#each networkItems as item, i (`to-${i}-${item.value}`)}
									<Select.Item value={item.value} label={item.label}>
										<img
											src="/networks/{item.value}.svg"
											alt=""
											width="20"
											height="20"
											class="network-icon"
											loading="lazy"
											decoding="async"
											onerror={(e) => ((e.currentTarget as HTMLImageElement).hidden = true)}
										/>
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
				<p data-error role="alert">
					Minimum amount is {amountValidation.minAmount} USDC
				</p>
			{:else if amountValidation.error === 'too_high'}
				<p data-error role="alert">
					Maximum amount is {amountValidation.maxAmount} USDC
				</p>
			{/if}
		</div>
		<div data-column='gap-2'>
			<label for='from-address'>From address</label>
			<input id='from-address' type='text' autocomplete='off' value={fromAddress} readonly disabled={loading} />
		</div>
		{#if loading}
			<span id='quote-loading-status' class='sr-only'>Loading, please wait</span>
		{/if}
		<LoadingButton
			type='submit'
			loading={loading}
			loadingText='Finding routes…'
			disabled={!canSubmit}
			aria-describedby={loading ? 'quote-loading-status' : undefined}
		>
			{#snippet children()}
				Get Routes
			{/snippet}
		</LoadingButton>
	</fieldset>
</form>
