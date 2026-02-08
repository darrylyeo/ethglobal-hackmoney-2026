import { createHttpProvider } from '$/api/voltaire.ts'
import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import { rpcUrls } from '$/constants/rpc-endpoints.ts'
import {
	storkEncodedAssetIdByAssetId,
	storkOracleAddressByChainId,
	storkRestBaseUrl,
	storkWebsocketUrl,
} from '$/constants/stork.ts'
import type {
	StorkPrice,
	StorkPrice$Id,
	StorkPriceTransport,
} from '$/data/StorkPrice.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { Abi, decodeParameters, encodeFunction } from '@tevm/voltaire/Abi'
import { toBytes } from '@tevm/voltaire/Hex'
import { parse, stringify } from 'devalue'
import { env } from '$env/dynamic/public'

export type StorkPriceRow = StorkPrice & { $source: DataSource }

type StorkPricePayload = {
	assetId: string
	price: bigint
	timestampNs: bigint
}

type StorkSubscriptionParams = {
	assetIds: string[]
	transports?: StorkPriceTransport[]
	chainId?: number | null
}

const DEFAULT_TRANSPORTS: StorkPriceTransport[] = ['websocket', 'rest', 'rpc']

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null

const toBigInt = (value: unknown): bigint | null =>
	typeof value === 'string' || typeof value === 'number' ? BigInt(value) : null

export const storkPricesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.StorkPrices,
		storageKey: CollectionId.StorkPrices,
		getKey: (row: StorkPriceRow) => stringify(row.$id),
		parser: { stringify, parse },
	}),
)

const updateStorkPrice = (row: StorkPriceRow) => {
	const key = stringify(row.$id)
	const existing = storkPricesCollection.state.get(key)
	if (existing) {
		storkPricesCollection.update(key, (draft) => {
			Object.assign(draft, row)
		})
	} else {
		storkPricesCollection.insert(row)
	}
}

const setStorkPriceLoading = (
	$id: StorkPrice$Id,
	encodedAssetId: string | null,
) => {
	const key = stringify($id)
	const existing = storkPricesCollection.state.get(key)
	const next = {
		$id,
		$source: DataSource.Stork,
		assetId: $id.assetId,
		transport: $id.transport,
		chainId: $id.chainId ?? null,
		encodedAssetId,
		price: existing?.price ?? 0n,
		timestampNs: existing?.timestampNs ?? 0n,
		updatedAt: Date.now(),
		isLoading: true,
		error: null,
	}
	updateStorkPrice(next)
}

const setStorkPriceError = (
	$id: StorkPrice$Id,
	encodedAssetId: string | null,
	error: string,
) => {
	const key = stringify($id)
	const existing = storkPricesCollection.state.get(key)
	updateStorkPrice({
		$id,
		$source: DataSource.Stork,
		assetId: $id.assetId,
		transport: $id.transport,
		chainId: $id.chainId ?? null,
		encodedAssetId,
		price: existing?.price ?? 0n,
		timestampNs: existing?.timestampNs ?? 0n,
		updatedAt: Date.now(),
		isLoading: false,
		error,
	})
}

const upsertStorkPricePayload = (
	payload: StorkPricePayload,
	transport: StorkPriceTransport,
	chainId?: number | null,
) => {
	const encodedAssetId = storkEncodedAssetIdByAssetId[payload.assetId] ?? null
	updateStorkPrice({
		$id: {
			assetId: payload.assetId,
			transport,
			...(chainId !== null && chainId !== undefined ? { chainId } : {}),
		},
		$source: DataSource.Stork,
		assetId: payload.assetId,
		transport,
		chainId: chainId ?? null,
		encodedAssetId,
		price: payload.price,
		timestampNs: payload.timestampNs,
		updatedAt: Date.now(),
		isLoading: false,
		error: null,
	})
}

const readStorkPricePayload = (
	value: unknown,
	assetId: string,
): StorkPricePayload | null => {
	if (!isRecord(value)) return null
	const price = toBigInt(value.price)
	const timestampNs = toBigInt(value.timestamp)
	if (price === null || timestampNs === null) return null
	return { assetId, price, timestampNs }
}

const parseRestPricePayloads = (value: unknown): StorkPricePayload[] => {
	if (!isRecord(value)) return []
	const data = isRecord(value.data) ? value.data : value
	const payload = isRecord(data.value) ? data.value : data
	if (!isRecord(payload)) return []
	return Object.entries(payload).flatMap(([assetId, entry]) => {
		const parsed = readStorkPricePayload(entry, assetId)
		return parsed ? [parsed] : []
	})
}

