export type IntentNavigateTo = (path: string, hash: string) => void

export const intentNavigateTo = $state<IntentNavigateTo | null>(null)

export const setIntentNavigateTo = (fn: IntentNavigateTo | null) => {
	intentNavigateTo = fn
}
