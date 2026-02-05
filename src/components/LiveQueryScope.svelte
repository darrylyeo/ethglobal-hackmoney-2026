<script lang="ts">
	import type { LiveQueryEntry } from '$/svelte/live-query-context.svelte'
	import {
		liveQueryAttachmentFrom,
		liveQueryLocalAttachmentFrom,
	} from '$/svelte/live-query-context.svelte'

	let {
		entries = [],
		scope = 'local',
	}: {
		entries?: LiveQueryEntry[]
		scope?: 'local' | 'global'
	} = $props()

	const liveQueryAttachment = $derived(
		scope === 'global'
			? liveQueryAttachmentFrom(() => entries)
			: liveQueryLocalAttachmentFrom(() => entries),
	)
</script>


<div style="display: contents" {@attach liveQueryAttachment}>
	<slot />
</div>