const fetchRestPrices = async (assetIds: string[]) => {
	const token = env.PUBLIC_STORK_REST_TOKEN
	if (!token) {
		for (const assetId of assetIds) {
			setStorkPriceError(
				{ assetId, transport: 'rest' },
				storkEncodedAssetIdByAssetId[assetId] ?? null,
				'Missing PUBLIC_STORK_REST_TOKEN',
			)
		}
		return
	}
	const url = new URL('v1/prices/latest', `${storkRestBaseUrl}/`)
	url.searchParams.set('assets', assetIds.join(','))
	const response = await fetch(url.toString(), {
		headers: { Authorization: `Basic ${token}` },
	})
	if (!response.ok) throw new Error(`Stork REST error: ${response.status}`)
	const data = await response.json()
	const payloads = parseRestPricePayloads(data)
	const seen = new Set(payloads.map((payload) => payload.assetId))
	for (const payload of payloads) {
		upsertStorkPricePayload(payload, 'rest', null)
	}
	for (const assetId of assetIds) {
		if (!seen.has(assetId)) {
			setStorkPriceError(
				{ assetId, transport: 'rest' },
				storkEncodedAssetIdByAssetId[assetId] ?? null,
				'No REST price returned',
			)
		}
	}
}

const createRestSubscription = (assetIds: string[]) => {
	if (!env.PUBLIC_STORK_REST_TOKEN) {
		for (const assetId of assetIds) {
			setStorkPriceError(
				{ assetId, transport: 'rest' },
				storkEncodedAssetIdByAssetId[assetId] ?? null,
				'Missing PUBLIC_STORK_REST_TOKEN',
			)
		}
		return () => {}
	}
	for (const assetId of assetIds) {
		setStorkPriceLoading(
			{ assetId, transport: 'rest' },
			storkEncodedAssetIdByAssetId[assetId] ?? null,
		)
	}
	const fetchNow = () => {
		fetchRestPrices(assetIds).catch((error) => {
			for (const assetId of assetIds) {
				setStorkPriceError(
					{ assetId, transport: 'rest' },
					storkEncodedAssetIdByAssetId[assetId] ?? null,
					error instanceof Error ? error.message : String(error),
				)
			}
		})
	}
	fetchNow()
	const id = setInterval(fetchNow, 15_000)
	return () => clearInterval(id)
}

let storkDeployments: Map<number, string> | null = null

const staticDeployments = new Map(
	(
		Object.entries(storkOracleAddressByChainId) as unknown as [string, string][]
	).map(([chainId, addr]) => [Number(chainId), addr]),
)

const fetchStorkDeployments = async () => {
	if (storkDeployments) return storkDeployments
	const token = env.PUBLIC_STORK_REST_TOKEN
	if (!token) {
		storkDeployments = staticDeployments
		return storkDeployments
	}
	const url = new URL('v1/deployments/evm', `${storkRestBaseUrl}/`)
	const response = await fetch(url.toString(), {
		headers: { Authorization: `Basic ${token}` },
	})
	if (response.ok) {
		const data = await response.json()
		const rows = isRecord(data) && Array.isArray(data.data) ? data.data : []
		const deployments = new Map<number, string>()
		for (const entry of rows) {
			if (!isRecord(entry)) continue
			const chainId = entry.chain_id
			const proxyAddress = entry.proxy_address
			if (typeof chainId !== 'number' || typeof proxyAddress !== 'string')
				continue
			deployments.set(chainId, proxyAddress)
		}
		storkDeployments = deployments
		return deployments
	}
	storkDeployments = staticDeployments
	return storkDeployments
}

const STORK_VALUE_ABI = Abi([
	{
		type: 'function',
		name: 'getTemporalNumericValueV1',
		stateMutability: 'view',
		inputs: [{ name: 'id', type: 'bytes32' }],
		outputs: [
			{
				name: 'value',
				type: 'tuple',
				components: [
					{ name: 'timestampNs', type: 'uint64' },
					{ name: 'quantizedValue', type: 'int192' },
				],
			},
		],
	},
]) as unknown as import('@tevm/voltaire/Abi').Abi

const STORK_VALUE_OUTPUTS = [
	{
		name: 'value',
		type: 'tuple',
		components: [
			{ name: 'timestampNs', type: 'uint64' },
			{ name: 'quantizedValue', type: 'int192' },
		],
	},
] as const

