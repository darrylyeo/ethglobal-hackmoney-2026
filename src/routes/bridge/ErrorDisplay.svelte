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

<div role='alert' data-error-display data-code={error.code}>
	<div data-error-header>
		<span data-error-icon>⚠️</span>
		<strong data-error-title>{error.title}</strong>
		{#if onDismiss}
			<button type='button' data-error-dismiss onclick={onDismiss} aria-label='Dismiss'>
				✕
			</button>
		{/if}
	</div>

	<p data-error-message>{error.message}</p>
	<p data-error-suggestion>{error.suggestion}</p>

	{#if error.retryable && onRetry}
		<div data-error-actions>
			<Button.Root
				type='button'
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
	[data-error-display] {
		padding: 1em;
		background: var(--color-error-bg, #fef2f2);
		border: 1px solid var(--color-error-border, #fecaca);
		border-radius: 0.5em;
	}

	[data-error-header] {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin-bottom: 0.5em;
	}

	[data-error-icon] {
		font-size: 1.25em;
	}

	[data-error-title] {
		flex: 1;
		color: var(--color-error, #dc2626);
	}

	[data-error-dismiss] {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25em;
		opacity: 0.6;
	}

	[data-error-dismiss]:hover {
		opacity: 1;
	}

	[data-error-message] {
		margin-bottom: 0.25em;
	}

	[data-error-suggestion] {
		font-size: 0.875em;
		opacity: 0.8;
		margin-bottom: 0.75em;
	}

	[data-error-actions] {
		display: flex;
		gap: 0.5em;
	}

	[data-error-details] {
		margin-top: 0.75em;
		font-size: 0.75em;
	}

	[data-error-details] summary {
		cursor: pointer;
		opacity: 0.7;
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
