<script lang="ts">
	// Types/constants
	import { ActionType, type Action, type ActionParams } from '$/constants/actions.ts'
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
		action: Action<ActionType.Transfer>
		filteredNetworks: readonly Network[]
		chainCoins: (chainId: number) => Coin[]
		asNonEmptyCoins: (coins: Coin[]) => coins is [Coin, ...Coin[]]
	} = $props()


	// State
	let invalid = $state(false)


	// (Derived)
	const p: ActionParams<ActionType.Transfer> = $derived.by(() => action.params)
	const coins = $derived(chainCoins(p.chainId))
	const tokenCoin = $derived(asNonEmptyCoins(coins) ? (coins.find((c) => c.address.toLowerCase() === p.tokenAddress.toLowerCase()) ?? coins[0]) : null)


	// Components
	import PatternInput from '$/components/PatternInput.svelte'
	import CoinInput from '$/views/CoinInput.svelte'
	import CoinAmountInput from '$/views/CoinAmountInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
</script>

{#if action.type === ActionType.Transfer}
	<div data-column>
	<label data-column="gap-2">
		<span>From</span>
		<PatternInput
			patternTypes={[PatternType.EvmAddress, PatternType.EnsName]}
			bind:value={p.fromActor}
			ariaLabel="From address"
		/>
	</label>
	<label data-column="gap-2">
		<span>To</span>
		<PatternInput
			patternTypes={[PatternType.EvmAddress, PatternType.EnsName]}
			bind:value={p.toActor}
			ariaLabel="To address"
		/>
	</label>
	<label data-column="gap-2">
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
					if (c) action = { ...action, params: { ...action.params, tokenAddress: c.address } }
				}}
				ariaLabel="Token"
			/>
		</label>
		<label data-column="gap-2">
			<span>Amount</span>
			<CoinAmountInput
				coins={coins}
				bind:coin={() => tokenCoin, (c) => {
					if (c) action = { ...action, params: { ...action.params, tokenAddress: c.address } }
				}}
				min={0n}
				max={0n}
				bind:value={p.amount}
				bind:invalid={invalid}
				ariaLabel="Amount"
			/>
		</label>
	{:else}
		<label data-column="gap-2">
			<span>Token address</span>
			<PatternInput
				patternTypes={[PatternType.EvmAddress]}
				value={p.tokenAddress}
				oninput={(e: Event) => {
					action = {
						...action,
						params: { ...action.params, tokenAddress: (e.currentTarget as HTMLInputElement).value },
					}
				}}
				ariaLabel="Token address"
			/>
		</label>
		<label data-column="gap-2">
			<span>Amount</span>
			<input
				type="text"
				value={String(p.amount)}
				oninput={(e) => {
					const v = (e.currentTarget as HTMLInputElement).value
					action = { ...action, params: { ...action.params, amount: BigInt(v || '0') } }
				}}
			/>
		</label>
	{/if}
	</div>
{/if}
