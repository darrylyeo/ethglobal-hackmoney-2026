import { toInteropName } from '$/constants/interop'
import { normalizeAddress } from '$/lib/address'
import { EntityType } from '$/data/$EntityType'
import type {
	IntentDimensions,
	IntentEntityRef,
	IntentResolution,
} from './types'

const getNumber = (value: unknown): number | null =>
	typeof value === 'number' && Number.isFinite(value) ? value : null

const getAddress = (value: unknown): `0x${string}` | null =>
	typeof value === 'string' ? normalizeAddress(value) : null

const getInteropAddress = (id: Record<string, unknown>): string | undefined =>
	typeof id.interopAddress === 'string' ? id.interopAddress : undefined

const getTokenInteropFromId = (
	id: Record<string, unknown>,
): string | undefined => {
	const chainId = getNumber(id.chainId)
	const tokenAddress = getAddress(id.tokenAddress)
	return chainId !== null && tokenAddress !== null
		? toInteropName(chainId, tokenAddress)
		: undefined
}

const resolveDimensions = (ref: IntentEntityRef): IntentDimensions => {
	const id = ref.id
	if (ref.type === EntityType.ActorCoin) {
		return {
			actor: getAddress(id.address),
			chainId: getNumber(id.chainId),
			tokenAddress: getAddress(id.tokenAddress),
			interopAddress: getInteropAddress(id),
			tokenInteropAddress: getTokenInteropFromId(id),
		}
	}
	if (ref.type === EntityType.Actor) {
		return {
			actor: getAddress(id.address),
			chainId: getNumber(id.network ?? id.chainId),
			tokenAddress: null,
			interopAddress: getInteropAddress(id),
		}
	}
	if (ref.type === EntityType.Coin || ref.type === EntityType.TokenListCoin) {
		return {
			actor: null,
			chainId: getNumber(id.network ?? id.chainId),
			tokenAddress: getAddress(id.address),
			tokenInteropAddress: getInteropAddress(id),
		}
	}
	return {
		actor: null,
		chainId: null,
		tokenAddress: null,
	}
}

const isMissingDimensions = (dimensions: IntentDimensions) =>
	!dimensions.actor || !dimensions.chainId || !dimensions.tokenAddress

const resolveEquality = (from: IntentDimensions, to: IntentDimensions) => ({
	actor:
		from.interopAddress && to.interopAddress
			? from.interopAddress === to.interopAddress
			: from.actor && to.actor
				? from.actor.toLowerCase() === to.actor.toLowerCase()
				: null,
	chain:
		from.chainId !== null && to.chainId !== null
			? from.chainId === to.chainId
			: null,
	token:
		from.tokenInteropAddress && to.tokenInteropAddress
			? from.tokenInteropAddress === to.tokenInteropAddress
			: from.tokenAddress && to.tokenAddress
				? from.tokenAddress.toLowerCase() === to.tokenAddress.toLowerCase()
				: null,
})

export const resolveIntent = (
	fromRef: IntentEntityRef,
	toRef: IntentEntityRef,
): IntentResolution => {
	const from = { ref: fromRef, dimensions: resolveDimensions(fromRef) }
	const to = { ref: toRef, dimensions: resolveDimensions(toRef) }
	const equality = resolveEquality(from.dimensions, to.dimensions)
	if (
		isMissingDimensions(from.dimensions) ||
		isMissingDimensions(to.dimensions)
	) {
		return {
			status: 'invalid',
			reason: 'Missing actor, chain, or token details.',
			from,
			to,
			equality,
		}
	}
	if (equality.actor && equality.chain && equality.token) {
		return {
			status: 'invalid',
			reason: 'No intent for identical actor, chain, and token.',
			from,
			to,
			equality,
		}
	}
	const sameActor = equality.actor === true
	const sameChain = equality.chain === true
	const sameToken = equality.token === true
	const kind =
		sameActor && sameChain && !sameToken
			? 'swap'
			: sameActor && !sameChain && sameToken
				? 'bridge'
				: sameActor && !sameChain && !sameToken
					? 'swap+bridge'
					: !sameActor && sameChain && sameToken
						? 'transfer'
						: !sameActor && sameChain && !sameToken
							? 'transfer+swap'
							: !sameActor && !sameChain && sameToken
								? 'transfer+bridge'
								: 'transfer+swap+bridge'
	return {
		status: 'valid',
		kind,
		from,
		to,
		equality,
	}
}
