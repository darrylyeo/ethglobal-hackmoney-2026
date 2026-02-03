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
	import { FEE_TIERS } from '$/constants/uniswap'
	import { WalletConnectionTransport } from '$/data/WalletConnection'

	// Context
	import { Button } from 'bits-ui'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'

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
		selectedWallet.connection.transport === WalletConnectionTransport.Eip1193 &&
		'provider' in selectedWallet.wallet ?
			selectedWallet.wallet
		:
			null,
	)

	// Functions
	import { formatSmallestToDecimal } from '$/lib/format'
	import { switchWalletChain } from '$/lib/wallet'

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
	const feeLabel = (fee: number) => `${(fee / 10000).toFixed(2)}%`
	const updateAmount0 = (value: bigint) => (
		liquiditySettingsState.current = { ...settings, amount0: value }
	)
	const updateAmount1 = (value: bigint) => (
		liquiditySettingsState.current = { ...settings, amount1: value }
	)

	// State
	import {
		bridgeSettingsState,
		defaultBridgeSettings,
	} from '$/state/bridge-settings.svelte'
	import {
		defaultLiquiditySettings,
		liquiditySettingsState,
	} from '$/state/liquidity-settings.svelte'
	import { actorCoinsCollection } from '$/collections/actor-coins'
	import { tokenListCoinsCollection } from '$/collections/token-list-coins'
	import { uniswapPositionsCollection } from '$/collections/uniswap-positions'

	let invalidAmount0 = $state(false)
	let invalidAmount1 = $state(false)
	let token0Selection = $state<Coin | null>(null)
	let token1Selection = $state<Coin | null>(null)

	// (Derived)
	const bridgeSettings = $derived(
		bridgeSettingsState.current ?? defaultBridgeSettings,
	)
	const settings = $derived(
		liquiditySettingsState.current ?? defaultLiquiditySettings,
	)
	const filteredNetworks = $derived(
		networks.filter((n) =>
			bridgeSettings.isTestnet ?
				n.type === NetworkType.Testnet
			:
				n.type === NetworkType.Mainnet,
		),
	)
	const network = $derived(
		settings.chainId ?
			networksByChainId[settings.chainId]
		:
			null,
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

	const positions = $derived(
		selectedActor ?
			(positionsQuery.data ?? [])
				.map((r) => r.row)
				.filter((p) => p.owner.toLowerCase() === selectedActor.toLowerCase())
		:
			[],
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
		selectedActor && network ?
			(balancesQuery.data ?? [])
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
		:
			[],
	)
	const token0Balance = $derived(
		network && selectedActor && token0Address ?
			(balances.find(
				(b) =>
					b.$id.chainId === network.id &&
					b.$id.tokenAddress.toLowerCase() === token0Address.toLowerCase(),
			)?.balance ?? null)
		:
			null,
	)
	const token1Balance = $derived(
		network && selectedActor && token1Address ?
			(balances.find(
				(b) =>
					b.$id.chainId === network.id &&
					b.$id.tokenAddress.toLowerCase() === token1Address.toLowerCase(),
			)?.balance ?? null)
		:
			null,
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
		const fallback = chainCoins.find(
			(coin) => coin.address !== token0Address,
		)
		if (fallback) token1Selection = fallback
	})

	$effect(() => {
		if (!token0Address || !token1Address) return
		if (token0Address === token1Address) return
		if (token0Address === settings.token0 && token1Address === settings.token1)
			return
		liquiditySettingsState.current = {
			...settings,
			token0: token0Address,
			token1: token1Address,
		}
	})

	$effect(() => {
		const nextChainId = filteredNetworks[0]?.id
		if (!nextChainId) return
		if (filteredNetworks.some((n) => n.id === settings.chainId)) return
		liquiditySettingsState.current = { ...settings, chainId: nextChainId }
	})

	// Components
	import CoinAmountInput from '$/views/CoinAmountInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
	import Select from '$/components/Select.svelte'
	import Positions from './Positions.svelte'
</script>


<div data-column="gap-4">
	<div data-row="gap-2 align-center justify-between">
		<h2>Add Liquidity</h2>
		<NetworkInput
			networks={filteredNetworks}
			value={settings.chainId}
			onValueChange={(value) => {
				const nextChainId = Array.isArray(value) ? value[0] ?? null : value
				if (nextChainId === null || nextChainId === settings.chainId) return
				liquiditySettingsState.current = { ...settings, chainId: nextChainId }
			}}
			placeholder="—"
			id="liq-chain"
		/>
	</div>

	{#if asNonEmpty(chainCoins) && token0Selection && token1Selection}
		<div data-card data-column="gap-3">
			<div data-card="secondary" data-column="gap-2">
				<div data-row="gap-2 align-center justify-between">
					<label for="liq-amount-0">Token 0</label>
					{#if token0Balance !== null}
						<Button.Root
							type="button"
							onclick={() => updateAmount0(token0Balance)}
							disabled={token0Balance === 0n}
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
					value={settings.amount0}
					invalid={invalidAmount0}
					onValueChange={updateAmount0}
					onInvalidChange={(invalid) => {
						invalidAmount0 = invalid
					}}
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

			<div data-card="secondary" data-column="gap-2">
				<div data-row="gap-2 align-center justify-between">
					<label for="liq-amount-1">Token 1</label>
					{#if token1Balance !== null}
						<Button.Root
							type="button"
							onclick={() => updateAmount1(token1Balance)}
							disabled={token1Balance === 0n}
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
					value={settings.amount1}
					invalid={invalidAmount1}
					onValueChange={updateAmount1}
					onInvalidChange={(invalid) => {
						invalidAmount1 = invalid
					}}
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

			<div data-column="gap-2">
				<label for="liq-fee">Fee tier</label>
				<Select
					items={FEE_TIERS}
					value={String(settings.fee)}
					onValueChange={(value) => {
						if (!value) return
						liquiditySettingsState.current = { ...settings, fee: Number(value) }
					}}
					getItemId={(fee) => String(fee)}
					getItemLabel={(fee) => feeLabel(fee)}
					id="liq-fee"
				/>
			</div>

			<div data-column="gap-2">
				<label for="liq-tick-lower">Price range (tick)</label>
				<div data-row="gap-2">
					<input
						id="liq-tick-lower"
						type="number"
						value={settings.tickLower}
						oninput={(e) => {
							const v = Number((e.target as HTMLInputElement).value)
							if (Number.isNaN(v)) return
							liquiditySettingsState.current = { ...settings, tickLower: v }
						}}
					/>
					<span>—</span>
					<input
						type="number"
						value={settings.tickUpper}
						oninput={(e) => {
							const v = Number((e.target as HTMLInputElement).value)
							if (Number.isNaN(v)) return
							liquiditySettingsState.current = { ...settings, tickUpper: v }
						}}
					/>
				</div>
			</div>
		</div>

		{#if needsChainSwitch && network && selectedEip1193Wallet}
			<div data-card="secondary" data-row="gap-2 align-center">
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

		<Button.Root
			type="button"
			disabled={settings.amount0 === 0n && settings.amount1 === 0n}
		>
			Add Liquidity
		</Button.Root>
	{:else}
		<p data-muted>No tokens available for this network.</p>
	{/if}

	<Positions {positions} chainId={settings.chainId} />
</div>
