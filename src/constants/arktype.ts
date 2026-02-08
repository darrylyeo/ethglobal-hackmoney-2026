import { type } from 'arktype'
import { normalizeAddress } from '$/lib/address.ts'

export const address = type('string').pipe(
	(v, ctx) => normalizeAddress(v) ?? ctx.mustBe('a hex address'),
)
