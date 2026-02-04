export type IntentNavigateTo = (path: string, hash: string) => void

export const intentNavigationStore = $state({
	fn: null as IntentNavigateTo | null,
})

export const setIntentNavigateTo = (fn: IntentNavigateTo | null) => {
	intentNavigationStore.fn = fn
}
