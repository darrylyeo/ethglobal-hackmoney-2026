# Spec 025: Toast notifications

Non-blocking notifications for transaction status updates, errors, and success
messages.

## Requirements

1. **Toast types:**
   - `info` – General information (blue)
   - `success` – Successful action (green)
   - `warning` – Attention needed (amber)
   - `error` – Error occurred (red)
   - `loading` – In progress with spinner

2. **Behavior:**
   - Auto-dismiss after timeout (configurable, default 5s)
   - Manual dismiss with X button
   - Stack multiple toasts
   - Pause timer on hover

3. **Position:**
   - Default: bottom-right
   - Configurable: top-right, top-left, bottom-left

4. **Content:**
   - Title (optional)
   - Message (required)
   - Action button (optional)
   - Progress bar for auto-dismiss

## Implementation

### Toast store (`src/lib/toast.svelte.ts`)

```typescript
export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'loading'

export type Toast = {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number // ms, 0 = no auto-dismiss
  action?: {
    label: string
    onClick: () => void
  }
  dismissible?: boolean
}

type ToastState = {
  toasts: Toast[]
}

const createToastStore = () => {
  let state = $state<ToastState>({ toasts: [] })

  const add = (toast: Omit<Toast, 'id'>): string => {
    const id = crypto.randomUUID()
    state.toasts = [...state.toasts, { ...toast, id }]

    // Auto-dismiss
    const duration = toast.duration ?? (toast.type === 'loading' ? 0 : 5000)
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }

    return id
  }

  const dismiss = (id: string) => {
    state.toasts = state.toasts.filter(t => t.id !== id)
  }

  const update = (id: string, updates: Partial<Toast>) => {
    state.toasts = state.toasts.map(t =>
      t.id === id ? { ...t, ...updates } : t
    )
  }

  const clear = () => {
    state.toasts = []
  }

  // Convenience methods
  const info = (message: string, options?: Partial<Toast>) =>
    add({ type: 'info', message, ...options })

  const success = (message: string, options?: Partial<Toast>) =>
    add({ type: 'success', message, ...options })

  const warning = (message: string, options?: Partial<Toast>) =>
    add({ type: 'warning', message, ...options })

  const error = (message: string, options?: Partial<Toast>) =>
    add({ type: 'error', message, duration: 0, ...options })

  const loading = (message: string, options?: Partial<Toast>) =>
    add({ type: 'loading', message, duration: 0, ...options })

  return {
    get toasts() { return state.toasts },
    add,
    dismiss,
    update,
    clear,
    info,
    success,
    warning,
    error,
    loading,
  }
}

export const toasts = createToastStore()
```

### `src/components/ToastContainer.svelte`

```svelte
<script lang="ts">
  import { toasts } from '$/lib/toast.svelte'
  import Toast from './Toast.svelte'

  let {
    position = 'bottom-right',
  }: {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  } = $props()
</script>

<div
  data-toast-container
  data-position={position}
  role="region"
  aria-label="Notifications"
  aria-live="polite"
>
  {#each toasts.toasts as toast (toast.id)}
    <Toast {toast} onDismiss={() => toasts.dismiss(toast.id)} />
  {/each}
</div>

<style>
  [data-toast-container] {
    position: fixed;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    max-width: 400px;
    width: 100%;
    padding: 1em;
    pointer-events: none;
  }

  [data-toast-container] > :global(*) {
    pointer-events: auto;
  }

  [data-position="top-right"] {
    top: 0;
    right: 0;
  }

  [data-position="top-left"] {
    top: 0;
    left: 0;
  }

  [data-position="bottom-right"] {
    bottom: 0;
    right: 0;
    flex-direction: column-reverse;
  }

  [data-position="bottom-left"] {
    bottom: 0;
    left: 0;
    flex-direction: column-reverse;
  }
</style>
```

### `src/components/Toast.svelte`

