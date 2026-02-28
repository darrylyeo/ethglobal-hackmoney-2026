<script lang="ts">
	// Types/constants
	import type { WithSource } from '$/constants/data-sources.ts'
	import type { SiweChallenge } from '$/data/SiweChallenge.ts'
	import type { EIP1193Provider } from '$/lib/rooms/siwe.ts'
	import { DataSourceId } from '$/constants/data-sources.ts'


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
	import { siweChallengesCollection } from '$/collections/SiweChallenges.ts'
	import { roomState } from '$/state/room.svelte.ts'
	import { signSiweMessage } from '$/lib/rooms/siwe.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'

	const challengesQuery = useLiveQuery(
		(q) =>
			q
				.from({ siweChallenge: siweChallengesCollection })
				.where(({ siweChallenge }) => eq(siweChallenge.roomId, roomId))
				.select(({ siweChallenge }) => ({ siweChallenge })),
		[() => roomId],
	)
	registerLocalLiveQueryStack(() => [
		{ id: 'pending-signatures-challenges', label: 'SIWE Challenges', query: challengesQuery },
	])

	const pendingChallenges = $derived(
		(challengesQuery.data ?? [])
			.map(({ siweChallenge }) => siweChallenge)
			.filter(
				(ch: SiweChallengeRow) =>
					ch.toPeerId === roomState.peerId && !ch.verified && !ch.signature,
			)
	)

	const canSign = $derived(
		provider != null
	)
	const signChallenge = async (challenge: WithSource<SiweChallenge>) => {
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
	import Address from '$/views/Address.svelte'
	import { Button } from 'bits-ui'
</script>


{#if pendingChallenges.length > 0}
	<section data-pending-signatures>
		<h3>
			Pending signatures
		</h3>
		<ul>
			{#each pendingChallenges as ch (ch.id)}
				<li data-challenge>
					<Address actorId={{ $network: { chainId: 1 }, address: ch.address }} />
					<span>
						Requested by {ch.fromPeerId.slice(0, 8)}
					</span>
					{#if canSign}
						<Button.Root
							type="button"
							onclick={() => signChallenge(ch)}
							>
							Sign
						</Button.Root>
					{:else}
						<span data-unverifiable>
							Unverifiable (read-only wallet)
						</span>
						<Button.Root
							type="button"
							onclick={() => markUnverifiable(ch.id)}
							>
							Mark unverifiable
						</Button.Root>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}
