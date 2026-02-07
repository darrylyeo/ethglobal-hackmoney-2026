<script lang="ts">


	// Types/constants
	import { redirect } from '@sveltejs/kit'


	// Functions
	export function load() {
		redirect(302, '/coin/USDC')
	}
</script>

