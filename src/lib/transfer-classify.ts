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
	if (messenger == null) return false
	const m = messenger.toLowerCase()
	return e.fromAddress.toLowerCase() === m || e.toAddress.toLowerCase() === m
}

export const isSwapTransfer = (_e: TransferLike): boolean => false
