# Spec 027: Dark mode support

System-aware and user-toggleable dark mode for the bridge interface.

## Requirements

1. **Detection:**
   - Detect system preference via `prefers-color-scheme`
   - Allow manual override via toggle
   - Persist preference in localStorage

2. **Color scheme:**
   - Light mode (default when no preference)
   - Dark mode
   - Smooth transition between modes

3. **Implementation:**
   - CSS custom properties for all colors
   - Single source of truth for theme
   - Works with Bits UI components

## Implementation

### Color tokens (`src/styles/colors.css`)

```css
:root {
  /* Light mode (default) */
  --color-bg-page: #ffffff;
  --color-bg-card: #ffffff;
  --color-bg-subtle: #f9fafb;
  --color-bg-input: #ffffff;

  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-text-inverted: #ffffff;

  --color-border: #e5e7eb;
  --color-border-input: #d1d5db;

  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-foreground: #ffffff;

  --color-success: #16a34a;
  --color-success-bg: #dcfce7;
  --color-warning: #d97706;
  --color-warning-bg: #fef3c7;
  --color-error: #dc2626;
  --color-error-bg: #fef2f2;
  --color-info: #2563eb;
  --color-info-bg: #dbeafe;

  --color-skeleton: #e5e7eb;
  --color-skeleton-highlight: #f3f4f6;

  --color-focus: #3b82f6;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* Dark mode */
[data-theme="dark"] {
  --color-bg-page: #111827;
  --color-bg-card: #1f2937;
  --color-bg-subtle: #1f2937;
  --color-bg-input: #374151;

  --color-text: #f9fafb;
  --color-text-muted: #9ca3af;
  --color-text-inverted: #111827;

  --color-border: #374151;
  --color-border-input: #4b5563;

  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-primary-foreground: #ffffff;

  --color-success: #22c55e;
  --color-success-bg: rgba(34, 197, 94, 0.15);
  --color-warning: #f59e0b;
  --color-warning-bg: rgba(245, 158, 11, 0.15);
  --color-error: #ef4444;
  --color-error-bg: rgba(239, 68, 68, 0.15);
  --color-info: #3b82f6;
  --color-info-bg: rgba(59, 130, 246, 0.15);

  --color-skeleton: #374151;
  --color-skeleton-highlight: #4b5563;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
}

/* System preference */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg-page: #111827;
    --color-bg-card: #1f2937;
    /* ... all dark mode values ... */
  }
}

/* Transition for theme changes */
:root {
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}
```

### Theme store (`src/lib/theme.svelte.ts`)

```typescript
export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'bridge-theme'

const getSystemTheme = (): 'light' | 'dark' => (
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
)

const createThemeStore = () => {
  let preference = $state<Theme>('system')
  let resolved = $state<'light' | 'dark'>('light')

  // Initialize from localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      preference = stored
    }
    resolved = preference === 'system' ? getSystemTheme() : preference
  }

  // Watch for system preference changes
  $effect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (preference === 'system') {
        resolved = getSystemTheme()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  })

  // Apply theme to document
  $effect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.theme = resolved
  })

  const setTheme = (theme: Theme) => {
    preference = theme
    resolved = theme === 'system' ? getSystemTheme() : theme
    localStorage.setItem(STORAGE_KEY, theme)
  }

  const toggle = () => {
    setTheme(resolved === 'light' ? 'dark' : 'light')
  }

  return {
    get preference() { return preference },
    get resolved() { return resolved },
    setTheme,
    toggle,
  }
}

export const theme = createThemeStore()
```

### `src/components/ThemeToggle.svelte`

```svelte
<script lang="ts">
  import { Button, DropdownMenu } from 'bits-ui'
  import { theme, type Theme } from '$/lib/theme.svelte'

  const options: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '💻' },
  ]

  const currentIcon = $derived(
    theme.resolved === 'dark' ? '🌙' : '☀️'
  )
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger data-theme-toggle aria-label="Toggle theme">
    <span aria-hidden="true">{currentIcon}</span>
  </DropdownMenu.Trigger>

  <DropdownMenu.Content data-theme-menu>
    {#each options as option (option.value)}
      <DropdownMenu.Item
        data-theme-option
        data-selected={theme.preference === option.value ? '' : undefined}
        onclick={() => theme.setTheme(option.value)}
      >
        <span aria-hidden="true">{option.icon}</span>
        <span>{option.label}</span>
        {#if theme.preference === option.value}
          <span aria-hidden="true">✓</span>
        {/if}
      </DropdownMenu.Item>
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>

<style>
  [data-theme-toggle] {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5em;
    height: 2.5em;
    border-radius: 0.5em;
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border);
    cursor: pointer;
    font-size: 1em;
  }

  [data-theme-toggle]:hover {
    background: var(--color-bg-card);
  }

  [data-theme-menu] {
    min-width: 140px;
  }

  [data-theme-option] {
    display: flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.5em 0.75em;
    cursor: pointer;
  }

  [data-theme-option]:hover {
    background: var(--color-bg-subtle);
  }

  [data-theme-option][data-selected] {
    font-weight: 600;
  }

  [data-theme-option] span:last-child {
    margin-left: auto;
  }
</style>
```

### Simple toggle variant

```svelte
<script lang="ts">
  import { Button } from 'bits-ui'
  import { theme } from '$/lib/theme.svelte'
</script>

<Button.Root
  onclick={() => theme.toggle()}
  aria-label={`Switch to ${theme.resolved === 'light' ? 'dark' : 'light'} mode`}
  data-theme-toggle
>
  {theme.resolved === 'dark' ? '☀️' : '🌙'}
</Button.Root>
```

### Add to navigation

```svelte
<!-- In Navigation.svelte or header -->
<ThemeToggle />
```

## Acceptance criteria

### Theme store
- [x] Default to system preference
- [x] `setTheme('light' | 'dark' | 'system')` changes theme
- [x] `toggle()` switches between light and dark
- [x] Preference persisted in localStorage
- [x] System preference changes detected
- [x] `resolved` always returns 'light' or 'dark'

### CSS
- [x] All colors use CSS custom properties
- [x] Dark mode colors defined
- [x] System preference media query works
- [x] Smooth transition between themes
- [x] Shadows adapt to theme

### ThemeToggle
- [x] Shows current theme icon
- [x] Dropdown with Light/Dark/System options
- [x] Current option marked
- [x] Clicking option changes theme

### Integration
- [x] Toggle in header/navigation
- [x] Theme applied on page load (no flash)
- [x] Works with Bits UI components
- [x] All components respect theme colors

## Status

Complete. `src/app.html`: blocking script reads localStorage key `bridge-theme` or system preference and sets `document.documentElement.dataset.theme` before first paint (no flash). `src/styles/colors.css`: :root light tokens and [data-theme="dark"] dark tokens; --color-* full set; transition on :root; color-scheme: dark in dark; --color-sticky-bg for components. `src/lib/theme.svelte.ts`: theme store with preference (light|dark|system), resolved (light|dark), setTheme, toggle, localStorage persist, $effect for system preference listener and document apply (dataset.theme + colorScheme). `src/components/ThemeToggle.svelte`: DropdownMenu with trigger (current icon), Light/Dark/System items, selected marked, onclick setTheme. Navigation: ThemeToggle in header. Components use var(--color-*) throughout; Bits UI uses --color-bg etc.

## Output when complete

`DONE`
