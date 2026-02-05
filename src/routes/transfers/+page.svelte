<script lang="ts">
	import { redirect } from '@sveltejs/kit'

	export function load() {
		redirect(302, '/explore/usdc')
	}
</script>
