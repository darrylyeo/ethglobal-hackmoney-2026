<script lang="ts">
	// Types/constants
	import { ActionType, type Action } from '$/constants/actions.ts'
	import type { Coin } from '$/constants/coins.ts'
	import type { Network } from '$/constants/networks.ts'
	import { formatSlippagePercent, slippagePresets } from '$/constants/slippage.ts'


	// Props
	let {
		action = $bindable(),
		filteredNetworks,
		chainCoins,
		asNonEmptyCoins,
	}: {
		action: Action
		filteredNetworks: readonly Network[]
		chainCoins: (chainId: number) => Coin[]
		asNonEmptyCoins: (coins: Coin[]) => coins is [Coin, ...Coin[]]
	} = $props()


	// State
	let invalid = $state(false)


	// Components
	import Select from '$/components/Select.svelte'
	import CoinInput from '$/views/CoinInput.svelte'
	import CoinAmountInput from '$/views/CoinAmountInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
</script>

{#if action.type === ActionType.Swap}
	{@const p = (action.params as { chainId: number; tokenIn: `0x${string}`; tokenOut: `0x${string}`; amount: bigint; slippage: number })}
	{@const coins = chainCoins(p.chainId)}
	{@const tokenInCoin = coins.find((c) => c.address.toLowerCase() === p.tokenIn.toLowerCase()) ?? coins[0]}
	{@const tokenOutCoin = coins.find((c) => c.address.toLowerCase() === p.tokenOut.toLowerCase()) ?? (coins[1] ?? coins[0])}
	<div data-column="gap-3">
	<label data-column="gap-0">
		<span>Network</span>
		<NetworkInput
			networks={filteredNetworks}
			bind:value={p.chainId}
			ariaLabel="Network"
		/>
	</label>
	{#if asNonEmptyCoins(coins)}
		<div data-column="gap-2">
			<label for="swap-amount-in">From</label>
			<CoinAmountInput
				id="swap-amount-in"
				coins={coins}
				bind:coin={() => tokenInCoin ?? coins[0], (c) => {
					if (c) action = { ...action, params: { ...action.params, tokenIn: c.address } } as Action
				}}
				min={0n}
				max={0n}
				bind:value={p.amount}
				bind:invalid={invalid}
				ariaLabel="Amount in"
			/>
		</div>
		<div data-column="gap-2">
			<label for="swap-token-out">To</label>
			<CoinInput
				id="swap-token-out"
				coins={coins}
				bind:value={() => tokenOutCoin, (c) => {
					if (c) action = { ...action, params: { ...action.params, tokenOut: c.address } } as Action
				}}
				ariaLabel="Token out"
			/>
		</div>
		<div data-column="gap-2">
			<label for="swap-slippage">Slippage</label>
			<Select
				id="swap-slippage"
				items={slippagePresets}
				getItemId={(x) => x.id}
				getItemLabel={(x) => formatSlippagePercent(x.value)}
				bind:value={() => slippagePresets.find((x) => Math.abs(x.value - p.slippage) < 1e-9)?.id ?? '', (v: string | string[]) => {
					const preset = slippagePresets.find((x) => x.id === (typeof v === 'string' ? v : v[0]))
					if (preset) action = { ...action, params: { ...action.params, slippage: preset.value } } as Action
				}}
				placeholder={formatSlippagePercent(p.slippage)}
				ariaLabel="Slippage"
			/>
		</div>
	{:else}
		<p data-muted>No tokens for this network.</p>
	{/if}
	</div>
{/if}
