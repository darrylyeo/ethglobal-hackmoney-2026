// Types/constants

export enum ToastType {
	Info = 'info',
	Success = 'success',
	Warning = 'warning',
	Error = 'error',
	Loading = 'loading',
}

export type Toast = {
	id: string
	type: ToastType
	title?: string
	message: string
	duration?: number
	action?: {
		label: string
		onClick: () => void
	}
	dismissible?: boolean,
}

type ToastState = {
	toasts: Toast[],
}


// State

let state = $state<ToastState>({ toasts: [] })

const timeouts = new Map<string, ReturnType<typeof setTimeout>>()


// Functions

const add = (toast: Omit<Toast, 'id'>): string => {
	const id = crypto.randomUUID()
	const duration = toast.duration ?? (toast.type === 'loading' ? 0 : 5000)
	state.toasts = [...state.toasts, { ...toast, id, duration }]
	if (duration > 0) {
		const t = setTimeout(() => {
			timeouts.delete(id)
			dismiss(id)
		}, duration)
		timeouts.set(id, t)
	}
	return id
}

const dismiss = (id: string) => {
	const t = timeouts.get(id)
	if (t) {
		clearTimeout(t)
		timeouts.delete(id)
	}
	state.toasts = state.toasts.filter((toast) => toast.id !== id)
}

const update = (id: string, updates: Partial<Toast>) => {
	state.toasts = state.toasts.map((t) =>
		t.id === id ? { ...t, ...updates } : t,
	)
}

const clear = () => {
	for (const t of timeouts.values()) clearTimeout(t)
	timeouts.clear()
	state.toasts = []
}

export const toasts = {
	get toasts() {
		return state.toasts
	},
	add,
	dismiss,
	update,
	clear,
	info: (
		message: string,
		options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>,
	) => add({ type: ToastType.Info, message, ...options }),
	success: (
		message: string,
		options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>,
	) => add({ type: ToastType.Success, message, ...options }),
	warning: (
		message: string,
		options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>,
	) => add({ type: ToastType.Warning, message, ...options }),
	error: (
		message: string,
		options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>,
	) => add({ type: ToastType.Error, message, duration: 0, ...options }),
	loading: (
		message: string,
		options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>,
	) => add({ type: ToastType.Loading, message, duration: 0, ...options }),
}
