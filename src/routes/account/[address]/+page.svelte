<script lang="ts">
	// Types/constants
	import { getFidByAddress } from '$/api/farcaster/hub.ts'
	import { normalizeIdentity } from '$/api/identity-resolve.ts'
	import {
		ensureIdentityLink,
		identityLinkKey,
		identityLinks,
	} from '$/collections/IdentityLinks.ts'
	import { siweVerificationsCollection } from '$/collections/SiweVerifications.ts'
	import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
	import { erc20Instances } from '$/constants/coin-instances.ts'
	import { IdentityInputKind } from '$/constants/identity-resolver.ts'
	import { ChainId } from '$/constants/networks.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { formatAddress, parseAccountAddressParam } from '$/lib/address.ts'
	import { singleFlight } from '$/lib/singleFlight.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'

	// Context
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { page } from '$app/state'

	// (Derived)
	const addrParam = $derived(
		page.params.address ?? ''
	)
	const isEnsName = $derived(
		normalizeIdentity(addrParam).kind === IdentityInputKind.EnsName
	)
	const parsed = $derived(
		parseAccountAddressParam(addrParam)
	)


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

	// (Derived)
	const link = $derived(
		identityLinkQuery.data?.[0]?.row
	)
	const account = $derived(
		parsed
		?? (link?.address
			? {
				address: link.address,
				chainId: link.chainId ?? ChainId.Ethereum,
				interopAddress: link.interopAddress,
			}
			: null)
	)
	const addr = $derived(
		account?.address ?? null
	)
	const actorId = $derived(
		account
			? {
				$network: { chainId: (account.chainId ?? 1) as import('$/data/Network.ts').Network$Id['chainId'] },
				address: account.address,
				...(account.interopAddress != null ?
					{ interopAddress: account.interopAddress }
					: {}),
			}
			: null
	)
	const contractId = $derived(
		account
			? {
				$network: { chainId: (account.chainId ?? 1) as import('$/data/Network.ts').Network$Id['chainId'] },
				address: account.address,
			}
			: null
	)
	const ensLoading = $derived(
		parsed == null
		&& isEnsName
		&& (!link || link.isLoading)
	)


	// State
	let farcasterFid = $state<number | null | undefined>(
		undefined,
	)


	// Actions
	$effect(() => {
		if (parsed ?? !isEnsName) return
		ensureIdentityLink(ChainId.Ethereum, addrParam)
	})
	$effect(() => {
		if (!account?.address || !isEnsName || addrParam === account.address) return
		goto(resolve(`/account/${account.address}`), { replaceState: true })
	})
	$effect(() => {
		const a = addr
		if (!a) {
			farcasterFid = undefined
			return
		}
		farcasterFid = undefined
		singleFlight(getFidByAddress)(a)
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
	import EntityView from '$/components/EntityView.svelte'
	import EntityViewSkeleton from '$/components/EntityViewSkeleton.svelte'
	import Collapsible from '$/components/Collapsible.svelte'
	import AccountContracts from '$/views/AccountContracts.svelte'
	import { AddressFormat } from '$/views/Address.svelte'
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
			entityId={actorId!}
			titleHref={resolve(`/account/${addrParam}`)}
			label={formatAddress(account.address)}
			metadata={account?.interopAddress ?
				[{ term: 'Interop', detail: account.interopAddress }]
				: []}
			annotation="Account"
		>
			{#snippet Title()}
				<EvmActor
					actorId={actorId}
					format={AddressFormat.Full}
					isVertical
				/>
			{/snippet}

			<div data-column>
				<section>
					<CoinBalances
						actorId={actorId}
						balanceTokens={erc20Instances.map((t) => ({
							chainId: t.$id.$network.chainId,
							tokenAddress: t.$id.address,
						}))}
					/>
				</section>

				<section>
					<Transactions actorId={actorId ?? undefined} />
				</section>

				<section>
					<LiquidityPositions actorId={actorId ?? undefined} />
				</section>

				<section>
					{#if contractId}
						<VerifiedContractSource contractId={contractId} />
					{/if}
				</section>

				<section>
					<AccountContracts actorId={actorId} />
				</section>
			</div>

			<div data-column>
				{#if farcasterFid != null && farcasterFid > 0}
					<Collapsible title="Farcaster">
						<p>
							<a href="/farcaster/user/{farcasterFid}">Farcaster profile @{farcasterFid}</a>
						</p>
					</Collapsible>
				{/if}

				<section>
					<WalletConnections actorId={actorId} />
				</section>

				<section>
					<RoomConnections actorId={actorId} />
				</section>

				<section>
					<Channels actorId={actorId} />
				</section>
			</div>
		</EntityView>
	{/if}
</main>
