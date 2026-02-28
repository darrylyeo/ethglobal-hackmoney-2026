<script lang="ts">
	// Types/constants
	import type { TransferEventRow } from '$/collections/TransferEvents.ts'
	import type { CoinInstance } from '$/constants/coin-instances.ts'
	import { CoinId, coinById } from '$/constants/coins.ts'
	import TransferEventRowView from '$/views/TransferEventRow.svelte'


	// Props
	let {
		item,
		coin,
		symbol,
	}: {
		item: TransferEventRow
		coin: CoinInstance
		symbol: string
	} = $props()

	// (Derived)
	const coinIconSrc = $derived(
		coin.icon?.original?.url ??
		coin.icon?.thumbnail?.url ??
		coin.icon?.low?.url ??
		(coin.coinId != null ? coinById[coin.coinId]?.icon : null) ??
		coinById[CoinId.ETH]?.icon,
	)


	// Functions
	function formatAmount(amount: string): string {
		const n = Number(amount) / 1e6
		return n.toLocaleString(undefined, {
			minimumFractionDigits: 0,
			maximumFractionDigits: 4,
		})
	}
	function formatTime(ts: number): string {
		return new Date(ts).toLocaleString(undefined, {
			dateStyle: 'short',
			timeStyle: 'short',
		})
	}
</script>


<TransferEventRowView
	{item}
	{coin}
	{formatAmount}
	{formatTime}
	{coinIconSrc}
/>
