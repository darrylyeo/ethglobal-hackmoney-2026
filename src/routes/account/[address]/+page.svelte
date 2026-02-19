<script lang="ts">
	// Types/constants
	import {
		ensureIdentityLink,
		identityLinkKey,
		identityLinks,
	} from '$/collections/IdentityLinks.ts'
	import { ChainId } from '$/constants/chain-id.ts'
	import { IdentityInputKind } from '$/constants/identity-resolver.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { ercTokens } from '$/constants/coins.ts'
	import { siweVerificationsCollection } from '$/collections/SiweVerifications.ts'
	import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { getFidByAddress } from '$/api/farcaster.ts'
	import { dedupeInFlight } from '$/lib/dedupeInFlight.ts'
	import { normalizeIdentity } from '$/api/identity-resolve.ts'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'


	// Functions
	import { formatAddress, parseAccountAddressParam } from '$/lib/address.ts'


	// (Derived)
	const addressParam = $derived(page.params.address ?? '')
	const parsed = $derived(parseAccountAddressParam(addressParam))
	const identityKind = $derived(normalizeIdentity(addressParam).kind)
	const isEnsName = $derived(identityKind === IdentityInputKind.EnsName)
	// State
	const identityLinkQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: identityLinks })
				.where(({ row }) =>
					eq(row.id, identityLinkKey(ChainId.Ethereum, addressParam)),
				)
				.select(({ row }) => ({ row })),
		[() => [addressParam]],
	)
	$effect(() => {
		if (parsed ?? !isEnsName) return
		ensureIdentityLink(ChainId.Ethereum, addressParam)
	})
	const linkRow = $derived(identityLinkQuery.data?.[0]?.row)
	const effectiveParsed = $derived(
		parsed ??
			(linkRow?.address
				? {
						address: linkRow.address,
						chainId: linkRow.chainId ?? ChainId.Ethereum,
						interopAddress: linkRow.interopAddress,
					}
				: null),
	)
	const ensLoading = $derived(
		parsed == null && isEnsName && (!linkRow || linkRow.isLoading),
	)
	const normalizedAddress = $derived(effectiveParsed?.address ?? null)

	let farcasterFid = $state<number | null | undefined>(undefined)
	$effect(() => {
		const addr = normalizedAddress
		if (!addr) {
			farcasterFid = undefined
			return
		}
		farcasterFid = undefined
		dedupeInFlight(`fidByAddress:${addr}`, () => getFidByAddress(addr))
			.then((fid) => {
				if (normalizedAddress !== addr) return
				farcasterFid = fid
			})
			.catch(() => {
				if (normalizedAddress !== addr) return
				farcasterFid = null
			})
	})


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
		normalizedAddress != null
			? (connectionsQuery.data ?? [])
					.map((r) => r.row)
					.filter((c) =>
						c.actors.some((a) => a === normalizedAddress),
					)
			: [],
	)
	const idSerialized = $derived(
		effectiveParsed?.interopAddress ?? effectiveParsed?.address ?? '',
	)
	const metadata = $derived(
		effectiveParsed?.interopAddress
			? [{ term: 'Interop', detail: effectiveParsed.interopAddress }]
			: [],
	)


	// Components
	import { AddressFormat } from '$/views/Address.svelte'
	import Boundary from '$/components/Boundary.svelte'
	import EntityView from '$/components/EntityView.svelte'
	import EntityViewSkeleton from '$/components/EntityViewSkeleton.svelte'
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
		{effectiveParsed
			? `Account ${formatAddress(effectiveParsed.address)}`
			: 'Account'}
	</title>
</svelte:head>


<main>
	{#if ensLoading}
		<EntityViewSkeleton />
	{:else if !effectiveParsed}
		<h1>Invalid address</h1>
		<p>The address in the URL could not be parsed.</p>
	{:else}
		<EntityView
			entityType={EntityType.Actor}
			entityId={{
				$network: { chainId: (effectiveParsed.chainId ?? 1) as import('$/data/Network.ts').Network$Id['chainId'] },
				address: effectiveParsed.address,
				...(effectiveParsed.interopAddress != null
					? { interopAddress: effectiveParsed.interopAddress }
					: {}),
			}}
			idSerialized={idSerialized}
			href={resolve(`/account/${addressParam}`)}
			label={formatAddress(effectiveParsed.address)}
			{metadata}
			annotation="Account"
		>
			{#snippet Title()}
				<EvmActor
					network={{ chainId: (effectiveParsed.chainId ?? 1) }}
					address={effectiveParsed.address}
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
					<Transactions
						selectedActor={normalizedAddress ?? undefined}
					/>
				</Boundary>
				<Boundary>
					<LiquidityPositions
						selectedActor={normalizedAddress ?? undefined}
					/>
				</Boundary>
				<Boundary>
					<VerifiedContractSource
						chainId={effectiveParsed.chainId ?? 1}
						address={effectiveParsed.address}
					/>
				</Boundary>
				<Boundary>
					<AccountContracts selectedActor={normalizedAddress} />
				</Boundary>
			</section>

			<section data-column="gap-2">
				{#if farcasterFid != null && farcasterFid > 0}
					<Boundary>
						<p>
							<a href="/farcaster/user/{farcasterFid}">Farcaster profile @{farcasterFid}</a>
						</p>
					</Boundary>
				{/if}
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
