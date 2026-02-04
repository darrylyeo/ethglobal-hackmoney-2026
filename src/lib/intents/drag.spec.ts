import { describe, expect, it } from 'vitest'
import { EntityType } from '$/data/$EntityType'
import {
	INTENT_MIME,
	getIntentDragPayload,
	setIntentDragData,
} from './drag'
import type { IntentDragPayload } from './types'

const mockDataTransfer = () => {
	let stored = ''
	return {
		setData(_t: string, data: string) {
			stored = data
		},
		getData(t: string) {
			return t === INTENT_MIME ? stored : ''
		},
	}
}

describe('intent drag payload round-trip with interop', () => {
	it('round-trips Actor payload with interopAddress', () => {
		const payload: IntentDragPayload = {
			entity: {
				type: EntityType.Actor,
				id: {
					network: 1,
					address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
				},
			},
		}
		const dt = mockDataTransfer()
		setIntentDragData({ dataTransfer: dt } as unknown as DragEvent, payload)
		const raw = dt.getData(INTENT_MIME)
		const parsed = JSON.parse(raw)
		expect(parsed.entity.id.address).toBe(payload.entity.id.address)
		expect(parsed.entity.id.network).toBe(1)
		expect(typeof parsed.entity.id.interopAddress).toBe('string')
		expect(parsed.entity.id.interopAddress).toMatch(/@eip155:1#[\dA-F]{8}$/)

		const restored = getIntentDragPayload({
			dataTransfer: { getData: (t: string) => (t === INTENT_MIME ? raw : '') },
		} as unknown as DragEvent)
		expect(restored).not.toBeNull()
		expect(restored!.entity.type).toBe(EntityType.Actor)
		expect(restored!.entity.id.interopAddress).toBe(parsed.entity.id.interopAddress)
		expect(restored!.entity.id.address).toBe(payload.entity.id.address)
	})

	it('round-trips ActorCoin payload with interopAddress', () => {
		const payload: IntentDragPayload = {
			entity: {
				type: EntityType.ActorCoin,
				id: {
					chainId: 8453,
					address: '0x1234567890123456789012345678901234567890',
					tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
				},
			},
		}
		const dt = mockDataTransfer()
		setIntentDragData({ dataTransfer: dt } as unknown as DragEvent, payload)
		const raw = dt.getData(INTENT_MIME)
		const parsed = JSON.parse(raw)
		expect(parsed.entity.id.chainId).toBe(8453)
		expect(typeof parsed.entity.id.interopAddress).toBe('string')
		expect(parsed.entity.id.interopAddress).toMatch(/@eip155:8453#/)

		const restored = getIntentDragPayload({
			dataTransfer: { getData: (t: string) => (t === INTENT_MIME ? raw : '') },
		} as unknown as DragEvent)
		expect(restored).not.toBeNull()
		expect(restored!.entity.id.interopAddress).toBe(parsed.entity.id.interopAddress)
	})

	it('accepts legacy 0x-only payload without interopAddress', () => {
		const raw = JSON.stringify({
			entity: {
				type: EntityType.Actor,
				id: {
					network: 1,
					address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
				},
			},
		})
		const restored = getIntentDragPayload({
			dataTransfer: {
				getData: (t: string) => (t === INTENT_MIME ? raw : ''),
			},
		} as unknown as DragEvent)
		expect(restored).not.toBeNull()
		expect(restored!.entity.id.address).toBe(
			'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
		)
		expect(restored!.entity.id.interopAddress).toBeUndefined()
	})
})
