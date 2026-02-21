<script lang="ts">
	// Types/constants
	import { redirect } from '@sveltejs/kit'
	import { CoinId } from '$/constants/coins.ts'


	// Functions
	export function load() {
		redirect(302, `/coin/${CoinId.USDC}`)
	}
</script>


<main></main>
