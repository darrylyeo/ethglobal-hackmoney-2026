<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/state'

	$effect(() => {
		const coinId = page.params.coinId ?? ''
		goto(`/coin/${coinId}`, { replaceState: true })
	})
</script>
