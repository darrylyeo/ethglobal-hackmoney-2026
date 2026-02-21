/**
 * Classify transfer events as bridge (CCTP) or swap for coin activity views.
 */

import type { ChainId } from '$/constants/networks.ts'
import { CCTP_TESTNET_CHAIN_IDS } from '$/constants/cctp.ts'
import { getCctpTokenMessenger } from '$/lib/cctp.ts'

export type TransferLike = {
	fromAddress: string
	toAddress: string
	chainId: number
}

export const isBridgeTransfer = (e: TransferLike) => {
	const messenger = getCctpTokenMessenger(
		e.chainId as ChainId,
		CCTP_TESTNET_CHAIN_IDS.has(e.chainId as ChainId),
	)
	return messenger != null && (
		e.fromAddress === messenger || e.toAddress === messenger
	)
}

export const isSwapTransfer = (_e: TransferLike) => false
