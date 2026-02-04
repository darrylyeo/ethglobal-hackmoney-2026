import { getContext, hasContext, setContext } from 'svelte'

export const useContext = <T>(key: string, getInitialValue: () => T) => {
	if (!hasContext(key)) return setContext(key, getInitialValue())
	const existing = getContext<T>(key)
	return (
		typeof window !== 'undefined' && existing === undefined
			? setContext(key, getInitialValue())
			: existing
	)
}
