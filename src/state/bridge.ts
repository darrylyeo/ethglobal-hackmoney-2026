// Constants
import {
	DEFAULT_SLIPPAGE,
	MAX_SLIPPAGE,
	MIN_SLIPPAGE,
} from '$/constants/slippage'

// Context
import { useContext } from '$/svelte/useContext'
import { PersistedState } from 'runed'

const booleanSerializer = {
	serialize: (v: boolean) => String(v),
	deserialize: (s: string) => s === 'true',
}

const slippageSerializer = {
	serialize: (v: number) => String(v),
	deserialize: (s: string) => {
		const n = parseFloat(s)
		if (Number.isNaN(n)) return DEFAULT_SLIPPAGE
		return Math.max(MIN_SLIPPAGE, Math.min(MAX_SLIPPAGE, n)) as number
	},
}

export const useBridgeIsTestnet = () => (
	useContext(
		'bridge-is-testnet',
		() => (
			new PersistedState<boolean>(
				'bridge-is-testnet',
				false,
				{ serializer: booleanSerializer },
			)
		),
	)
)

export const useBridgeSlippage = () => (
	useContext(
		'bridge-slippage',
		() => (
			new PersistedState<number>(
				'bridge-slippage',
				DEFAULT_SLIPPAGE,
				{ serializer: slippageSerializer },
			)
		),
	)
)

export const useBridgeAutoRefresh = () => (
	useContext(
		'bridge-quote-auto-refresh',
		() => (
			new PersistedState<boolean>(
				'bridge-quote-auto-refresh',
				false,
				{ serializer: booleanSerializer },
			)
		),
	)
)
