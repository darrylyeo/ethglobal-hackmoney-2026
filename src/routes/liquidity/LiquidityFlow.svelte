<script lang="ts">
import type { ConnectedWallet } from '$/collections/wallet-connections'
import { WalletConnectionTransport } from '$/data/WalletConnection'
	import { Button } from 'bits-ui'
import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { DataSource } from '$/constants/data-sources'
	import {
		ChainId,
		NetworkType,
		networks,
		networksByChainId,
	} from '$/constants/networks'
	import { FEE_TIERS } from '$/constants/uniswap'
	import {
		liquiditySettingsState,
		defaultLiquiditySettings,
	} from '$/state/liquidity-settings.svelte'
	import { uniswapPoolsCollection } from '$/collections/uniswap-pools'
	import { uniswapPositionsCollection } from '$/collections/uniswap-positions'
	import { actorCoinsCollection } from '$/collections/actor-coins'
	import {
		formatSmallestToDecimal,
		parseDecimalToSmallest,
		isValidDecimalInput,
	} from '$/lib/format'
	import { switchWalletChain } from '$/lib/wallet'
	import NetworkInput from '$/views/NetworkInput.svelte'
	import Select from '$/components/Select.svelte'
	import Positions from './Positions.svelte'

	let {
		selectedWallets,
		selectedActor,
		selectedChainId,
	}: {
		selectedWallets: ConnectedWallet[]
		selectedActor: `0x${string}` | null
		selectedChainId: number | null
	} = $props()

	const selectedWallet = $derived(
		selectedWallets.find((w) => w.connection.selected) ?? null,
	)
	const selectedEip1193Wallet = $derived(
		selectedWallet?.connection.transport === WalletConnectionTransport.Eip1193
			? selectedWallet.wallet
			: null,
	)
	const settings = $derived(
		liquiditySettingsState.current ?? defaultLiquiditySettings,
	)
	const filteredNetworks = $derived(
		networks.filter((n) => n.type === NetworkType.Mainnet),
	)
	const network = $derived(
		settings.chainId ? networksByChainId[settings.chainId] : null,
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

	const pools = $derived((poolsQuery.data ?? []).map((r) => r.row))
	const positions = $derived(
		selectedActor
			? (positionsQuery.data ?? [])
					.map((r) => r.row)
					.filter((p) => p.owner.toLowerCase() === selectedActor!.toLowerCase())
			: [],
	)
	const needsChainSwitch = $derived(
		Boolean(
			selectedWallet &&
			selectedChainId !== null &&
			network &&
			selectedChainId !== network.id,
		),
	)
	const feeLabel = (fee: number) => `${(fee / 10000).toFixed(2)}%`

	const onAmount0Input = (e: Event) => {
		const v = (e.target as HTMLInputElement).value
			.replace(/[^0-9.,]/g, '')
			.replace(/,/g, '')
		if (v === '') liquiditySettingsState.current = { ...settings, amount0: 0n }
		else if (isValidDecimalInput(v, 18))
			liquiditySettingsState.current = {
				...settings,
				amount0: parseDecimalToSmallest(v, 18),
			}
	}
	const onAmount1Input = (e: Event) => {
		const v = (e.target as HTMLInputElement).value
			.replace(/[^0-9.,]/g, '')
			.replace(/,/g, '')
		if (v === '') liquiditySettingsState.current = { ...settings, amount1: 0n }
		else if (isValidDecimalInput(v, 18))
			liquiditySettingsState.current = {
				...settings,
				amount1: parseDecimalToSmallest(v, 18),
			}
	}
</script>

<div data-column="gap-4">
	<h2>Add Liquidity</h2>

	<div data-row="gap-4">
		<div data-column="gap-1" style="flex:1">
			<label for="liq-chain">Chain</label>
			<NetworkInput
				networks={filteredNetworks}
				value={settings.chainId}
				onValueChange={(v) => (
					typeof v === 'number'
						? (liquiditySettingsState.current = { ...settings, chainId: v })
						: null
				)}
				placeholder="—"
				id="liq-chain"
			/>
		</div>
	</div>

	<div data-card data-column="gap-2">
		<div data-column="gap-1">
			<label for="liq-token0">Token 0</label>
			<input
				id="liq-token0"
				type="text"
				readonly
				value={settings.token0.slice(0, 10)}
			/>
		</div>
		<div data-column="gap-1">
			<label for="liq-token1">Token 1</label>
			<input
				id="liq-token1"
				type="text"
				readonly
				value={settings.token1.slice(0, 10)}
			/>
		</div>
		<div data-column="gap-1">
			<label for="liq-fee">Fee tier</label>
			<Select
				items={FEE_TIERS}
				value={String(settings.fee)}
				onValueChange={(v) => {
					if (v)
						liquiditySettingsState.current = { ...settings, fee: Number(v) }
				}}
				getItemId={(fee) => String(fee)}
				getItemLabel={(fee) => feeLabel(fee)}
				id="liq-fee"
			/>
		</div>
		<div data-column="gap-1">
			<span aria-hidden="true">Price range (tick)</span>
			<div data-row="gap-2">
				<input
					type="number"
					value={settings.tickLower}
					oninput={(e) => {
						const v = parseInt((e.target as HTMLInputElement).value, 10)
						if (!Number.isNaN(v))
							liquiditySettingsState.current = { ...settings, tickLower: v }
					}}
				/>
				<span>—</span>
				<input
					type="number"
					value={settings.tickUpper}
					oninput={(e) => {
						const v = parseInt((e.target as HTMLInputElement).value, 10)
						if (!Number.isNaN(v))
							liquiditySettingsState.current = { ...settings, tickUpper: v }
					}}
				/>
			</div>
		</div>
		<div data-column="gap-1">
			<label for="liq-amt0">Amount 0</label>
			<input
				id="liq-amt0"
				type="text"
				inputmode="decimal"
				placeholder="0.00"
				value={settings.amount0 === 0n
					? ''
					: formatSmallestToDecimal(settings.amount0, 6)}
				oninput={onAmount0Input}
			/>
		</div>
		<div data-column="gap-1">
			<label for="liq-amt1">Amount 1</label>
			<input
				id="liq-amt1"
				type="text"
				inputmode="decimal"
				placeholder="0.00"
				value={settings.amount1 === 0n
					? ''
					: formatSmallestToDecimal(settings.amount1, 6)}
				oninput={onAmount1Input}
			/>
		</div>
	</div>

{#if needsChainSwitch && network && selectedEip1193Wallet}
		<div data-card="secondary" data-row="gap-2 align-center">
			<span>Switch to {network.name}</span>
			<Button.Root
				onclick={() =>
				switchWalletChain(selectedEip1193Wallet.provider, network.id)}
				>Switch</Button.Root
			>
		</div>
	{/if}

	<Button.Root
		type="button"
		disabled={settings.amount0 === 0n && settings.amount1 === 0n}
	>
		Add Liquidity
	</Button.Root>

	<Positions {positions} chainId={settings.chainId} />
</div>
