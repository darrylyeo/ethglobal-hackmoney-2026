import { type } from 'arktype'
import { normalizeAddress } from '$/lib/address.ts'

export const address = type('string').pipe(
	(v, ctx) => normalizeAddress(v) ?? ctx.mustBe('a hex address'),
)

export const hexString = type('string').pipe(
	(v, ctx) => (/^0x[0-9a-fA-F]*$/.test(v as string) ? (v as `0x${string}`) : ctx.mustBe('hex string (0x...)')),
)
