<script lang="ts">
	// Types/constants
	import type { StateChannelRow } from '$/collections/StateChannels.ts'
	import { closeChannel } from '$/api/yellow.ts'
	import { DataSourceId } from '$/constants/data-sources.ts'


	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { stateChannelsCollection } from '$/collections/StateChannels.ts'
	import { sharedAddressesCollection } from '$/collections/SharedAddresses.ts'
	import { formatSmallestToDecimal } from '$/lib/format.ts'
	import { yellowState } from '$/state/yellow.svelte.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Props
	let { roomId }: { roomId: string } = $props()


	// (Derived)
	const sharedQuery = useLiveQuery(
		(q) =>
			q
				.from({ sharedAddress: sharedAddressesCollection })
				.where(({ sharedAddress }) => eq(sharedAddress.roomId, roomId))
				.select(({ sharedAddress }) => ({ sharedAddress })),
		[() => roomId],
	)
	const channelsQuery = useLiveQuery((q) =>
		q.from({ stateChannel: stateChannelsCollection }).select(({ stateChannel }) => ({ stateChannel })),
	)
	const liveQueryEntries = [
		{
			id: 'channel-list-shared',
			label: 'Shared Addresses',
			query: sharedQuery,
		},
		{
			id: 'channel-list-channels',
			label: 'Yellow Channels',
			query: channelsQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const roomAddresses = $derived(
		(sharedQuery.data ?? []).map(({ sharedAddress }) => sharedAddress.address.toLowerCase()),
	)
	const myAddress = $derived(yellowState.address?.toLowerCase() ?? null)
	const allChannels = $derived((channelsQuery.data ?? []).map(({ stateChannel: channel }) => channel))
	const roomChannels = $derived(
		myAddress
			? allChannels.filter((ch) => {
					const isMine =
						ch.participant0.toLowerCase() === myAddress ||
						ch.participant1.toLowerCase() === myAddress
					const counterparty =
						ch.participant0.toLowerCase() === myAddress
							? ch.participant1.toLowerCase()
							: ch.participant0.toLowerCase()
					return isMine && roomAddresses.includes(counterparty)
				})
			: [],
	)


	// Functions
	const getCounterparty = (channel: StateChannelRow) =>
		myAddress && channel.participant0.toLowerCase() === myAddress
			? channel.participant1
			: channel.participant0
	const getMyBalance = (channel: StateChannelRow) =>
		myAddress && channel.participant0.toLowerCase() === myAddress
			? channel.balance0
			: channel.balance1


	// State
	let transferOpen = $state(false)
	let transferChannel = $state<StateChannelRow | null>(null)
	let closingChannelId = $state<string | null>(null)
	let closeError = $state<string | null>(null)


	// Actions
	const settleAndClose = async (channel: StateChannelRow) => {
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
	import Address from '$/views/Address.svelte'
	import { Button } from 'bits-ui'
	import TransferDialog from './TransferDialog.svelte'
</script>


<section class="channel-list">
	<h3>Payment Channels</h3>

	{#each roomChannels as channel (channel.id)}
		{@const counterparty = getCounterparty(channel)}
		{@const myBalance = getMyBalance(channel)}
		<div
			data-row="wrap"
			data-status={channel.status}
		>
			<Address
				actorId={{ $network: { chainId: channel.chainId }, address: counterparty }}
			/>
			<span class="channel-balance">
				{formatSmallestToDecimal(myBalance, 6)} USDC
			</span>
			<span data-status>{channel.status}</span>
			{#if channel.status === 'active'}
				<Button.Root
					type="button"
					onclick={() => {
						transferChannel = channel
						transferOpen = true
					}}
				>
					Send
				</Button.Root>
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
		<p class="channel-error" role="alert">
			{closeError}
		</p>
	{/if}
</section>

{#if transferChannel}
	<TransferDialog channel={transferChannel} bind:isOpen={transferOpen} />
{/if}


<style>
	.channel-list h3 {
		margin-bottom: 0.5rem;
	}
	.channel-balance {
		font-variant-numeric: tabular-nums;
	}
	.channel-error {
		color: var(--color-error, red);
	}
</style>
