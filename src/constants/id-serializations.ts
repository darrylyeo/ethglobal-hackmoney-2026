/**
 * Entity ID serialization formats and pattern metadata (spec 094). Structure follows spec 045.
 */

import { PatternType } from '$/constants/patterns.ts'

export type IdPattern =
	| { kind: 'regex'; regex: RegExp; description?: string }
	| { kind: 'pattern'; type: PatternType }
	| { kind: 'eip'; ref: string; section?: string }
	| { kind: 'caip'; ref: string; section?: string }

// ----- Network -----
export enum Network$IdSerializationType {
	ChainId = 'ChainId',
	Slug = 'Slug',
	Caip2 = 'Caip2',
}

export type Network$IdSerializationEntry = {
	serialization: Network$IdSerializationType
	label: string
	patterns: IdPattern[]
}

export const networkIdSerializations = [
	{
		serialization: Network$IdSerializationType.ChainId,
		label: 'Chain ID (decimal)',
		patterns: [{ kind: 'pattern', type: PatternType.EvmBlockNumber }],
	},
	{
		serialization: Network$IdSerializationType.Slug,
		label: 'Network slug',
		patterns: [{ kind: 'regex', regex: /^[a-z0-9-]+$/i, description: 'URL slug (e.g. ethereum)' }],
	},
	{
		serialization: Network$IdSerializationType.Caip2,
		label: 'CAIP-2 chain reference',
		patterns: [{ kind: 'caip', ref: 'CAIP-2', section: 'chain_id' }],
	},
] as const satisfies readonly Network$IdSerializationEntry[]

export const networkIdSerializationsBySerialization = Object.fromEntries(
	networkIdSerializations.map((e) => [e.serialization, e]),
) as Record<Network$IdSerializationType, Network$IdSerializationEntry>

// ----- Actor -----
export enum Actor$IdSerializationType {
	PlainChainAddress = 'PlainChainAddress',
	InteropEip7930 = 'InteropEip7930',
}

export type Actor$IdSerializationEntry = {
	serialization: Actor$IdSerializationType
	label: string
	patterns: IdPattern[]
}

export const actorIdSerializations = [
	{
		serialization: Actor$IdSerializationType.PlainChainAddress,
		label: 'Chain ID + address',
		patterns: [
			{
				kind: 'regex',
				regex: /^(\d+)-(0x[0-9a-fA-F]{40})$/,
				description: 'chainId-0xaddress',
			},
		],
	},
	{
		serialization: Actor$IdSerializationType.InteropEip7930,
		label: 'Interop address (EIP-7930)',
		patterns: [{ kind: 'eip', ref: 'EIP-7930' }, { kind: 'eip', ref: 'ERC-7828' }],
	},
] as const satisfies readonly Actor$IdSerializationEntry[]

export const actorIdSerializationsBySerialization = Object.fromEntries(
	actorIdSerializations.map((e) => [e.serialization, e]),
) as Record<Actor$IdSerializationType, Actor$IdSerializationEntry>

// ----- Contract -----
export enum Contract$IdSerializationType {
	SlugAddress = 'SlugAddress',
	ChainIdAddress = 'ChainIdAddress',
}

export type Contract$IdSerializationEntry = {
	serialization: Contract$IdSerializationType
	label: string
	patterns: IdPattern[]
}

export const contractIdSerializations = [
	{
		serialization: Contract$IdSerializationType.SlugAddress,
		label: 'Slug : address',
		patterns: [
			{
				kind: 'regex',
				regex: /^[a-z0-9-]+:0x[0-9a-fA-F]{40}$/i,
				description: 'networkSlug:0xaddress',
			},
		],
	},
	{
		serialization: Contract$IdSerializationType.ChainIdAddress,
		label: 'Chain ID : address',
		patterns: [
			{
				kind: 'regex',
				regex: /^\d+:0x[0-9a-fA-F]{40}$/,
				description: 'chainId:0xaddress',
			},
		],
	},
] as const satisfies readonly Contract$IdSerializationEntry[]

export const contractIdSerializationsBySerialization = Object.fromEntries(
	contractIdSerializations.map((e) => [e.serialization, e]),
) as Record<Contract$IdSerializationType, Contract$IdSerializationEntry>

