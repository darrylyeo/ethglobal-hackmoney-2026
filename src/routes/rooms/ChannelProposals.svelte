<script lang="ts">
	// Props
	let { roomId }: { roomId: string } = $props()

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { channelProposalsCollection } from '$/collections/channel-proposals'
	import type { SharedAddress } from '$/collections/shared-addresses'
	import { sharedAddressesCollection } from '$/collections/shared-addresses'
	import { yellowDepositsCollection } from '$/collections/yellow-deposits'
	import { roomState } from '$/state/room.svelte'
	import { yellowState } from '$/state/yellow.svelte'
	import { formatSmallestToDecimal } from '$/lib/format'

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
	const incomingQuery = useLiveQuery(
		(q) => q
			.from({ row: channelProposalsCollection })
			.where(({ row }) => eq(row.roomId, roomId))
			.select(({ row }) => ({ row })),
		[() => roomId],
	)
	const outgoingQuery = useLiveQuery(
		(q) => q
			.from({ row: channelProposalsCollection })
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
			? (incomingQuery.data ?? []).map((r) => r.row).filter((p) => p.to.toLowerCase() === myAddress && p.status === 'pending')
			: [],
	)
	const outgoing = $derived(
		myAddress
			? (outgoingQuery.data ?? []).map((r) => r.row).filter((p) => p.from.toLowerCase() === myAddress && p.status === 'pending')
			: [],
	)

	let selectedAddress = $state<`0x${string}` | null>(null)
	let myDeposit = $state('')
	let theirDeposit = $state('')

	const proposeChannel = () => {
		if (!selectedAddress) return
		roomState.connection?.send({
			type: 'propose-channel',
			to: selectedAddress,
			myDeposit,
			theirDeposit,
		})
		myDeposit = ''
		theirDeposit = ''
		selectedAddress = null
	}

	const acceptProposal = (proposalId: string) => {
		roomState.connection?.send({ type: 'accept-channel', proposalId })
	}

	const rejectProposal = (proposalId: string) => {
		roomState.connection?.send({ type: 'reject-channel', proposalId })
	}

	const isHexAddress = (value: string): value is `0x${string}` => (
		value.startsWith('0x')
	)

	// Components
	import Address from '$/components/Address.svelte'
	import Select from '$/components/Select.svelte'
	import { Button } from 'bits-ui'
</script>

<section data-channel-proposals>
	<h3>Open Channel</h3>

	<div data-available-balance>
		Available: {formatSmallestToDecimal(availableBalance, 6)} USDC
	</div>

	<form
		onsubmit={(e) => {
			e.preventDefault()
			proposeChannel()
		}}
	>
		{#snippet addressItem(shared: SharedAddress)}
			<Address network={1} address={shared.address} />
		{/snippet}

		<Select
			items={otherVerified}
			value={selectedAddress ?? ''}
			onValueChange={(v) => {
				selectedAddress = v && isHexAddress(v) ? v : null
			}}
			getItemId={(shared) => shared.address}
			getItemLabel={(shared) => shared.address}
			placeholder="Select participant"
			Item={addressItem}
		/>

		<input
			type="text"
			placeholder="My deposit (USDC)"
			bind:value={myDeposit}
			inputmode="decimal"
		/>
		<input
			type="text"
			placeholder="Their deposit (USDC)"
			bind:value={theirDeposit}
			inputmode="decimal"
		/>

		<Button.Root type="submit" disabled={!selectedAddress || !myDeposit}>
			Propose Channel
		</Button.Root>
	</form>

	{#if incoming.length > 0}
		<h4>Incoming Proposals</h4>
		{#each incoming as proposal (proposal.id)}
			<div data-proposal>
				<Address network={1} address={proposal.from} />
				<span>
					wants to open {formatSmallestToDecimal(proposal.fromDeposit, 6)} / {formatSmallestToDecimal(proposal.toDeposit, 6)} USDC channel
				</span>
				<Button.Root type="button" onclick={() => acceptProposal(proposal.id)}>Accept</Button.Root>
				<Button.Root type="button" onclick={() => rejectProposal(proposal.id)}>Reject</Button.Root>
			</div>
		{/each}
	{/if}
</section>

<style>
	[data-channel-proposals] h3, [data-channel-proposals] h4 { margin: 0.5rem 0; }
	[data-available-balance] { margin-bottom: 0.5rem; }
	[data-channel-proposals] form { display: flex; flex-direction: column; gap: 0.5rem; max-width: 20rem; }
	[data-proposal] { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin: 0.5rem 0; }
</style>
