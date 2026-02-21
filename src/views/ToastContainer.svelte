<script lang="ts">
	// Props
	let {
		position = 'bottom-right',
	}: {
		position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
	} = $props()


	// State
	import { toasts } from '$/lib/toast.svelte.ts'


	// Components
	import Toast from '$/components/Toast.svelte'
</script>


<div
	class="toast-container position-{position}"
	role="region"
	aria-label="Notifications"
	aria-live="polite"
>
	{#each toasts.toasts as toast (toast.id)}
		<Toast {toast} onDismiss={() => toasts.dismiss(toast.id)} />
	{/each}
</div>


<style>
	.toast-container {
		position: fixed;
		z-index: 200;
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		max-width: 400px;
		width: 100%;
		padding: 1em;
		pointer-events: none;

		> :global(*) {
			pointer-events: auto;
		}

		&.position-top-right {
			top: 0;
			right: 0;
		}

		&.position-top-left {
			top: 0;
			left: 0;
		}

		&.position-bottom-right {
			bottom: 0;
			right: 0;
			flex-direction: column-reverse;
		}

		&.position-bottom-left {
			bottom: 0;
			left: 0;
			flex-direction: column-reverse;
		}
	}
</style>

