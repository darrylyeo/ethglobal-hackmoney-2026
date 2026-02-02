<script lang="ts">
	// Types/constants
	import type { EIP1193Provider } from '$/lib/siwe'

	// Props
	let {
		roomId,
		addresses,
		provider,
	}: {
		roomId: string
		addresses: `0x${string}`[]
		provider: EIP1193Provider | null
	} = $props()

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { sharedAddressesCollection } from '$/collections/shared-addresses'
	import { roomState } from '$/state/room.svelte'

	const mySharedQuery = useLiveQuery(
		(q) => q
			.from({ row: sharedAddressesCollection })
			.where(({ row }) => eq(row.roomId, roomId))
			.select(({ row }) => ({ row })),
		[() => roomId],
	)

	const myShared = $derived(
		(mySharedQuery.data ?? [])
			.map((r) => r.row)
			.filter((s) => s.peerId === roomState.peerId),
	)

	const isShared = (addr: `0x${string}`) => (
		myShared.some((s) => s.address.toLowerCase() === addr.toLowerCase())
	)

	const shareAddress = (address: `0x${string}`) => {
		roomState.connection?.send({ type: 'share-address', address })
	}

	// Components
	import Address from '$/components/Address.svelte'
	import { Button } from 'bits-ui'
</script>

<section data-my-addresses>
	<h3>My addresses</h3>
	{#if addresses.length === 0}
		<p>Connect a wallet to share addresses.</p>
	{:else}
		<ul>
			{#each addresses as address (address)}
				{@const shared = isShared(address)}
				<li data-address>
					<Address network={1} address={address} />
					<Button.Root
						type="button"
						onclick={() => shareAddress(address)}
						disabled={shared}
					>
						{shared ? 'Shared' : 'Share'}
					</Button.Root>
				</li>
			{/each}
		</ul>
	{/if}
</section>
