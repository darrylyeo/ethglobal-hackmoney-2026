<script lang="ts">


	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections.ts'
	import type { TransactionSession } from '$/data/TransactionSession.ts'
	import { createSessionAction } from '$/data/TransactionSession.ts'
	import { ActionType } from '$/constants/intents.ts'
	import { ercTokens } from '$/constants/coins.ts'


	// Context
	import { setContext } from 'svelte'
	import { bridgeSettingsState } from '$/state/bridge-settings.svelte'
	import {
		SESSION_CONTEXT_KEY,
		type SessionContext,
	} from './session-context.ts'


	// Props
	let {
		session = $bindable(),
	}: {
		session: TransactionSession,
	} = $props()


	// Functions
	import { fetchAllBalancesForAddress } from '$/collections/actor-coins.ts'


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
	})
	setContext(SESSION_CONTEXT_KEY, sessionCtx)


	// (Derived)
	$effect(() => {
		sessionCtx.connectedWallets = connectedWallets
		sessionCtx.selectedActor = selectedActor
		sessionCtx.selectedChainId = selectedChainId
		sessionCtx.isTestnet = bridgeSettingsState.current.isTestnet
	})

	const balanceTokensToFetch = $derived(
		(() => {
			const resolved =
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
					: ercTokens
			return resolved.length > 0 ? resolved : ercTokens
		})(),
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
	import AccountsSelect from '$/views/AccountsSelect.svelte'
	import CoinBalances from '$/views/CoinBalances.svelte'
	import ActionsSequence from './ActionsSequence.svelte'
</script>


<main id="main" data-session data-column="gap-4" data-sticky-container>
	<section data-scroll-item data-column="gap-2">
		<header data-row="gap-2 align-center justify-between wrap">
			<input
				type="text"
				bind:value={session.name}
				placeholder="Session name"
				aria-label="Session name"
				data-row-item="flexible"
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
					{balanceTokens}
				/>
			</div>
		</details>
	</section>

	<section data-scroll-item data-column="gap-4">
		<ActionsSequence bind:actions={session.actions} />
	</section>
</main>
