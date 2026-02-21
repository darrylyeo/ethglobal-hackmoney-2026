/**
 * CCTP helpers. Domain and contract lookups use constants/cctp (array + derived map).
 */

import {
	CCTP_MESSAGE_TRANSMITTER_MAINNET,
	CCTP_MESSAGE_TRANSMITTER_TESTNET,
	CCTP_TOKEN_MESSENGER_MAINNET,
	CCTP_TOKEN_MESSENGER_TESTNET,
	cctpDomainByChainId,
} from '$/constants/cctp.ts'
import type { ChainId } from '$/constants/networks.ts'

export const getCctpDomainId = (chainId: ChainId | null) =>
	chainId === null ? null : (cctpDomainByChainId[chainId]?.domain ?? null)

export const isCctpSupportedChain = (chainId: ChainId | null) =>
	chainId !== null && cctpDomainByChainId[chainId] !== undefined

export const getCctpTokenMessenger = (
	chainId: ChainId | null,
	isTestnet: boolean,
) =>
	chainId !== null && cctpDomainByChainId[chainId] !== undefined
		? isTestnet
			? CCTP_TOKEN_MESSENGER_TESTNET
			: CCTP_TOKEN_MESSENGER_MAINNET
		: null

export const getCctpMessageTransmitter = (
	chainId: ChainId | null,
	isTestnet: boolean,
) =>
	chainId !== null && cctpDomainByChainId[chainId] !== undefined
		? isTestnet
			? CCTP_MESSAGE_TRANSMITTER_TESTNET
			: CCTP_MESSAGE_TRANSMITTER_MAINNET
		: null
