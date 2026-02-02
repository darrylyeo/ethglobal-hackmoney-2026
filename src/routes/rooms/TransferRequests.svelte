<script lang="ts">
	// Types/constants
	import type { SharedAddress } from '$/collections/shared-addresses'

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { sendTransfer } from '$/api/yellow'
	import { sharedAddressesCollection } from '$/collections/shared-addresses'
	import { transferRequestsCollection } from '$/collections/transfer-requests'
	import { yellowDepositsCollection } from '$/collections/yellow-deposits'
	import { formatSmallestToDecimal } from '$/lib/format'
	import { roomState } from '$/state/room.svelte'
	import { yellowState } from '$/state/yellow.svelte'

	// Props
	let { roomId }: { roomId: string } = $props()

	// Functions
	const isHexAddress = (value: string): value is `0x${string}` => (
		value.startsWith('0x')
	)

	// State
	let selectedAddress = $state<`0x${string}` | null>(null)
	let amount = $state('')
	let sendingRequestId = $state<string | null>(null)
	let sendError = $state<string | null>(null)

	// (Derived)
	const verifiedQuery = useLiveQuery(
		(q) => q
			.from({ row: sharedAddressesCollection })
			.where(({ row }) => eq(row.roomId, roomId))
			.select(({ row }) => ({ row })),
		[() => roomId],
	)
	const depositQuery = useLiveQuery(
		(q) => q
			.from({ row: yellowDepositsCollection })
			.select(({ row }) => ({ row })),
	)
	const requestsQuery = useLiveQuery(
		(q) => q
			.from({ row: transferRequestsCollection })
			.where(({ row }) => eq(row.roomId, roomId))
			.select(({ row }) => ({ row })),
		[() => roomId],
	)
	const myAddress = $derived(yellowState.address?.toLowerCase() ?? null)
	const otherVerified = $derived(
		myAddress
			? (verifiedQuery.data ?? []).map((r) => r.row).filter((s) => s.address.toLowerCase() !== myAddress)
			: [],
	)
	const availableBalance = $derived(
		myAddress && yellowState.chainId
			? (depositQuery.data ?? []).map((r) => r.row).find(
				(d) => d.address.toLowerCase() === myAddress && d.chainId === yellowState.chainId,
			)?.availableBalance ?? 0n
			: 0n,
	)
	const incoming = $derived(
		myAddress
			? (requestsQuery.data ?? []).map((r) => r.row).filter((p) => p.to.toLowerCase() === myAddress && p.status === 'pending')
			: [],
	)
	const outgoing = $derived(
		myAddress
			? (requestsQuery.data ?? []).map((r) => r.row).filter((p) => p.from.toLowerCase() === myAddress)
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
		const request = (requestsQuery.data ?? []).map((r) => r.row).find((r) => r.id === requestId)
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
	import Select from '$/components/Select.svelte'
	import { Button } from 'bits-ui'
</script>


<section data-transfer-requests>
	<h3>Request Transfer</h3>

	<div data-available-balance>
		Available: {formatSmallestToDecimal(availableBalance, 6)} USDC
	</div>

	<form
		onsubmit={(e) => {
			e.preventDefault()
			proposeTransfer()
		}}
	>
		{#snippet addressItem(shared: SharedAddress)}
			<Address network={1} address={shared.address} />
		{/snippet}

		<Select
			items={otherVerified}
			value={selectedAddress ?? ''}
			onValueChange={(v) => {
				selectedAddress = (
					typeof v === 'string' && isHexAddress(v) ?
						v
					: Array.isArray(v) && typeof v[0] === 'string' && isHexAddress(v[0]) ?
						v[0]
					:
						null
				)
			}}
			getItemId={(shared) => shared.address}
			getItemLabel={(shared) => shared.address}
			placeholder="Select participant"
			Item={addressItem}
		/>

		<input
			type="text"
			placeholder="Amount (USDC)"
			bind:value={amount}
			inputmode="decimal"
		/>

		<Button.Root type="submit" disabled={!selectedAddress || !amount.trim()}>
			Request Transfer
		</Button.Root>
	</form>

	{#if incoming.length > 0}
		<h4>Incoming Requests</h4>
		{#each incoming as request (request.id)}
			<div data-request>
				<Address network={1} address={request.from} />
				<span>
					requested {request.allocations[0]?.amount ?? '0'} {request.allocations[0]?.asset ?? 'usdc'}
				</span>
				<Button.Root type="button" onclick={() => acceptRequest(request.id)}>Accept</Button.Root>
				<Button.Root type="button" onclick={() => rejectRequest(request.id)}>Reject</Button.Root>
			</div>
		{/each}
	{/if}

	{#if outgoing.length > 0}
		<h4>Outgoing Requests</h4>
		{#each outgoing as request (request.id)}
			<div data-request>
				<Address network={1} address={request.to} />
				<span>
					{request.allocations[0]?.amount ?? '0'} {request.allocations[0]?.asset ?? 'usdc'} ({request.status})
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
		<p data-error role="alert">{sendError}</p>
	{/if}
</section>


<style>
	[data-transfer-requests] h3, [data-transfer-requests] h4 { margin: 0.5rem 0; }
	[data-available-balance] { margin-bottom: 0.5rem; }
	[data-transfer-requests] form { display: flex; flex-direction: column; gap: 0.5rem; max-width: 20rem; }
	[data-request] { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin: 0.5rem 0; }
	[data-error] { color: var(--color-error, red); }
</style>
