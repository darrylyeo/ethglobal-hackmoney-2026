<script lang="ts">
	// Types/constants
	import { ActionType, type Action, type ActionParams } from '$/constants/actions.ts'
	import type { Coin } from '$/constants/coins.ts'
	import { CoinType, bridgeCoinsByChainId } from '$/constants/coins.ts'
	import { ChainId, type Network } from '$/constants/networks.ts'


	// Props
	let {
		action = $bindable(),
		filteredNetworks,
	}: {
		action: Action<ActionType.Bridge>
		filteredNetworks: readonly Network[]
	} = $props()


	// State
	let invalid = $state(false)


	// (Derived)
	const getParams = (a: Action<ActionType.Bridge>): ActionParams<ActionType.Bridge> =>
		a.params as ActionParams<ActionType.Bridge>
	const p: ActionParams<ActionType.Bridge> = $derived(getParams(action))
	const bridgeCoins = $derived(
		bridgeCoinsByChainId[p.fromChainId ?? ChainId.Ethereum] ?? [],
	)
	const selectedCoin = $derived(bridgeCoins.find((c) => c.address === p.tokenAddress) ?? bridgeCoins[0])
	const syntheticCoin = $derived({
		type: CoinType.Erc20 as const,
		chainId: p.fromChainId ?? ChainId.Ethereum,
		address: p.tokenAddress as `0x${string}`,
		symbol: p.tokenSymbol || 'Token',
		decimals: p.tokenDecimals,
	})

	$effect(() => {
		if (bridgeCoins.length === 0) return
		const match = bridgeCoins.find((c) => c.address === p.tokenAddress)
		if (match) return
		const first = bridgeCoins[0]
		action = {
			...action,
			params: {
				...action.params,
				tokenAddress: first.address,
				tokenSymbol: first.symbol,
				tokenDecimals: first.decimals,
			},
		}
	})


	// Components
	import CoinAmountInput from '$/views/CoinAmountInput.svelte'
	import CoinInput from '$/views/CoinInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
	import TokenAmountInput from '$/views/TokenAmountInput.svelte'
</script>

{#if action.type === ActionType.Bridge}
	<div data-column>
		<label data-column="gap-2">
			<span>From network</span>
			<NetworkInput
				networks={filteredNetworks}
				bind:value={p.fromChainId}
				ariaLabel="From network"
			/>
		</label>
		{#if bridgeCoins.length >= 1}
			<label data-column="gap-2">
				<span>Coin</span>
				<CoinInput
					coins={bridgeCoins as [Coin, ...Coin[]]}
					bind:value={() => selectedCoin, (c) => {
						if (c)
							action = {
								...action,
								params: {
									...action.params,
									tokenAddress: c.address,
									tokenSymbol: c.symbol,
									tokenDecimals: c.decimals,
								},
							}
					}}
					ariaLabel="Coin"
				/>
			</label>
		{/if}
		<label data-column="gap-2">
			<span>To network</span>
			<NetworkInput
				networks={filteredNetworks}
				bind:value={p.toChainId}
				ariaLabel="To network"
			/>
		</label>
		<label data-column="gap-2">
			<span>Amount</span>
			{#if bridgeCoins.length >= 1}
				<CoinAmountInput
					coins={bridgeCoins as [Coin, ...Coin[]]}
					bind:coin={() => selectedCoin, (c) => {
						if (c)
							action = {
								...action,
								params: {
									...action.params,
									tokenAddress: c.address,
									tokenSymbol: c.symbol,
									tokenDecimals: c.decimals,
								},
							}
					}}
					min={0n}
					max={0n}
					bind:value={p.amount}
					bind:isInvalid={invalid}
					ariaLabel="Amount"
				/>
			{:else}
				<TokenAmountInput
					coin={syntheticCoin}
					min={0n}
					max={0n}
					bind:value={p.amount}
					bind:isInvalid={invalid}
					ariaLabel="Amount"
				/>
			{/if}
		</label>
	</div>
{/if}
