/**
 * PartyKit room server: room lifecycle, peer join/leave, SIWE challenge generation, state sync.
 */

import type * as Party from 'partykit/server'

type ChannelProposalParams = {
	id: string
	roomId: string
	from: `0x${string}`
	to: `0x${string}`
	chainId: number
	fromDeposit: string
	toDeposit: string
	status: 'pending'
	createdAt: number
	expiresAt: number
}

type PendingChannelProposal = {
	fromPeerId: string
	toPeerId: string
	from: `0x${string}`
	to: `0x${string}`
	fromDeposit: string
	toDeposit: string
	createdAt: number
	expiresAt: number
}

type RoomMessage =
	| { type: 'join'; displayName?: string }
	| { type: 'leave' }
	| { type: 'share-address'; address: `0x${string}` }
	| { type: 'request-challenge'; address: `0x${string}`; fromPeerId: string }
	| { type: 'challenge'; challenge: SiweChallenge }
	| { type: 'submit-signature'; challengeId: string; signature: `0x${string}` }
	| { type: 'verify-result'; challengeId: string; verified: boolean }
	| { type: 'sync'; state: RoomState }
	| { type: 'propose-channel'; to: `0x${string}`; myDeposit: string; theirDeposit: string }
	| { type: 'channel-proposal'; from: `0x${string}`; channelParams: ChannelProposalParams }
	| { type: 'accept-channel'; proposalId: string }
	| { type: 'reject-channel'; proposalId: string; reason?: string }
	| { type: 'channel-opened'; channelId: string; participants: [`0x${string}`, `0x${string}`] }
	| { type: 'channel-closed'; channelId: string }

type Room = {
	id: string
	createdAt: number
	createdBy: string
	name?: string
}

type RoomPeer = {
	id: string
	roomId: string
	peerId: string
	displayName?: string
	joinedAt: number
	lastSeenAt: number
	isConnected: boolean
}

type SharedAddress = {
	id: string
	roomId: string
	peerId: string
	address: `0x${string}`
	verifiedBy: string[]
	sharedAt: number
}

type SiweChallenge = {
	id: string
	roomId: string
	fromPeerId: string
	toPeerId: string
	address: `0x${string}`
	message: string
	nonce: string
	issuedAt: number
	expiresAt: number
	signature?: `0x${string}`
	verified: boolean
}

type RoomState = {
	room: Room
	peers: RoomPeer[]
	sharedAddresses: SharedAddress[]
	challenges: SiweChallenge[]
}

const SIWE_DOMAIN = 'hackmoney.example'

function createSiweMessage(params: {
	domain: string
	address: `0x${string}`
	statement: string
	uri: string
	nonce: string
	issuedAt: string
	expirationTime?: string
	chainId: number
	resources?: string[]
}): string {
	const lines = [
		`${params.domain} wants you to sign in with your Ethereum account:`,
		params.address,
		'',
		params.statement,
		'',
		`URI: ${params.uri}`,
		`Version: 1`,
		`Chain ID: ${params.chainId}`,
		`Nonce: ${params.nonce}`,
		`Issued At: ${params.issuedAt}`,
	]
	if (params.expirationTime) {
		lines.push(`Expiration Time: ${params.expirationTime}`)
	}
	if (params.resources?.length) {
		lines.push('Resources:')
		params.resources.forEach((r) => lines.push(`- ${r}`))
	}
	return lines.join('\n')
}

function generateChallenge(params: {
	roomId: string
	fromPeerId: string
	toPeerId: string
	address: `0x${string}`
}): SiweChallenge {
	const nonce = crypto.randomUUID()
	const issuedAt = Date.now()
	const expiresAt = issuedAt + 5 * 60 * 1000
	const message = createSiweMessage({
		domain: SIWE_DOMAIN,
		address: params.address,
		statement: `Verify address ownership for room ${params.roomId}`,
		uri: `partykit://${params.roomId}`,
		nonce,
		issuedAt: new Date(issuedAt).toISOString(),
		expirationTime: new Date(expiresAt).toISOString(),
		chainId: 1,
		resources: [`peer:${params.toPeerId}`],
	})
	return {
		id: `${params.roomId}:${params.fromPeerId}:${params.toPeerId}:${params.address.toLowerCase()}`,
		roomId: params.roomId,
		fromPeerId: params.fromPeerId,
		toPeerId: params.toPeerId,
		address: params.address,
		message,
		nonce,
		issuedAt,
		expiresAt,
		verified: false,
	}
}

export default class RoomServer implements Party.Server {
	room: Party.Room
	state: RoomState | null = null
	channelProposals = new Map<string, PendingChannelProposal>()

	constructor(room: Party.Room) {
		this.room = room
	}

	getState(): RoomState {
		if (this.state) return this.state
		const now = Date.now()
		this.state = {
			room: {
				id: this.room.id,
				createdAt: now,
				createdBy: '',
				name: undefined,
			},
			peers: [],
			sharedAddresses: [],
			challenges: [],
		}
		return this.state
	}

	onConnect(conn: Party.Connection) {
		const state = this.getState()
		const peerId = conn.id
		const roomPeer: RoomPeer = {
			id: `${this.room.id}:${peerId}`,
			roomId: this.room.id,
			peerId,
			displayName: undefined,
			joinedAt: Date.now(),
			lastSeenAt: Date.now(),
			isConnected: true,
		}
		const existingIdx = state.peers.findIndex((p) => p.peerId === peerId)
		if (existingIdx >= 0) {
			state.peers[existingIdx] = { ...roomPeer, displayName: state.peers[existingIdx].displayName }
		} else {
			if (state.peers.length === 0) {
				state.room.createdBy = peerId
			}
			state.peers.push(roomPeer)
		}
		conn.send(JSON.stringify({ type: 'sync', state }))
		this.room.broadcast(JSON.stringify({ type: 'sync', state }), [conn.id])
	}

