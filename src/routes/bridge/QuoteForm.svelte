<script lang='ts'>
	// Functions
	import { Select, Button } from 'bits-ui'

	// Props
	let {
		networkItems,
		fromChain = $bindable('1'),
		toChain = $bindable('10'),
		amount = $bindable('1000000'),
		fromAddress,
		loading = false,
		onSubmit,
	}: {
		networkItems: { value: string; label: string }[]
		fromChain?: string
		toChain?: string
		amount?: string
		fromAddress: string
		loading?: boolean
		onSubmit: () => void
	} = $props()
</script>

<form
	aria-labelledby='quote-heading'
	data-column='gap-4'
	onsubmit={(e) => {
		e.preventDefault()
		onSubmit()
	}}
>
	<fieldset data-column='gap-4' aria-describedby='quote-desc'>
		<legend class='sr-only'>Quote parameters</legend>
		<p id='quote-desc' class='sr-only'>Source and destination chain, amount in smallest units, and sender address.</p>
		<div data-row='gap-4'>
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
			<label for='amount'>Amount (smallest units)</label>
			<input id='amount' type='text' inputmode='numeric' autocomplete='off' bind:value={amount} />
		</div>
		<div data-column='gap-2'>
			<label for='from-address'>From address</label>
			<input id='from-address' type='text' autocomplete='off' value={fromAddress} readonly />
		</div>
		<Button.Root type='submit' disabled={loading}>
			{loading ? 'Loading…' : 'Get Quote'}
		</Button.Root>
	</fieldset>
</form>
