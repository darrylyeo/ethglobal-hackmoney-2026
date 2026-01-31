/// <reference lib="deno.ns" />
import { assertEquals } from 'jsr:@std/assert'
import {
	createInitialStatus,
	mapLifiProcessStatus,
	type BridgeStatus,
	type TxStatus,
} from './tx-status'

Deno.test('createInitialStatus returns idle with empty steps', () => {
	const status = createInitialStatus()
	assertEquals(status.overall, 'idle')
	assertEquals(status.steps, [])
})

Deno.test('TxStatus type has step, state, txHash, chainId, error, startedAt', () => {
	const s: TxStatus = {
		step: 'approve',
		state: 'success',
		txHash: '0xabc',
		chainId: 1,
		startedAt: 1000,
		completedAt: 2000,
	}
	assertEquals(s.step, 'approve')
	assertEquals(s.state, 'success')
	assertEquals(s.txHash, '0xabc')
	assertEquals(s.chainId, 1)
})

Deno.test('BridgeStatus type has overall, steps, estimatedDurationSeconds', () => {
	const s: BridgeStatus = {
		overall: 'in_progress',
		steps: [],
		estimatedDurationSeconds: 120,
	}
	assertEquals(s.overall, 'in_progress')
	assertEquals(s.estimatedDurationSeconds, 120)
})

Deno.test('mapLifiProcessStatus maps TOKEN_ALLOWANCE to approve', () => {
	assertEquals(mapLifiProcessStatus('TOKEN_ALLOWANCE', 'DONE'), {
		step: 'approve',
		state: 'success',
	})
})

Deno.test('mapLifiProcessStatus maps PERMIT to approve', () => {
	assertEquals(mapLifiProcessStatus('PERMIT', 'PENDING'), {
		step: 'approve',
		state: 'pending',
	})
})

Deno.test('mapLifiProcessStatus maps SWAP to send', () => {
	assertEquals(mapLifiProcessStatus('SWAP', 'DONE'), {
		step: 'send',
		state: 'success',
	})
})

Deno.test('mapLifiProcessStatus maps CROSS_CHAIN to send', () => {
	assertEquals(mapLifiProcessStatus('CROSS_CHAIN', 'FAILED'), {
		step: 'send',
		state: 'failed',
	})
})

Deno.test('mapLifiProcessStatus maps RECEIVING_CHAIN to confirm', () => {
	assertEquals(mapLifiProcessStatus('RECEIVING_CHAIN', 'DONE'), {
		step: 'confirm',
		state: 'success',
	})
})

Deno.test('mapLifiProcessStatus maps unknown process type to send', () => {
	assertEquals(mapLifiProcessStatus('UNKNOWN', 'PENDING'), {
		step: 'send',
		state: 'pending',
	})
})
