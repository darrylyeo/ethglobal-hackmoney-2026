<script lang='ts'>
	// Types/constants
	import type { BridgeError } from '$/lib/errors'

	// Functions
	import { Button } from 'bits-ui'
	import { getRetryDelay } from '$/lib/errors'

	// Props
	let {
		error,
		attempt = 1,
		onRetry,
		onDismiss,
		showDetails = false,
	}: {
		error: BridgeError
		attempt?: number
		onRetry?: () => void
		onDismiss?: () => void
		showDetails?: boolean
	} = $props()

	// State
	let countdown = $state(0)

	const canRetry = $derived(countdown === 0)

	$effect(() => {
		if (!error.retryable) return
		const delay = getRetryDelay(error, attempt)
		if (delay <= 1000) return
		let count = Math.ceil(delay / 1000)
		countdown = count
		const interval = setInterval(() => {
			count--
			countdown = count
			if (count <= 0) clearInterval(interval)
		}, 1000)
		return () => clearInterval(interval)
	})
</script>

<div role="alert" data-error-display data-code={error.code} data-card="secondary" data-column="gap-2">
	<div data-row="gap-2 align-center">
		<span>⚠️</span>
		<strong data-error data-row-item="flexible">{error.title}</strong>
		{#if onDismiss}
			<button type="button" data-error-dismiss onclick={onDismiss} aria-label="Dismiss">
				✕
			</button>
		{/if}
	</div>

	<p>{error.message}</p>
	{#if error.suggestion}
		<p data-muted>{error.suggestion}</p>
	{/if}

	{#if error.retryable && onRetry}
		<div data-row="gap-2">
			<Button.Root
				type="button"
				onclick={onRetry}
				disabled={!canRetry}
			>
				{#if countdown > 0}
					Retry in {countdown}s
				{:else}
					Try again
				{/if}
			</Button.Root>
		</div>
	{/if}

	{#if showDetails && error.originalError}
		<details data-error-details>
			<summary>Technical details</summary>
			<pre>{error.originalError.message}</pre>
		</details>
	{/if}
</div>

<style>
	[data-error-dismiss] {
		background: none;
		border: none;
		padding: 0.25em;
		opacity: 0.6;
	}

	[data-error-dismiss]:hover {
		opacity: 1;
	}

	[data-error-details] pre {
		margin-top: 0.5em;
		padding: 0.5em;
		background: rgba(0, 0, 0, 0.05);
		border-radius: 0.25em;
		overflow-x: auto;
		white-space: pre-wrap;
		word-break: break-all;
	}
</style>
