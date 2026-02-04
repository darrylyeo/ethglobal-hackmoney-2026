import { type } from 'arktype'
import type {
	TransactionSession,
	TransactionSessionFlow,
} from '$/data/TransactionSession'
import { normalizeAddress } from '$/lib/address'
import {
	type BridgeSettings,
	BridgeRouteSort,
	defaultBridgeSettings,
} from '$/state/bridge-settings.svelte'
import {
	type LiquiditySettings,
	defaultLiquiditySettings,
} from '$/state/liquidity-settings.svelte'
import { defaultSwapSettings } from '$/state/swap-settings.svelte'

export type SwapSessionParams = {
	chainId: number
	tokenIn: `0x${string}`
	tokenOut: `0x${string}`
	amount: bigint
	slippage: number
	isTestnet: boolean
}

export type BridgeSessionParams = BridgeSettings

export type TransferSessionParams = {
	fromActor: `0x${string}`
	toActor: `0x${string}`
	chainId: number
	amount: bigint
	tokenSymbol: string
	tokenDecimals: number
	tokenAddress: `0x${string}`
	mode: 'direct' | 'channel'
}

export type LiquiditySessionParams = LiquiditySettings & {
	isTestnet: boolean
}

export type TransactionSessionDefaults = Partial<{
	swap: SwapSessionParams
	bridge: BridgeSessionParams
	transfer: TransferSessionParams
	liquidity: LiquiditySessionParams
}>

export const defaultSwapSessionParams: SwapSessionParams = {
	...defaultSwapSettings,
	isTestnet: defaultBridgeSettings.isTestnet,
}

export const defaultLiquiditySessionParams: LiquiditySessionParams = {
	...defaultLiquiditySettings,
	isTestnet: defaultBridgeSettings.isTestnet,
}

const bridgeSortValues = new Set<string>(Object.values(BridgeRouteSort))

const numberSchema = type('number').or('string.numeric.parse')
const integerSchema = type('number.integer').or('string.integer.parse')
const nullableNumberSchema = type('null').or(numberSchema)
const bigintSchema = type('bigint')
	.or(type('string.integer').pipe((value) => BigInt(value)))
	.or(type('number.integer').pipe((value) => BigInt(value)))
const booleanSchema = type('boolean')
	.or(type("'true'").pipe(() => true))
	.or(type("'false'").pipe(() => false))
const addressSchema = type('string').pipe((value, ctx) => (
	normalizeAddress(value) ?? ctx.mustBe('a hex address')
))
const modeSchema = type("'direct'|'channel'")

const parseNumber = (value: unknown, fallback: number): number => (
	((result) => (
		result instanceof type.errors ? fallback : result
	))(numberSchema(value))
)

const parseInteger = (value: unknown, fallback: number): number => (
	((result) => (
		result instanceof type.errors ? fallback : result
	))(integerSchema(value))
)

const parseNullableNumber = (
	value: unknown,
	fallback: number | null,
): number | null => (
	((result) => (
		result instanceof type.errors ? fallback : result
	))(nullableNumberSchema(value))
)

const parseBigInt = (value: unknown, fallback: bigint): bigint => (
	((result) => (
		result instanceof type.errors ? fallback : result
	))(bigintSchema(value))
)

const parseBoolean = (value: unknown, fallback: boolean): boolean => (
	((result) => (
		result instanceof type.errors ? fallback : result
	))(booleanSchema(value))
)

const parseAddress = (
	value: unknown,
	fallback: `0x${string}`,
): `0x${string}` => (
	((result) => (
		result instanceof type.errors ? fallback : result
	))(addressSchema(value))
)

const parseMode = (
	value: unknown,
	fallback: 'direct' | 'channel',
): 'direct' | 'channel' => (
	((result) => (
		result instanceof type.errors ? fallback : result
	))(modeSchema(value))
)

const parseBridgeSort = (
	value: unknown,
	fallback: BridgeSettings['sortBy'],
): BridgeSettings['sortBy'] => (
	typeof value === 'string' && bridgeSortValues.has(value) ?
		value
	: fallback
)

export const normalizeSwapSessionParams = (
	params: Record<string, unknown> | null,
	defaults: SwapSessionParams = defaultSwapSessionParams,
): SwapSessionParams => {
	const base: SwapSessionParams = {
		chainId: parseInteger(params?.chainId, defaults.chainId),
		tokenIn: parseAddress(params?.tokenIn, defaults.tokenIn),
		tokenOut: parseAddress(params?.tokenOut, defaults.tokenOut),
		amount: parseBigInt(params?.amount, defaults.amount),
		slippage: parseNumber(params?.slippage, defaults.slippage),
		isTestnet: parseBoolean(params?.isTestnet, defaults.isTestnet),
	}
	return params ? { ...params, ...base } : base
}

