<script lang="ts">
	// Types/constants
	import { ActionType, type Action, type ActionParams } from '$/constants/actions.ts'
	import { ZERO_ADDRESS } from '$/api/voltaire.ts'
	import type { CoinInstance } from '$/constants/coin-instances.ts'
	import {
		CoinInstanceType,
		erc20TokenByNetwork,
		nativeCurrencyByNetwork,
	} from '$/constants/coin-instances.ts'
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
	const bridgeCoins = $derived.by(() => {
		const chainId = p.fromChainId ?? ChainId.Ethereum
		const native = nativeCurrencyByNetwork.get(chainId) ?? []
		const erc20 = erc20TokenByNetwork.get(chainId) ?? []
		return [...native, ...erc20]
	})
	const selectedCoin = $derived(
		bridgeCoins.find((c) =>
			c.type === CoinInstanceType.Erc20Token
				? c.$id.address === p.tokenAddress
				: p.tokenAddress === ZERO_ADDRESS,
		) ?? bridgeCoins[0],
	)
	const syntheticCoin = $derived({
		type: CoinInstanceType.Erc20Token as const,
		$id: {
			$network: { chainId: p.fromChainId ?? ChainId.Ethereum },
			address: p.tokenAddress as `0x${string}`,
		},
		chainId: p.fromChainId ?? ChainId.Ethereum,
		address: p.tokenAddress as `0x${string}`,
		symbol: p.tokenSymbol || 'Token',
		decimals: p.tokenDecimals,
	} satisfies CoinInstance)

	$effect(() => {
		if (bridgeCoins.length === 0) return
		const match = bridgeCoins.find((c) =>
			c.type === CoinInstanceType.Erc20Token
				? c.$id.address === p.tokenAddress
				: p.tokenAddress === ZERO_ADDRESS,
		)
		if (match) return
		const first = bridgeCoins[0]
		action = {
			...action,
			params: {
				...action.params,
				tokenAddress:
					first.type === CoinInstanceType.Erc20Token
						? first.$id.address
						: ZERO_ADDRESS,
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
					coins={bridgeCoins as [CoinInstance, ...CoinInstance[]]}
					bind:value={() => selectedCoin, (c) => {
						if (c)
							action = {
								...action,
								params: {
									...action.params,
									tokenAddress:
										c.type === CoinInstanceType.Erc20Token
											? c.$id.address
											: ZERO_ADDRESS,
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
					coins={bridgeCoins as [CoinInstance, ...CoinInstance[]]}
					bind:coin={() => selectedCoin, (c) => {
						if (c)
							action = {
								...action,
								params: {
									...action.params,
									tokenAddress:
										c.type === CoinInstanceType.Erc20Token
											? c.$id.address
											: ZERO_ADDRESS,
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
