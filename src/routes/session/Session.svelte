<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/WalletConnections.ts'
	import type { Session } from '$/data/Session.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { erc20TokenByNetwork } from '$/constants/coin-instances.ts'
	import { NetworkType, networks } from '$/constants/networks.ts'


	// Context
	import { resolve } from '$app/paths'
	import { networkEnvironmentState } from '$/state/network-environment.svelte.ts'
	import { NetworkEnvironment } from '$/constants/network-environment.ts'


	// Props
	let {
		onPersist,
		pendingSessionCommand = null,
		session = $bindable(),
	}: {
		onPersist?: () => void
		pendingSessionCommand?: 'simulate' | 'execute' | null
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
	let persisted = $state(
		false
	)
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
		filteredNetworks.flatMap((n) =>
			(erc20TokenByNetwork.get(n.chainId) ?? []).map((t) => ({
				chainId: t.$id.$network.chainId,
				tokenAddress: t.$id.address,
			})),
		),
	)
	const balanceTokensToFetch = $derived(
		balanceTokens.length > 0
			? balanceTokens.flatMap((t) => {
					const e = erc20TokenByNetwork
						.get(t.chainId)
						?.find(
							(e) =>
								e.$id.address.toLowerCase() ===
								t.tokenAddress.toLowerCase(),
						)
					return e ? [e] : []
				})
			: filteredNetworks.flatMap(
					(n) => erc20TokenByNetwork.get(n.chainId) ?? [],
				),
	)
	const effectiveBalanceTokens = $derived(
		balanceTokens.length > 0 ? balanceTokens : defaultBalanceTokens,
	)
	const actorId = $derived(
		selectedActor && selectedChainId != null
			? ({
				$network: { chainId: selectedChainId },
				address: selectedActor,
			} as import('$/data/Actor.ts').Actor$Id)
			: null,
	)

	$effect(() => {
		if (!selectedActor || balanceTokensToFetch.length === 0) return
		void fetchAllBalancesForAddress(
			selectedActor,
			undefined,
			balanceTokensToFetch as unknown as Parameters<
				typeof fetchAllBalancesForAddress
			>[2],
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
	const placeholderName = $derived(
		formatSessionPlaceholderName(session.actions)
	)
	const displayLabel = $derived(
		session.name || placeholderName
	)

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
		entity={session}
		titleHref={false}
		label={displayLabel}
		annotation="Session"
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
				<header data-row="wrap">
					<AccountsSelect
						bind:connectedWallets
						bind:selectedActor
						bind:selectedChainId
					/>
				</header>
			</summary>
			<div data-column>
				<CoinBalances
					actorId={actorId}
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
			sessionId={session.$id.id}
			triggerSimulate={pendingSessionCommand === 'simulate'}
			triggerExecute={pendingSessionCommand === 'execute'}
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
