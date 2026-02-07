<script lang="ts">


	// Props
	let {
		selectedActor,
		balanceTokens = [],
	}: {
		selectedActor: `0x${string}` | null,
		balanceTokens?: {
			chainId: number,
			tokenAddress: `0x${string}`,
		}[],
	} = $props()


	// Components
	import CoinBalances from '$/views/CoinBalances.svelte'
</script>


<CoinBalances
	{selectedActor}
	{balanceTokens}
/>