// ----- Block -----
export enum Block$IdSerializationType {
	ChainIdBlockNumber = 'ChainIdBlockNumber',
	SlugBlockNumber = 'SlugBlockNumber',
}

export type Block$IdSerializationEntry = {
	serialization: Block$IdSerializationType
	label: string
	patterns: IdPattern[]
}

export const blockIdSerializations = [
	{
		serialization: Block$IdSerializationType.ChainIdBlockNumber,
		label: 'Chain ID : block number',
		patterns: [{ kind: 'regex', regex: /^(\d+):(\d+)$/, description: 'chainId:blockNumber' }],
	},
	{
		serialization: Block$IdSerializationType.SlugBlockNumber,
		label: 'Slug : block number',
		patterns: [
			{
				kind: 'regex',
				regex: /^[a-z0-9-]+:\d+$/i,
				description: 'networkSlug:blockNumber',
			},
		],
	},
] as const satisfies readonly Block$IdSerializationEntry[]

export const blockIdSerializationsBySerialization = Object.fromEntries(
	blockIdSerializations.map((e) => [e.serialization, e]),
) as Record<Block$IdSerializationType, Block$IdSerializationEntry>

// ----- Coin -----
export enum Coin$IdSerializationType {
	PlainChainAddress = 'PlainChainAddress',
	InteropEip7930 = 'InteropEip7930',
	Symbol = 'Symbol',
}

export type Coin$IdSerializationEntry = {
	serialization: Coin$IdSerializationType
	label: string
	patterns: IdPattern[]
}

export const coinIdSerializations = [
	{
		serialization: Coin$IdSerializationType.PlainChainAddress,
		label: 'Chain ID + address',
		patterns: [
			{
				kind: 'regex',
				regex: /^(\d+)-((?:0x[0-9a-fA-F]{40})|(?:[A-Z0-9]+))$/,
				description: 'chainId-address or chainId-SYMBOL',
			},
		],
	},
	{
		serialization: Coin$IdSerializationType.InteropEip7930,
		label: 'Interop address (EIP-7930)',
		patterns: [{ kind: 'eip', ref: 'EIP-7930' }, { kind: 'eip', ref: 'ERC-7828' }],
	},
	{
		serialization: Coin$IdSerializationType.Symbol,
		label: 'Symbol (display)',
		patterns: [{ kind: 'regex', regex: /^[A-Z0-9]+$/i, description: 'Token symbol e.g. USDC, ETH' }],
	},
] as const satisfies readonly Coin$IdSerializationEntry[]

export const coinIdSerializationsBySerialization = Object.fromEntries(
	coinIdSerializations.map((e) => [e.serialization, e]),
) as Record<Coin$IdSerializationType, Coin$IdSerializationEntry>

// ----- ActorCoin -----
export enum ActorCoin$IdSerializationType {
	Composite = 'Composite',
	Devalue = 'Devalue',
}

export type ActorCoin$IdSerializationEntry = {
	serialization: ActorCoin$IdSerializationType
	label: string
	patterns: IdPattern[]
}

