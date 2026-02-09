<script lang="ts">
	// Types/constants
	import { ActionType, type Action, type ActionParams } from '$/constants/actions.ts'
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
		action: Action<ActionType.Bridge>
		filteredNetworks: readonly Network[]
	} = $props()


	// State
	let invalid = $state(false)


	// (Derived)
	const p: ActionParams<ActionType.Bridge> = $derived.by(() => action.params)
	const bridgeCoins = $derived(getBridgeCoins(p.fromChainId ?? ChainId.Ethereum))
	const selectedCoin = $derived(bridgeCoins.find((c) => c.address.toLowerCase() === p.tokenAddress.toLowerCase()) ?? bridgeCoins[0])

	$effect(() => {
		if (bridgeCoins.length === 0) return
		const match = bridgeCoins.find((c) => c.address.toLowerCase() === p.tokenAddress.toLowerCase())
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
	import CoinInput from '$/views/CoinInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
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
			<input
				type="text"
				inputmode="decimal"
				placeholder="0.00"
				value={p.amount > 0n ? formatSmallestToDecimal(p.amount, p.tokenDecimals) : ''}
				oninput={(e) => {
					const raw = (e.currentTarget as HTMLInputElement).value
					if (raw === '') {
						invalid = false
						action = { ...action, params: { ...action.params, amount: 0n } }
						return
					}
					if (isValidDecimalInput(raw, p.tokenDecimals)) {
						invalid = false
						action = {
							...action,
							params: { ...action.params, amount: parseDecimalToSmallest(raw, p.tokenDecimals) },
						}
						return
					}
					invalid = true
				}}
			/>
		</label>
	</div>
{/if}