```svelte
<script lang="ts">
  import type { Toast as ToastType } from '$/lib/toast.svelte'
  import { Button } from 'bits-ui'
  import Spinner from './Spinner.svelte'

  let {
    toast,
    onDismiss,
  }: {
    toast: ToastType
    onDismiss: () => void
  } = $props()

  let paused = $state(false)

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
  onmouseenter={() => { paused = true }}
  onmouseleave={() => { paused = false }}
>
  <div data-toast-icon>
    {#if toast.type === 'loading'}
      <Spinner size="1em" />
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
      <Button.Root
        type="button"
        onclick={toast.action.onClick}
        data-toast-action
      >
        {toast.action.label}
      </Button.Root>
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

  {#if toast.duration && toast.duration > 0}
    <div
      data-toast-progress
      data-paused={paused ? '' : undefined}
      style:--duration="{toast.duration}ms"
    />
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

  [data-toast][data-type="success"] {
    border-color: var(--color-success, #22c55e);
  }

  [data-toast][data-type="error"] {
    border-color: var(--color-error, #ef4444);
  }

  [data-toast][data-type="warning"] {
    border-color: var(--color-warning, #f59e0b);
  }

  [data-toast][data-type="info"] {
    border-color: var(--color-info, #3b82f6);
  }

  [data-toast-icon] {
    flex-shrink: 0;
    width: 1.25em;
    text-align: center;
  }

  [data-toast][data-type="success"] [data-toast-icon] {
    color: var(--color-success);
  }

  [data-toast][data-type="error"] [data-toast-icon] {
    color: var(--color-error);
  }

  [data-toast][data-type="warning"] [data-toast-icon] {
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
    animation: progress var(--duration) linear forwards;
  }

  [data-toast-progress][data-paused] {
    animation-play-state: paused;
  }

  @keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
  }
</style>
```

### Usage in bridge flow

```svelte
<script>
  import { toasts } from '$/lib/toast.svelte'

  const executeBridge = async () => {
    const loadingId = toasts.loading('Submitting transaction…')

    try {
      const result = await executeSelectedRoute(...)

      toasts.dismiss(loadingId)
      toasts.success('Bridge transaction submitted!', {
        title: 'Success',
        action: {
          label: 'View on Explorer',
          onClick: () => window.open(txUrl, '_blank'),
        },
      })
    } catch (e) {
      toasts.dismiss(loadingId)
      const error = categorizeError(e)
      toasts.error(error.message, {
        title: error.title,
        action: error.retryable
          ? { label: 'Retry', onClick: executeBridge }
          : undefined,
      })
    }
  }
</script>
```

### Add to layout

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import ToastContainer from '$/components/ToastContainer.svelte'
</script>

<slot />
<ToastContainer position="bottom-right" />
```

## Acceptance criteria

### Toast store
- [x] `toasts.add()` creates toast with unique ID
- [x] `toasts.dismiss()` removes toast by ID
- [x] `toasts.update()` modifies existing toast
- [x] `toasts.clear()` removes all toasts
- [x] Convenience methods: info, success, warning, error, loading
- [x] Auto-dismiss after duration (default 5s)
- [x] Loading toasts don't auto-dismiss

### Toast component
- [x] Displays icon, title (optional), message
- [x] Type-specific styling (colors, icons)
- [x] Dismiss button (X)
- [x] Action button (optional)
- [x] Progress bar for auto-dismiss
- [x] Pause progress on hover
- [x] Entrance animation

### ToastContainer
- [x] Renders list of toasts
- [x] Configurable position (4 corners)
- [x] Stacks multiple toasts
- [x] Proper ARIA attributes

### Integration
- [x] Success toast on bridge submit
- [x] Error toast with retry action
- [x] Loading toast during transaction
- [x] Toast dismissed when transaction completes

## Status

Complete. `src/lib/toast.svelte.ts` store (add/dismiss/update/clear, convenience
methods, auto-dismiss, loading no auto-dismiss); `src/components/Toast.svelte`
(icon, title, message, type styling, dismiss, action, progress bar, pause on
hover, entrance animation); `src/components/ToastContainer.svelte` (position,
stack, ARIA); layout includes ToastContainer; BridgeExecution.svelte shows loading
toast, success with View on Explorer, error with Retry, loading dismissed on
completion.

## Output when complete

`DONE`
