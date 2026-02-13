<script lang="ts">
	// Types/constants
	import { ActionType, type Action, type ActionParams } from '$/constants/actions.ts'
	import type { Coin } from '$/constants/coins.ts'
	import type { Network } from '$/constants/networks.ts'
	import { slippagePresets } from '$/constants/slippage.ts'
	import { formatSlippagePercent } from '$/lib/slippage.ts'


	// Props
	let {
		action = $bindable(),
		filteredNetworks,
		chainCoins,
		asNonEmptyCoins,
	}: {
		action: Action<ActionType.Swap>
		filteredNetworks: readonly Network[]
		chainCoins: (chainId: number) => Coin[]
		asNonEmptyCoins: (coins: Coin[]) => coins is [Coin, ...Coin[]]
	} = $props()


	// State
	let invalid = $state(false)


	// (Derived)
	const params = $derived(
		action?.params != null ? (action.params as ActionParams<ActionType.Swap>) : null,
	)
	const coins = $derived(params ? chainCoins(params.chainId) : [])
	const tokenInCoin = $derived(
		params && typeof params.tokenIn === 'string' && coins.length
			? (coins.find((c) => c.address === params.tokenIn) ?? coins[0])
			: null,
	)
	const tokenOutCoin = $derived(
		params && typeof params.tokenOut === 'string' && coins.length
			? (coins.find((c) => c.address === params.tokenOut) ?? (coins[1] ?? coins[0]))
			: null,
	)


	// Components
	import Select from '$/components/Select.svelte'
	import CoinInput from '$/views/CoinInput.svelte'
	import CoinAmountInput from '$/views/CoinAmountInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
</script>


	<div data-column>
		<label data-column="gap-2">
			<span>Network</span>
			<NetworkInput
				networks={filteredNetworks}
				bind:value={() => params?.chainId ?? 0, (v) => {
					if (action?.params != null)
						action = { ...action, params: { ...action.params, chainId: v } }
				}}
				ariaLabel="Network"
			/>
		</label>
		{#if asNonEmptyCoins(coins)}
			<div data-column="gap-2">
				<label data-column="gap-2">
					<span>From</span>
					<CoinAmountInput
						coins={coins}
						bind:coin={() => tokenInCoin ?? coins[0], (c) => {
							if (c && action?.params != null)
								action = { ...action, params: { ...action.params, tokenIn: c.address } }
						}}
						min={0n}
						max={0n}
						bind:value={params!.amount}
						bind:isInvalid={invalid}
						ariaLabel="Amount in"
					/>
				</label>
			</div>
			<div data-column="gap-2">
				<label data-column="gap-2">
					<span>To</span>
					<CoinInput
						coins={coins}
						bind:value={() => tokenOutCoin, (c) => {
							if (c && action?.params != null)
								action = { ...action, params: { ...action.params, tokenOut: c.address } }
						}}
						ariaLabel="Token out"
					/>
				</label>
			</div>
			<div data-column="gap-2">
				<label data-column="gap-2">
					<span>Slippage</span>
					<Select
						items={slippagePresets}
						bind:value={() => slippagePresets.find((x) => Math.abs(x.value - (params?.slippage ?? 0)) < 1e-9) ?? undefined, (preset) => {
							if (preset && action?.params != null)
								action = { ...action, params: { ...action.params, slippage: preset.value } }
						}}
						getItemId={(x) => x.id}
						getItemLabel={(x) => formatSlippagePercent(x.value)}
						placeholder={params != null ? formatSlippagePercent(params.slippage) : ''}
						ariaLabel="Slippage"
					/>
				</label>
			</div>
		{:else}
			<p data-muted>No tokens for this network.</p>
		{/if}
	</div>
