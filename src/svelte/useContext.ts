import { getContext, hasContext, setContext } from 'svelte'

export const useContext = <T>(key: string, getInitialValue: () => T) =>
	hasContext(key) ? getContext<T>(key) : setContext(key, getInitialValue())
