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
		expect(result.options.length).toBe(3)
		expect(result.options[2].label).toBe('Bridge via Circle Gateway')
		expect(result.options[2].actions[0].protocolAction.protocol).toBe(Protocol.Gateway)
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

	it('matches UniswapPosition → Actor as ManagePosition with CollectFees + RemoveLiquidity options', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.UniswapPosition, { positionId: 1 }),
			ref(EntityType.Actor, { address: '0xaaa' }),
		)
		expect(result.matched).toBe(true)
		if (!result.matched) return
		expect(result.intent.type).toBe(IntentType.ManagePosition)
		expect(result.options.length).toBe(2)
		expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.CollectFees)
		expect(result.options[1].actions[0].protocolAction.action).toBe(ActionType.RemoveLiquidity)
	})

	it('matches ActorCoin → UniswapPosition as IncreasePositionLiquidity', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
			ref(EntityType.UniswapPosition, { positionId: 1 }),
		)
		expect(result.matched).toBe(true)
		if (!result.matched) return
		expect(result.intent.type).toBe(IntentType.IncreasePositionLiquidity)
		expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.IncreaseLiquidity)
		expect(result.options[0].actions[0].protocolAction.protocol).toBe(Protocol.UniswapV4)
	})

	it('matches Actor → Room as ShareAddressInRoom', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.Actor, { address: '0xaaa' }),
			ref(EntityType.Room, { id: 'room-1' }),
		)
		expect(result.matched).toBe(true)
		if (!result.matched) return
		expect(result.intent.type).toBe(IntentType.ShareAddressInRoom)
		expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.ShareAddress)
		expect(result.options[0].actions[0].protocolAction.protocol).toBe(Protocol.PartyKit)
	})

	it('matches ActorCoin → RoomPeer as ProposeRoomTransfer', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
			ref(EntityType.RoomPeer, { peerId: 'peer-1', roomId: 'room-1' }),
		)
		expect(result.matched).toBe(true)
		if (!result.matched) return
		expect(result.intent.type).toBe(IntentType.ProposeRoomTransfer)
		expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.ProposeTransfer)
		expect(result.options[0].actions[0].protocolAction.protocol).toBe(Protocol.PartyKit)
	})

	it('matches Actor → RoomPeer as RequestPeerVerification', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.Actor, { address: '0xaaa' }),
			ref(EntityType.RoomPeer, { peerId: 'peer-1', roomId: 'room-1' }),
		)
		expect(result.matched).toBe(true)
		if (!result.matched) return
		expect(result.intent.type).toBe(IntentType.RequestPeerVerification)
		expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.RequestVerification)
		expect(result.options[0].actions[0].protocolAction.protocol).toBe(Protocol.PartyKit)
	})

	it('matches ActorCoin → Coin as SwapToCoin', () => {
		const result = resolveIntentForDrag(
			ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
			ref(EntityType.Coin, { symbol: 'ETH', address: '0xeth' }),
		)
		expect(result.matched).toBe(true)
		if (!result.matched) return
		expect(result.intent.type).toBe(IntentType.SwapToCoin)
		expect(result.options.length).toBe(2)
		expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.Swap)
		expect(result.options[0].actions[0].protocolAction.protocol).toBe(Protocol.UniswapV4)
		expect(result.options[1].actions[0].protocolAction.protocol).toBe(Protocol.LiFi)
	})

	describe('SendFunds (ActorCoin → ActorCoin)', () => {
		it('same actor, same network, different coin → Swap only', () => {
			const result = resolveIntentForDrag(
				ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
				ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xweth' }),
			)
			expect(result.matched).toBe(true)
			if (!result.matched) return
			expect(result.intent.type).toBe(IntentType.SendFunds)
			expect(result.options.length).toBe(2)
			expect(result.options[0].label).toBe('Swap via LiFi')
			expect(result.options[0].actions.length).toBe(1)
			expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.Swap)
			expect(result.options[1].label).toBe('Via Uniswap V4')
		})

		it('same actor, different network, same coin → Bridge only', () => {
			const result = resolveIntentForDrag(
				ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
				ref(EntityType.ActorCoin, { chainId: 10, address: '0xaaa', tokenAddress: '0xusdc' }),
			)
			expect(result.matched).toBe(true)
			if (!result.matched) return
			expect(result.intent.type).toBe(IntentType.SendFunds)
			expect(result.options.length).toBe(3)
			expect(result.options[0].label).toBe('Bridge via LiFi')
			expect(result.options[0].actions.length).toBe(1)
			expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.Bridge)
			expect(result.options[1].label).toBe('Via CCTP')
			expect(result.options[2].label).toBe('Via Gateway')
		})

		it('same actor, different network, different coin → Swap + Bridge', () => {
			const result = resolveIntentForDrag(
				ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
				ref(EntityType.ActorCoin, { chainId: 10, address: '0xaaa', tokenAddress: '0xweth' }),
			)
			expect(result.matched).toBe(true)
			if (!result.matched) return
			expect(result.intent.type).toBe(IntentType.SendFunds)
			expect(result.options.length).toBe(3)
			expect(result.options[0].label).toBe('Swap + Bridge via LiFi')
			expect(result.options[0].actions.length).toBe(2)
			expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.Swap)
			expect(result.options[0].actions[1].protocolAction.action).toBe(ActionType.Bridge)
		})

		it('different actor, same network, same coin → Transfer via LiFi + Yellow', () => {
			const result = resolveIntentForDrag(
				ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
				ref(EntityType.ActorCoin, { chainId: 1, address: '0xbbb', tokenAddress: '0xusdc' }),
			)
			expect(result.matched).toBe(true)
			if (!result.matched) return
			expect(result.intent.type).toBe(IntentType.SendFunds)
			expect(result.options.length).toBe(2)
			expect(result.options[0].label).toBe('Transfer via LiFi')
			expect(result.options[0].actions.length).toBe(1)
			expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.Transfer)
			expect(result.options[0].actions[0].protocolAction.protocol).toBe(Protocol.LiFi)
			expect(result.options[1].label).toBe('Transfer via Yellow')
			expect(result.options[1].actions[0].protocolAction.protocol).toBe(Protocol.Yellow)
		})

		it('different actor, same network, different coin → Swap via LiFi (native recipient)', () => {
			const result = resolveIntentForDrag(
				ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
				ref(EntityType.ActorCoin, { chainId: 1, address: '0xbbb', tokenAddress: '0xweth' }),
			)
			expect(result.matched).toBe(true)
			if (!result.matched) return
			expect(result.intent.type).toBe(IntentType.SendFunds)
			expect(result.options.length).toBe(2)
			expect(result.options[0].label).toBe('Swap via LiFi')
			expect(result.options[0].actions.length).toBe(1)
			expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.Swap)
			expect(result.options[1].label).toBe('Via Uniswap V4')
		})

		it('different actor, different network, same coin → Bridge (native recipient)', () => {
			const result = resolveIntentForDrag(
				ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
				ref(EntityType.ActorCoin, { chainId: 10, address: '0xbbb', tokenAddress: '0xusdc' }),
			)
			expect(result.matched).toBe(true)
			if (!result.matched) return
			expect(result.intent.type).toBe(IntentType.SendFunds)
			expect(result.options.length).toBe(3)
			expect(result.options[0].label).toBe('Bridge via LiFi')
			expect(result.options[1].label).toBe('Via CCTP')
			expect(result.options[2].label).toBe('Via Gateway')
		})

		it('different actor, different network, different coin → Swap + Bridge (native recipient)', () => {
			const result = resolveIntentForDrag(
				ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
				ref(EntityType.ActorCoin, { chainId: 10, address: '0xbbb', tokenAddress: '0xweth' }),
			)
			expect(result.matched).toBe(true)
			if (!result.matched) return
			expect(result.intent.type).toBe(IntentType.SendFunds)
			expect(result.options.length).toBe(3)
			expect(result.options[0].label).toBe('Swap + Bridge via LiFi')
			expect(result.options[0].actions.length).toBe(2)
			expect(result.options[0].actions[0].protocolAction.action).toBe(ActionType.Swap)
			expect(result.options[0].actions[1].protocolAction.action).toBe(ActionType.Bridge)
			expect(result.options[1].label).toBe('Via Uniswap V4 + CCTP')
			expect(result.options[2].label).toBe('Via Uniswap V4 + Gateway')
		})

		it('identical source and destination throws', () => {
			const result = resolveIntentForDrag(
				ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
				ref(EntityType.ActorCoin, { chainId: 1, address: '0xaaa', tokenAddress: '0xusdc' }),
			)
			expect(result.matched).toBe(true)
			if (!result.matched) return
			expect(result.options).toEqual([])
			expect(result.error).toBeInstanceOf(Error)
		})

		it('address comparison is case-insensitive', () => {
			const result = resolveIntentForDrag(
				ref(EntityType.ActorCoin, { chainId: 1, address: '0xAAA', tokenAddress: '0xUSDC' }),
				ref(EntityType.ActorCoin, { chainId: 10, address: '0xaaa', tokenAddress: '0xusdc' }),
			)
			expect(result.matched).toBe(true)
			if (!result.matched) return
			expect(result.intent.type).toBe(IntentType.SendFunds)
			expect(result.options[0].label).toBe('Bridge via LiFi')
		})
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
	it('actionsByProtocol maps Yellow to channel, transfer, and custody actions', () => {
		const yellowActions = actionsByProtocol[Protocol.Yellow]
		expect(yellowActions).toContain(ActionType.Transfer)
		expect(yellowActions).toContain(ActionType.CreateChannel)
		expect(yellowActions).toContain(ActionType.AddChannelMember)
		expect(yellowActions).toContain(ActionType.CloseChannel)
		expect(yellowActions).toContain(ActionType.DepositToCustody)
		expect(yellowActions).toContain(ActionType.WithdrawFromCustody)
		expect(yellowActions).toContain(ActionType.ResizeChannel)
	})

	it('actionsByProtocol maps UniswapV4 to swap, liquidity, fee, and pool actions', () => {
		const uniActions = actionsByProtocol[Protocol.UniswapV4]
		expect(uniActions).toContain(ActionType.Swap)
		expect(uniActions).toContain(ActionType.AddLiquidity)
		expect(uniActions).toContain(ActionType.RemoveLiquidity)
		expect(uniActions).toContain(ActionType.CollectFees)
		expect(uniActions).toContain(ActionType.IncreaseLiquidity)
		expect(uniActions).toContain(ActionType.CreatePool)
	})

	it('actionsByProtocol maps PartyKit to room actions including accept/reject', () => {
		const partyKitActions = actionsByProtocol[Protocol.PartyKit]
		expect(partyKitActions).toContain(ActionType.ShareAddress)
		expect(partyKitActions).toContain(ActionType.ProposeTransfer)
		expect(partyKitActions).toContain(ActionType.RequestVerification)
		expect(partyKitActions).toContain(ActionType.AcceptTransfer)
		expect(partyKitActions).toContain(ActionType.RejectTransfer)
	})

	it('actionsByProtocol maps Gateway to Bridge', () => {
		const gatewayActions = actionsByProtocol[Protocol.Gateway]
		expect(gatewayActions).toContain(ActionType.Bridge)
	})

	it('protocolsByAction maps Swap to UniswapV4 and LiFi', () => {
		const swapProtocols = protocolsByAction[ActionType.Swap]
		expect(swapProtocols).toContain(Protocol.UniswapV4)
		expect(swapProtocols).toContain(Protocol.LiFi)
	})

	it('protocolsByAction maps Bridge to Cctp, LiFi, and Gateway', () => {
		const bridgeProtocols = protocolsByAction[ActionType.Bridge]
		expect(bridgeProtocols).toContain(Protocol.Cctp)
		expect(bridgeProtocols).toContain(Protocol.LiFi)
		expect(bridgeProtocols).toContain(Protocol.Gateway)
	})

	it('protocolsByAction maps Transfer to Yellow and LiFi', () => {
		const transferProtocols = protocolsByAction[ActionType.Transfer]
		expect(transferProtocols).toContain(Protocol.Yellow)
		expect(transferProtocols).toContain(Protocol.LiFi)
	})

	it('protocolsByAction maps AddLiquidity to UniswapV4 only', () => {
		const protocols = protocolsByAction[ActionType.AddLiquidity]
		expect(protocols).toEqual([Protocol.UniswapV4])
	})

	it('protocolsByAction maps ShareAddress to PartyKit only', () => {
		const protocols = protocolsByAction[ActionType.ShareAddress]
		expect(protocols).toEqual([Protocol.PartyKit])
	})

	it('intentEntityTypes contains all entity types from intent definitions', () => {
		expect(intentEntityTypes.has(EntityType.Actor)).toBe(true)
		expect(intentEntityTypes.has(EntityType.ActorCoin)).toBe(true)
		expect(intentEntityTypes.has(EntityType.ActorNetwork)).toBe(true)
		expect(intentEntityTypes.has(EntityType.UniswapPool)).toBe(true)
		expect(intentEntityTypes.has(EntityType.UniswapPosition)).toBe(true)
		expect(intentEntityTypes.has(EntityType.Room)).toBe(true)
		expect(intentEntityTypes.has(EntityType.RoomPeer)).toBe(true)
		expect(intentEntityTypes.has(EntityType.Coin)).toBe(true)
		expect(intentEntityTypes.has(EntityType.Network)).toBe(false)
	})
})
