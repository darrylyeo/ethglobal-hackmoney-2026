<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { ercTokens } from '$/constants/coins.ts'
	import { siweVerificationsCollection } from '$/collections/SiweVerifications.ts'
	import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'


	// Functions
	import { formatAddress, parseAccountAddressParam } from '$/lib/address.ts'


	// (Derived)
	const addressParam = $derived(page.params.address ?? '')
	const parsed = $derived(parseAccountAddressParam(addressParam))
	const normalizedAddress = $derived(parsed?.address ?? null)


	// State
	const balanceTokens = $derived(
		ercTokens.map((t) => ({ chainId: t.chainId, tokenAddress: t.address })),
	)
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
							(a) => a === normalizedAddress,
						),
					)
			: [],
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
	import Heading from '$/components/Heading.svelte'
	import EvmActor from '$/views/EvmActor.svelte'
	import Channels from '$/views/Channels.svelte'
	import CoinBalances from '$/views/CoinBalances.svelte'
	import LiquidityPositions from '$/views/LiquidityPositions.svelte'
	import RoomConnections from '$/views/RoomConnections.svelte'
	import Transactions from '$/views/Transactions.svelte'
	import AccountContracts from '$/views/AccountContracts.svelte'
	import VerifiedContractSource from '$/views/VerifiedContractSource.svelte'
	import WalletConnections from '$/views/WalletConnections.svelte'
</script>


<svelte:head>
	<title>
		{parsed ? `Account ${formatAddress(parsed.address)}` : 'Account'}
	</title>
</svelte:head>


<main>
	{#if !parsed}
		<h1>Invalid address</h1>
		<p>The address in the URL could not be parsed.</p>
	{:else}
		<EntityView
			entityType={EntityType.Actor}
			entityId={{
				$network: { chainId: (parsed.chainId ?? 1) as import('$/data/Network.ts').Network$Id['chainId'] },
				address: parsed.address,
				...(parsed.interopAddress != null ? { interopAddress: parsed.interopAddress } : {}),
			}}
			idSerialized={idSerialized}
			href={resolve(`/account/${addressParam}`)}
			label={formatAddress(parsed.address)}
			{metadata}
			annotation="Account"
		>
			{#snippet Title()}
				<EvmActor
					network={parsed.chainId ?? 1}
					address={parsed.address}
					format={AddressFormat.Full}
					isVertical
				/>
			{/snippet}

			<section data-column="gap-2">
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
					<LiquidityPositions selectedActor={normalizedAddress} />
				</Boundary>
				<Boundary>
					<VerifiedContractSource
						chainId={parsed.chainId ?? 1}
						address={parsed.address}
					/>
				</Boundary>
				<Boundary>
					<AccountContracts selectedActor={normalizedAddress} />
				</Boundary>
			</section>

			<section data-column="gap-2">
				<Boundary>
					<WalletConnections selectedActor={normalizedAddress} />
				</Boundary>
				<Boundary>
					<RoomConnections selectedActor={normalizedAddress} />
				</Boundary>
				<Boundary>
					<Channels selectedActor={normalizedAddress} />
				</Boundary>
			</section>
		</EntityView>
	{/if}
</main>
