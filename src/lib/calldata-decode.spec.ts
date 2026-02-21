import { assertEquals } from 'jsr:@std/assert'
import {
	decodeCalldataWithSignature,
	decodeEventDataWithSignature,
	eventTopicFromSignature,
	formatDecodedParamValue,
	functionSelectorFromSignature,
	parseEventSignature,
	parseFunctionSignature,
} from './calldata-decode.ts'

Deno.test('parseFunctionSignature: extracts name and types', () => {
	assertEquals(parseFunctionSignature('transfer(address,uint256)'), {
		name: 'transfer',
		types: ['address', 'uint256'],
	})
	assertEquals(parseFunctionSignature('approve(address,uint256)'), {
		name: 'approve',
		types: ['address', 'uint256'],
	})
	assertEquals(parseFunctionSignature('balanceOf(address)'), {
		name: 'balanceOf',
		types: ['address'],
	})
	assertEquals(parseFunctionSignature('foo()'), { name: 'foo', types: [] })
	assertEquals(parseFunctionSignature('bar(uint256,(address,bytes))'), {
		name: 'bar',
		types: ['uint256', '(address,bytes)'],
	})
	assertEquals(parseFunctionSignature('invalid'), null)
	assertEquals(parseFunctionSignature('noParens'), null)
})

Deno.test('decodeCalldataWithSignature: decodes transfer calldata', () => {
	// transfer(to, amount): selector 0xa9059cbb + address (32 bytes) + uint256 (32 bytes)
	// 1e18 in hex = 0de0b6b3a7640000, left-padded to 32 bytes
	const calldata =
		'0xa9059cbb0000000000000000000000007432f2e8c2e2e8c2e2e8c2e2e8c2e2e8c2e2e8c2000000000000000000000000000000000000000000000000000de0b6b3a7640000' as `0x${string}`
	const out = decodeCalldataWithSignature('transfer(address,uint256)', calldata)
	assertEquals(out?.name, 'transfer')
	assertEquals(out?.params.length, 2)
	assertEquals(out?.params[0].type, 'address')
	assertEquals(
		(out?.params[0].value as `0x${string}`).toLowerCase(),
		'0x7432f2e8c2e2e8c2e2e8c2e2e8c2e2e8c2e2e8c2',
	)
	assertEquals(out?.params[1].type, 'uint256')
	assertEquals(typeof out?.params[1].value, 'bigint')
	// Voltaire decodes ABI; exact value depends on encoding (here: 3906250000000000n)
	assertEquals(out?.params[1].value, 3906250000000000n)
})

Deno.test('decodeCalldataWithSignature: selector-only calldata for zero-arg function', () => {
	const selector = functionSelectorFromSignature('foo()')
	assertEquals(selector, '0xc2985578')
	const out = decodeCalldataWithSignature('foo()', selector as `0x${string}`)
	assertEquals(out, { name: 'foo', params: [] })
})

Deno.test('decodeCalldataWithSignature: returns null for too short or invalid', () => {
	assertEquals(decodeCalldataWithSignature('transfer(address,uint256)', '0xa9059cbb' as `0x${string}`), null)
	assertEquals(decodeCalldataWithSignature('not a sig', '0xa9059cbb00' as `0x${string}`), null)
})

Deno.test('decodeCalldataWithSignature: returns null when calldata selector does not match signature', () => {
	const transferCalldata =
		'0xa9059cbb0000000000000000000000007432f2e8c2e2e8c2e2e8c2e2e8c2e2e8c2e2e8c2000000000000000000000000000000000000000000000000000de0b6b3a7640000' as `0x${string}`
	assertEquals(decodeCalldataWithSignature('approve(address,uint256)', transferCalldata), null)
})

Deno.test('functionSelectorFromSignature: returns 4-byte selector for known signatures', () => {
	assertEquals(functionSelectorFromSignature('transfer(address,uint256)'), '0xa9059cbb')
	assertEquals(functionSelectorFromSignature('approve(address,uint256)'), '0x095ea7b3')
	assertEquals(functionSelectorFromSignature('balanceOf(address)'), '0x70a08231')
	assertEquals(functionSelectorFromSignature('foo()'), '0xc2985578')
	assertEquals(functionSelectorFromSignature('invalid'), null)
})

