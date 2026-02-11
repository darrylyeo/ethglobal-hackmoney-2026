<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { VerificationStatus } from '$/data/Verification.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { ercTokens } from '$/constants/coins.ts'
	import { fetchAllBalancesForAddress } from '$/collections/ActorCoins.ts'
	import { siweVerificationsCollection } from '$/collections/SiweVerifications.ts'
	import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Context
	import { resolve } from '$app/paths'


	// Props
	let { data }: { data: { addressParam: string } } = $props()


	// Functions
	import { formatAddress, parseAccountAddressParam } from '$/lib/address.ts'


	// (Derived)
	const parsed = $derived(parseAccountAddressParam(data.addressParam))
	const normalizedAddress = $derived(parsed?.address ?? null)


	// State
	const balanceTokens = $derived(
		ercTokens.map((t) => ({ chainId: t.chainId, tokenAddress: t.address })),
	)
	$effect(() => {
		if (!normalizedAddress) return
		void fetchAllBalancesForAddress(normalizedAddress, undefined, ercTokens)
	})
	const connectionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: walletConnectionsCollection })
				.select(({ row }) => ({ row })),
		[],
	)
	const verificationsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: siweVerificationsCollection })
				.select(({ row }) => ({ row })),
		[],
	)
	registerLocalLiveQueryStack(() => [
		{ id: 'account-connections', label: 'Wallet Connections', query: connectionsQuery },
		{ id: 'account-verifications', label: 'Verifications', query: verificationsQuery },
	])
	const connectionsForAccount = $derived(
		normalizedAddress
			? (connectionsQuery.data ?? [])
					.map((r) => r.row)
					.filter((c) =>
						c.actors.some(
							(a) => a.toLowerCase() === normalizedAddress.toLowerCase(),
						),
					)
			: [],
	)
	const verificationsList = $derived(
		(verificationsQuery.data ?? []).map((r) => r.row),
	)
	const autoWatched = $derived(
		connectionsForAccount.some((c) => c.status === 'connected') ||
			(normalizedAddress != null &&
				verificationsList.some(
					(v) =>
						v.status === VerificationStatus.Verified &&
						v.address.toLowerCase() === normalizedAddress.toLowerCase(),
				)),
	)
	const idSerialized = $derived(parsed?.interopAddress ?? parsed?.address ?? '')
	const metadata = $derived(
		parsed?.interopAddress
			? [{ term: 'Interop', detail: parsed.interopAddress }]
			: [],
	)


	// Components
	import { AddressFormat } from '$/views/Address.svelte'
	import Boundary from '$/components/Boundary.svelte'
	import EntityView from '$/components/EntityView.svelte'
	import EvmActor from '$/views/EvmActor.svelte'
	import Channels from '$/views/Channels.svelte'
	import CoinBalances from '$/views/CoinBalances.svelte'
	import LiquidityPositions from '$/views/LiquidityPositions.svelte'
	import RoomConnections from '$/views/RoomConnections.svelte'
	import Transactions from '$/views/Transactions.svelte'
	import WalletConnections from '$/views/WalletConnections.svelte'
</script>


<svelte:head>
	<title>
		{parsed ? `Account ${formatAddress(parsed.address)}` : 'Account'}
	</title>
</svelte:head>


<main data-column="gap-4">
	{#if !parsed}
		<h1>Invalid address</h1>
		<p>The address in the URL could not be parsed.</p>
	{:else}
		<EntityView
			entityType={EntityType.Actor}
			idSerialized={idSerialized}
			href={resolve(`/account/${data.addressParam}`)}
			label={formatAddress(parsed.address)}
			{metadata}
			annotation="Account"
			{autoWatched}
		>
			{#snippet Title()}
				<EvmActor
					network={parsed.chainId ?? 1}
					address={parsed.address}
					format={AddressFormat.Full}
					vertical
				/>
			{/snippet}

			<Boundary>
				<CoinBalances
					selectedActor={normalizedAddress}
					{balanceTokens}
					availableAccounts={normalizedAddress ? [normalizedAddress] : []}
				/>
			</Boundary>
			<Boundary>
				<Transactions selectedActor={normalizedAddress} />
			</Boundary>
			<Boundary>
				<WalletConnections selectedActor={normalizedAddress} />
			</Boundary>
			<Boundary>
				<RoomConnections selectedActor={normalizedAddress} />
			</Boundary>
			<Boundary>
				<LiquidityPositions selectedActor={normalizedAddress} />
			</Boundary>
			<Boundary>
				<Channels selectedActor={normalizedAddress} />
			</Boundary>
		</EntityView>
	{/if}
</main>
