import { type } from 'arktype'
import { address } from '$/constants/arktype.ts'
import { ChainId } from '$/constants/chain-id.ts'

const zeroAddress = '0x0000000000000000000000000000000000000000' as `0x${string}`

const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`
const weth = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`

export enum BridgeRouteSort {
	Recommended = 'recommended',
	Output = 'output',
	Fees = 'fees',
	Speed = 'speed',
}

export type ActionTypeDefinition<_Schema extends { infer: unknown } = { infer: Record<string, unknown> }> = {
	type: ActionType
	label: string
	icon: string
	params: _Schema
	getDefaultParams: () => _Schema['infer']
}

export enum ActionType {
	Swap = 'Swap',
	Bridge = 'Bridge',
	Transfer = 'Transfer',
	CreateChannel = 'CreateChannel',
	AddChannelMember = 'AddChannelMember',
	CloseChannel = 'CloseChannel',
	AddLiquidity = 'AddLiquidity',
	RemoveLiquidity = 'RemoveLiquidity',
	CollectFees = 'CollectFees',
	IncreaseLiquidity = 'IncreaseLiquidity',
	ShareAddress = 'ShareAddress',
	ProposeTransfer = 'ProposeTransfer',
	RequestVerification = 'RequestVerification',
	DepositToCustody = 'DepositToCustody',
	WithdrawFromCustody = 'WithdrawFromCustody',
	ResizeChannel = 'ResizeChannel',
	CreatePool = 'CreatePool',
	AcceptTransfer = 'AcceptTransfer',
	RejectTransfer = 'RejectTransfer',
}

export const actionTypeDefinitions = [
	{
		type: ActionType.Swap,
		label: 'Swap',
		icon: '🔄',
		params: type({
			chainId: type('number.integer').default(ChainId.Ethereum),
			tokenIn: address.default(usdc),
			tokenOut: address.default(weth),
			amount: type('bigint').default(0n),
			slippage: type('number').default(0.005),
			isTestnet: type('boolean').default(false),
		}),
	},
	{
		type: ActionType.Bridge,
		label: 'Bridge',
		icon: '🌉',
		params: type({
			slippage: type('number').default(0.005),
			sortBy: type.valueOf(BridgeRouteSort).default(BridgeRouteSort.Recommended),
			fromChainId: type('number.integer').or('null').default(ChainId.Ethereum),
			toChainId: type('number.integer').or('null').default(ChainId.Optimism),
			tokenAddress: address.default(usdc),
			tokenSymbol: type('string').default('USDC'),
			tokenDecimals: type('number.integer').default(6),
			amount: type('bigint').default(1_000_000n),
			useCustomRecipient: type('boolean').default(false),
			customRecipient: type('string').default(''),
			isTestnet: type('boolean').default(false),
			protocolIntent: type("'cctp'|'lifi'|'gateway'|null").default(null),
			transferSpeed: type("'fast'|'standard'").default('fast'),
			forwardingEnabled: type('boolean').default(false),
		}),
	},
	{
		type: ActionType.Transfer,
		label: 'Transfer',
		icon: '💸',
		params: type({
			fromActor: address.default(zeroAddress),
			toActor: address.default(zeroAddress),
			chainId: type('number.integer').default(0),
			amount: type('bigint').default(0n),
			tokenSymbol: type('string').default(''),
			tokenDecimals: type('number.integer').default(0),
			tokenAddress: address.default(zeroAddress),
			mode: type("'direct'|'channel'").default('direct'),
		}),
	},
	{
		type: ActionType.AddLiquidity,
		label: 'Add Liquidity',
		icon: '💧',
		params: type({
			chainId: type('number.integer').default(ChainId.Ethereum),
			token0: address.default(usdc),
			token1: address.default(weth),
			fee: type('number.integer').default(3000),
			tickLower: type('number.integer').default(-887220),
			tickUpper: type('number.integer').default(887220),
			amount0: type('bigint').default(0n),
			amount1: type('bigint').default(0n),
			isTestnet: type('boolean').default(false),
		}),
	},
	{
		type: ActionType.RemoveLiquidity,
		label: 'Remove Liquidity',
		icon: '💧',
		params: type({
			chainId: type('number.integer').default(ChainId.Ethereum),
			token0: address.default(usdc),
			token1: address.default(weth),
			fee: type('number.integer').default(3000),
			tickLower: type('number.integer').default(-887220),
			tickUpper: type('number.integer').default(887220),
			amount0: type('bigint').default(0n),
			amount1: type('bigint').default(0n),
			isTestnet: type('boolean').default(false),
		}),
	},
	{
		type: ActionType.CollectFees,
		label: 'Collect Fees',
		icon: '💰',
		params: type({
			chainId: type('number.integer').default(ChainId.Ethereum),
			token0: address.default(usdc),
			token1: address.default(weth),
			fee: type('number.integer').default(3000),
			tickLower: type('number.integer').default(-887220),
			tickUpper: type('number.integer').default(887220),
			amount0: type('bigint').default(0n),
			amount1: type('bigint').default(0n),
			isTestnet: type('boolean').default(false),
		}),
	},
	{
		type: ActionType.IncreaseLiquidity,
		label: 'Increase Liquidity',
		icon: '💧',
		params: type({
			chainId: type('number.integer').default(ChainId.Ethereum),
			token0: address.default(usdc),
			token1: address.default(weth),
			fee: type('number.integer').default(3000),
			tickLower: type('number.integer').default(-887220),
			tickUpper: type('number.integer').default(887220),
			amount0: type('bigint').default(0n),
			amount1: type('bigint').default(0n),
			isTestnet: type('boolean').default(false),
		}),
	},
	{
		type: ActionType.CreateChannel,
		label: 'Create Channel',
		icon: '💛',
		params: type({}),
	},
	{
		type: ActionType.AddChannelMember,
		label: 'Add Member',
		icon: '💛',
		params: type({}),
	},
	{
		type: ActionType.CloseChannel,
		label: 'Close Channel',
		icon: '💛',
		params: type({}),
	},
	{
		type: ActionType.ShareAddress,
		label: 'Share Address',
		icon: '📤',
		params: type({}),
	},
	{
		type: ActionType.ProposeTransfer,
		label: 'Propose Transfer',
		icon: '🤝',
		params: type({}),
	},
	{
		type: ActionType.RequestVerification,
		label: 'Request Verification',
		icon: '✅',
		params: type({}),
	},
	{
		type: ActionType.DepositToCustody,
		label: 'Deposit to Custody',
		icon: '🏦',
		params: type({}),
	},
	{
		type: ActionType.WithdrawFromCustody,
		label: 'Withdraw from Custody',
		icon: '🏦',
		params: type({}),
	},
	{
		type: ActionType.ResizeChannel,
		label: 'Resize Channel',
		icon: '💛',
		params: type({}),
	},
	{
		type: ActionType.CreatePool,
		label: 'Create Pool',
		icon: '🏊',
		params: type({}),
	},
	{
		type: ActionType.AcceptTransfer,
		label: 'Accept Transfer',
		icon: '✅',
		params: type({}),
	},
	{
		type: ActionType.RejectTransfer,
		label: 'Reject Transfer',
		icon: '❌',
		params: type({}),
	},
] as const satisfies readonly {
	type: ActionType
	label: string
	icon: string
	params: { infer: unknown; assert: (input: unknown) => unknown }
}[]

