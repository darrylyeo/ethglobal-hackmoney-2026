<script lang="ts">
	// Types/constants
	import { ActionType, type Action, type ActionParams } from '$/constants/actions.ts'
	import { CoinInstanceType, type CoinInstance } from '$/constants/coin-instances.ts'
	import type { Network } from '$/constants/networks.ts'
	import { PatternType } from '$/constants/patterns.ts'


	// Props
	let {
		action = $bindable(),
		filteredNetworks,
		chainCoins,
		asNonEmptyCoins,
		actors = [],
	}: {
		action: Action<ActionType.Transfer>
		filteredNetworks: readonly Network[]
		chainCoins: (chainId: number) => CoinInstance[]
		asNonEmptyCoins: (coins: CoinInstance[]) => coins is [CoinInstance, ...CoinInstance[]]
		actors?: readonly `0x${string}`[]
	} = $props()


	// State
	let invalid = $state(false)


	// (Derived)
	const getParams = (a: Action<ActionType.Transfer>): ActionParams<ActionType.Transfer> =>
		a.params as ActionParams<ActionType.Transfer>
	const p: ActionParams<ActionType.Transfer> = $derived(getParams(action))
	const coins = $derived(chainCoins(p.chainId))
	const tokenCoin = $derived(asNonEmptyCoins(coins) ? (coins.find((c) => c.address === p.tokenAddress) ?? coins[0]) : null)
	const actorItems = $derived(actors.map((a) => ({ address: a })))
	const syntheticCoin = $derived({
		type: CoinInstanceType.Erc20Token as const,
		$id: {
			$network: { chainId: p.chainId },
			address: p.tokenAddress as `0x${string}`,
		},
		chainId: p.chainId,
		address: p.tokenAddress as `0x${string}`,
		symbol: p.tokenSymbol || 'Token',
		decimals: p.tokenDecimals,
	} satisfies CoinInstance)


	// Components
	import PatternInput from '$/components/PatternInput.svelte'
	import AddressInput from '$/views/AddressInput.svelte'
	import CoinInput from '$/views/CoinInput.svelte'
	import CoinAmountInput from '$/views/CoinAmountInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
	import TokenAmountInput from '$/views/TokenAmountInput.svelte'
</script>

{#if action.type === ActionType.Transfer}
	<div data-column>
	<label data-column>
		<span>From</span>
		<AddressInput
			items={actorItems}
			bind:value={() => p.fromActor || null, (v) => {
				if (action?.params != null) action = { ...action, params: { ...action.params, fromActor: v ?? ('0x0000000000000000000000000000000000000000' as `0x${string}`) } }
			}}
			network={{ chainId: p.chainId }}
			placeholder="Select or enter address"
			ariaLabel="From address"
		/>
	</label>
	<label data-column>
		<span>To</span>
		<AddressInput
			items={actorItems}
			bind:value={() => p.toActor || null, (v) => {
				if (action?.params != null) action = { ...action, params: { ...action.params, toActor: v ?? ('0x0000000000000000000000000000000000000000' as `0x${string}`) } }
			}}
			network={{ chainId: p.chainId }}
			placeholder="Select or enter address"
			ariaLabel="To address"
		/>
	</label>
	<label data-column>
		<span>Network</span>
		<NetworkInput
			networks={filteredNetworks}
			bind:value={p.chainId}
			ariaLabel="Network"
		/>
	</label>
	{#if asNonEmptyCoins(coins) && tokenCoin}
		<label data-column>
			<span>Token</span>
			<CoinInput
				coins={coins}
				bind:value={() => tokenCoin, (c) => {
					if (c) action = { ...action, params: { ...action.params, tokenAddress: c.address } }
				}}
				ariaLabel="Token"
			/>
		</label>
		<label data-column>
			<span>Amount</span>
			<CoinAmountInput
				coins={coins}
				bind:coin={() => tokenCoin, (c) => {
					if (c) action = { ...action, params: { ...action.params, tokenAddress: c.address } }
				}}
				min={0n}
				max={0n}
				bind:value={p.amount}
				bind:isInvalid={invalid}
				ariaLabel="Amount"
			/>
		</label>
	{:else}
		<label data-column>
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
		<label data-column>
			<span>Amount</span>
		<TokenAmountInput
			coin={syntheticCoin}
			min={0n}
			max={0n}
			bind:value={p.amount}
			bind:isInvalid={invalid}
			ariaLabel="Amount"
		/>
		</label>
	{/if}
	</div>
{/if}
