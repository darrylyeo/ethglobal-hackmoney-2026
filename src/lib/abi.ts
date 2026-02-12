import type { Abi } from '@tevm/voltaire/Abi'

type AbiItem = Abi[number]
type AbiFunction = Extract<AbiItem, { type: 'function' }>

export const isFunction = (part: AbiItem): part is AbiFunction =>
	part.type === 'function'

export const isReadable = (
	part: AbiItem,
): part is Extract<AbiFunction, { stateMutability: 'view' | 'pure' }> =>
	isFunction(part) &&
	(part.stateMutability === 'view' || part.stateMutability === 'pure')

export const isReadableWithoutInputs = (
	part: AbiItem,
): part is Extract<AbiFunction, { stateMutability: 'view' | 'pure' }> =>
	isReadable(part) && !(part.inputs?.length > 0)

export const isWritable = (
	part: AbiItem,
): part is Extract<
	AbiFunction,
	{ stateMutability: 'nonpayable' | 'payable' }
> =>
	isFunction(part) &&
	(part.stateMutability === 'nonpayable' || part.stateMutability === 'payable')
