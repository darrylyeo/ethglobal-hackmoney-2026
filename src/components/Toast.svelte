<script lang="ts">
	// Types/constants
	import type { Toast as ToastType } from '$/lib/toast.svelte'

	// Props
	let {
		toast,
		onDismiss,
	}: {
		toast: ToastType
		onDismiss: () => void
	} = $props()

	// State
	let paused = $state(false)

	// Functions
	const icons: Record<ToastType['type'], string> = {
		info: 'ℹ️',
		success: '✓',
		warning: '⚠️',
		error: '✕',
		loading: '',
	}
</script>

<div
	data-toast
	data-type={toast.type}
	role="alert"
	onmouseenter={() => {
		paused = true
	}}
	onmouseleave={() => {
		paused = false
	}}
>
	<div data-toast-icon>
		{#if toast.type === 'loading'}
			<span data-toast-spinner aria-hidden="true"></span>
		{:else}
			{icons[toast.type]}
		{/if}
	</div>

	<div data-toast-content>
		{#if toast.title}
			<strong data-toast-title>{toast.title}</strong>
		{/if}
		<p data-toast-message>{toast.message}</p>
		{#if toast.action}
			<button
				type="button"
				data-toast-action
				onclick={toast.action.onClick}
			>
				{toast.action.label}
			</button>
		{/if}
	</div>

	{#if toast.dismissible !== false}
		<button
			type="button"
			data-toast-dismiss
			onclick={onDismiss}
			aria-label="Dismiss notification"
		>
			✕
		</button>
	{/if}

	{#if toast.duration != null && toast.duration > 0}
		<div
			data-toast-progress
			data-paused={paused ? '' : undefined}
			style="--duration: {toast.duration}ms"
		></div>
	{/if}
</div>

<style>
	[data-toast] {
		display: flex;
		align-items: flex-start;
		gap: 0.75em;
		padding: 1em;
		border-radius: 0.5em;
		background: var(--color-bg-page);
		border: 1px solid var(--color-border);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		position: relative;
		overflow: hidden;
		animation: toast-in 0.2s ease-out;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(1em);
		}
	}

	[data-toast][data-type='success'] {
		border-color: var(--color-success, #22c55e);
	}

	[data-toast][data-type='error'] {
		border-color: var(--color-error, #ef4444);
	}

	[data-toast][data-type='warning'] {
		border-color: var(--color-warning, #f59e0b);
	}

	[data-toast][data-type='info'] {
		border-color: var(--color-info, #3b82f6);
	}

	[data-toast-icon] {
		flex-shrink: 0;
		width: 1.25em;
		text-align: center;
	}

	[data-toast-spinner] {
		display: inline-block;
		width: 1em;
		height: 1em;
		border: 2px solid currentColor;
		border-right-color: transparent;
		border-radius: 50%;
		animation: toast-spin 0.6s linear infinite;
	}

	@keyframes toast-spin {
		to {
			transform: rotate(360deg);
		}
	}

	[data-toast][data-type='success'] [data-toast-icon] {
		color: var(--color-success);
	}

	[data-toast][data-type='error'] [data-toast-icon] {
		color: var(--color-error);
	}

	[data-toast][data-type='warning'] [data-toast-icon] {
		color: var(--color-warning);
	}

	[data-toast-content] {
		flex: 1;
		min-width: 0;
	}

	[data-toast-title] {
		display: block;
		margin-bottom: 0.25em;
	}

	[data-toast-message] {
		margin: 0;
		font-size: 0.875em;
		opacity: 0.9;
	}

	[data-toast-action] {
		margin-top: 0.5em;
		font-size: 0.875em;
		padding: 0.25em 0.5em;
		background: var(--color-border);
		border: none;
		border-radius: 0.25em;
		cursor: pointer;
	}

	[data-toast-dismiss] {
		flex-shrink: 0;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25em;
		opacity: 0.5;
		font-size: 0.875em;
	}

	[data-toast-dismiss]:hover {
		opacity: 1;
	}

	[data-toast-progress] {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 3px;
		background: currentColor;
		opacity: 0.3;
		animation: toast-progress var(--duration) linear forwards;
	}

	[data-toast-progress][data-paused] {
		animation-play-state: paused;
	}

	@keyframes toast-progress {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}
</style>
