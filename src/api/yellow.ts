/**
 * Yellow Network / Nitrolite: Custody, Clearnode, channel operations.
 * SDK lazy-loaded when available; stubs allow UI to render.
 */

import type { EIP1193Provider } from '$/lib/wallet.ts'
import {
	createWalletClientForChain,
	getChainFor,
} from '$/api/viem-client.ts'
import type { YellowChannelState } from '$/data/YellowChannelState.ts'
import {
	yellowDeploymentByChainId,
	YellowEnvironment,
	yellowClearnodeEndpointByEnvironment,
	CHALLENGE_PERIOD,
} from '$/constants/yellow.ts'
import { NetworkType, networksByChainId } from '$/constants/networks.ts'
import { getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'
import { Address } from '@tevm/voltaire/Address'
import { Hex } from '@tevm/voltaire/Hex'
import { PrivateKey } from '@tevm/voltaire/PrivateKey'
import { parseDecimalToSmallest } from '$/lib/format.ts'
import { createPublicClient, createWalletClient, custom, http } from 'viem'

export type ClearnodeConnection = {
	close: () => void
	onMessage: (handler: (msg: unknown) => void) => void
	send: (msg: unknown) => void
	sendRequest?: <T>(
		buildMessage: (requestId: number) => Promise<string>,
	) => Promise<T>
	sessionSigner?: (payload: unknown[]) => Promise<`0x${string}`>
	sessionKey?: `0x${string}`
}

const getYellowSdk = async () => import('@erc7824/nitrolite')

export const connectClearnode = async (params: {
	chainId: number
	signer: EIP1193Provider
	address: `0x${string}`
	environment?: YellowEnvironment
	wsUrl?: string
}): Promise<ClearnodeConnection> => {
	const {
		createAuthRequestMessage,
		createAuthVerifyMessageFromChallenge,
		createECDSAMessageSigner,
		createEIP712AuthMessageSigner,
		createGetLedgerBalancesMessage,
	} = await getYellowSdk()
	const wsUrl =
		params.wsUrl
		?? (typeof globalThis.window !== 'undefined' && (globalThis.window as unknown as Record<string, unknown>).__E2E_CLEARNODE_WS_URL__ as string | undefined)
		?? yellowClearnodeEndpointByEnvironment[
			params.environment ??
				(networksByChainId[params.chainId]?.type === NetworkType.Testnet ?
					YellowEnvironment.Sandbox
				: YellowEnvironment.Production)
		]
	if (!wsUrl) {
		throw new Error('Missing clearnode endpoint for chain')
	}

	type PendingEntry = {
		resolve: (value: unknown) => void
		reject: (error: Error) => void
	}
	const socket = new WebSocket(wsUrl)
	const handlers = new Set<(msg: unknown) => void>()
	const pending = new Map<number, PendingEntry>()
	let requestId = 1
	let sessionSigner: ((payload: unknown[]) => Promise<`0x${string}`>) | null =
		null
	let sessionKey: `0x${string}` | null = null

	const sendRaw = (msg: unknown) => {
		socket.send(typeof msg === 'string' ? msg : JSON.stringify(msg))
	}

	const sendRequest = <T>(buildMessage: (id: number) => Promise<string>) =>
		new Promise<T>((resolve, reject) => {
			const id = requestId++
			buildMessage(id)
				.then((message) => {
					pending.set(id, {
						resolve: resolve as (value: unknown) => void,
						reject,
					})
					sendRaw(message)
				})
				.catch((error: unknown) => {
					reject(
						error instanceof Error
							? error
							: new Error('Failed to build request'),
					)
				})
		})

	const awaitOpen = new Promise<void>((resolve, reject) => {
		socket.addEventListener('open', () => resolve(), { once: true })
		socket.addEventListener(
			'error',
			() => reject(new Error('Clearnode connection failed')),
			{ once: true },
		)
	})

	await awaitOpen

	const sessionPkHex = Hex.random(32) as `0x${string}`
	const sessionAddressHex = Address.toHex(PrivateKey.toAddress(sessionPkHex))
	const authParams = {
		address: params.address,
		session_key: sessionAddressHex,
		application: 'ethglobal-hackmoney-2026',
		allowances: [],
		expires_at: BigInt(Math.floor(Date.now() / 1000) + 60 * 60),
		scope: 'transfer,channel',
	}

	const authRequest = await createAuthRequestMessage(authParams)
	sendRaw(authRequest)

	const authReady = new Promise<void>((resolve, reject) => {
		socket.addEventListener('message', async (event) => {
		  try {
			const data = typeof event.data === 'string' ? event.data : ''
			let parsed: { res?: unknown[] } | null = null
			try {
				parsed = JSON.parse(data) as { res?: unknown[] }
			} catch {
				handlers.forEach((handler) => handler(event.data))
				return
			}
			const response = parsed?.res
			if (!Array.isArray(response)) {
				handlers.forEach((handler) => handler(event.data))
				return
			}
			const [id, method, result] = response
			if (method === 'auth_challenge' || method === 'auth_request') {
				const walletClient = createWalletClient({
					account: params.address,
					chain: getChainFor(params.chainId),
					transport: custom(params.signer),
				})
				const signer = createEIP712AuthMessageSigner(walletClient, authParams, {
					name: authParams.application,
				})
				const challenge =
					result && typeof result === 'object' && 'challenge_message' in result ?
						result.challenge_message
					: result &&
							typeof result === 'object' &&
							'challengeMessage' in result ?
						result.challengeMessage
					:
						null
				if (typeof challenge === 'string') {
					const verifyMessage = await createAuthVerifyMessageFromChallenge(
						signer,
						challenge,
					)
					sendRaw(verifyMessage)
				}
			} else if (method === 'auth_verify') {
				const success =
					result && typeof result === 'object' && 'success' in result ?
						Boolean(result.success)
					:
						false
				if (success) {
					const signer = createECDSAMessageSigner(sessionPkHex)
					sessionSigner = signer as (payload: unknown[]) => Promise<`0x${string}`>
					sessionKey = sessionAddressHex
					const balancesMessage = await createGetLedgerBalancesMessage(
						signer,
						params.address,
						requestId++,
					)
					sendRaw(balancesMessage)
					resolve()
				} else {
					reject(new Error('Yellow auth failed'))
				}
			} else if (method === 'error') {
				reject(new Error('Yellow auth error'))
			}
			if (typeof id === 'number' && pending.has(id)) {
				const entry = pending.get(id)
				if (entry) {
					if (method === 'error') {
						const message =
							result && typeof result === 'object' && 'error' in result ?
								String(result.error)
							:
								'Yellow request failed'
						entry.reject(new Error(message))
					} else {
						entry.resolve(result)
					}
					pending.delete(id)
				}
			}
			handlers.forEach((handler) => handler(event.data))
		  } catch (err) {
			reject(err instanceof Error ? err : new Error(String(err)))
		  }
		})
	})

	await authReady

	return {
		close: () => socket.close(),
		onMessage: (handler) => {
			handlers.add(handler)
		},
		send: sendRaw,
		sendRequest,
		sessionSigner: sessionSigner ?? undefined,
		sessionKey: sessionKey ?? undefined,
	}
}

const createNitroliteClient = async (
	provider: EIP1193Provider,
	chainId: number,
) => {
	const deployment = yellowDeploymentByChainId[chainId]
	if (!deployment) {
		throw new Error('Yellow contracts not deployed on this chain')
	}
	const rpcUrl = getEffectiveRpcUrl(chainId)
	if (!rpcUrl) {
		throw new Error('No RPC endpoint for this chain')
	}
	const { NitroliteClient, WalletStateSigner } = await getYellowSdk()
	const walletClient = createWalletClientForChain(provider, chainId)
	const accounts = (await provider.request({
		method: 'eth_accounts',
		params: [],
	})) as `0x${string}`[]
	const account = accounts[0]
	if (!account) {
		throw new Error('No connected account')
	}
	const publicClient = createPublicClient({ transport: http(rpcUrl) })
	return new NitroliteClient({
		publicClient,
		walletClient: Object.assign(walletClient, {
			account: { address: account, type: 'json-rpc' as const },
		}),
		stateSigner: new WalletStateSigner(
			Object.assign(walletClient, {
				account: { address: account, type: 'json-rpc' as const },
			}),
		),
		addresses: {
			custody: deployment.custody,
			adjudicator: deployment.adjudicator,
		},
		chainId,
		challengeDuration: BigInt(CHALLENGE_PERIOD ?? 86400),
	})
}

export const depositToCustody = async (params: {
	provider: EIP1193Provider
	chainId: number
	token: `0x${string}`
	amount: bigint
}): Promise<{ txHash: `0x${string}` }> => {
	const client = await createNitroliteClient(params.provider, params.chainId)
	return { txHash: await client.deposit(params.token, params.amount) }
}

export const withdrawFromCustody = async (params: {
	provider: EIP1193Provider
	chainId: number
	token: `0x${string}`
	amount: bigint
}): Promise<{ txHash: `0x${string}` }> => {
	const client = await createNitroliteClient(params.provider, params.chainId)
	return { txHash: await client.withdrawal(params.token, params.amount) }
}

export const getAvailableBalance = async (params: {
	clearnodeConnection: ClearnodeConnection
	address: `0x${string}`
}): Promise<bigint> => {
	const { createGetLedgerBalancesMessage } = await getYellowSdk()
	if (
		!params.clearnodeConnection.sendRequest ||
		!params.clearnodeConnection.sessionSigner
	)
		return 0n
	const result = await params.clearnodeConnection.sendRequest((id) =>
		createGetLedgerBalancesMessage(
			params.clearnodeConnection.sessionSigner!,
			params.address,
			id,
		),
	)
	const balances =
		result && typeof result === 'object' && 'ledgerBalances' in result
			? result.ledgerBalances
			: []
	if (!Array.isArray(balances)) return 0n
	const usdc = balances.find(
		(entry) =>
			entry &&
			typeof entry === 'object' &&
			'asset' in entry &&
			String(entry.asset).toLowerCase() === 'usdc',
	)
	const amount =
		usdc && typeof usdc === 'object' && 'amount' in usdc ?
			String(usdc.amount)
		:
			'0'
	return parseDecimalToSmallest(amount, 6)
}

export const openChannel = async (params: {
	clearnodeConnection: ClearnodeConnection
	chainId: number
	token: `0x${string}`
	roomId?: string
}): Promise<{ channelId: string }> => {
	const { createCreateChannelMessage } = await getYellowSdk()
	if (
		!params.clearnodeConnection.sendRequest ||
		!params.clearnodeConnection.sessionSigner
	) {
		throw new Error('Clearnode connection unavailable')
	}
	const result = await params.clearnodeConnection.sendRequest((id) =>
		createCreateChannelMessage(
			params.clearnodeConnection.sessionSigner!,
			{
				chain_id: params.chainId,
				token: params.token,
			},
			id,
		),
	)
	const channelId =
		result && typeof result === 'object' && 'channelId' in result ?
			String(result.channelId)
		: result && typeof result === 'object' && 'channel_id' in result ?
			String(result.channel_id)
		:
			''
	if (!channelId) throw new Error('Missing channel id from clearnode')
	// TODO: submit channel + initial state to custody contract
	return { channelId }
}

export const resizeChannel = async (params: {
	clearnodeConnection: ClearnodeConnection
	channelId: `0x${string}`
	fundsDestination: `0x${string}`
	resizeAmount?: bigint
	allocateAmount?: bigint
}): Promise<{ channelId: string }> => {
	const { createResizeChannelMessage } = await getYellowSdk()
	if (
		!params.clearnodeConnection.sendRequest ||
		!params.clearnodeConnection.sessionSigner
	) {
		throw new Error('Clearnode session missing')
	}
	await params.clearnodeConnection.sendRequest((id) =>
		createResizeChannelMessage(
			params.clearnodeConnection.sessionSigner!,
			{
				channel_id: params.channelId,
				funds_destination: params.fundsDestination,
				resize_amount: params.resizeAmount,
				allocate_amount: params.allocateAmount,
			},
			id,
		),
	)
	return { channelId: params.channelId }
}

export const sendTransfer = async (params: {
	clearnodeConnection: ClearnodeConnection
	destination: `0x${string}`
	allocations: { asset: string; amount: string }[]
}): Promise<{ turnNum: number }> => {
	const { createTransferMessage } = await getYellowSdk()
	if (
		!params.clearnodeConnection.sendRequest ||
		!params.clearnodeConnection.sessionSigner
	) {
		throw new Error('Clearnode session missing')
	}
	const result = await params.clearnodeConnection.sendRequest((id) =>
		createTransferMessage(
			params.clearnodeConnection.sessionSigner!,
			{
				destination: params.destination,
				allocations: params.allocations,
			},
			id,
		),
	)
	return {
		turnNum:
			result && typeof result === 'object' && 'version' in result ?
				Number(result.version)
			:
				0,
	}
}

export const closeChannel = async (params: {
	clearnodeConnection: ClearnodeConnection
	channelId: `0x${string}`
	fundsDestination: `0x${string}`
}): Promise<{ channelId: string }> => {
	const { createCloseChannelMessage } = await getYellowSdk()
	if (
		!params.clearnodeConnection.sendRequest ||
		!params.clearnodeConnection.sessionSigner
	) {
		throw new Error('Clearnode session missing')
	}
	await params.clearnodeConnection.sendRequest((id) =>
		createCloseChannelMessage(
			params.clearnodeConnection.sessionSigner!,
			params.channelId,
			params.fundsDestination,
			id,
		),
	)
	return { channelId: params.channelId }
}

export const challengeChannel = async (params: {
	provider: EIP1193Provider
	chainId: number
	channelId: `0x${string}`
	latestState: YellowChannelState
}): Promise<{ txHash: `0x${string}` }> => {
	const client = await createNitroliteClient(params.provider, params.chainId)
	return {
		txHash: await client.challengeChannel({
			channelId: params.channelId,
			candidateState: {
				intent: params.latestState.intent,
				version: BigInt(params.latestState.version),
				data: params.latestState.stateData,
				allocations: params.latestState.allocations.map((a) => ({
					destination: a.destination,
					token: a.token,
					amount: a.amount,
				})),
				sigs: params.latestState.signatures,
			},
		}),
	}
}