const readTemporalNumericValue = (
	value: unknown,
): { timestampNs: bigint; quantizedValue: bigint } | null => {
	if (Array.isArray(value)) {
		const [timestampNs, quantizedValue] = value
		if (typeof timestampNs === 'bigint' && typeof quantizedValue === 'bigint') {
			return { timestampNs, quantizedValue }
		}
	}
	if (isRecord(value)) {
		const timestampNs = value.timestampNs
		const quantizedValue = value.quantizedValue
		if (typeof timestampNs === 'bigint' && typeof quantizedValue === 'bigint') {
			return { timestampNs, quantizedValue }
		}
	}
	return null
}

const fetchRpcPrice = async (assetId: string, chainId: number) => {
	const encodedAssetId = storkEncodedAssetIdByAssetId[assetId]
	if (!encodedAssetId) {
		setStorkPriceError(
			{ assetId, transport: 'rpc', chainId },
			null,
			'Missing encoded asset id',
		)
		return
	}
	const rpcUrl = rpcUrls[chainId]
	if (!rpcUrl) {
		setStorkPriceError(
			{ assetId, transport: 'rpc', chainId },
			encodedAssetId,
			`No RPC URL for chain ${chainId}`,
		)
		return
	}
	const deployments = await fetchStorkDeployments()
	const contractAddress = deployments.get(chainId)
	if (!contractAddress) {
		setStorkPriceError(
			{ assetId, transport: 'rpc', chainId },
			encodedAssetId,
			`No Stork contract for chain ${chainId}`,
		)
		return
	}
	const provider = createHttpProvider(rpcUrl)
	const data = encodeFunction(STORK_VALUE_ABI, 'getTemporalNumericValueV1', [
		encodedAssetId,
	])
	const result = await provider.request({
		method: 'eth_call',
		params: [{ to: contractAddress, data }, 'latest'],
	})
	if (typeof result !== 'string' || !result || result === '0x') {
		throw new Error('Stork RPC returned invalid data')
	}
	const decoded = decodeParameters(STORK_VALUE_OUTPUTS, toBytes(result))
	const parsed = readTemporalNumericValue(decoded[0])
	if (!parsed) throw new Error('Unable to decode Stork value')
	upsertStorkPricePayload(
		{
			assetId,
			price: parsed.quantizedValue,
			timestampNs: parsed.timestampNs,
		},
		'rpc',
		chainId,
	)
}

const createRpcSubscription = (assetIds: string[], chainId: number) => {
	for (const assetId of assetIds) {
		setStorkPriceLoading(
			{ assetId, transport: 'rpc', chainId },
			storkEncodedAssetIdByAssetId[assetId] ?? null,
		)
	}
	const fetchNow = () => {
		Promise.all(
			assetIds.map((assetId) =>
				fetchRpcPrice(assetId, chainId).catch((error) => {
					setStorkPriceError(
						{ assetId, transport: 'rpc', chainId },
						storkEncodedAssetIdByAssetId[assetId] ?? null,
						error instanceof Error ? error.message : String(error),
					)
				}),
			),
		).catch(() => {})
	}
	fetchNow()
	const id = setInterval(fetchNow, 30_000)
	return () => clearInterval(id)
}

type StorkWebsocketState = {
	socket: WebSocket | null
	assetCounts: Map<string, number>
	connecting: boolean
}

const storkWebsocketState: StorkWebsocketState = {
	socket: null,
	assetCounts: new Map(),
	connecting: false,
}

const ensureWebsocketConnection = () => {
	if (storkWebsocketState.socket || storkWebsocketState.connecting) return
	if (typeof WebSocket === 'undefined') return
	if (!env.PUBLIC_STORK_REST_TOKEN) {
		return
	}
	storkWebsocketState.connecting = true
	const socket = new WebSocket(storkWebsocketUrl)
	storkWebsocketState.socket = socket
	socket.onopen = () => {
		storkWebsocketState.connecting = false
		const assetIds = [...storkWebsocketState.assetCounts.keys()]
		if (assetIds.length > 0) {
			socket.send(JSON.stringify({ type: 'subscribe', data: assetIds }))
		}
	}
	socket.onmessage = (event) => {
		let message: unknown
		try {
			message = JSON.parse(event.data)
		} catch {
			return
		}
		if (!isRecord(message) || message.type !== 'oracle_prices') return
		const payloads = parseRestPricePayloads(message)
		for (const payload of payloads) {
			upsertStorkPricePayload(payload, 'websocket', null)
		}
	}
	socket.onclose = () => {
		storkWebsocketState.socket = null
		storkWebsocketState.connecting = false
	}
	socket.onerror = () => {
		storkWebsocketState.socket = null
		storkWebsocketState.connecting = false
	}
}

