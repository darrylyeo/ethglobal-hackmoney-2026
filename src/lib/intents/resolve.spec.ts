import { EntityType } from '$/data/$EntityType.ts'
import {
	ActionType,
	IntentType,
	Protocol,
	type IntentEntityRef,
} from '$/constants/intents.ts'
import {
	actionsByProtocol,
	intentEntityTypes,
	protocolsByAction,
	resolveIntentForDrag,
} from '$/lib/intents.ts'
import { describe, expect, it } from 'vitest'


describe('resolveIntentForDrag', () => {
	const ref = (type: EntityType, id: Record<string, unknown> = {}): IntentEntityRef => ({
		type,
		id,
	})

	it('matches ActorCoin → ActorNetwork as SwapAndBridge', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.ActorCoin, { chainId: 1, address: '0xabc', tokenAddress: '0xdef' }),
			ref(EntityType.ActorNetwork, { chainId: 10, address: '0x123' }),
		)
		expect(result.matched).toBe(true)
		if (!result.matched) return
		expect(result.intent.type).toBe(IntentType.SwapAndBridge)
		expect(result.options.length).toBeGreaterThan(0)
		expect(result.options[0].actions.length).toBe(2)
	})

	it('matches Actor → Actor as CreateChannelAndAddMember', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.Actor, { address: '0xaaa' }),
			ref(EntityType.Actor, { address: '0xbbb' }),
		)
		expect(result.matched).toBe(true)
		if (!result.matched) return
		expect(result.intent.type).toBe(IntentType.CreateChannelAndAddMember)
		expect(result.options.length).toBe(1)
		expect(result.options[0].actions.length).toBe(2)
		expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.CreateChannel)
		expect(result.options[0].actions[0].protocolAction.protocol).toBe(Protocol.Yellow)
		expect(result.options[0].actions[1].protocolAction.action).toBe(ActionType.AddChannelMember)
	})

	it('matches ActorCoin → Actor as CreateChannelAddMemberAndTransfer', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
			ref(EntityType.Actor, { address: '0xbbb' }),
		)
		expect(result.matched).toBe(true)
		if (!result.matched) return
		expect(result.intent.type).toBe(IntentType.CreateChannelAddMemberAndTransfer)
		expect(result.options[0].actions.length).toBe(3)
		expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.CreateChannel)
		expect(result.options[0].actions[1].protocolAction.action).toBe(ActionType.AddChannelMember)
		expect(result.options[0].actions[2].protocolAction.action).toBe(ActionType.Transfer)
	})

	it('matches ActorCoin → UniswapPool as AddLiquidity', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
			ref(EntityType.UniswapPool, { poolId: '0xpool' }),
		)
		expect(result.matched).toBe(true)
		if (!result.matched) return
		expect(result.intent.type).toBe(IntentType.AddLiquidity)
		expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.AddLiquidity)
		expect(result.options[0].actions[0].protocolAction.protocol).toBe(Protocol.UniswapV4)
	})

	it('matches UniswapPosition → Actor as RemoveLiquidity', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.UniswapPosition, { positionId: 1 }),
			ref(EntityType.Actor, { address: '0xaaa' }),
		)
		expect(result.matched).toBe(true)
		if (!result.matched) return
		expect(result.intent.type).toBe(IntentType.RemoveLiquidity)
		expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.RemoveLiquidity)
		expect(result.options[0].actions[0].protocolAction.protocol).toBe(Protocol.UniswapV4)
	})

	it('returns matched:false for Actor → UniswapPool (no intent)', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.Actor, { address: '0xaaa' }),
			ref(EntityType.UniswapPool, { poolId: '0xpool' }),
		)
		expect(result.matched).toBe(false)
	})

	it('returns matched:false for Coin → Coin (no intent)', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.Coin, { address: '0xaaa' }),
			ref(EntityType.Coin, { address: '0xbbb' }),
		)
		expect(result.matched).toBe(false)
	})

	it('returns matched:false for Network → Network (no intent)', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.Network, { chainId: 1 }),
			ref(EntityType.Network, { chainId: 10 }),
		)
		expect(result.matched).toBe(false)
	})
})


describe('derived lookups', () => {
	it('actionsByProtocol maps Yellow to channel and transfer actions', () => {
		const yellowActions = actionsByProtocol[Protocol.Yellow]
		expect(yellowActions).toContain(ActionType.Transfer)
		expect(yellowActions).toContain(ActionType.CreateChannel)
		expect(yellowActions).toContain(ActionType.AddChannelMember)
		expect(yellowActions).toContain(ActionType.CloseChannel)
	})

	it('actionsByProtocol maps UniswapV4 to swap and liquidity actions', () => {
		const uniActions = actionsByProtocol[Protocol.UniswapV4]
		expect(uniActions).toContain(ActionType.Swap)
		expect(uniActions).toContain(ActionType.AddLiquidity)
		expect(uniActions).toContain(ActionType.RemoveLiquidity)
	})

	it('protocolsByAction maps Swap to UniswapV4 and LiFi', () => {
		const swapProtocols = protocolsByAction[ActionType.Swap]
		expect(swapProtocols).toContain(Protocol.UniswapV4)
		expect(swapProtocols).toContain(Protocol.LiFi)
	})

	it('protocolsByAction maps Bridge to Cctp and LiFi', () => {
		const bridgeProtocols = protocolsByAction[ActionType.Bridge]
		expect(bridgeProtocols).toContain(Protocol.Cctp)
		expect(bridgeProtocols).toContain(Protocol.LiFi)
	})

	it('protocolsByAction maps AddLiquidity to UniswapV4 only', () => {
		const protocols = protocolsByAction[ActionType.AddLiquidity]
		expect(protocols).toEqual([Protocol.UniswapV4])
	})

	it('intentEntityTypes contains all entity types from intent definitions', () => {
		expect(intentEntityTypes.has(EntityType.Actor)).toBe(true)
		expect(intentEntityTypes.has(EntityType.ActorCoin)).toBe(true)
		expect(intentEntityTypes.has(EntityType.ActorNetwork)).toBe(true)
		expect(intentEntityTypes.has(EntityType.UniswapPool)).toBe(true)
		expect(intentEntityTypes.has(EntityType.UniswapPosition)).toBe(true)
		expect(intentEntityTypes.has(EntityType.Coin)).toBe(false)
		expect(intentEntityTypes.has(EntityType.Network)).toBe(false)
	})
})