const withGetDefaultParams = actionTypeDefinitions.map((d) => ({
	...d,
	getDefaultParams: () => d.params.assert({}) as (typeof d.params)['infer'],
}))

export const actionTypeDefinitionByActionType = Object.fromEntries(
	withGetDefaultParams.map((d) => [d.type, d]),
) as Record<ActionType, (typeof withGetDefaultParams)[number]>

export const actionTypes = withGetDefaultParams

type _DefinitionFor<T extends ActionType> = Extract<
	(typeof withGetDefaultParams)[number],
	{ type: T }
>
export type ActionParams<_ActionType extends ActionType> = ReturnType<
	_DefinitionFor<_ActionType>['getDefaultParams']
>

export type SessionDefaults = Partial<{
	addLiquidity: ActionParams<ActionType.AddLiquidity>
	bridge: ActionParams<ActionType.Bridge>
	collectFees: ActionParams<ActionType.CollectFees>
	increaseLiquidity: ActionParams<ActionType.IncreaseLiquidity>
	removeLiquidity: ActionParams<ActionType.RemoveLiquidity>
	swap: ActionParams<ActionType.Swap>
	transfer: ActionParams<ActionType.Transfer>,
}>

export type Action<_ActionType extends ActionType = ActionType> = {
	type: _ActionType
	params: ActionParams<_ActionType>
	protocolAction?: { action: _ActionType; protocol: string }
	protocolSelection?: string
}

export type LiquidityAction =
	| Action<ActionType.AddLiquidity>
	| Action<ActionType.RemoveLiquidity>
	| Action<ActionType.CollectFees>
	| Action<ActionType.IncreaseLiquidity>

export const createAction = <_ActionType extends ActionType>(
	type: _ActionType,
	params?: Partial<ActionParams<_ActionType>>,
): Action<_ActionType> => ({
	type,
	params: {
		...actionTypeDefinitionByActionType[type].getDefaultParams(),
		...params
	} as ActionParams<_ActionType>,
})

export const mergeActionParams = <_ActionType extends ActionType>(
	action: Action<_ActionType>,
): Action<_ActionType> => ({
	...action,
	params: {
		...actionTypeDefinitionByActionType[action.type].getDefaultParams(),
		...action.params
	} as ActionParams<_ActionType>,
})