const updateWebsocketSubscriptions = () => {
	const socket = storkWebsocketState.socket
	if (!socket || socket.readyState !== WebSocket.OPEN) return
	const assetIds = [...storkWebsocketState.assetCounts.keys()]
	socket.send(JSON.stringify({ type: 'subscribe', data: assetIds }))
}

const createWebsocketSubscription = (assetIds: string[]) => {
	if (!env.PUBLIC_STORK_REST_TOKEN) {
		for (const assetId of assetIds) {
			setStorkPriceError(
				{ assetId, transport: 'websocket' },
				storkEncodedAssetIdByAssetId[assetId] ?? null,
				'Websocket requires PUBLIC_STORK_REST_TOKEN',
			)
		}
		return () => {}
	}
	for (const assetId of assetIds) {
		setStorkPriceLoading(
			{ assetId, transport: 'websocket' },
			storkEncodedAssetIdByAssetId[assetId] ?? null,
		)
		const count = storkWebsocketState.assetCounts.get(assetId) ?? 0
		storkWebsocketState.assetCounts.set(assetId, count + 1)
	}
	ensureWebsocketConnection()
	updateWebsocketSubscriptions()
	return () => {
		for (const assetId of assetIds) {
			const count = storkWebsocketState.assetCounts.get(assetId) ?? 0
			if (count <= 1) storkWebsocketState.assetCounts.delete(assetId)
			else storkWebsocketState.assetCounts.set(assetId, count - 1)
		}
		const socket = storkWebsocketState.socket
		if (socket && socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify({ type: 'unsubscribe', data: assetIds }))
		}
	}
}

const subscriptionRegistry = new Map<
	string,
	{ count: number; unsubscribe: () => void }
>()

const registerSubscription = (key: string, create: () => () => void) => {
	const existing = subscriptionRegistry.get(key)
	if (existing) {
		existing.count += 1
		return () => {
			existing.count -= 1
			if (existing.count <= 0) {
				existing.unsubscribe()
				subscriptionRegistry.delete(key)
			}
		}
	}
	const unsubscribe = create()
	subscriptionRegistry.set(key, { count: 1, unsubscribe })
	return () => {
		const current = subscriptionRegistry.get(key)
		if (!current) return
		current.count -= 1
		if (current.count <= 0) {
			current.unsubscribe()
			subscriptionRegistry.delete(key)
		}
	}
}

export const subscribeStorkPrices = ({
	assetIds,
	transports = DEFAULT_TRANSPORTS,
	chainId = null,
}: StorkSubscriptionParams) => {
	const uniqueAssetIds = [...new Set(assetIds)]
	if (uniqueAssetIds.length === 0) return () => {}
	const keyAssetIds = [...uniqueAssetIds].sort().join(',')
	const unsubscribers = transports.flatMap((transport) => {
		if (transport === 'rest') {
			return registerSubscription(`rest:${keyAssetIds}`, () =>
				createRestSubscription(uniqueAssetIds),
			)
		}
		if (transport === 'websocket') {
			return registerSubscription(`websocket:${keyAssetIds}`, () =>
				createWebsocketSubscription(uniqueAssetIds),
			)
		}
		if (transport === 'rpc' && chainId !== null) {
			const rpcAssetIds = uniqueAssetIds.filter(
				(assetId) => assetId in storkEncodedAssetIdByAssetId,
			)
			if (rpcAssetIds.length === 0) return []
			const rpcKey = [...rpcAssetIds].sort().join(',')
			return registerSubscription(`rpc:${chainId}:${rpcKey}`, () =>
				createRpcSubscription(rpcAssetIds, chainId),
			)
		}
		return []
	})
	return () => {
		for (const unsubscribe of unsubscribers) unsubscribe()
	}
}

export const getBestStorkPrice = (
	rows: StorkPriceRow[],
	assetId: string,
	chainId: number | null,
): StorkPriceRow | null => {
	const candidates = rows.filter(
		(row) =>
			row.assetId === assetId &&
			(row.transport !== 'rpc' ||
				(chainId !== null && row.chainId === chainId)),
	)
	const ready = candidates.filter(
		(row) => !row.isLoading && row.error === null,
	)
	if (ready.length === 0) return null
	const priority = ['rpc', 'websocket', 'rest'] as const
	for (const transport of priority) {
		const best = ready
			.filter((row) => row.transport === transport)
			.sort((a, b) => (a.timestampNs > b.timestampNs ? -1 : 1))[0]
		if (best) return best
	}
	return ready.sort((a, b) => (a.timestampNs > b.timestampNs ? -1 : 1))[0] ?? null
}
