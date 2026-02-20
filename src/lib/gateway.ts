/**
 * Circle Gateway helpers. Domain and contract lookups use constants/gateway (array + derived map).
 */

import {
	GATEWAY_API_BASE_MAINNET,
	GATEWAY_API_BASE_TESTNET,
	GATEWAY_MAINNET_CHAIN_IDS,
	GATEWAY_MINTER_MAINNET,
	GATEWAY_MINTER_TESTNET,
	GATEWAY_TESTNET_CHAIN_IDS,
	GATEWAY_WALLET_MAINNET,
	GATEWAY_WALLET_TESTNET,
	gatewayDomainByChainId,
} from '$/constants/gateway.ts'
import type { ChainId } from '$/constants/networks.ts'

export const getGatewayDomainId = (chainId: ChainId | null): number | null =>
	chainId === null ? null : (gatewayDomainByChainId[chainId]?.domain ?? null)

export const isGatewaySupportedChain = (
	chainId: number | null,
	isTestnet: boolean,
): boolean =>
	chainId !== null &&
	(isTestnet
		? GATEWAY_TESTNET_CHAIN_IDS.has(chainId as ChainId)
		: GATEWAY_MAINNET_CHAIN_IDS.has(chainId as ChainId))

export const getGatewayWalletAddress = (
	chainId: ChainId | null,
	isTestnet: boolean,
): `0x${string}` | null =>
	chainId !== null && isGatewaySupportedChain(chainId, isTestnet)
		? (isTestnet ? GATEWAY_WALLET_TESTNET : GATEWAY_WALLET_MAINNET)
		: null

export const getGatewayMinterAddress = (
	chainId: ChainId | null,
	isTestnet: boolean,
): `0x${string}` | null =>
	chainId !== null && isGatewaySupportedChain(chainId, isTestnet)
		? (isTestnet ? GATEWAY_MINTER_TESTNET : GATEWAY_MINTER_MAINNET)
		: null

export const getGatewayApiBase = (isTestnet: boolean): string =>
	isTestnet ? GATEWAY_API_BASE_TESTNET : GATEWAY_API_BASE_MAINNET
