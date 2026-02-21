import { getContext, hasContext, setContext } from 'svelte'

export const useContext = <T>(key: string, getInitialValue: () => T) => {
	if (!hasContext(key)) return setContext(key, getInitialValue())
	return getContext<T>(key)
}

