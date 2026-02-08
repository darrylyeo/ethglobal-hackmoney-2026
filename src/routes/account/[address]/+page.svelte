<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { ercTokens } from '$/constants/coins.ts'
	import { fetchAllBalancesForAddress } from '$/collections/actor-coins.ts'
	import { verificationsCollection } from '$/collections/verifications.ts'
	import { walletConnectionsCollection } from '$/collections/wallet-connections.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import LocalGraphScene from '$/components/LocalGraphScene.svelte'


	// Context
	import { resolve } from '$app/paths'


	// Props
	let { data }: { data: { addressParam: string } } = $props()


	// Functions
	import { formatAddress, parseAccountAddressParam } from '$/lib/address.ts'
	import { getAddressUrl } from '$/constants/explorers.ts'


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
				.where(({ row }) => eq(row.$source, DataSource.Local))
				.select(({ row }) => ({ row })),
		[],
	)
	const verificationsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: verificationsCollection })
				.where(({ row }) => eq(row.$source, DataSource.PartyKit))
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
						v.status === 'verified' &&
						v.address.toLowerCase() === normalizedAddress.toLowerCase(),
				)),
	)


	// Components
	import { AddressFormat } from '$/components/Address.svelte'
	import EvmActor from '$/components/EvmActor.svelte'
	import WatchButton from '$/components/WatchButton.svelte'
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


<main data-column="gap-2">
	{#if !parsed}
		<h1>Invalid address</h1>
		<p>The address in the URL could not be parsed.</p>
	{:else}
		<header data-column="gap-2">
			<div data-row="wrap gap-4 align-center">
				<h1 data-orient="vertical">
					<EvmActor
						network={parsed.chainId ?? 1}
						address={parsed.address}
						format={AddressFormat.Full}
						vertical
					/>
				</h1>
				<span data-text="annotation">Account</span>
				<WatchButton
					entityType={EntityType.Actor}
					id={parsed.interopAddress ?? parsed.address}
					label={formatAddress(parsed.address)}
					href={resolve(`/account/${data.addressParam}`)}
					{autoWatched}
				/>
			</div>
			<nav data-row="wrap gap-2">
				{#if parsed.interopAddress}
					<code class="interop">{parsed.interopAddress}</code>
				{/if}
				<button
					type="button"
					class="copy-btn"
					title="Copy address"
					onclick={() => {
						navigator.clipboard.writeText(parsed.address)
					}}
				>
					Copy
				</button>
				{#if parsed.chainId}
					{@const explorerUrl = getAddressUrl(parsed.chainId, parsed.address)}
					{#if explorerUrl}
						<a
							href={explorerUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="explorer-link"
						>
							View on explorer
						</a>
					{/if}
				{/if}
			</nav>
		</header>

		<div data-grid="columns-autofit column-min-16 gap-6">
			<CoinBalances selectedActor={normalizedAddress} {balanceTokens} />
			<Transactions selectedActor={normalizedAddress} />
			<WalletConnections selectedActor={normalizedAddress} />
			<RoomConnections selectedActor={normalizedAddress} />
			<LiquidityPositions selectedActor={normalizedAddress} />
			<Channels selectedActor={normalizedAddress} />
			<section data-scroll-item>
				<LocalGraphScene />
			</section>
		</div>
	{/if}
</main>


<style>
	.copy-btn,
	.explorer-link {
		font-size: 0.85em;
		padding: 0.2rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-subtle);
		color: inherit;
		text-decoration: none;
		cursor: pointer;
	}

	.copy-btn:hover,
	.explorer-link:hover {
		background: var(--color-border);
	}
</style>