export const actorCoinIdSerializations = [
	{
		serialization: ActorCoin$IdSerializationType.Composite,
		label: 'Chain : owner : token address',
		patterns: [
			{
				kind: 'regex',
				regex: /^(\d+):(0x[0-9a-fA-F]{40}):(0x[0-9a-fA-F]{40})$/,
				description: 'chainId:ownerAddress:tokenAddress',
			},
		],
	},
	{
		serialization: ActorCoin$IdSerializationType.Devalue,
		label: 'Stringified $id (devalue)',
		patterns: [{ kind: 'regex', regex: /^\{/, description: 'Serialized object (e.g. devalue)' }],
	},
] as const satisfies readonly ActorCoin$IdSerializationEntry[]

export const actorCoinIdSerializationsBySerialization = Object.fromEntries(
	actorCoinIdSerializations.map((e) => [e.serialization, e]),
) as Record<ActorCoin$IdSerializationType, ActorCoin$IdSerializationEntry>

// ----- ChainTransaction -----
export enum ChainTransaction$IdSerializationType {
	ChainIdTxHash = 'ChainIdTxHash',
	SlugTxHash = 'SlugTxHash',
}

export type ChainTransaction$IdSerializationEntry = {
	serialization: ChainTransaction$IdSerializationType
	label: string
	patterns: IdPattern[]
}

export const chainTransactionIdSerializations = [
	{
		serialization: ChainTransaction$IdSerializationType.ChainIdTxHash,
		label: 'Chain ID : tx hash',
		patterns: [
			{
				kind: 'regex',
				regex: /^(\d+):(0x[0-9a-fA-F]{64})$/,
				description: 'chainId:txHash',
			},
		],
	},
	{
		serialization: ChainTransaction$IdSerializationType.SlugTxHash,
		label: 'Slug : tx hash',
		patterns: [
			{
				kind: 'regex',
				regex: /^[a-z0-9-]+:0x[0-9a-fA-F]{64}$/i,
				description: 'networkSlug:txHash',
			},
		],
	},
] as const satisfies readonly ChainTransaction$IdSerializationEntry[]

export const chainTransactionIdSerializationsBySerialization = Object.fromEntries(
	chainTransactionIdSerializations.map((e) => [e.serialization, e]),
) as Record<ChainTransaction$IdSerializationType, ChainTransaction$IdSerializationEntry>

// ----- TransactionTrace (same as ChainTransaction) -----
export enum TransactionTrace$IdSerializationType {
	ChainIdTxHash = 'ChainIdTxHash',
	SlugTxHash = 'SlugTxHash',
}

export type TransactionTrace$IdSerializationEntry = {
	serialization: TransactionTrace$IdSerializationType
	label: string
	patterns: IdPattern[]
}

export const transactionTraceIdSerializations = [
	{
		serialization: TransactionTrace$IdSerializationType.ChainIdTxHash,
		label: 'Chain ID : tx hash',
		patterns: [
			{
				kind: 'regex',
				regex: /^(\d+):(0x[0-9a-fA-F]{64})$/,
				description: 'chainId:txHash',
			},
		],
	},
	{
		serialization: TransactionTrace$IdSerializationType.SlugTxHash,
		label: 'Slug : tx hash',
		patterns: [
			{
				kind: 'regex',
				regex: /^[a-z0-9-]+:0x[0-9a-fA-F]{64}$/i,
				description: 'networkSlug:txHash',
			},
		],
	},
] as const satisfies readonly TransactionTrace$IdSerializationEntry[]

export const transactionTraceIdSerializationsBySerialization = Object.fromEntries(
	transactionTraceIdSerializations.map((e) => [e.serialization, e]),
) as Record<TransactionTrace$IdSerializationType, TransactionTrace$IdSerializationEntry>

// ----- VerifiedContractSource (same as Contract) -----
export enum VerifiedContractSource$IdSerializationType {
	SlugAddress = 'SlugAddress',
	ChainIdAddress = 'ChainIdAddress',
}

export type VerifiedContractSource$IdSerializationEntry = {
	serialization: VerifiedContractSource$IdSerializationType
	label: string
	patterns: IdPattern[]
}

export const verifiedContractSourceIdSerializations = [
	{
		serialization: VerifiedContractSource$IdSerializationType.SlugAddress,
		label: 'Slug : address',
		patterns: [
			{
				kind: 'regex',
				regex: /^[a-z0-9-]+:0x[0-9a-fA-F]{40}$/i,
				description: 'networkSlug:0xaddress',
			},
		],
	},
	{
		serialization: VerifiedContractSource$IdSerializationType.ChainIdAddress,
		label: 'Chain ID : address',
		patterns: [
			{
				kind: 'regex',
				regex: /^\d+:0x[0-9a-fA-F]{40}$/,
				description: 'chainId:0xaddress',
			},
		],
	},
] as const satisfies readonly VerifiedContractSource$IdSerializationEntry[]

export const verifiedContractSourceIdSerializationsBySerialization = Object.fromEntries(
	verifiedContractSourceIdSerializations.map((e) => [e.serialization, e]),
) as Record<
	VerifiedContractSource$IdSerializationType,
	VerifiedContractSource$IdSerializationEntry
>
