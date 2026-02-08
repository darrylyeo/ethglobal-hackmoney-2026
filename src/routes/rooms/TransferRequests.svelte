<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources.ts'


	// Context
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { sendTransfer } from '$/api/yellow.ts'
	import { sharedAddressesCollection } from '$/collections/SharedAddresses.ts'
	import { transferRequestsCollection } from '$/collections/TransferRequests.ts'
	import { yellowDepositsCollection } from '$/collections/YellowDeposits.ts'
	import { formatSmallestToDecimal } from '$/lib/format.ts'
	import { roomState } from '$/state/room.svelte.ts'
	import { yellowState } from '$/state/yellow.svelte.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Props
	let {
		roomId,
	}: {
		roomId: string,
	} = $props()


	// State
	let selectedAddress = $state<`0x${string}` | null>(null)
	let amount = $state('')
	let sendingRequestId = $state<string | null>(null)
	let sendError = $state<string | null>(null)


	// (Derived)
	const verifiedQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: sharedAddressesCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.where(({ row }) => eq(row.roomId, roomId))
				.select(({ row }) => ({ row })),
		[() => roomId],
	)
	const depositQuery = useLiveQuery((q) =>
		q
			.from({ row: yellowDepositsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Yellow))
			.select(({ row }) => ({ row })),
	)
	const requestsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transferRequestsCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.where(({ row }) => eq(row.roomId, roomId))
				.select(({ row }) => ({ row })),
		[() => roomId],
	)
	const liveQueryEntries = [
		{
			id: 'transfer-requests-verified',
			label: 'Shared Addresses',
			query: verifiedQuery,
		},
		{
			id: 'transfer-requests-deposits',
			label: 'Yellow Deposits',
			query: depositQuery,
		},
		{
			id: 'transfer-requests',
			label: 'Transfer Requests',
			query: requestsQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const myAddress = $derived(yellowState.address?.toLowerCase() ?? null)
	const otherVerified = $derived(
		myAddress
			? (verifiedQuery.data ?? [])
					.map((r) => r.row)
					.filter((s) => s.address.toLowerCase() !== myAddress)
			: [],
	)
	const availableBalance = $derived(
		myAddress && yellowState.chainId
			? ((depositQuery.data ?? [])
					.map((r) => r.row)
					.find(
						(d) =>
							d.address.toLowerCase() === myAddress &&
							d.chainId === yellowState.chainId,
					)?.availableBalance ?? 0n)
			: 0n,
	)
	const incoming = $derived(
		myAddress
			? (requestsQuery.data ?? [])
					.map((r) => r.row)
					.filter(
						(p) => p.to.toLowerCase() === myAddress && p.status === 'pending',
					)
			: [],
	)
	const outgoing = $derived(
		myAddress
			? (requestsQuery.data ?? [])
					.map((r) => r.row)
					.filter((p) => p.from.toLowerCase() === myAddress)
			: [],
	)


	// Actions
	const proposeTransfer = () => {
		if (!selectedAddress) return
		const trimmedAmount = amount.trim()
		if (!trimmedAmount) return
		roomState.connection?.send({
			type: 'propose-transfer',
			to: selectedAddress,
			allocations: [{ asset: 'usdc', amount: trimmedAmount }],
		})
		amount = ''
		selectedAddress = null
	}

	const acceptRequest = (requestId: string) => {
		roomState.connection?.send({ type: 'accept-transfer', requestId })
	}

	const rejectRequest = (requestId: string) => {
		roomState.connection?.send({ type: 'reject-transfer', requestId })
	}

	const sendAcceptedTransfer = async (requestId: string) => {
		if (!yellowState.clearnodeConnection || !yellowState.address) {
			sendError = 'Connect to Yellow before sending'
			return
		}
		const request = (requestsQuery.data ?? [])
			.map((r) => r.row)
			.find((r) => r.id === requestId)
		if (!request) return
		sendError = null
		sendingRequestId = requestId
		try {
			await sendTransfer({
				clearnodeConnection: yellowState.clearnodeConnection,
				destination: request.to,
				allocations: request.allocations,
			})
			roomState.connection?.send({ type: 'transfer-sent', requestId })
		} catch (error) {
			sendError = error instanceof Error ? error.message : 'Transfer failed'
		} finally {
			sendingRequestId = null
		}
	}


	// Components
	import Address from '$/components/Address.svelte'
	import AddressInput from '$/views/AddressInput.svelte'
	import { Button } from 'bits-ui'
</script>


<section class="transfer-requests">
	<h3>Request Transfer</h3>

	<div class="available-balance">
		Available: {formatSmallestToDecimal(availableBalance, 6)} USDC
	</div>

	<form
		class="transfer-form"
		data-column="gap-2"
		onsubmit={(e) => {
			e.preventDefault()
			proposeTransfer()
		}}
	>
		<AddressInput
			items={otherVerified}
			bind:value={selectedAddress}
			placeholder="Select participant"
			ariaLabel="Participant"
		/>

		<input
			type="text"
			placeholder="Amount (USDC)"
			bind:value={amount}
			inputmode="decimal"
		/>

		<Button.Root
			type="submit"
			disabled={!selectedAddress || !amount.trim()}
		>
			Request Transfer
		</Button.Root>
	</form>

	{#if incoming.length > 0}
		<h4>Incoming Requests</h4>
		{#each incoming as request (request.id)}
			<div data-row="wrap gap-2">
				<Address
					network={1}
					address={request.from}
				/>
				<span>
					requested {request.allocations[0]?.amount ?? '0'}
					{request.allocations[0]?.asset ?? 'usdc'}
				</span>
				<Button.Root
					type="button"
					onclick={() => acceptRequest(request.id)}
				>
					Accept
				</Button.Root>
				<Button.Root
					type="button"
					onclick={() => rejectRequest(request.id)}
				>
					Reject
				</Button.Root>
			</div>
		{/each}
	{/if}

	{#if outgoing.length > 0}
		<h4>Outgoing Requests</h4>
		{#each outgoing as request (request.id)}
			<div data-row="wrap gap-2">
				<Address
					network={1}
					address={request.to}
				/>
				<span>
					{request.allocations[0]?.amount ?? '0'}
					{request.allocations[0]?.asset ?? 'usdc'} ({request.status})
				</span>
				{#if request.status === 'accepted'}
					<Button.Root
						type="button"
						disabled={sendingRequestId === request.id}
						onclick={() => sendAcceptedTransfer(request.id)}
					>
						{sendingRequestId === request.id ? 'Sending...' : 'Send'}
					</Button.Root>
				{/if}
			</div>
		{/each}
	{/if}

	{#if sendError}
		<p
			class="transfer-error"
			role="alert"
		>
			{sendError}
		</p>
	{/if}
</section>


<style>
	.transfer-requests h3,
	.transfer-requests h4 {
		margin: 0.5rem 0;
	}
	.available-balance {
		margin-bottom: 0.5rem;
	}
	.transfer-form {
		max-width: 20rem;
	}
	.transfer-error {
		color: var(--color-error, red);
	}
</style>
