<script lang="ts">
	// Props
	let {
		selectedActor,
		balanceTokens = [],
	}: {
		selectedActor: `0x${string}` | null
		balanceTokens?: {
			chainId: number
			tokenAddress: `0x${string}`
		}[]
	} = $props()

	// Components
	import Balances from '$/views/Balances.svelte'
</script>


<Balances {selectedActor} {balanceTokens} />
