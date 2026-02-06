export const debounce = <T extends (...args: Parameters<T>) => void>(
	fn: T,
	ms: number,
) => {
	let timeout: ReturnType<typeof setTimeout> | null = null
	const run = (...args: Parameters<T>) => {
		if (timeout) clearTimeout(timeout)
		timeout = setTimeout(() => {
			timeout = null
			fn(...args)
		}, ms)
	}
	run.cancel = () => {
		if (timeout) clearTimeout(timeout)
		timeout = null
	}
	return run
}

