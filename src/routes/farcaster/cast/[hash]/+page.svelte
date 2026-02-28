<script lang="ts">
	// Context
	import { goto } from '$app/navigation'
	import { page } from '$app/state'

	// State
	import { ensureCastByHash } from '$/collections/FarcasterCasts.ts'
	import { castUrl } from '$/constants/farcaster.ts'

	// (Derived)
	const hashParam = $derived(
		page.params.hash ?? ''
	)
	const hash = $derived(
		(hashParam?.startsWith('0x') ?
			hashParam
		: `0x${hashParam}`) as `0x${string}`,
	)

	let status = $state<'loading' | 'done' | 'error'>('loading')
	$effect(() => {
		if (!hashParam) {
			status = 'error'
			return
		}
		status = 'loading'
		ensureCastByHash(hash)
			.then((cast) =>
				goto(castUrl(cast.$id.fid, cast.$id.hash), {
					replaceState: true,
				}),
			)
			.catch(() => (status = 'error'))
	})
</script>


<svelte:head>
	<title>Cast · Farcaster</title>
</svelte:head>


<main data-column="gap-4">
	{#if status === 'loading'}
		<p>Loading cast…</p>
	{:else if status === 'error'}
		<p>Cast not found</p>
	{/if}
</main>
