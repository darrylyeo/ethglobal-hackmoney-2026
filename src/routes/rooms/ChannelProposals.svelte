<script lang="ts">
	// Props
	let { roomId }: { roomId: string } = $props()

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { channelProposalsCollection } from '$/collections/channel-proposals'
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

	// Components
	import Address from '$/components/Address.svelte'
	import { Button, Select } from 'bits-ui'
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
		<Select.Root
			type="single"
			value={selectedAddress ?? ''}
			onValueChange={(v) => { selectedAddress = v ? (v as `0x${string}`) : null }}
			items={otherVerified.map((s) => ({ value: s.address, label: s.address }))}
		>
			<Select.Trigger>Select participant</Select.Trigger>
			<Select.Portal>
				<Select.Content>
					<Select.Viewport>
						{#each otherVerified as shared (shared.id)}
							<Select.Item value={shared.address} label={shared.address}>
								<Address network={1} address={shared.address} />
							</Select.Item>
						{/each}
					</Select.Viewport>
				</Select.Content>
			</Select.Portal>
		</Select.Root>

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

		<Button type="submit" disabled={!selectedAddress || !myDeposit}>
			Propose Channel
		</Button>
	</form>

	{#if incoming.length > 0}
		<h4>Incoming Proposals</h4>
		{#each incoming as proposal (proposal.id)}
			<div data-proposal>
				<Address network={1} address={proposal.from} />
				<span>
					wants to open {formatSmallestToDecimal(proposal.fromDeposit, 6)} / {formatSmallestToDecimal(proposal.toDeposit, 6)} USDC channel
				</span>
				<Button onclick={() => acceptProposal(proposal.id)}>Accept</Button>
				<Button onclick={() => rejectProposal(proposal.id)}>Reject</Button>
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
