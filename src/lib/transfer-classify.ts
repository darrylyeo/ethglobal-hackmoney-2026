/**
 * Classify transfer events as bridge (CCTP) or swap for coin activity views.
 */

import type { ChainId } from '$/constants/chain-id.ts'
import { isCctpTestnetChain } from '$/constants/cctp.ts'
import { getCctpTokenMessenger } from '$/lib/cctp.ts'

export type TransferLike = {
	fromAddress: string
	toAddress: string
	chainId: number
}

export const isBridgeTransfer = (e: TransferLike): boolean => {
	const messenger = getCctpTokenMessenger(
		e.chainId as ChainId,
		isCctpTestnetChain(e.chainId as ChainId),
	)
	return messenger != null && (
		e.fromAddress === messenger || e.toAddress === messenger
	)
}

export const isSwapTransfer = (_e: TransferLike): boolean => false
