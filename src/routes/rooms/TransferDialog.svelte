<script lang="ts">
	// Types/constants
	import type { StateChannelRow } from '$/collections/StateChannels.ts'
	import { sendTransfer } from '$/api/yellow.ts'
	import {
		formatSmallestToDecimal,
		parseDecimalToSmallest,
	} from '$/lib/format.ts'
	import { yellowState } from '$/state/yellow.svelte.ts'


	// Props
	let {
		channel,
		isOpen = $bindable(false),
	}: {
		channel: StateChannelRow
		isOpen: boolean
	} = $props()


	// (Derived)
	const myBalance = $derived(
		yellowState.address &&
			channel.participant0.toLowerCase() === yellowState.address.toLowerCase()
			? channel.balance0
			: channel.balance1,
	)


	// State
	let amount = $state('')
	let error = $state<string | null>(null)
	let sending = $state(false)


	// Actions
	const onSend = async () => {
		if (!yellowState.clearnodeConnection) return
		if (!yellowState.address) {
			error = 'Missing wallet address'
			return
		}

		sending = true
		error = null

		try {
			const trimmedAmount = amount.trim()
			const amountSmallest = parseDecimalToSmallest(trimmedAmount, 6)

			if (amountSmallest > myBalance) {
				throw new Error('Insufficient channel balance')
			}

			await sendTransfer({
				clearnodeConnection: yellowState.clearnodeConnection,
				destination:
					channel.participant0.toLowerCase() ===
					yellowState.address.toLowerCase()
						? channel.participant1
						: channel.participant0,
				allocations: [
					{
						asset: 'usdc',
						amount: trimmedAmount,
					},
				],
			})

			isOpen = false
			amount = ''
		} catch (e) {
			error = e instanceof Error ? e.message : 'Transfer failed'
		} finally {
			sending = false
		}
	}


	// Components
	import { Button, Dialog } from 'bits-ui'
</script>


<Dialog.Root bind:open={isOpen}>
	<Dialog.Content>
		<Dialog.Title>Send USDC</Dialog.Title>
		<Dialog.Description>
			Instant off-chain transfer to counterparty
		</Dialog.Description>

		<div class="transfer-balance">
			Available: {formatSmallestToDecimal(myBalance, 6)} USDC
		</div>

		<input
			type="text"
			data-text="font-monospace"
			placeholder="Amount (USDC)"
			bind:value={amount}
			inputmode="decimal"
		/>

		{#if error}
			<p
				class="transfer-error"
				role="alert"
			>
				{error}
			</p>
		{/if}

		<div
			data-row
			class="transfer-actions"
		>
			<Button.Root
				type="button"
				onclick={() => {
					isOpen = false
				}}
			>
				Cancel
			</Button.Root>
			<Button.Root
				type="button"
				onclick={onSend}
				disabled={sending || !amount}
			>
				{sending ? 'Sending...' : 'Send'}
			</Button.Root>
		</div>
	</Dialog.Content>
</Dialog.Root>


<style>
	.transfer-balance {
		margin: 0.5rem 0;
	}
	.transfer-actions {
		margin-top: 1rem;
	}
	.transfer-error {
		color: var(--color-error, red);
	}
</style>
