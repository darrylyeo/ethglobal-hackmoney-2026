<script lang="ts">
	// Types/constants
	import type { YellowChannel } from '$/collections/yellow-channels'

	// Props
	let {
		channel,
		open = $bindable(false),
	}: {
		channel: YellowChannel
		open: boolean
	} = $props()

	// State
	import { yellowState } from '$/state/yellow.svelte'
	import { sendTransfer } from '$/api/yellow'
	import { parseDecimalToSmallest, formatSmallestToDecimal } from '$/lib/format'

	let amount = $state('')
	let sending = $state(false)
	let error = $state<string | null>(null)

	const myBalance = $derived(
		yellowState.address && channel.participant0.toLowerCase() === yellowState.address.toLowerCase()
			? channel.balance0
			: channel.balance1,
	)

	const handleSend = async () => {
		if (!yellowState.clearnodeConnection) return

		sending = true
		error = null

		try {
			const amountSmallest = parseDecimalToSmallest(amount, 6)

			if (amountSmallest > myBalance) {
				throw new Error('Insufficient channel balance')
			}

			await sendTransfer({
				clearnodeConnection: yellowState.clearnodeConnection,
				channelId: channel.id,
				amount: amountSmallest,
			})

			open = false
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

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Title>Send USDC</Dialog.Title>
		<Dialog.Description>
			Instant off-chain transfer to counterparty
		</Dialog.Description>

		<div data-balance>
			Available: {formatSmallestToDecimal(myBalance, 6)} USDC
		</div>

		<input
			type="text"
			placeholder="Amount (USDC)"
			bind:value={amount}
			inputmode="decimal"
		/>

		{#if error}
			<p data-error role="alert">{error}</p>
		{/if}

		<div data-actions>
			<Button onclick={() => { open = false }}>Cancel</Button>
			<Button onclick={handleSend} disabled={sending || !amount}>
				{sending ? 'Sending...' : 'Send'}
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	[data-balance] { margin: 0.5rem 0; }
	[data-actions] { display: flex; gap: 0.5rem; margin-top: 1rem; }
	[data-error] { color: var(--color-error, red); }
</style>
