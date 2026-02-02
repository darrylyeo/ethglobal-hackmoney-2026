<script lang="ts">
	// Types/constants
	import type { YellowChannel } from '$/collections/yellow-channels'

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { closeChannel } from '$/api/yellow'
	import { yellowChannelsCollection } from '$/collections/yellow-channels'
	import { sharedAddressesCollection } from '$/collections/shared-addresses'
	import { formatSmallestToDecimal } from '$/lib/format'
	import { yellowState } from '$/state/yellow.svelte'

	// Props
	let { roomId }: { roomId: string } = $props()

	// (Derived)
	const sharedQuery = useLiveQuery(
		(q) => q
			.from({ row: sharedAddressesCollection })
			.where(({ row }) => eq(row.roomId, roomId))
			.select(({ row }) => ({ row })),
		[() => roomId],
	)
	const channelsQuery = useLiveQuery((q) => q.from({ row: yellowChannelsCollection }).select(({ row }) => ({ row })))
	const roomAddresses = $derived((sharedQuery.data ?? []).map((r) => r.row.address.toLowerCase()))
	const myAddress = $derived(yellowState.address?.toLowerCase() ?? null)
	const allChannels = $derived((channelsQuery.data ?? []).map((r) => r.row))
	const roomChannels = $derived(
		myAddress
			? allChannels.filter((ch) => {
				const isMine = ch.participant0.toLowerCase() === myAddress || ch.participant1.toLowerCase() === myAddress
				const counterparty = ch.participant0.toLowerCase() === myAddress ? ch.participant1.toLowerCase() : ch.participant0.toLowerCase()
				return isMine && roomAddresses.includes(counterparty)
			})
			: [],
	)

	// Functions
	const getCounterparty = (channel: YellowChannel) => (
		myAddress && channel.participant0.toLowerCase() === myAddress
			? channel.participant1
			: channel.participant0
	)
	const getMyBalance = (channel: YellowChannel) => (
		myAddress && channel.participant0.toLowerCase() === myAddress
			? channel.balance0
			: channel.balance1
	)

	// State
	let transferOpen = $state(false)
	let transferChannel = $state<YellowChannel | null>(null)
	let closingChannelId = $state<string | null>(null)
	let closeError = $state<string | null>(null)

	// Actions
	const settleAndClose = async (channel: YellowChannel) => {
		if (!yellowState.clearnodeConnection || !yellowState.address) {
			closeError = 'Connect to Yellow before closing'
			return
		}
		closingChannelId = channel.id
		closeError = null
		try {
			await closeChannel({
				clearnodeConnection: yellowState.clearnodeConnection,
				channelId: channel.id as `0x${string}`,
				fundsDestination: yellowState.address,
			})
		} catch (error) {
			closeError = error instanceof Error ? error.message : 'Close failed'
		} finally {
			closingChannelId = null
		}
	}

	// Components
	import Address from '$/components/Address.svelte'
	import { Button } from 'bits-ui'
	import TransferDialog from './TransferDialog.svelte'
</script>

<section data-channel-list>
	<h3>Payment Channels</h3>

	{#each roomChannels as channel (channel.id)}
		{@const counterparty = getCounterparty(channel)}
		{@const myBalance = getMyBalance(channel)}
		<div data-channel data-status={channel.status}>
			<Address network={channel.chainId} address={counterparty} />
			<span data-balance>
				{formatSmallestToDecimal(myBalance, 6)} USDC
			</span>
			<span data-status>{channel.status}</span>
			{#if channel.status === 'active'}
				<Button.Root type="button" onclick={() => { transferChannel = channel; transferOpen = true }}>Send</Button.Root>
				<Button.Root
					type="button"
					disabled={closingChannelId === channel.id}
					onclick={() => settleAndClose(channel)}
				>
					{closingChannelId === channel.id ? 'Closing...' : 'Settle & Close'}
				</Button.Root>
			{/if}
		</div>
	{/each}

	{#if roomChannels.length === 0}
		<p>No channels with room participants</p>
	{/if}

	{#if closeError}
		<p data-error role="alert">{closeError}</p>
	{/if}
</section>

{#if transferChannel}
	<TransferDialog
		channel={transferChannel}
		bind:open={transferOpen}
	/>
{/if}

<style>
	[data-channel-list] h3 { margin-bottom: 0.5rem; }
	[data-channel] { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
	[data-balance] { font-variant-numeric: tabular-nums; }
	[data-error] { color: var(--color-error, red); }
</style>
