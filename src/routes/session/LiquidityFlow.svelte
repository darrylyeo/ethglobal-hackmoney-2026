<script lang="ts">


	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import type { TokenListCoinRow } from '$/collections/token-list-coins'
	import type { Coin } from '$/constants/coins'
	import { CoinType } from '$/constants/coins'
	import { DataSource } from '$/constants/data-sources'
	import { MediaType } from '$/constants/media'
	import {
		NetworkType,
		networks,
		networksByChainId,
	} from '$/constants/networks'
	import type { UniswapFeeTier } from '$/constants/uniswap'
	import { uniswapFeeTiers } from '$/constants/uniswap'
	import { WalletConnectionTransport } from '$/data/WalletConnection'


	// Context
	import { getContext } from 'svelte'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { Button } from 'bits-ui'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'
	import {
		getEffectiveHash,
		setEffectiveHash,
		SESSION_HASH_SOURCE_KEY,
	} from '$/lib/session/panel-hash'


	// Props
	let {
		selectedWallets,
		selectedActor,
		selectedChainId,
	}: {
		selectedWallets: ConnectedWallet[]
		selectedActor: `0x${string}` | null
		selectedChainId: number | null
	} = $props()


	// (Derived)
	const selectedWallet = $derived(
		selectedWallets.find((w) => w.connection.selected) ?? null,
	)
	const selectedEip1193Wallet = $derived(
		selectedWallet &&
			selectedWallet.connection.transport ===
				WalletConnectionTransport.Eip1193 &&
			'provider' in selectedWallet.wallet
			? selectedWallet.wallet
			: null,
	)
	const hashSource = getContext<
		import('$/lib/session/panel-hash').SessionHashSource
	>(SESSION_HASH_SOURCE_KEY)
	const effectiveHash = $derived(getEffectiveHash(hashSource))


	// Functions
	import { E2E_TEVM_ENABLED, requestE2eTevmContractTx } from '$/lib/e2e/tevm'
	import { formatSmallestToDecimal } from '$/lib/format'
	import {
		type LiquiditySessionParams,
		getLiquiditySessionParams,
	} from '$/lib/session/params'
	import {
		buildSessionHash,
		createTransactionSession,
		forkTransactionSession,
		parseSessionHash,
		updateTransactionSessionParams,
	} from '$/lib/session/sessions'
	import { switchWalletChain } from '$/lib/wallet'

	type ExecutionArgs = {
		provider: {
			request: (args: {
				method: string
				params?: unknown[]
			}) => Promise<unknown>
		}
		walletAddress: `0x${string}`
	}

	const asNonEmpty = (coins: Coin[]): coins is [Coin, ...Coin[]] =>
		coins.length > 0
	const toCoin = (token: TokenListCoinRow): Coin => ({
		type: CoinType.Erc20,
		chainId: token.chainId,
		address: token.address,
		symbol: token.symbol,
		name: token.name,
		decimals: token.decimals,
		icon: token.logoURI
			? {
					type: MediaType.Image,
					original: {
						url: token.logoURI,
					},
				}
			: undefined,
	})
	const feeLabel = (fee: UniswapFeeTier) =>
		`${(fee.feeTier / 10000).toFixed(2)}%`
	const updateAmount0 = (value: bigint) =>
		updateSessionParams({ ...settings, amount0: value })
	const updateAmount1 = (value: bigint) =>
		updateSessionParams({ ...settings, amount1: value })


	// State
	import {
		addLiquidity,
		fetchPools,
		fetchPositions,
		initializePool,
	} from '$/api/uniswap'
	import { TICK_SPACINGS } from '$/constants/uniswap'
	import { actorCoinsCollection } from '$/collections/actor-coins'
	import { tokenListCoinsCollection } from '$/collections/token-list-coins'
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'
	import { uniswapPositionsCollection } from '$/collections/uniswap-positions'
	import {
		fetchUniswapPools,
		uniswapPoolsCollection,
	} from '$/collections/uniswap-pools'
	import { fetchUniswapPositions } from '$/collections/uniswap-positions'

	let activeSessionId = $state<string | null>(null)
	let lookupSessionId = $state<string | null>(null)
	let invalidAmount0 = $state(false)
	let invalidAmount1 = $state(false)
	let token0Selection = $state<Coin | null>(null)
	let token1Selection = $state<Coin | null>(null)
	let e2eLiquidityStatus = $state<{
		txHash: `0x${string}` | null
		message: string
	} | null>(null)


	// (Derived)
	const sessionQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionSessionsCollection })
				.where(({ row }) => eq(row.id, activeSessionId ?? ''))
				.select(({ row }) => ({ row })),
		[() => activeSessionId],
	)
	const lookupSessionQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionSessionsCollection })
				.where(({ row }) => eq(row.id, lookupSessionId ?? ''))
				.select(({ row }) => ({ row })),
		[() => lookupSessionId],
	)
	const lookupSession = $derived(lookupSessionQuery.data?.[0]?.row ?? null)
	const session = $derived(sessionQuery.data?.[0]?.row ?? null)
	const sessionParams = $derived(getLiquiditySessionParams(session))
	const sessionLocked = $derived(Boolean(session?.lockedAt))
	const settings = $derived(sessionParams)
	const filteredNetworks = $derived(
		networks.filter((n) =>
			sessionParams.isTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)
	const network = $derived(
		settings.chainId
			? (Object.values(networksByChainId).find(
					(entry) => entry?.id === settings.chainId,
				) ?? null)
			: null,
	)

	const poolsQuery = useLiveQuery((q) =>
		q
			.from({ row: uniswapPoolsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Uniswap))
			.select(({ row }) => ({ row })),
	)
	const positionsQuery = useLiveQuery((q) =>
		q
			.from({ row: uniswapPositionsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Uniswap))
			.select(({ row }) => ({ row })),
	)
	const balancesQuery = useLiveQuery((q) =>
		q
			.from({ row: actorCoinsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Voltaire))
			.select(({ row }) => ({ row })),
	)
	const tokenListQuery = useLiveQuery((q) =>
		q
			.from({ row: tokenListCoinsCollection })
			.where(({ row }) => eq(row.$source, DataSource.TokenLists))
			.select(({ row }) => ({ row })),
	)
	const matchingPool = $derived(
		(poolsQuery.data ?? []).find(
			(r: { row: UniswapPoolRow }) =>
				r.row.chainId === settings.chainId &&
				r.row.token0.toLowerCase() === settings.token0.toLowerCase() &&
				r.row.token1.toLowerCase() === settings.token1.toLowerCase() &&
				r.row.fee === settings.fee,
		)?.row ?? null,
	)
	const liveQueryEntries = [
		{
			id: 'liquidity-flow-session',
			label: 'Session',
			query: sessionQuery,
		},
		{
			id: 'liquidity-flow-pools',
			label: 'Uniswap Pools',
			query: poolsQuery,
		},
		{
			id: 'liquidity-flow-positions',
			label: 'Uniswap Positions',
			query: positionsQuery,
		},
		{
			id: 'liquidity-flow-balances',
			label: 'Balances',
			query: balancesQuery,
		},
		{
			id: 'liquidity-flow-token-list',
			label: 'Token List',
			query: tokenListQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)

	const positions = $derived(
		selectedActor
			? (positionsQuery.data ?? [])
					.map((r) => r.row)
					.filter((p) => p.owner.toLowerCase() === selectedActor.toLowerCase())
			: [],
	)
	const chainTokens = $derived(
		(tokenListQuery.data ?? [])
			.map((r) => r.row)
			.filter((token) => token.chainId === settings.chainId),
	)
	const chainCoins = $derived(chainTokens.map(toCoin))
	const token0Address = $derived(token0Selection?.address ?? null)
	const token1Address = $derived(token1Selection?.address ?? null)
	const balances = $derived(
		selectedActor && network
			? (balancesQuery.data ?? [])
					.map((r) => r.row)
					.filter(
						(b) =>
							b.$id.address.toLowerCase() === selectedActor.toLowerCase() &&
							b.$id.chainId === network.id &&
							chainTokens.some(
								(token) =>
									token.address.toLowerCase() ===
									b.$id.tokenAddress.toLowerCase(),
							),
					)
			: [],
	)
	const token0Balance = $derived(
		network && selectedActor && token0Address
			? (balances.find(
					(b) =>
						b.$id.chainId === network.id &&
						b.$id.tokenAddress.toLowerCase() === token0Address.toLowerCase(),
				)?.balance ?? null)
			: null,
	)
	const token1Balance = $derived(
		network && selectedActor && token1Address
			? (balances.find(
					(b) =>
						b.$id.chainId === network.id &&
						b.$id.tokenAddress.toLowerCase() === token1Address.toLowerCase(),
				)?.balance ?? null)
			: null,
	)
	const needsChainSwitch = $derived(
		Boolean(
			selectedWallet &&
			selectedChainId !== null &&
			network &&
			selectedChainId !== network.id,
		),
	)


	// Actions
	const activateSession = (sessionId: string) => {
		activeSessionId = sessionId
		setEffectiveHash(hashSource, buildSessionHash(sessionId))
	}
	const updateSessionParams = (nextParams: LiquiditySessionParams) => {
		if (!session) return
		if (sessionLocked) {
			activateSession(
				createTransactionSession({
					actions: [...session.actions],
					params: nextParams,
				}).id,
			)
			return
		}
		updateTransactionSessionParams(session.id, nextParams)
	}
	const forkSession = () => {
		if (!session) return
		activateSession(forkTransactionSession(session).id)
	}
	const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
	const SQRT_PRICE_X96_DEFAULT = 2n ** 96n
	const deadline = () => Math.floor(Date.now() / 1000) + 1200

	const executeLiquidity = async (args: ExecutionArgs) => {
		if (
			selectedActor &&
			args.walletAddress.toLowerCase() !== selectedActor.toLowerCase()
		) {
			throw new Error(
				'Active wallet address must match the liquidity provider.',
			)
		}
		e2eLiquidityStatus = null
		try {
			if (E2E_TEVM_ENABLED) {
				const txHash = await requestE2eTevmContractTx({
					provider: args.provider,
					from: args.walletAddress,
					value: settings.amount0 + settings.amount1,
				})
				e2eLiquidityStatus = { txHash, message: 'Liquidity added.' }
				return { txHash }
			}
			let poolId = matchingPool?.id ?? null
			if (!poolId) {
				await initializePool({
					provider: args.provider,
					chainId: settings.chainId,
					token0: settings.token0,
					token1: settings.token1,
					fee: settings.fee,
					tickSpacing: (TICK_SPACINGS as Record<number, number>)[settings.fee] ?? 60,
					sqrtPriceX96: SQRT_PRICE_X96_DEFAULT,
					hooks: ZERO_ADDRESS,
				})
				poolId = `pool-${settings.chainId}-${settings.token0}-${settings.token1}-${settings.fee}`
			}
			const { txHash } = await addLiquidity({
				provider: args.provider,
				poolId,
				tickLower: settings.tickLower,
				tickUpper: settings.tickUpper,
				amount0Desired: settings.amount0,
				amount1Desired: settings.amount1,
				amount0Min: 0n,
				amount1Min: 0n,
				recipient: args.walletAddress,
				deadline: deadline(),
			})
			e2eLiquidityStatus = { txHash, message: 'Liquidity added.' }
			return { txHash }
		} catch (error) {
			e2eLiquidityStatus = { txHash: null, message: 'Liquidity failed.' }
			throw error
		}
	}

	$effect(() => {
		if (!lookupSessionId || !lookupSessionQuery.isReady) return
		if (lookupSession) {
			activeSessionId = lookupSessionId
		} else {
			activateSession(
				createTransactionSession({
					actions: ['liquidity'],
					params: {},
				}).id,
			)
			lookupSessionId = null
		}
	})
	$effect(() => {
		const hash = hashSource.enabled
			? effectiveHash
			: typeof window !== 'undefined'
				? window.location.hash
				: ''
		const parsed = parseSessionHash(hash)
		if (parsed.kind === 'session') {
			lookupSessionId = parsed.sessionId
			return
		}
		lookupSessionId = null
		activateSession(
			createTransactionSession({
				actions:
					parsed.kind === 'actions'
						? parsed.actions.map((action) => action.action)
						: ['liquidity'],
				params:
					parsed.kind === 'actions' ? (parsed.actions[0]?.params ?? {}) : {},
			}).id,
		)
	})
	$effect(() => {
		if (hashSource.enabled) return
		if (typeof window === 'undefined') return
		const handleHash = () => {
			const parsed = parseSessionHash(window.location.hash)
			if (parsed.kind === 'session') {
				lookupSessionId = parsed.sessionId
				return
			}
			lookupSessionId = null
			activateSession(
				createTransactionSession({
					actions:
						parsed.kind === 'actions'
							? parsed.actions.map((action) => action.action)
							: ['liquidity'],
					params:
						parsed.kind === 'actions' ? (parsed.actions[0]?.params ?? {}) : {},
				}).id,
			)
		}
		handleHash()
		window.addEventListener('hashchange', handleHash)
		return () => window.removeEventListener('hashchange', handleHash)
	})

	$effect(() => {
		if (!asNonEmpty(chainCoins)) return
		const token0Match =
			chainCoins.find(
				(coin) => coin.address.toLowerCase() === settings.token0.toLowerCase(),
			) ?? chainCoins[0]
		const token1Match =
			chainCoins.find(
				(coin) => coin.address.toLowerCase() === settings.token1.toLowerCase(),
			) ??
			chainCoins.find((coin) => coin.address !== token0Match.address) ??
			token0Match
		if (!token0Selection || token0Selection.address !== token0Match.address)
			token0Selection = token0Match
		if (!token1Selection || token1Selection.address !== token1Match.address)
			token1Selection = token1Match
	})

	$effect(() => {
		if (!asNonEmpty(chainCoins)) return
		if (!token0Address || !token1Address) return
		if (token0Address !== token1Address) return
		const fallback = chainCoins.find((coin) => coin.address !== token0Address)
		if (fallback) token1Selection = fallback
	})

	$effect(() => {
		if (!token0Address || !token1Address) return
		if (token0Address === token1Address) return
		if (token0Address === settings.token0 && token1Address === settings.token1)
			return
		updateSessionParams({
			...settings,
			token0: token0Address,
			token1: token1Address,
		})
	})

	$effect(() => {
		const nextChainId = filteredNetworks[0]?.id
		if (!nextChainId) return
		if (filteredNetworks.some((n) => n.id === settings.chainId)) return
		updateSessionParams({ ...settings, chainId: nextChainId })
	})

	$effect(() => {
		const { chainId, token0, token1 } = settings
		if (!chainId || !token0 || !token1 || token0 === token1) return
		fetchUniswapPools(
			{ chainId, token0: token0 as `0x${string}`, token1: token1 as `0x${string}` },
			fetchPools,
		).catch(() => {})
	})

	$effect(() => {
		if (!selectedActor || !settings.chainId) return
		fetchUniswapPositions(
			{ chainId: settings.chainId, owner: selectedActor },
			fetchPositions,
		).catch(() => {})
	})


	// Components
	import LoadingButton from '$/components/LoadingButton.svelte'
	import Select from '$/components/Select.svelte'
	import CoinAmountInput from '$/views/CoinAmountInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
	import TransactionFlow from '$/views/TransactionFlow.svelte'
	import Positions from './Positions.svelte'
</script>


<div data-column="gap-4">
	<div data-row="gap-2 align-center justify-between">
		<h2>Add Liquidity</h2>
		{#if sessionLocked}
			<LoadingButton type="button" onclick={forkSession}>New draft</LoadingButton>
		{/if}
	</div>

	<div data-protocol data-card data-row="gap-2 align-center">
		<span data-muted>Protocol</span>
		<strong>Uniswap v4</strong>
	</div>

	{#if asNonEmpty(chainCoins) && token0Selection && token1Selection}
		<div data-card data-column="gap-3" data-section="chain-tokens">
			<div data-row="gap-2 align-center wrap">
				<div data-column="gap-1">
					<label for="liq-chain">Chain</label>
					<NetworkInput
						networks={filteredNetworks}
						bind:value={
							() => settings.chainId,
							(value) => {
								const nextChainId = Array.isArray(value)
									? (value[0] ?? null)
									: value
								if (nextChainId === null || nextChainId === settings.chainId) return
								updateSessionParams({ ...settings, chainId: nextChainId })
							}
						}
						placeholder="—"
						id="liq-chain"
						disabled={sessionLocked}
					/>
				</div>
				<div data-column="gap-1">
					<label for="liq-token0">Token 0</label>
					<Select
						items={chainCoins}
						bind:value={
							() => token0Address ?? '',
							(value) => {
								const coin = chainCoins.find((c) => c.address === value)
								if (coin) token0Selection = coin
							}
						}
						getItemId={(c) => c.address}
						getItemLabel={(c) => c.symbol}
						id="liq-token0"
						disabled={sessionLocked}
					/>
				</div>
				<div data-column="gap-1">
					<label for="liq-token1">Token 1</label>
					<Select
						items={chainCoins}
						bind:value={
							() => token1Address ?? '',
							(value) => {
								const coin = chainCoins.find((c) => c.address === value)
								if (coin) token1Selection = coin
							}
						}
						getItemId={(c) => c.address}
						getItemLabel={(c) => c.symbol}
						id="liq-token1"
						disabled={sessionLocked}
					/>
				</div>
			</div>
		</div>

		<div data-card data-column="gap-3" data-section="fee-range">
			<div data-column="gap-2">
				<label for="liq-fee">Fee tier</label>
				<Select
					items={uniswapFeeTiers}
					bind:value={
						() => String(settings.fee),
						(value) => {
							if (!value) return
							updateSessionParams({ ...settings, fee: Number(value) })
						}
					}
					getItemId={(fee) => String(fee.feeTier)}
					getItemLabel={(fee) => feeLabel(fee)}
					id="liq-fee"
					disabled={sessionLocked}
				/>
			</div>
			<div data-column="gap-2">
				<label for="liq-tick-lower">Price range (tick)</label>
				<div data-row="gap-2">
					<input
						id="liq-tick-lower"
						type="number"
						bind:value={() => String(settings.tickLower), (v) => {
							const n = Number(v)
							if (!Number.isNaN(n))
								updateSessionParams({ ...settings, tickLower: n })
						}}
						disabled={sessionLocked}
					/>
					<span>—</span>
					<input
						type="number"
						bind:value={() => String(settings.tickUpper), (v) => {
							const n = Number(v)
							if (!Number.isNaN(n))
								updateSessionParams({ ...settings, tickUpper: n })
						}}
						disabled={sessionLocked}
					/>
				</div>
			</div>
		</div>

		<div data-card data-column="gap-3" data-section="amounts-preview">
			<div data-card data-column="gap-2">
				<div data-row="gap-2 align-center justify-between">
					<label for="liq-amount-0">Amount 0</label>
					{#if token0Balance !== null}
						<Button.Root
							type="button"
							onclick={() => updateAmount0(token0Balance)}
							disabled={sessionLocked || token0Balance === 0n}
						>
							Max
						</Button.Root>
					{/if}
				</div>
				<CoinAmountInput
					id="liq-amount-0"
					coins={chainCoins}
					bind:coin={token0Selection}
					min={0n}
					max={token0Balance ?? 0n}
					bind:value={() => settings.amount0, updateAmount0}
					disabled={sessionLocked}
					bind:invalid={
						() => invalidAmount0, (invalid) => (invalidAmount0 = invalid)
					}
					ariaLabel="Token 0"
				/>
				{#if token0Balance !== null}
					<small data-muted>
						Balance: {formatSmallestToDecimal(
							token0Balance,
							token0Selection.decimals,
							4,
						)}
						{token0Selection.symbol}
					</small>
				{/if}
			</div>

			<div data-card data-column="gap-2">
				<div data-row="gap-2 align-center justify-between">
					<label for="liq-amount-1">Amount 1</label>
					{#if token1Balance !== null}
						<Button.Root
							type="button"
							onclick={() => updateAmount1(token1Balance)}
							disabled={sessionLocked || token1Balance === 0n}
						>
							Max
						</Button.Root>
					{/if}
				</div>
				<CoinAmountInput
					id="liq-amount-1"
					coins={chainCoins}
					bind:coin={token1Selection}
					min={0n}
					max={token1Balance ?? 0n}
					bind:value={() => settings.amount1, updateAmount1}
					disabled={sessionLocked}
					bind:invalid={
						() => invalidAmount1, (invalid) => (invalidAmount1 = invalid)
					}
					ariaLabel="Token 1"
				/>
				{#if token1Balance !== null}
					<small data-muted>
						Balance: {formatSmallestToDecimal(
							token1Balance,
							token1Selection.decimals,
							4,
						)}
						{token1Selection.symbol}
					</small>
				{/if}
			</div>

			<div data-muted data-row="gap-1">
				<span>Pool price / position preview</span>
				<span>—</span>
			</div>
		</div>

		{#if needsChainSwitch && network && selectedEip1193Wallet}
			<div data-card data-row="gap-2 align-center">
				<span>Switch to {network.name}</span>
				<Button.Root
					type="button"
					onclick={() =>
						switchWalletChain(selectedEip1193Wallet.provider, network.id)}
				>
					Switch
				</Button.Root>
			</div>
		{/if}
	{:else}
		<p data-muted>No tokens available for this network.</p>
	{/if}

	<div data-section="primary-action">
		<TransactionFlow
			walletConnection={selectedWallet}
			transactions={[
				{
					id: `liquidity-${settings.chainId}-${settings.token0}-${settings.token1}`,
					chainId: settings.chainId,
					title: 'Add liquidity',
					actionLabel: 'Add Liquidity',
					dataTestId: 'add-liquidity-submit',
					canExecute:
						(settings.amount0 > 0n || settings.amount1 > 0n) &&
						Boolean(selectedActor),
					execute: executeLiquidity,
					executionModes: ['e2e', 'wallet'],
				},
			]}
		/>
		{#if e2eLiquidityStatus}
			<p
			data-e2e-liquidity-status
			data-tx-hash={e2eLiquidityStatus.txHash ?? undefined}
			data-error={e2eLiquidityStatus.txHash ? undefined : ''}
			>
				{e2eLiquidityStatus.message}
			</p>
		{/if}
	</div>

	<Positions
		{positions}
		chainId={settings.chainId}
		provider={selectedEip1193Wallet?.provider ?? null}
		owner={selectedActor}
	/>
</div>
