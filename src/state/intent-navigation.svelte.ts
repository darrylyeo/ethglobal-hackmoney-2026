export type IntentNavigateTo = (path: string, hash: string) => void

const intentNavigationStore = $state({
	fn: null as IntentNavigateTo | null,
})

export const getIntentNavigationStore = () => intentNavigationStore

export const setIntentNavigateTo = (fn: IntentNavigateTo | null) => {
	intentNavigationStore.fn = fn
}
