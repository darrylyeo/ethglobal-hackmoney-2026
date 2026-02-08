/// <reference lib="deno.ns" />
import { assertEquals } from 'jsr:@std/assert'
import {
	BridgeOverallStatus,
	type BridgeStatus,
	createInitialStatus,
	mapLifiProcessStatus,
	type TxStatus,
	TxState,
	TxStep,
} from './txStatus.ts'

Deno.test('createInitialStatus returns idle with empty steps', () => {
	const status = createInitialStatus()
	assertEquals(status.overall, BridgeOverallStatus.Idle)
	assertEquals(status.steps, [])
})

Deno.test(
	'TxStatus type has step, state, txHash, chainId, error, startedAt',
	() => {
		const s: TxStatus = {
			step: TxStep.Approve,
			state: TxState.Success,
			txHash: '0xabc',
			chainId: 1,
			startedAt: 1000,
			completedAt: 2000,
		}
		assertEquals(s.step, TxStep.Approve)
		assertEquals(s.state, TxState.Success)
		assertEquals(s.txHash, '0xabc')
		assertEquals(s.chainId, 1)
	},
)

Deno.test(
	'BridgeStatus type has overall, steps, estimatedDurationSeconds',
	() => {
		const s: BridgeStatus = {
			overall: BridgeOverallStatus.InProgress,
			steps: [],
			estimatedDurationSeconds: 120,
		}
		assertEquals(s.overall, BridgeOverallStatus.InProgress)
		assertEquals(s.estimatedDurationSeconds, 120)
	},
)

Deno.test('mapLifiProcessStatus maps TOKEN_ALLOWANCE to approve', () => {
	assertEquals(mapLifiProcessStatus('TOKEN_ALLOWANCE', 'DONE'), {
		step: TxStep.Approve,
		state: TxState.Success,
	})
})

Deno.test('mapLifiProcessStatus maps PERMIT to approve', () => {
	assertEquals(mapLifiProcessStatus('PERMIT', 'PENDING'), {
		step: TxStep.Approve,
		state: TxState.Pending,
	})
})

Deno.test('mapLifiProcessStatus maps SWAP to send', () => {
	assertEquals(mapLifiProcessStatus('SWAP', 'DONE'), {
		step: TxStep.Send,
		state: TxState.Success,
	})
})

Deno.test('mapLifiProcessStatus maps CROSS_CHAIN to send', () => {
	assertEquals(mapLifiProcessStatus('CROSS_CHAIN', 'FAILED'), {
		step: TxStep.Send,
		state: TxState.Failed,
	})
})

Deno.test('mapLifiProcessStatus maps RECEIVING_CHAIN to confirm', () => {
	assertEquals(mapLifiProcessStatus('RECEIVING_CHAIN', 'DONE'), {
		step: TxStep.Confirm,
		state: TxState.Success,
	})
})

Deno.test('mapLifiProcessStatus maps unknown process type to send', () => {
	assertEquals(mapLifiProcessStatus('UNKNOWN', 'PENDING'), {
		step: TxStep.Send,
		state: TxState.Pending,
	})
})
