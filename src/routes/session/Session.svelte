<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/WalletConnections.ts'
	import type { Session } from '$/data/Session.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { ercTokens } from '$/constants/coins.ts'
	import { NetworkType, networks } from '$/constants/networks.ts'


	// Context
	import { resolve } from '$app/paths'
	import { networkEnvironmentState } from '$/state/network-environment.svelte.ts'
	import { NetworkEnvironment } from '$/constants/network-environment.ts'


	// Props
	let {
		onPersist,
		session = $bindable(),
	}: {
		onPersist?: () => void
		session: Session
	} = $props()


	// Functions
	import { stringify } from 'devalue'
	import { fetchAllBalancesForAddress } from '$/collections/ActorCoins.ts'
	import {
		buildSessionPath,
		formatSessionPlaceholderName,
	} from '$/lib/session/sessions.ts'


	// State
	let persisted = $state(false)
	let initialSnapshot = $state<string | null>(null)
	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let selectedChainId = $state<number | null>(null)
	let balanceTokens = $state<
		{ chainId: number; tokenAddress: `0x${string}` }[]
	>([])

	// (Derived)
	const isTestnet = $derived(
		networkEnvironmentState.current === NetworkEnvironment.Testnet,
	)
	const filteredNetworks = $derived(
		networks.filter((n) =>
			isTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)
	const defaultBalanceTokens = $derived(
		ercTokens
			.filter((t) => filteredNetworks.some((n) => n.id === t.chainId))
			.map((t) => ({ chainId: t.chainId, tokenAddress: t.address })),
	)
	const balanceTokensToFetch = $derived(
		balanceTokens.length > 0
			? balanceTokens.flatMap((t) => {
					const e = ercTokens.find(
						(e) =>
							e.chainId === t.chainId &&
							e.address.toLowerCase() ===
								t.tokenAddress.toLowerCase(),
					)
					return e ? [e] : []
				})
			: ercTokens.filter((t) =>
					filteredNetworks.some((n) => n.id === t.chainId),
				),
	)
	const effectiveBalanceTokens = $derived(
		balanceTokens.length > 0 ? balanceTokens : defaultBalanceTokens,
	)

	$effect(() => {
		if (!selectedActor || balanceTokensToFetch.length === 0) return
		void fetchAllBalancesForAddress(
			selectedActor,
			undefined,
			balanceTokensToFetch,
		)
	})

	$effect(() => {
		if (persisted || !onPersist) return
		const snapshot = stringify({
			actions: session.actions,
			params: session.params,
			name: session.name,
		})
		if (initialSnapshot === null) {
			initialSnapshot = snapshot
			return
		}
		if (snapshot !== initialSnapshot) {
			persisted = true
			onPersist()
		}
	})
	const placeholderName = $derived(formatSessionPlaceholderName(session.actions))
	const displayLabel = $derived(session.name || placeholderName)

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import AccountsSelect from '$/views/AccountsSelect.svelte'
	import CoinBalances from '$/views/CoinBalances.svelte'
	import ActionsSequence from './ActionsSequence.svelte'
</script>


<div
	data-session
	data-column="gap-4"
	data-sticky-container
>
	<EntityView
		data-scroll-item
		entityType={EntityType.Session}
		idSerialized={session.id}
		href={resolve(buildSessionPath(session.id))}
		label={displayLabel}
		annotation="Session"
		hasAnchorTitle={false}
	>
		{#snippet Title()}
			<span class="sr-only">Session</span>
			<input
				type="text"
				class="session-name-input"
				bind:value={session.name}
				placeholder={placeholderName}
				aria-label="Session name"
			/>
		{/snippet}
		<details open data-card>
			<summary>
				<header data-row="wrap gap-2">
					<AccountsSelect
						bind:connectedWallets
						bind:selectedActor
						bind:selectedChainId
					/>
				</header>
			</summary>
			<div data-column>
				<CoinBalances
					{selectedActor}
					balanceTokens={effectiveBalanceTokens}
					availableAccounts={connectedWallets
						.map((w) => w.connection.activeActor)
						.filter((a): a is `0x${string}` => a != null)}
				/>
			</div>
		</details>
	</EntityView>

	<section data-scroll-item data-column="gap-4">
		<ActionsSequence
			bind:actions={session.actions}
			{connectedWallets}
			{selectedActor}
			{selectedChainId}
			{isTestnet}
			sessionId={session.id}
		/>
	</section>
</div>


<style>
	.session-name-input:placeholder-shown:not(:focus) {
		border: none;
		background: transparent;
		padding: 0;
		box-shadow: none;
		outline: none;
	}

	.session-name-input:placeholder-shown:not(:focus)::placeholder {
		color: inherit;
	}
</style>
