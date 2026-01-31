// Types
import type { ProviderDetailType, WalletState } from '$/lib/wallet'

// Context
import { useContext } from '$/svelte/useContext'
import { useBridgeIsTestnet } from '$/state/bridge'

// Functions
import {
	connectProvider,
	subscribeProviders,
	createWalletState,
	getWalletChainId,
	subscribeChainChanged,
} from '$/lib/wallet'

export const WALLET_CONTEXT_KEY = 'wallet'

const createWalletContext = () => {
	const isTestnetState = useBridgeIsTestnet()
	let state = $state(createWalletState())

	$effect(() => {
		state.isTestnet = isTestnetState.current
	})

	$effect(() => {
		if (typeof window === 'undefined') return
		return subscribeProviders((providers) => {
			state.providers = providers
		})
	})

	$effect(() => {
		if (!state.connectedDetail) {
			state.chainId = null
			return
		}
		getWalletChainId(state.connectedDetail.provider).then((id) => {
			state.chainId = id
		})
		return subscribeChainChanged(state.connectedDetail.provider, (id) => {
			state.chainId = id
		})
	})

	const connect = async (detail: ProviderDetailType) => {
		state.error = null
		state.isConnecting = true
		try {
			state.address = await connectProvider(detail)
			state.connectedDetail = detail
		} catch (e) {
			state.error = e instanceof Error ? e.message : String(e)
		} finally {
			state.isConnecting = false
		}
	}

	const disconnect = () => {
		state.connectedDetail = null
		state.address = null
		state.chainId = null
		state.error = null
	}

	const toggleTestnet = (checked: boolean) => {
		isTestnetState.current = checked
	}

	return {
		get state() {
			return state
		},
		connect,
		disconnect,
		toggleTestnet,
	}
}

export const useWalletState = () => (
	useContext(WALLET_CONTEXT_KEY, createWalletContext)
)
