<script lang="ts">
	import { goto } from '$app/navigation'

	$effect(() => {
		goto('/positions/channels', { replaceState: true })
	})
</script>