	onClose(conn: Party.Connection) {
		const state = this.getState()
		const peerId = conn.id
		const peer = state.peers.find((p) => p.peerId === peerId)
		if (peer) {
			peer.isConnected = false
			peer.lastSeenAt = Date.now()
			this.room.broadcast(JSON.stringify({ type: 'sync', state }))
		}
	}

	onMessage(message: string | ArrayBuffer | ArrayBufferView, sender: Party.Connection) {
		const raw = typeof message === 'string' ? message : new TextDecoder().decode(message)
		let msg: RoomMessage
		try {
			msg = JSON.parse(raw) as RoomMessage
		} catch {
			return
		}
		const state = this.getState()
		const peerId = sender.id

		switch (msg.type) {
			case 'join': {
				const peer = state.peers.find((p) => p.peerId === peerId)
				if (peer) {
					peer.displayName = msg.displayName
					peer.lastSeenAt = Date.now()
					peer.isConnected = true
				}
				this.room.broadcast(JSON.stringify({ type: 'sync', state }))
				break
			}
			case 'leave': {
				const idx = state.peers.findIndex((p) => p.peerId === peerId)
				if (idx >= 0) state.peers.splice(idx, 1)
				this.room.broadcast(JSON.stringify({ type: 'sync', state }))
				break
			}
			case 'share-address': {
				const id = `${this.room.id}:${peerId}:${msg.address.toLowerCase()}`
				if (!state.sharedAddresses.some((s) => s.id === id)) {
					state.sharedAddresses.push({
						id,
						roomId: this.room.id,
						peerId,
						address: msg.address,
						verifiedBy: [],
						sharedAt: Date.now(),
					})
				}
				const others = state.peers.filter((p) => p.peerId !== peerId && p.isConnected)
				for (const other of others) {
					const challenge = generateChallenge({
						roomId: this.room.id,
						fromPeerId: peerId,
						toPeerId: other.peerId,
						address: msg.address,
					})
					state.challenges.push(challenge)
					sender.send(JSON.stringify({ type: 'challenge', challenge }))
					const toConn = this.room.getConnection(other.peerId)
					if (toConn) {
						toConn.send(JSON.stringify({ type: 'challenge', challenge }))
					}
				}
				this.room.broadcast(JSON.stringify({ type: 'sync', state }))
				break
			}
			case 'submit-signature': {
				const ch = state.challenges.find((c) => c.id === msg.challengeId)
				if (ch) {
					ch.signature = msg.signature
					const toConn = this.room.getConnection(ch.toPeerId)
					if (toConn) {
						toConn.send(JSON.stringify({ type: 'submit-signature', challengeId: msg.challengeId, signature: msg.signature }))
					}
				}
				break
			}
			case 'verify-result': {
				const ch = state.challenges.find((c) => c.id === msg.challengeId)
				if (ch && msg.verified) {
					ch.verified = true
					const sharedId = `${this.room.id}:${ch.fromPeerId}:${ch.address.toLowerCase()}`
					const shared = state.sharedAddresses.find((s) => s.id === sharedId)
					if (shared && !shared.verifiedBy.includes(ch.toPeerId)) {
						shared.verifiedBy.push(ch.toPeerId)
					}
				}
				this.room.broadcast(JSON.stringify({ type: 'sync', state }))
				break
			}
			case 'propose-channel': {
				const fromShared = state.sharedAddresses.find((s) => s.peerId === peerId)
				const fromAddress = fromShared?.address
				const toShared = state.sharedAddresses.find(
					(s) => s.address.toLowerCase() === (msg.to as string).toLowerCase(),
				)
				const toPeerId = toShared?.peerId
				if (!fromAddress || !toPeerId) break
				const now = Date.now()
				const expiresAt = now + 15 * 60 * 1000
				const proposalId = `${this.room.id}:${fromAddress.toLowerCase()}:${msg.to.toLowerCase()}:${now}`
				this.channelProposals.set(proposalId, {
					fromPeerId: peerId,
					toPeerId,
					from: fromAddress,
					to: msg.to,
					fromDeposit: msg.myDeposit,
					toDeposit: msg.theirDeposit,
					createdAt: now,
					expiresAt,
				})
				const channelParams: ChannelProposalParams = {
					id: proposalId,
					roomId: this.room.id,
					from: fromAddress,
					to: msg.to,
					chainId: 1,
					fromDeposit: msg.myDeposit,
					toDeposit: msg.theirDeposit,
					status: 'pending',
					createdAt: now,
					expiresAt,
				}
				const toConn = this.room.getConnection(toPeerId)
				if (toConn) {
					toConn.send(JSON.stringify({ type: 'channel-proposal', from: fromAddress, channelParams }))
				}
				break
			}
			case 'accept-channel': {
				const pending = this.channelProposals.get(msg.proposalId)
				if (pending) {
					const fromConn = this.room.getConnection(pending.fromPeerId)
					if (fromConn) {
						fromConn.send(JSON.stringify({ type: 'accept-channel', proposalId: msg.proposalId }))
					}
					this.channelProposals.delete(msg.proposalId)
				}
				break
			}
			case 'reject-channel': {
				const pending = this.channelProposals.get(msg.proposalId)
				if (pending) {
					const fromConn = this.room.getConnection(pending.fromPeerId)
					if (fromConn) {
						fromConn.send(JSON.stringify({ type: 'reject-channel', proposalId: msg.proposalId, reason: msg.reason }))
					}
					this.channelProposals.delete(msg.proposalId)
				}
				break
			}
			case 'channel-opened':
			case 'channel-closed':
				this.room.broadcast(raw)
				break
			default:
				break
		}
	}
}
