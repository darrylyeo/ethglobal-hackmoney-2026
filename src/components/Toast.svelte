<script lang="ts">
	// Types/constants
	import { ToastType, type Toast } from '$/lib/toast.svelte.ts'


	// Props
	let {
		toast,
		onDismiss,
	}: {
		toast: Toast,
		onDismiss: () => void,
	} = $props()


	// State
	let paused = $state(false)


	// Components
	import Icon from '$/components/Icon.svelte'
</script>


<div
	class="toast-root"
	data-card
	data-row="gap-3"
	data-type={toast.type}
	role="alert"
	onmouseenter={() => {
		paused = true
	}}
	onmouseleave={() => {
		paused = false
	}}
>
	<div class="toast-icon">
		{#if toast.type === ToastType.Loading}
			<span class="toast-spinner" aria-hidden="true"></span>
		{:else}
			<Icon
				icon={{
					info: 'ℹ️',
					success: '✓',
					warning: '⚠️',
					error: '✕',
					loading: '',
				}[toast.type]}
			/>
		{/if}
	</div>

	<div class="toast-content">
		{#if toast.title}
			<strong class="toast-title">{toast.title}</strong>
		{/if}
		<p class="toast-message">{toast.message}</p>
		{#if toast.action}
			<button type="button" class="toast-action" onclick={toast.action.onClick}>
				{toast.action.label}
			</button>
		{/if}
	</div>

	{#if toast.dismissible !== false}
		<button
			type="button"
			class="toast-dismiss"
			onclick={onDismiss}
			aria-label="Dismiss notification"
		>
			✕
		</button>
	{/if}

	{#if toast.duration != null && toast.duration > 0}
		<div
			class="toast-progress"
			data-paused={paused ? '' : undefined}
			style="--duration: {toast.duration}ms"
		></div>
	{/if}
</div>


<style>
	.toast-root {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		position: relative;
		overflow: hidden;
		animation: toast-in 0.2s ease-out;

		&[data-type='success'] {
			border-color: var(--color-success);

			.toast-icon {
				color: var(--color-success);
			}
		}

		&[data-type='error'] {
			border-color: var(--color-error);

			.toast-icon {
				color: var(--color-error);
			}
		}

		&[data-type='warning'] {
			border-color: var(--color-warning);

			.toast-icon {
				color: var(--color-warning);
			}
		}

		&[data-type='info'] {
			border-color: var(--color-info);
		}
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(1em);
		}
	}

	.toast-icon {
		flex-shrink: 0;
		width: 1.25em;
		text-align: center;
	}

	.toast-spinner {
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

	.toast-content {
		flex: 1;
		min-width: 0;
	}

	.toast-title {
		display: block;
		margin-bottom: 0.25em;
	}

	.toast-message {
		margin: 0;
		font-size: 0.875em;
		opacity: 0.9;
	}

	.toast-action {
		margin-top: 0.5em;
		font-size: 0.875em;
		padding: 0.25em 0.5em;
		background: var(--color-border);
		border: none;
		border-radius: 0.25em;
		cursor: pointer;
	}

	.toast-dismiss {
		flex-shrink: 0;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.25em;
		opacity: 0.5;
		font-size: 0.875em;

		&:hover {
			opacity: 1;
		}
	}

	.toast-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 3px;
		background: currentColor;
		opacity: 0.3;
		animation: toast-progress var(--duration) linear forwards;

		&[data-paused] {
			animation-play-state: paused;
		}
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
