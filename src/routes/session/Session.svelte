<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections.ts'
	import type { TransactionSession } from '$/data/TransactionSession.ts'
	import { createSessionAction } from '$/data/TransactionSession.ts'
	import { ActionType } from '$/constants/intents.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { ercTokens } from '$/constants/coins.ts'
	import { NetworkType, networks } from '$/constants/networks.ts'


	// Context
	import { setContext } from 'svelte'
	import { resolve } from '$app/paths'
	import {
		SESSION_CONTEXT_KEY,
		type SessionContext,
	} from './session-context.ts'
	import { networkEnvironmentState } from '$/state/network-environment.svelte.ts'
	import { NetworkEnvironment } from '$/constants/network-environment.ts'


	// Props
	let {
		session = $bindable(),
	}: {
		session: TransactionSession,
	} = $props()


	// Functions
	import { fetchAllBalancesForAddress } from '$/collections/actor-coins.ts'
	import { buildSessionHash } from '$/lib/session/sessions.ts'


	// State
	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let selectedChainId = $state<number | null>(null)
	let balanceTokens = $state<
		{ chainId: number, tokenAddress: `0x${string}` }[]
	>([])

	const sessionCtx: SessionContext = $state({
		connectedWallets: [],
		selectedActor: null,
		selectedChainId: null,
		isTestnet: false,
		session: null,
		sessionId: null,
	})
	setContext(SESSION_CONTEXT_KEY, sessionCtx)


	// (Derived)
	const isTestnet = $derived(
		networkEnvironmentState.current === NetworkEnvironment.Testnet,
	)
	$effect(() => {
		sessionCtx.connectedWallets = connectedWallets
		sessionCtx.selectedActor = selectedActor
		sessionCtx.selectedChainId = selectedChainId
		sessionCtx.isTestnet = isTestnet
		sessionCtx.session = session
		sessionCtx.sessionId = session.id
	})

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
		if (session.actions.length === 0) {
			session = {
				...session,
				actions: [createSessionAction(ActionType.Swap)],
			}
		}
	})


	// Components
	import WatchButton from '$/components/WatchButton.svelte'
	import AccountsSelect from '$/views/AccountsSelect.svelte'
	import CoinBalances from '$/views/CoinBalances.svelte'
	import ActionsSequence from './ActionsSequence.svelte'
</script>


<main id="main" data-session data-column="gap-4" data-sticky-container>
	<section data-scroll-item data-column="gap-2">
		<header data-row="wrap gap-4 align-center">
			<div data-column="gap-1" data-row-item="flexible">
				<h1>
					<span class="sr-only">Session</span>
					<input
						type="text"
						bind:value={session.name}
						placeholder="Session name"
						aria-label="Session name"
					/>
				</h1>
			</div>
			<span data-text="annotation">Session</span>
			<WatchButton
				entityType={EntityType.TransactionSession}
				id={session.id}
				label={session.name || 'Session'}
				href={`${resolve('/session')}${buildSessionHash(session.id)}`}
				autoWatched={session.status === 'Draft' || session.status === 'Submitted'}
			/>
		</header>

		<details
			open
			data-card
		>
			<summary>
				<header
					data-card
					data-row="wrap gap-2"
				>
					<AccountsSelect
						bind:connectedWallets
						bind:selectedActor
						bind:selectedChainId
					/>
				</header>
			</summary>
			<div data-column="gap-3">
				<CoinBalances
					{selectedActor}
					balanceTokens={effectiveBalanceTokens}
					availableAccounts={connectedWallets
					.map((w) => w.connection.activeActor)
					.filter((a): a is `0x${string}` => a != null)}
				/>
			</div>
		</details>
	</section>

	<section data-scroll-item data-column="gap-4">
		<ActionsSequence bind:actions={session.actions} />
	</section>
</main>
