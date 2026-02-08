/// <reference lib='deno.ns' />
import { assertEquals } from 'jsr:@std/assert'

const actorCoinKey = (
	chainId: number,
	address: `0x${string}`,
	coinAddress: `0x${string}`,
) => `${chainId}-${address.toLowerCase()}-${coinAddress.toLowerCase()}`

const formatBalance = (balance: bigint, decimals: number) => {
	const divisor = 10n ** BigInt(decimals)
	const integerPart = balance / divisor
	const fractionalPart = balance % divisor
	return (
		`${integerPart}.${fractionalPart
			.toString()
			.padStart(decimals, '0')
			.slice(0, 4)}`
	)
}

Deno.test('actorCoinKey generates correct composite key', () => {
	assertEquals(actorCoinKey(1, '0xABC123', '0xUSDC456'), '1-0xabc123-0xusdc456')
})

Deno.test('actorCoinKey normalizes addresses to lowercase', () => {
	const key1 = actorCoinKey(1, '0xABCDEF', '0x123456')
	const key2 = actorCoinKey(1, '0xabcdef', '0x123456')
	assertEquals(key1, key2)
})

Deno.test('actorCoinKey differentiates by chainId', () => {
	const key1 = actorCoinKey(1, '0xabc', '0xusdc')
	const key2 = actorCoinKey(10, '0xabc', '0xusdc')
	assertEquals(key1 !== key2, true)
})

Deno.test('formatBalance formats 1 USDC correctly', () => {
	assertEquals(formatBalance(1000000n, 6), '1.0000')
})

Deno.test('formatBalance formats fractional amounts', () => {
	assertEquals(formatBalance(1234567n, 6), '1.2345')
})

Deno.test('formatBalance formats large amounts', () => {
	assertEquals(formatBalance(1234567890n, 6), '1234.5678')
})

Deno.test('formatBalance handles zero', () => {
	assertEquals(formatBalance(0n, 6), '0.0000')
})
