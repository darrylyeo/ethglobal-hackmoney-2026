<script lang="ts">
	// Types/constants
	import { ActionType, type Action } from '$/constants/actions.ts'
	import type { Coin } from '$/constants/coins.ts'
	import { getBridgeCoins } from '$/constants/coins.ts'
	import { ChainId } from '$/constants/networks.ts'
	import type { Network } from '$/constants/networks.ts'
	import {
		formatSmallestToDecimal,
		isValidDecimalInput,
		parseDecimalToSmallest,
	} from '$/lib/format.ts'


	// Props
	let {
		action = $bindable(),
		filteredNetworks,
	}: {
		action: Action
		filteredNetworks: readonly Network[]
	} = $props()


	// State
	let invalid = $state(false)


	// (Derived)
	$effect(() => {
		if (action.type !== ActionType.Bridge) return
		const p = action.params as {
			fromChainId: number | null
			tokenAddress: `0x${string}`
			tokenSymbol: string
			tokenDecimals: number
		}
		const coins = getBridgeCoins(p.fromChainId ?? ChainId.Ethereum)
		if (coins.length === 0) return
		const match = coins.find((c) => c.address.toLowerCase() === p.tokenAddress.toLowerCase())
		if (match) return
		const first = coins[0]
		action = {
			...action,
			params: {
				...action.params,
				tokenAddress: first.address,
				tokenSymbol: first.symbol,
				tokenDecimals: first.decimals,
			},
		} as Action
	})


	// Components
	import CoinInput from '$/views/CoinInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
</script>

{#if action.type === ActionType.Bridge}
	{@const p = (action.params as {
		fromChainId: number | null
		toChainId: number | null
		tokenAddress: `0x${string}`
		tokenSymbol: string
		tokenDecimals: number
		amount: bigint
	})}
	{@const bridgeCoins = getBridgeCoins(p.fromChainId ?? ChainId.Ethereum)}
	{@const selectedCoin = bridgeCoins.find((c) => c.address.toLowerCase() === p.tokenAddress.toLowerCase()) ?? bridgeCoins[0]}
	<div data-column="gap-3">
		<label data-column="gap-0">
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
							} as Action
					}}
					ariaLabel="Coin"
				/>
			</label>
		{/if}
		<label data-column="gap-0">
			<span>To network</span>
			<NetworkInput
				networks={filteredNetworks}
				bind:value={p.toChainId}
				ariaLabel="To network"
			/>
		</label>
		<label data-column="gap-0">
			<span>Amount</span>
			<input
				type="text"
				inputmode="decimal"
				placeholder="0.00"
				value={p.amount > 0n ? formatSmallestToDecimal(p.amount, p.tokenDecimals) : ''}
				oninput={(e) => {
					const raw = (e.currentTarget as HTMLInputElement).value
					if (raw === '') {
						invalid = false
						action = { ...action, params: { ...action.params, amount: 0n } } as Action
						return
					}
					if (isValidDecimalInput(raw, p.tokenDecimals)) {
						invalid = false
						action = {
							...action,
							params: { ...action.params, amount: parseDecimalToSmallest(raw, p.tokenDecimals) },
						} as Action
						return
					}
					invalid = true
				}}
			/>
		</label>
	</div>
{/if}
