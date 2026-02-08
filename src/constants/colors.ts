/**
 * Brand colors for networks (by chain ID) and coins (by symbol).
 * Derived from networkConfigs and coinColors.
 */

import type { ChainId } from '$/constants/chain-id.ts'
import { coinColors } from '$/constants/coins.ts'
import { networkConfigs } from '$/constants/networks.ts'

/** Primary brand color (hex) per chain ID. */
export const networkColorByChainId: Partial<Record<ChainId, string>> =
	Object.fromEntries(
		networkConfigs
			.filter((n): n is typeof n & { color: string } => n.color != null)
			.map((n) => [n.chainId, n.color]),
	) as Partial<Record<ChainId, string>>

/** Primary brand color (hex) per coin symbol. */
export const coinColorBySymbol: Partial<Record<string, string>> =
	Object.fromEntries(coinColors.map((c) => [c.symbol, c.color]))
