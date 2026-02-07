<script lang="ts">


	// Types/constants
	import type { SiweChallengeRow } from '$/collections/siwe-challenges.ts'
	import type { EIP1193Provider } from '$/lib/rooms/siwe.ts'
	import { DataSource } from '$/constants/data-sources.ts'


	// Props
	let {
		roomId,
		provider,
	}: {
		roomId: string
		provider: EIP1193Provider | null
	} = $props()


	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { siweChallengesCollection } from '$/collections/siwe-challenges.ts'
	import { roomState } from '$/state/room.svelte'
	import { signSiweMessage } from '$/lib/rooms/siwe.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'

	const challengesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: siweChallengesCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
				.where(({ row }) => eq(row.roomId, roomId))
				.select(({ row }) => ({ row })),
		[() => roomId],
	)
	registerLocalLiveQueryStack(() => [
		{ id: 'pending-signatures-challenges', label: 'SIWE Challenges', query: challengesQuery },
	])

	const pendingChallenges = $derived(
		(challengesQuery.data ?? [])
			.map((r) => r.row)
			.filter(
				(ch: SiweChallengeRow) =>
					ch.toPeerId === roomState.peerId && !ch.verified && !ch.signature,
			),
	)

	const canSign = $derived(provider != null)
	const signChallenge = async (challenge: SiweChallengeRow) => {
		if (!provider) return
		try {
			const signature = await signSiweMessage({
				provider,
				message: challenge.message,
				address: challenge.address,
			})
			roomState.connection?.send({
				type: 'submit-signature',
				challengeId: challenge.id,
				signature,
			})
		} catch {
			// user rejected or error
		}
	}
	const markUnverifiable = (challengeId: string) => {
		roomState.connection?.send({ type: 'mark-unverifiable', challengeId })
	}


	// Components
	import Address from '$/components/Address.svelte'
	import { Button } from 'bits-ui'
</script>


{#if pendingChallenges.length > 0}
	<section data-pending-signatures>
		<h3>Pending signatures</h3>
		<ul>
			{#each pendingChallenges as ch (ch.id)}
				<li data-challenge>
					<Address network={1} address={ch.address} />
					<span>Requested by {ch.fromPeerId.slice(0, 8)}</span>
					{#if canSign}
						<Button.Root type="button" onclick={() => signChallenge(ch)}>
							Sign
						</Button.Root>
					{:else}
						<span data-unverifiable>Unverifiable (read-only wallet)</span>
						<Button.Root type="button" onclick={() => markUnverifiable(ch.id)}>
							Mark unverifiable
						</Button.Root>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}
