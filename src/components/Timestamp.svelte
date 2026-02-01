<script module lang="ts">
	// Types/constants
	export enum TimestampFormat {
		Absolute = 'absolute',
		Relative = 'relative',
		Both = 'both',
	}
</script>


<script lang="ts">
	// Props
	let {
		timestamp,
		format = TimestampFormat.Absolute,
	}: {
		timestamp: number
		format?: TimestampFormat
	} = $props()


	// Functions
	import { formatRelativeTime } from '$/lib/formatRelativeTime'


	// State
	let now = $state(
		Date.now()
	)

	const date = $derived(
		typeof timestamp === 'number' ?
			new Date(timestamp)
		:
			undefined
	)

	const isoString = $derived(
		date?.toISOString()
	)

	const absoluteTime = $derived(
		date?.toLocaleString()
	)

	const relativeTime = $derived(
		typeof timestamp === 'number' ?
			formatRelativeTime(now - timestamp)
		:
			undefined
	)

	// $effect(() => {
	// 	if (format === TimestampFormat.Relative || format === TimestampFormat.Both) {
	// 		const interval = setInterval(() => {
	// 			now = Date.now()
	// 		}, 1000)

	// 		return () => {
	// 			clearInterval(interval)
	// 		}
	// 	}
	// })
</script>


{#if format === TimestampFormat.Absolute}
	<time
		datetime={isoString}
		title={relativeTime}
	>{absoluteTime}</time>
{:else if format === TimestampFormat.Relative}
	<time
		datetime={isoString}
		title={absoluteTime}
	>{relativeTime}</time>
{:else if format === TimestampFormat.Both}
	<time
		datetime={isoString}
		title={`${absoluteTime} (${relativeTime})`}
	>{absoluteTime} ({relativeTime})</time>
{/if}