export const normalizeBridgeSessionParams = (
	params: Record<string, unknown> | null,
	defaults: BridgeSessionParams = defaultBridgeSettings,
): BridgeSessionParams => {
	const base: BridgeSessionParams = {
		slippage: parseNumber(params?.slippage, defaults.slippage),
		isTestnet: parseBoolean(params?.isTestnet, defaults.isTestnet),
		sortBy: parseBridgeSort(params?.sortBy, defaults.sortBy),
		fromChainId: parseNullableNumber(params?.fromChainId, defaults.fromChainId),
		toChainId: parseNullableNumber(params?.toChainId, defaults.toChainId),
		amount: parseBigInt(params?.amount, defaults.amount),
		useCustomRecipient: parseBoolean(
			params?.useCustomRecipient,
			defaults.useCustomRecipient,
		),
		customRecipient:
			typeof params?.customRecipient === 'string'
				? params.customRecipient
				: defaults.customRecipient,
	}
	return params ? { ...params, ...base } : base
}

export const normalizeTransferSessionParams = (
	params: Record<string, unknown> | null,
	defaults: TransferSessionParams,
): TransferSessionParams => {
	const base: TransferSessionParams = {
		fromActor: parseAddress(params?.fromActor, defaults.fromActor),
		toActor: parseAddress(params?.toActor, defaults.toActor),
		chainId: parseInteger(params?.chainId, defaults.chainId),
		amount: parseBigInt(params?.amount, defaults.amount),
		tokenSymbol:
			typeof params?.tokenSymbol === 'string'
				? params.tokenSymbol
				: defaults.tokenSymbol,
		tokenDecimals: parseInteger(params?.tokenDecimals, defaults.tokenDecimals),
		tokenAddress: parseAddress(params?.tokenAddress, defaults.tokenAddress),
		mode: parseMode(params?.mode, defaults.mode),
	}
	return params ? { ...params, ...base } : base
}

export const normalizeLiquiditySessionParams = (
	params: Record<string, unknown> | null,
	defaults: LiquiditySessionParams = defaultLiquiditySessionParams,
): LiquiditySessionParams => {
	const base: LiquiditySessionParams = {
		chainId: parseInteger(params?.chainId, defaults.chainId),
		token0: parseAddress(params?.token0, defaults.token0),
		token1: parseAddress(params?.token1, defaults.token1),
		fee: parseInteger(params?.fee, defaults.fee),
		tickLower: parseInteger(params?.tickLower, defaults.tickLower),
		tickUpper: parseInteger(params?.tickUpper, defaults.tickUpper),
		amount0: parseBigInt(params?.amount0, defaults.amount0),
		amount1: parseBigInt(params?.amount1, defaults.amount1),
		isTestnet: parseBoolean(params?.isTestnet, defaults.isTestnet),
	}
	return params ? { ...params, ...base } : base
}

export const normalizeTransactionSessionParams = (
	flows: TransactionSessionFlow[],
	params: Record<string, unknown> | null,
	defaults?: TransactionSessionDefaults,
) => {
	const flow = flows[0] ?? null
	if (flow === 'swap')
		return normalizeSwapSessionParams(params, defaults?.swap ?? defaultSwapSessionParams)
	if (flow === 'bridge')
		return normalizeBridgeSessionParams(params, defaults?.bridge ?? defaultBridgeSettings)
	if (flow === 'liquidity')
		return normalizeLiquiditySessionParams(
			params,
			defaults?.liquidity ?? defaultLiquiditySessionParams,
		)
	if (flow === 'transfer' && defaults?.transfer)
		return normalizeTransferSessionParams(params, defaults.transfer)
	return params ?? {}
}

export const getSwapSessionParams = (session: TransactionSession | null) => (
	normalizeSwapSessionParams(session?.params ?? null)
)

export const getBridgeSessionParams = (session: TransactionSession | null) => (
	normalizeBridgeSessionParams(session?.params ?? null)
)

export const getTransferSessionParams = (
	session: TransactionSession | null,
	defaults: TransferSessionParams,
) => (
	normalizeTransferSessionParams(session?.params ?? null, defaults)
)

export const getLiquiditySessionParams = (session: TransactionSession | null) => (
	normalizeLiquiditySessionParams(session?.params ?? null)
)
