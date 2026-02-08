import { EntityType } from '$/data/$EntityType.ts'
import {
	ActionType,
	IntentType,
	Protocol,
	actionTypeDefinitionByActionType,
	protocolActions,
	protocolSpecs,
	type IntentEntityRef,
} from '$/constants/intents.ts'
import {
	actionsByProtocol,
	intentEntityTypes,
	protocolsByAction,
	resolveIntentForDrag,
	specByActionType,
	validActionTypes,
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
		expect(result.options.length).toBe(3)
		expect(result.options[2].label).toBe('Bridge via Circle Gateway')
		expect(result.options[2].actions[0].protocolAction.id.protocol).toBe(Protocol.CircleGateway)
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
		expect(result.options[0].actions[0].protocolAction.id.actionType).toBe(ActionType.CreateChannel)
		expect(result.options[0].actions[0].protocolAction.id.protocol).toBe(Protocol.Yellow)
		expect(result.options[0].actions[1].protocolAction.id.actionType).toBe(ActionType.AddChannelMember)
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
		expect(result.options[0].actions[0].protocolAction.id.actionType).toBe(ActionType.CreateChannel)
		expect(result.options[0].actions[1].protocolAction.id.actionType).toBe(ActionType.AddChannelMember)
		expect(result.options[0].actions[2].protocolAction.id.actionType).toBe(ActionType.Transfer)
	})

	it('matches ActorCoin → UniswapPool as AddLiquidity', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
			ref(EntityType.UniswapPool, { poolId: '0xpool' }),
		)
		expect(result.matched).toBe(true)
		if (!result.matched) return
		expect(result.intent.type).toBe(IntentType.AddLiquidity)
		expect(result.options[0].actions[0].protocolAction.id.actionType).toBe(ActionType.AddLiquidity)
		expect(result.options[0].actions[0].protocolAction.id.protocol).toBe(Protocol.UniswapV4)
	})

	it('matches UniswapPosition → Actor as RemoveLiquidity', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.UniswapPosition, { positionId: 1 }),
			ref(EntityType.Actor, { address: '0xaaa' }),
		)
		expect(result.matched).toBe(true)
		if (!result.matched) return
		expect(result.intent.type).toBe(IntentType.ManagePosition)
		expect(result.options.length).toBe(2)
		expect(result.options[0].actions[0].protocolAction.id.actionType).toBe(ActionType.CollectFees)
		expect(result.options[1].actions[0].protocolAction.id.actionType).toBe(ActionType.RemoveLiquidity)
	})

	it('returns matched:false for Actor → UniswapPool (no intent)', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.Actor, { address: '0xaaa' }),
			ref(EntityType.UniswapPool, { poolId: '0xpool' }),
		)
		expect(result.matched).toBe(false)
	})

	it('returns matched:false for same entity type when no intent registered', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.Coin, { address: '0xaaa' }),
			ref(EntityType.Coin, { address: '0xbbb' }),
		)
		expect(result.matched).toBe(false)
	})

	it('returns error when resolveOptions throws', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
			ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
		)
		expect(result.matched).toBe(true)
		expect(result.options).toEqual([])
		expect(result.error).toBeInstanceOf(Error)
	})

	it('respects entity match predicates', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.Actor, { address: '0xaaa' }),
			ref(EntityType.Actor, { address: '0xbbb', rejectMatch: true }),
		)
		expect(result.matched).toBe(false)
	})
})


describe('derived lookups', () => {
	it('actionsByProtocol maps each protocol to its action types', () => {
		expect(actionsByProtocol[Protocol.Yellow]).toContain(ActionType.Transfer)
		expect(actionsByProtocol[Protocol.Yellow]).toContain(ActionType.CreateChannel)
		expect(actionsByProtocol[Protocol.UniswapV4]).toContain(ActionType.Swap)
		expect(actionsByProtocol[Protocol.UniswapV4]).toContain(ActionType.AddLiquidity)
		expect(actionsByProtocol[Protocol.UniswapV4]).toContain(ActionType.RemoveLiquidity)
	})

	it('protocolsByAction maps each action to its protocols', () => {
		expect(protocolsByAction[ActionType.Swap]).toContain(Protocol.UniswapV4)
		expect(protocolsByAction[ActionType.Swap]).toContain(Protocol.LiFi)
		expect(protocolsByAction[ActionType.Bridge]).toContain(Protocol.Cctp)
		expect(protocolsByAction[ActionType.Bridge]).toContain(Protocol.LiFi)
		expect(protocolsByAction[ActionType.AddLiquidity]).toEqual([Protocol.UniswapV4])
	})

	it('intentEntityTypes contains all entity types from intent definitions', () => {
		expect(intentEntityTypes.has(EntityType.Actor)).toBe(true)
		expect(intentEntityTypes.has(EntityType.ActorCoin)).toBe(true)
		expect(intentEntityTypes.has(EntityType.ActorNetwork)).toBe(true)
		expect(intentEntityTypes.has(EntityType.UniswapPool)).toBe(true)
		expect(intentEntityTypes.has(EntityType.UniswapPosition)).toBe(true)
	})
})
