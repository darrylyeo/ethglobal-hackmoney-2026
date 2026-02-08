<script lang="ts">
	// Types/constants
	import { ActionType, type Action } from '$/constants/actions.ts'
	import type { Coin } from '$/constants/coins.ts'
	import type { Network } from '$/constants/networks.ts'
	import { PatternType } from '$/constants/patterns.ts'


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
	import PatternInput from '$/components/PatternInput.svelte'
	import CoinInput from '$/views/CoinInput.svelte'
	import CoinAmountInput from '$/views/CoinAmountInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
</script>

{#if action.type === ActionType.Transfer}
	{@const p = (action.params as { fromActor: `0x${string}`; toActor: `0x${string}`; chainId: number; amount: bigint; tokenAddress: `0x${string}` })}
	{@const coins = chainCoins(p.chainId)}
	{@const tokenCoin = asNonEmptyCoins(coins) ? (coins.find((c) => c.address.toLowerCase() === p.tokenAddress.toLowerCase()) ?? coins[0]) : null}
	<div data-column="gap-3">
	<label data-column="gap-0">
		<span>From</span>
		<PatternInput
			patternTypes={[PatternType.EvmAddress, PatternType.EnsName]}
			bind:value={p.fromActor}
			ariaLabel="From address"
		/>
	</label>
	<label data-column="gap-0">
		<span>To</span>
		<PatternInput
			patternTypes={[PatternType.EvmAddress, PatternType.EnsName]}
			bind:value={p.toActor}
			ariaLabel="To address"
		/>
	</label>
	<label data-column="gap-0">
		<span>Network</span>
		<NetworkInput
			networks={filteredNetworks}
			bind:value={p.chainId}
			ariaLabel="Network"
		/>
	</label>
	{#if asNonEmptyCoins(coins) && tokenCoin}
		<label data-column="gap-2">
			<span>Token</span>
			<CoinInput
				coins={coins}
				bind:value={() => tokenCoin, (c) => {
					if (c) action = { ...action, params: { ...action.params, tokenAddress: c.address } } as Action
				}}
				ariaLabel="Token"
			/>
		</label>
		<label data-column="gap-2">
			<span>Amount</span>
			<CoinAmountInput
				coins={coins}
				bind:coin={() => tokenCoin, (c) => {
					if (c) action = { ...action, params: { ...action.params, tokenAddress: c.address } } as Action
				}}
				min={0n}
				max={0n}
				bind:value={p.amount}
				bind:invalid={invalid}
				ariaLabel="Amount"
			/>
		</label>
	{:else}
		<label data-column="gap-0">
			<span>Token address</span>
			<input type="text" bind:value={p.tokenAddress} />
		</label>
		<label data-column="gap-0">
			<span>Amount</span>
			<input
				type="text"
				value={String(p.amount)}
				oninput={(e) => {
					const v = (e.currentTarget as HTMLInputElement).value
					action = { ...action, params: { ...action.params, amount: BigInt(v || '0') } } as Action
				}}
			/>
		</label>
	{/if}
	</div>
{/if}
