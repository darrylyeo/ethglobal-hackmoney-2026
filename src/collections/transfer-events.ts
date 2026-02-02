/**
 * Transfer events for the transfers page: query key for TanStack Query cache.
 * Normalized events are served by the cache for the selected period (eth_getLogs via Voltaire).
 */

import type { NormalizedTransferEvent } from '$/api/transfers-logs'

export type TransferEventRow = NormalizedTransferEvent

export function transferEventsQueryKey(
	period: string,
): readonly [string, string] {
	return ['transfer-events', period] as const
}
