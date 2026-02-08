/**
 * Global network environment (mainnet/testnet). Persisted to localStorage.
 * Switching runs profile archive/restore for env-scoped collections.
 */

import { PersistedState } from 'runed'
import {
	NetworkEnvironment,
} from '$/constants/network-environment.ts'
import { switchNetworkEnvironment } from '$/lib/profile.ts'

const STORAGE_KEY = 'blockhead.v1:network-environment'

export const networkEnvironmentState = new PersistedState<NetworkEnvironment>(
	STORAGE_KEY,
	NetworkEnvironment.Mainnet,
	{
		serializer: {
			serialize: (v) => v,
			deserialize: (v) => (v === NetworkEnvironment.Testnet ? NetworkEnvironment.Testnet : NetworkEnvironment.Mainnet),
		},
	},
)

export const setNetworkEnvironment = (newEnv: NetworkEnvironment) => {
	const current = networkEnvironmentState.current
	if (current === newEnv) return
	switchNetworkEnvironment(current, newEnv)
	networkEnvironmentState.current = newEnv
}

export const getNetworkEnvironment = (): NetworkEnvironment =>
	networkEnvironmentState.current
