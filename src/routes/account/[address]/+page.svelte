<script lang="ts">
	// Types/constants
	import { getFidByAddress } from '$/api/farcaster/index.ts'
	import { normalizeIdentity } from '$/api/identity-resolve.ts'
	import {
		ensureIdentityLink,
		identityLinkKey,
		identityLinks,
	} from '$/collections/IdentityLinks.ts'
	import { siweVerificationsCollection } from '$/collections/SiweVerifications.ts'
	import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
	import { ercTokens } from '$/constants/coins.ts'
	import { IdentityInputKind } from '$/constants/identity-resolver.ts'
	import { ChainId } from '$/constants/networks.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { dedupeInFlight } from '$/lib/dedupeInFlight.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'


	// Functions
	import { formatAddress, parseAccountAddressParam } from '$/lib/address.ts'


	// (Derived)
	const addrParam = $derived(page.params.address ?? '')
	const isEnsName = $derived(
		normalizeIdentity(addrParam).kind === IdentityInputKind.EnsName,
	)
	const parsed = $derived(parseAccountAddressParam(addrParam))


	// Context
	const identityLinkQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: identityLinks })
				.where(({ row }) =>
					eq(row.id, identityLinkKey(ChainId.Ethereum, addrParam)),
				)
				.select(({ row }) => ({ row })),
		[() => [addrParam]],
	)


	// (Derived)
	const link = $derived(identityLinkQuery.data?.[0]?.row)
	const account = $derived(
		parsed
		?? (link?.address
			? {
				address: link.address,
				chainId: link.chainId ?? ChainId.Ethereum,
				interopAddress: link.interopAddress,
			}
			: null),
	)
	const addr = $derived(account?.address ?? null)
	const ensLoading = $derived(
		parsed == null
		&& isEnsName
		&& (!link || link.isLoading),
	)


	// State
	let farcasterFid = $state<number | null | undefined>(undefined)


	// Context
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


	// Actions
	$effect(() => {
		if (parsed ?? !isEnsName) return
		ensureIdentityLink(ChainId.Ethereum, addrParam)
	})
	$effect(() => {
		const a = addr
		if (!a) {
			farcasterFid = undefined
			return
		}
		farcasterFid = undefined
		dedupeInFlight(`fidByAddress:${a}`, () => getFidByAddress(a))
			.then((fid) => {
				if (addr !== a) return
				farcasterFid = fid
			})
			.catch(() => {
				if (addr !== a) return
				farcasterFid = null
			})
	})


	// Components
	import Boundary from '$/components/Boundary.svelte'
	import EntityView from '$/components/EntityView.svelte'
	import EntityViewSkeleton from '$/components/EntityViewSkeleton.svelte'
	import Heading from '$/components/Heading.svelte'
	import { AddressFormat } from '$/views/Address.svelte'
	import AccountContracts from '$/views/AccountContracts.svelte'
	import Channels from '$/views/Channels.svelte'
	import CoinBalances from '$/views/CoinBalances.svelte'
	import EvmActor from '$/views/EvmActor.svelte'
	import LiquidityPositions from '$/views/LiquidityPositions.svelte'
	import RoomConnections from '$/views/RoomConnections.svelte'
	import Transactions from '$/views/Transactions.svelte'
	import VerifiedContractSource from '$/views/VerifiedContractSource.svelte'
	import WalletConnections from '$/views/WalletConnections.svelte'
</script>


<svelte:head>
	<title>
		{account
			? `Account ${formatAddress(account.address)}`
			: 'Account'}
	</title>
</svelte:head>


<main>
	{#if ensLoading}
		<EntityViewSkeleton />
	{:else if !account}
		<h1>Invalid address</h1>
		<p>The address in the URL could not be parsed.</p>
	{:else}
		<EntityView
			entityType={EntityType.Actor}
			entityId={{
				$network: { chainId: (account.chainId ?? 1) as import('$/data/Network.ts').Network$Id['chainId'] },
				address: account.address,
				...(account.interopAddress != null
					? { interopAddress: account.interopAddress }
					: {}),
			}}
			idSerialized={account?.interopAddress ?? account?.address ?? ''}
			href={resolve(`/account/${addrParam}`)}
			label={formatAddress(account.address)}
			metadata={account?.interopAddress
				? [{ term: 'Interop', detail: account.interopAddress }]
				: []}
			annotation="Account"
		>
			{#snippet Title()}
				<EvmActor
					network={{ chainId: (account.chainId ?? 1) }}
					address={account.address}
					format={AddressFormat.Full}
					isVertical
				/>
			{/snippet}

			<section data-column="gap-2">
				<Boundary>
					<CoinBalances
						selectedActor={addr}
						balanceTokens={ercTokens.map((t) => ({ chainId: t.chainId, tokenAddress: t.address }))}
						availableAccounts={addr ? [addr] : []}
					/>
				</Boundary>
				<Boundary>
					<Transactions
						selectedActor={addr ?? undefined}
					/>
				</Boundary>
				<Boundary>
					<LiquidityPositions
						selectedActor={addr ?? undefined}
					/>
				</Boundary>
				<Boundary>
					<VerifiedContractSource
						chainId={account.chainId ?? 1}
						address={account.address}
					/>
				</Boundary>
				<Boundary>
					<AccountContracts selectedActor={addr} />
				</Boundary>
			</section>

			<section data-column="gap-2">
				{#if farcasterFid != null
					&& farcasterFid > 0}
					<Boundary>
						<p>
							<a href="/farcaster/user/{farcasterFid}">Farcaster profile @{farcasterFid}</a>
						</p>
					</Boundary>
				{/if}
				<Boundary>
					<WalletConnections selectedActor={addr} />
				</Boundary>
				<Boundary>
					<RoomConnections selectedActor={addr} />
				</Boundary>
				<Boundary>
					<Channels selectedActor={addr} />
				</Boundary>
			</section>
		</EntityView>
	{/if}
</main>
