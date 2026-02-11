import { setContext } from 'svelte'
import { useContext } from '$/svelte/useContext.ts'

const KEY = 'headingLevel'

export const useHeadingLevel = () => useContext(KEY, () => 0)

export const provideHeadingLevel = () => setContext(KEY, useHeadingLevel() + 1)
