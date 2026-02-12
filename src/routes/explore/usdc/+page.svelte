<script lang="ts">
	import { goto } from '$app/navigation'

	$effect(() => {
		goto('/coin/USDC', { replaceState: true })
	})
</script>
