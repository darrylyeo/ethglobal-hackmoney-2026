<script lang="ts">
	// Types/constants
	import { ActionType, type ActionParams, type LiquidityAction } from '$/constants/actions.ts'
	import type { CoinInstance } from '$/constants/coin-instances.ts'
	import type { Network } from '$/constants/networks.ts'
	import { liquidityFeeTierPresets } from '$/constants/uniswap.ts'


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
		asNonEmptyCoins: (coins: CoinInstance[]) => coins is [CoinInstance, ...CoinInstance[]]
	} = $props()

	// (Derived)
	const getParams = (a: LiquidityAction): ActionParams<ActionType.AddLiquidity> =>
		a.params as ActionParams<ActionType.AddLiquidity>
	const p: ActionParams<ActionType.AddLiquidity> = $derived(
		getParams(action)
	)
	const coins = $derived(
		chainCoins(p.chainId)
	)
	const token0Coin = $derived(
		coins.find((c) => c.address === p.token0) ?? coins[0]
	)
	const token1Coin = $derived(
		coins.find((c) => c.address === p.token1) ?? (coins[1] ?? coins[0])
	)


	// Components
	import Select from '$/components/Select.svelte'
	import CoinInput from '$/views/CoinInput.svelte'
	import CoinAmountInput from '$/views/CoinAmountInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
</script>


{#if action.type === ActionType.AddLiquidity || action.type === ActionType.RemoveLiquidity || action.type === ActionType.CollectFees || action.type === ActionType.IncreaseLiquidity}
	<div data-column>
		<label data-column>
			<span>
				Network
			</span>

			<NetworkInput
				networks={filteredNetworks}
				bind:value={p.chainId}
				ariaLabel="Network"
			/>
		</label>

		{#if asNonEmptyCoins(coins)}
			<label data-column>
				<span>
					Token 0
				</span>

				<CoinInput
					coins={coins}
					bind:value={() => token0Coin, (c) => {
						if (c) action = { ...action, params: { ...action.params, token0: c.address } }
					}}
					ariaLabel="Token 0"
				/>
			</label>

			<label data-column>
				<span>
					Token 1
				</span>

				<CoinInput
					coins={coins}
					bind:value={() => token1Coin, (c) => {
						if (c) action = { ...action, params: { ...action.params, token1: c.address } }
					}}
					ariaLabel="Token 1"
				/>
			</label>

			<label data-column>
				<span>
					Fee tier
				</span>

				<Select
					items={liquidityFeeTierPresets}
					bind:value={() => liquidityFeeTierPresets.find((x) => x.value === p.fee) ?? undefined, (preset) => {
						if (preset) action = { ...action, params: { ...action.params, fee: preset.value } }
					}}
					getItemId={(x) => x.id}
					getItemLabel={(x) => x.label}
					placeholder={liquidityFeeTierPresets.find((x) => x.value === p.fee)?.label ?? ''}
					ariaLabel="Fee tier"
				/>
			</label>

			<label data-column>
				<span>
					Amount 0
				</span>

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

			<label data-column>
				<span>
					Amount 1
				</span>

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
			<p data-muted>
				No tokens for this network.
			</p>
		{/if}
	</div>
{/if}
