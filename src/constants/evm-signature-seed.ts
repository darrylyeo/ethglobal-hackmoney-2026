/**
 * Seed data: 10 most popular function selectors, event topics, and error selectors.
 * Used to prefill EvmSelectors, EvmTopics, and EvmErrors collections on first use.
 */

import type { EvmError } from '$/data/EvmError.ts'
import type { EvmSelector } from '$/data/EvmSelector.ts'
import type { EvmTopic } from '$/data/EvmTopic.ts'

export const popularEvmSelectors: readonly EvmSelector[] = [
	{ $id: { hex: '0xa9059cbb' }, signatures: ['transfer(address,uint256)'] },
	{ $id: { hex: '0x095ea7b3' }, signatures: ['approve(address,uint256)'] },
	{ $id: { hex: '0x70a08231' }, signatures: ['balanceOf(address)'] },
	{ $id: { hex: '0x18160ddd' }, signatures: ['totalSupply()'] },
	{ $id: { hex: '0x23b872dd' }, signatures: ['transferFrom(address,address,uint256)'] },
	{ $id: { hex: '0xdd62ed3e' }, signatures: ['allowance(address,address)'] },
	{ $id: { hex: '0x06fdde03' }, signatures: ['name()'] },
	{ $id: { hex: '0x95d89b41' }, signatures: ['symbol()'] },
	{ $id: { hex: '0x313ce567' }, signatures: ['decimals()'] },
	{ $id: { hex: '0x42842e0e' }, signatures: ['safeTransferFrom(address,address,uint256)'] },
]

export const popularEvmTopics: readonly EvmTopic[] = [
	{
		$id: { hex: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' },
		signatures: ['Transfer(address,address,uint256)'],
	},
	{
		$id: { hex: '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925' },
		signatures: ['Approval(address,address,uint256)'],
	},
	{
		$id: { hex: '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31' },
		signatures: ['ApprovalForAll(address,address,bool)'],
	},
	{
		$id: { hex: '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1' },
		signatures: ['Sync(uint112,uint112)'],
	},
	{
		$id: { hex: '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67' },
		signatures: ['Swap(address,address,int256,int256,uint160,uint128,int24)'],
	},
	{
		$id: { hex: '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c' },
		signatures: ['Deposit(address,uint256)'],
	},
	{
		$id: { hex: '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65' },
		signatures: ['Withdrawal(address,uint256)'],
	},
	{
		$id: { hex: '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0' },
		signatures: ['OwnershipTransferred(address,address)'],
	},
	{
		$id: { hex: '0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d' },
		signatures: ['RoleGranted(bytes32,address,address)'],
	},
	{
		$id: { hex: '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822' },
		signatures: ['Swap(address,uint256,uint256,uint256,uint256,address)'],
	},
]

export const popularEvmErrors: readonly EvmError[] = [
	{ $id: { hex: '0x08c379a0' }, signatures: ['Error(string)'] },
	{ $id: { hex: '0x4e487b71' }, signatures: ['Panic(uint256)'] },
	{ $id: { hex: '0x1e4fbdf7' }, signatures: ['InvalidProof()'] },
	{ $id: { hex: '0x2d0a3f8e' }, signatures: ['InvalidAmount()'] },
	{ $id: { hex: '0x82b42900' }, signatures: ['Unauthorized()'] },
	{ $id: { hex: '0x5c60da1b' }, signatures: ['Implementation()'] },
	{ $id: { hex: '0x30f28b7a' }, signatures: ['InvalidOwner()'] },
	{ $id: { hex: '0x2d838119' }, signatures: ['InvalidSignature()'] },
	{ $id: { hex: '0x2d67b72d' }, signatures: ['InsufficientBalance()'] },
	{ $id: { hex: '0xfe0d94c1' }, signatures: ['AlreadyClaimed()'] },
]