Deno.test('formatDecodedParamValue: address, bigint, bool, bytes', () => {
	assertEquals(
		formatDecodedParamValue('address', '0x7432f2e8c2e2e8c2e2e8c2e2e8c2e2e8c2e2e8c2'),
		'0x7432f2…e2E8C2',
	)
	assertEquals(formatDecodedParamValue('uint256', 3906250000000000n), '3906250000000000')
	assertEquals(formatDecodedParamValue('bool', true), 'true')
	assertEquals(formatDecodedParamValue('bool', false), 'false')
	assertEquals(
		formatDecodedParamValue('bytes', new Uint8Array([0xde, 0xad, 0xbe, 0xef])),
		'0xdeadbeef',
	)
	assertEquals(formatDecodedParamValue('bytes', new Uint8Array(0)), '0x')
})

Deno.test('formatDecodedParamValue: tuple', () => {
	assertEquals(
		formatDecodedParamValue('(address,bytes)', [
			'0x7432f2e8c2e2e8c2e2e8c2e2e8c2e2e8c2e2e8c2',
			new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
		]),
		'(0x7432f2…e2E8C2, 0xdeadbeef)',
	)
})

Deno.test('eventTopicFromSignature: returns 32-byte topic', () => {
	const topic = eventTopicFromSignature('Transfer(address,address,uint256)')
	assertEquals(topic?.length, 66)
	assertEquals(topic?.slice(0, 2), '0x')
	assertEquals(
		topic,
		'0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
	)
	assertEquals(eventTopicFromSignature('invalid'), null)
})

Deno.test('parseEventSignature: splits indexed and non-indexed', () => {
	assertEquals(parseEventSignature('Transfer(address,address,uint256)'), {
		name: 'Transfer',
		indexedTypes: [],
		nonIndexedTypes: ['address', 'address', 'uint256'],
	})
	assertEquals(
		parseEventSignature('Transfer(address indexed, address indexed, uint256)'),
		{
			name: 'Transfer',
			indexedTypes: ['address', 'address'],
			nonIndexedTypes: ['uint256'],
		},
	)
	assertEquals(parseEventSignature('Foo()'), {
		name: 'Foo',
		indexedTypes: [],
		nonIndexedTypes: [],
	})
	assertEquals(parseEventSignature('not a sig'), null)
})

Deno.test('decodeEventDataWithSignature: decodes Transfer event data', () => {
	const topic = eventTopicFromSignature('Transfer(address,address,uint256)')
	const fromAddr = '0000000000000000000000007432f2e8c2e2e8c2e2e8c2e2e8c2e2e8c2e2e8c2'
	const toAddr = '000000000000000000000000abcdabcdabcdabcdabcdabcdabcdabcdabcdabcd'
	const value = '0000000000000000000000000000000000000000000000000de0b6b3a7640000'
	const hex = (`${topic}${fromAddr}${toAddr}${value}` as `0x${string}`)
	const out = decodeEventDataWithSignature('Transfer(address,address,uint256)', hex)
	assertEquals(out?.name, 'Transfer')
	assertEquals(out?.params.length, 3)
	assertEquals(out?.params[2].type, 'uint256')
	assertEquals(out?.params[2].value, 1000000000000000000n)
})

Deno.test('decodeEventDataWithSignature: decodes Transfer with indexed params (params in signature order)', () => {
	const topic = eventTopicFromSignature('Transfer(address indexed, address indexed, uint256)')
	const topic1 = '0000000000000000000000007432f2e8c2e2e8c2e2e8c2e2e8c2e2e8c2e2e8c2'
	const topic2 = '000000000000000000000000abcdabcdabcdabcdabcdabcdabcdabcdabcdabcd'
	const dataHex = '0000000000000000000000000000000000000000000000000de0b6b3a7640000'
	const hex = (`${topic}${topic1}${topic2}${dataHex}` as `0x${string}`)
	const out = decodeEventDataWithSignature(
		'Transfer(address indexed, address indexed, uint256)',
		hex,
	)
	assertEquals(out?.name, 'Transfer')
	assertEquals(out?.params.length, 3)
	assertEquals(out?.params[0].type, 'address')
	assertEquals(
		(out?.params[0].value as `0x${string}`).toLowerCase(),
		'0x7432f2e8c2e2e8c2e2e8c2e2e8c2e2e8c2e2e8c2',
	)
	assertEquals(out?.params[1].type, 'address')
	assertEquals(
		(out?.params[1].value as `0x${string}`).toLowerCase(),
		'0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd',
	)
	assertEquals(out?.params[2].type, 'uint256')
	assertEquals(out?.params[2].value, 1000000000000000000n)
})

Deno.test('decodeEventDataWithSignature: returns null for too short or topic mismatch', () => {
	assertEquals(
		decodeEventDataWithSignature('Transfer(address,address,uint256)', '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' as `0x${string}`),
		null,
	)
	const wrongTopic =
		'0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`
	assertEquals(
		decodeEventDataWithSignature('Transfer(address,address,uint256)', wrongTopic),
		null,
	)
})
