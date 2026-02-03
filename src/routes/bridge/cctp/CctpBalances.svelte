<script lang="ts">
	// Props
	let {
		selectedActor,
	}: {
		selectedActor: `0x${string}` | null
	} = $props()

	// Components
	import Balances from '$/views/Balances.svelte'
</script>

<Balances {selectedActor} />
