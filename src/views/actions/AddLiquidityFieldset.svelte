<script lang="ts">
	// Types/constants
	import { ActionType, type ActionParams, type LiquidityAction } from '$/constants/actions.ts'
	import type { Coin } from '$/constants/coins.ts'
	import type { Network } from '$/constants/networks.ts'


	// Props
	let {
		action = $bindable(),
		filteredNetworks,
		chainCoins,
		asNonEmptyCoins,
	}: {
		action: LiquidityAction
		filteredNetworks: readonly Network[]
		chainCoins: (chainId: number) => Coin[]
		asNonEmptyCoins: (coins: Coin[]) => coins is [Coin, ...Coin[]]
	} = $props()


	// (Derived)
	const p: ActionParams<ActionType.AddLiquidity> = $derived.by(() => action.params)
	const coins = $derived(chainCoins(p.chainId))
	const token0Coin = $derived(coins.find((c) => c.address.toLowerCase() === p.token0.toLowerCase()) ?? coins[0])
	const token1Coin = $derived(coins.find((c) => c.address.toLowerCase() === p.token1.toLowerCase()) ?? (coins[1] ?? coins[0]))


	// Components
	import CoinInput from '$/views/CoinInput.svelte'
	import CoinAmountInput from '$/views/CoinAmountInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
</script>


{#if action.type === ActionType.AddLiquidity || action.type === ActionType.RemoveLiquidity || action.type === ActionType.CollectFees || action.type === ActionType.IncreaseLiquidity}
	<div data-column>
		<label data-column="gap-2">
			<span>Network</span>
			<NetworkInput
				networks={filteredNetworks}
				bind:value={p.chainId}
				ariaLabel="Network"
			/>
		</label>
		{#if asNonEmptyCoins(coins)}
			<label data-column="gap-2">
				<span>Token 0</span>
				<CoinInput
					coins={coins}
					bind:value={() => token0Coin, (c) => {
						if (c) action = { ...action, params: { ...action.params, token0: c.address } }
					}}
					ariaLabel="Token 0"
				/>
			</label>
			<label data-column="gap-2">
				<span>Token 1</span>
				<CoinInput
					coins={coins}
					bind:value={() => token1Coin, (c) => {
						if (c) action = { ...action, params: { ...action.params, token1: c.address } }
					}}
					ariaLabel="Token 1"
				/>
			</label>
			<label data-column="gap-2">
				<span>Fee tier (bps)</span>
				<input type="number" bind:value={p.fee} />
			</label>
			<label data-column="gap-2">
				<span>Amount 0</span>
				<CoinAmountInput
					coins={coins}
					bind:coin={() => token0Coin ?? coins[0], (c) => {
						if (c) action = { ...action, params: { ...action.params, token0: c.address } }
					}}
					min={0n}
					max={0n}
					bind:value={p.amount0}
					ariaLabel="Amount 0"
				/>
			</label>
			<label data-column="gap-2">
				<span>Amount 1</span>
				<CoinAmountInput
					coins={coins}
					bind:coin={() => token1Coin ?? (coins[1] ?? coins[0]), (c) => {
						if (c) action = { ...action, params: { ...action.params, token1: c.address } }
					}}
					min={0n}
					max={0n}
					bind:value={p.amount1}
					ariaLabel="Amount 1"
				/>
			</label>
		{:else}
			<p data-muted>No tokens for this network.</p>
		{/if}
	</div>
{/if}
