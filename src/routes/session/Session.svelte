<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/WalletConnections.ts'
	import { SessionStatus, type Session } from '$/data/Session.ts'
	import { ActionType, createAction } from '$/constants/actions.ts'
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
		onPersist,
		session = $bindable(),
	}: {
		onPersist?: () => void
		session: Session
	} = $props()


	// Functions
	import { fetchAllBalancesForAddress } from '$/collections/ActorCoins.ts'
	import {
		buildSessionHash,
		formatSessionPlaceholderName,
	} from '$/lib/session/sessions.ts'


	// State
	let persisted = $state(false)
	let connectedWallets = $state<ConnectedWallet[]>([])
	let selectedActor = $state<`0x${string}` | null>(null)
	let selectedChainId = $state<number | null>(null)
	let balanceTokens = $state<
		{ chainId: number; tokenAddress: `0x${string}` }[]
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
				actions: [createAction(ActionType.Swap)],
			}
		}
	})

	const handleFormInteraction = () => {
		if (persisted || !onPersist) return
		persisted = true
		onPersist()
	}
	const placeholderName = $derived(formatSessionPlaceholderName(session.actions))
	const displayLabel = $derived(session.name || placeholderName)

	// Components
	import WatchButton from '$/components/WatchButton.svelte'
	import AccountsSelect from '$/views/AccountsSelect.svelte'
	import CoinBalances from '$/views/CoinBalances.svelte'
	import ActionsSequence from './ActionsSequence.svelte'
</script>


<main
	id="main"
	data-session
	data-column="gap-4"
	data-sticky-container
	onfocusin={handleFormInteraction}
>
	<section data-scroll-item data-column="gap-2">
		<header data-row="wrap gap-4 align-center">
			<div data-column="gap-1" data-row-item="flexible">
				<h1>
					<span class="sr-only">Session</span>
					<input
						type="text"
						bind:value={session.name}
						placeholder={placeholderName}
						aria-label="Session name"
					/>
				</h1>
			</div>
			<span data-text="annotation">Session</span>
			<WatchButton
				entityType={EntityType.Session}
				id={session.id}
				label={displayLabel}
				href={`${resolve('/session')}${buildSessionHash(session.id)}`}
				autoWatched={session.status === SessionStatus.Draft || session.status === SessionStatus.Submitted}
			/>
		</header>

		<details
			open
			data-card
		>
			<summary>
				<header data-row="wrap gap-2">
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
