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

	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
		const initial = stored && (stored === 'light' || stored === 'dark' || stored === 'system')
			? stored
			: 'system'
		preference = initial
		resolved = initial === 'system' ? getSystemTheme() : initial
	}

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

	$effect(() => {
		if (typeof document === 'undefined') return
		document.documentElement.dataset.theme = resolved
		document.documentElement.style.colorScheme = resolved
	})

	const setTheme = (theme: Theme) => {
		preference = theme
		resolved = theme === 'system' ? getSystemTheme() : theme
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, theme)
		}
	}

	const toggle = () => {
		setTheme(resolved === 'light' ? 'dark' : 'light')
	}

	return {
		get preference() {
			return preference
		},
		get resolved() {
			return resolved
		},
		setTheme,
		toggle,
	}
}

export const theme = createThemeStore()
