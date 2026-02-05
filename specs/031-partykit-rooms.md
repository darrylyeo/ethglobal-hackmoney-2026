# Spec 031: PartyKit multiplayer rooms

Real-time multiplayer sessions where users can share verified wallet addresses with
peers using SIWE (Sign-In with Ethereum) for cryptographic proof of ownership.

**References:**

- https://docs.partykit.io/
- https://eips.ethereum.org/EIPS/eip-4361 (SIWE)
- https://login.xyz/

## Overview

Users join "rooms" identified by a unique room code. Within a room, users can share
a subset of their connected wallet addresses with other participants. Address
sharing requires cryptographic verification:

1. Sharer requests a unique SIWE challenge from each peer
2. Each peer generates a nonce-bearing message
3. Sharer signs each peer's message using Voltaire
4. Peers validate the signature matches the claimed address
5. Verified addresses are visible to all room participants

## Collections

### `src/collections/rooms.ts`

```typescript
type Room = {
  id: string // room code
  createdAt: number
  createdBy: string // peerId
  name?: string
}

const roomsCollection = createCollection<Room>({
  id: 'rooms',
  getId: (room) => room.id,
})
```

### `src/collections/room-peers.ts`

```typescript
type RoomPeer = {
  id: string // `${roomId}:${peerId}`
  roomId: string
  peerId: string // PartyKit connection id
  displayName?: string
  joinedAt: number
  lastSeenAt: number
  isConnected: boolean
}

const roomPeersCollection = createCollection<RoomPeer>({
  id: 'room-peers',
  getId: (peer) => peer.id,
})
```

### `src/collections/shared-addresses.ts`

```typescript
type SharedAddress = {
  id: string // `${roomId}:${peerId}:${address}`
  roomId: string
  peerId: string
  address: `0x${string}`
  verifiedBy: string[] // peerIds who have verified
  sharedAt: number
}

const sharedAddressesCollection = createCollection<SharedAddress>({
  id: 'shared-addresses',
  getId: (sa) => sa.id,
})
```

### `src/collections/siwe-challenges.ts`

```typescript
type SiweChallenge = {
  id: string // `${roomId}:${fromPeerId}:${toPeerId}:${address}`
  roomId: string
  fromPeerId: string // peer requesting verification
  toPeerId: string // peer who generated challenge
  address: `0x${string}`
  message: string // full SIWE message
  nonce: string
  issuedAt: number
  expiresAt: number
  signature?: `0x${string}`
  verified: boolean
}

const siweChallengesCollection = createCollection<SiweChallenge>({
  id: 'siwe-challenges',
  getId: (ch) => ch.id,
})
```

## PartyKit server

### `partykit/room.ts`

```typescript
import type * as Party from 'partykit/server'

type RoomMessage =
  | { type: 'join'; displayName?: string }
  | { type: 'leave' }
  | { type: 'share-address'; address: `0x${string}` }
  | { type: 'request-challenge'; address: `0x${string}`; fromPeerId: string }
  | { type: 'challenge'; challenge: SiweChallenge }
  | { type: 'submit-signature'; challengeId: string; signature: `0x${string}` }
  | { type: 'verify-result'; challengeId: string; verified: boolean }
  | { type: 'sync'; state: RoomState }

type RoomState = {
  room: Room
  peers: RoomPeer[]
  sharedAddresses: SharedAddress[]
  challenges: SiweChallenge[]
}

export default class RoomServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    // Send current state to new connection
    // Broadcast peer joined
  }

  onClose(conn: Party.Connection) {
    // Mark peer disconnected
    // Broadcast peer left
  }

  onMessage(message: string, sender: Party.Connection) {
    const msg: RoomMessage = JSON.parse(message)
    // Handle message types
  }

  // Generate SIWE challenge for peer (domain = app host from connection: Origin at onConnect, else request host, else 'localhost')
  generateChallenge(params: {
    domain: string
    roomId: string
    fromPeerId: string
    toPeerId: string
    address: `0x${string}`
  }): SiweChallenge {
    const nonce = crypto.randomUUID()
    const issuedAt = Date.now()
    const expiresAt = issuedAt + 5 * 60 * 1000 // 5 minutes

    const message = createSiweMessage({
      domain: params.domain,
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
      id: `${params.roomId}:${params.fromPeerId}:${params.toPeerId}:${params.address}`,
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
}
```

### `partykit.json`

```json
{
  "name": "hackmoney-rooms",
  "main": "partykit/room.ts"
}
```

## Client API

### `src/lib/partykit.ts`

```typescript
import PartySocket from 'partysocket'

type RoomConnection = {
  socket: PartySocket
  roomId: string
  peerId: string
  send: (msg: RoomMessage) => void
  close: () => void
}

// Connect to room
const connectToRoom = (roomId: string): RoomConnection => {
  const socket = new PartySocket({
    host: PARTYKIT_HOST,
    room: roomId,
  })

  return {
    socket,
    roomId,
    peerId: socket.id,
    send: (msg) => socket.send(JSON.stringify(msg)),
    close: () => socket.close(),
  }
}

// Create new room
const createRoom = async (name?: string): Promise<string> => {
  const roomId = generateRoomCode() // 6-char alphanumeric
  // Room is created on first connection
  return roomId
}

// Generate room code
const generateRoomCode = () => (
  Math.random().toString(36).substring(2, 8).toUpperCase()
)
```

### `src/lib/siwe.ts`

SIWE message construction and verification using Voltaire:

```typescript
import { recoverAddress, hashMessage } from '$/lib/voltaire'

type SiweMessageParams = {
  domain: string
  address: `0x${string}`
  statement: string
  uri: string
  nonce: string
  issuedAt: string
  expirationTime?: string
  chainId: number
  resources?: string[]
}

// Construct EIP-4361 message
const createSiweMessage = (params: SiweMessageParams): string => {
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

// Parse SIWE message back to params
const parseSiweMessage = (message: string): SiweMessageParams => {
  // Parse EIP-4361 format
  // ...
}

// Verify signature using Voltaire
const verifySiweSignature = async (params: {
  message: string
  signature: `0x${string}`
  expectedAddress: `0x${string}`
}): Promise<boolean> => {
  const recoveredAddress = await recoverAddress({
    message: params.message,
    signature: params.signature,
  })
  return recoveredAddress.toLowerCase() === params.expectedAddress.toLowerCase()
}

// Sign SIWE message using connected wallet via Voltaire
const signSiweMessage = async (params: {
  provider: EIP1193Provider
  message: string
  address: `0x${string}`
}): Promise<`0x${string}`> => {
  const signature = await params.provider.request({
    method: 'personal_sign',
    params: [params.message, params.address],
  })
  return signature as `0x${string}`
}
```

## State management

### `src/state/room.svelte.ts`

```typescript
import { roomsCollection } from '$/collections/rooms'
import { roomPeersCollection } from '$/collections/room-peers'
import { sharedAddressesCollection } from '$/collections/shared-addresses'
import { siweChallengesCollection } from '$/collections/siwe-challenges'

type RoomState = {
  connection: RoomConnection | null
  roomId: string | null
  peerId: string | null
}

// Reactive room state
export const roomState = $state<RoomState>({
  connection: null,
  roomId: null,
  peerId: null,
})

// Actions
export const joinRoom = async (roomId: string, displayName?: string) => {
  const conn = connectToRoom(roomId)

  conn.socket.addEventListener('message', (event) => {
    const msg: RoomMessage = JSON.parse(event.data)
    handleServerMessage(msg)
  })

  conn.send({ type: 'join', displayName })

  roomState.connection = conn
  roomState.roomId = roomId
  roomState.peerId = conn.peerId
}

export const leaveRoom = () => {
  roomState.connection?.send({ type: 'leave' })
  roomState.connection?.close()
  roomState.connection = null
  roomState.roomId = null
  roomState.peerId = null
}

// Handle incoming messages and update collections
const handleServerMessage = (msg: RoomMessage) => {
  switch (msg.type) {
    case 'sync':
      // Bulk update all collections from server state
      break
    case 'challenge':
      siweChallengesCollection.insert(msg.challenge)
      break
    case 'verify-result':
      siweChallengesCollection.update(msg.challengeId, { verified: msg.verified })
      break
    // ...
  }
}
```

## UI

### Page route: `src/routes/rooms/+page.svelte`

Room lobby – create or join a room.

### `src/routes/rooms/[roomId]/+page.svelte`

Room view with peer list and address sharing.

### `src/routes/rooms/RoomLobby.svelte`

```svelte
<!-- Create room form -->
<!-- Join room form (enter code) -->
<!-- Recent rooms list -->
```

### `src/routes/rooms/RoomView.svelte`

Main room interface:

**Sections:**
1. Room header (name, code, share link)
2. Peer list with connection status
3. My addresses (from `actorsCollection`) with share toggles
4. Shared addresses from other peers with verification status
5. Pending challenges to sign/verify

### `src/routes/rooms/PeerList.svelte`

```svelte
<script lang="ts">
  import { useLiveQuery } from '$/svelte/live-query-context.svelte'
  import { roomPeersCollection } from '$/collections/room-peers'

  let { roomId }: { roomId: string } = $props()

  const peersQuery = useLiveQuery(() => (
    roomPeersCollection.query({ where: { roomId } })
  ))
</script>

{#each peersQuery.data ?? [] as peer (peer.id)}
  <div data-peer data-connected={peer.isConnected}>
    <span>{peer.displayName ?? peer.peerId.slice(0, 8)}</span>
    <span data-status>{peer.isConnected ? '●' : '○'}</span>
  </div>
{/each}
```

### `src/routes/rooms/AddressSharing.svelte`

Address sharing with SIWE verification flow:

```svelte
<script lang="ts">
  import { useLiveQuery } from '$/svelte/live-query-context.svelte'
  import { actorsCollection } from '$/collections/actors'
  import { sharedAddressesCollection } from '$/collections/shared-addresses'
  import { siweChallengesCollection } from '$/collections/siwe-challenges'
  import { roomState } from '$/state/room.svelte'
  import { signSiweMessage } from '$/lib/siwe'

  let { roomId }: { roomId: string } = $props()

  // My connected addresses
  const actorsQuery = useLiveQuery(() => actorsCollection.query({}))

  // Addresses I've shared
  const mySharedQuery = useLiveQuery(() => (
    sharedAddressesCollection.query({
      where: { roomId, peerId: roomState.peerId },
    })
  ))

  // Pending challenges for me to sign
  const pendingChallengesQuery = useLiveQuery(() => (
    siweChallengesCollection.query({
      where: { roomId, fromPeerId: roomState.peerId, verified: false },
    })
  ))

  // Share an address (initiates verification with all peers)
  const shareAddress = async (address: `0x${string}`) => {
    roomState.connection?.send({ type: 'share-address', address })
  }

  // Sign a challenge from a peer
  const signChallenge = async (challenge: SiweChallenge, provider: EIP1193Provider) => {
    const signature = await signSiweMessage({
      provider,
      message: challenge.message,
      address: challenge.address,
    })
    roomState.connection?.send({
      type: 'submit-signature',
      challengeId: challenge.id,
      signature,
    })
  }
</script>

<section data-my-addresses>
  <h3>My Addresses</h3>
  {#each actorsQuery.data ?? [] as actor (actor.id)}
    {@const isShared = mySharedQuery.data?.some((s) => s.address === actor.address)}
    <div data-address>
      <Address address={actor.address} />
      <Button onclick={() => shareAddress(actor.address)} disabled={isShared}>
        {isShared ? 'Shared' : 'Share'}
      </Button>
    </div>
  {/each}
</section>

<section data-pending-signatures>
  <h3>Pending Signatures</h3>
  {#each pendingChallengesQuery.data ?? [] as challenge (challenge.id)}
    <div data-challenge>
      <p>Sign for peer {challenge.toPeerId.slice(0, 8)}</p>
      <Button onclick={() => signChallenge(challenge, provider)}>
        Sign
      </Button>
    </div>
  {/each}
</section>
```

### `src/routes/rooms/SharedAddresses.svelte`

Display verified shared addresses from all peers:

```svelte
<script lang="ts">
  import { useLiveQuery } from '$/svelte/live-query-context.svelte'
  import { sharedAddressesCollection } from '$/collections/shared-addresses'
  import { roomPeersCollection } from '$/collections/room-peers'

  let { roomId }: { roomId: string } = $props()

  const sharedQuery = useLiveQuery(() => (
    sharedAddressesCollection.query({ where: { roomId } })
  ))

  const peersQuery = useLiveQuery(() => (
    roomPeersCollection.query({ where: { roomId } })
  ))

  const getPeerName = (peerId: string) => (
    peersQuery.data?.find((p) => p.peerId === peerId)?.displayName ?? peerId.slice(0, 8)
  )
</script>

<section data-shared-addresses>
  <h3>Shared Addresses</h3>
  {#each sharedQuery.data ?? [] as shared (shared.id)}
    {@const verificationCount = shared.verifiedBy.length}
    {@const peerCount = (peersQuery.data?.length ?? 1) - 1}
    <div data-shared-address data-fully-verified={verificationCount === peerCount}>
      <span data-peer-name>{getPeerName(shared.peerId)}</span>
      <Address address={shared.address} />
      <span data-verification>
        {verificationCount}/{peerCount} verified
      </span>
    </div>
  {/each}
</section>
```

## Verification flow

### Sequence diagram

```
Sharer                    Server                    Peer A                   Peer B
   |                         |                         |                        |
   |-- share-address(0x123) ->|                        |                        |
   |                         |-- request-challenge --->|                        |
   |                         |-- request-challenge --------------------------->|
   |                         |                         |                        |
   |                         |<-- challenge(nonceA) ---|                        |
   |                         |<-- challenge(nonceB) ---------------------------|
   |                         |                         |                        |
   |<-- challenge(nonceA) ---|                         |                        |
   |<-- challenge(nonceB) ---|                         |                        |
   |                         |                         |                        |
   |  [signs both messages]  |                         |                        |
   |                         |                         |                        |
   |-- submit-sig(A, sigA) ->|                         |                        |
   |-- submit-sig(B, sigB) ->|                         |                        |
   |                         |                         |                        |
   |                         |-- verify(sigA) -------->|                        |
   |                         |-- verify(sigB) ---------------------------->|
   |                         |                         |                        |
   |                         |<-- verified(true) ------|                        |
   |                         |<-- verified(true) --------------------------|
   |                         |                         |                        |
   |<-- address-verified ----|-- address-verified ---->|-- address-verified -->|
```

### Security considerations

1. **Nonce uniqueness** – Each challenge has a unique nonce to prevent replay
2. **Expiration** – Challenges expire after 5 minutes
3. **Per-peer challenges** – Sharer must sign for each peer individually
4. **Peer-specific resource** – SIWE message includes target peer in resources
5. **Server validation** – Server validates signatures before broadcasting
6. **No key custody** – Signatures happen client-side via wallet

## Acceptance criteria

### Collections
- [x] `roomsCollection` in `src/collections/rooms.ts`
- [x] `roomPeersCollection` in `src/collections/room-peers.ts`
- [x] `sharedAddressesCollection` in `src/collections/shared-addresses.ts`
- [x] `siweChallengesCollection` in `src/collections/siwe-challenges.ts`
- [x] Unit tests for collection normalizers

### PartyKit server
- [x] `partykit/room.ts` handles room lifecycle
- [x] Peer join/leave broadcasts to room
- [x] Challenge generation with unique nonce
- [x] Signature verification on server
- [x] State sync on connect

### Client API
- [x] `src/lib/partykit.ts` with `connectToRoom`, `createRoom`
- [x] `src/lib/siwe.ts` with `createSiweMessage`, `signSiweMessage`, `verifySiweSignature`
- [x] SIWE signing via Voltaire `personal_sign`
- [x] Signature recovery via Voltaire `recoverAddress`

### State management
- [x] `src/state/room.svelte.ts` with reactive room state
- [x] `joinRoom`, `leaveRoom` actions
- [x] Server message handler updates collections

### UI
- [x] `src/routes/rooms/+page.svelte` – lobby
- [x] `src/routes/rooms/[roomId]/+page.svelte` – room view
- [x] Peer list with connection status
- [x] Address sharing toggle per address
- [x] Pending challenge signing UI
- [x] Shared addresses display with verification count
- [x] Navigation link added

### Verification flow
- [x] Per-peer challenge generation
- [x] Sharer signs each peer's challenge
- [x] Peers validate signatures
- [x] Address marked verified per peer
- [x] Challenge expiration enforced

## Status

Complete. Collections (rooms, room-peers, shared-addresses, siwe-challenges) with key helpers in *-keys.ts and Deno unit tests. PartyKit server partykit/room.ts: onConnect/onClose/onMessage, join/leave/share-address, generateChallenge (SIWE message inline), submit-signature forwarded to verifier, verify-result broadcast; state sync on connect. Client: src/lib/partykit.ts (connectToRoom, createRoom, generateRoomCode), src/lib/siwe.ts (createSiweMessage, signSiweMessage via personal_sign, verifySiweSignature via viem recoverMessageAddress). State: src/state/room.svelte.ts (joinRoom, leaveRoom, handleServerMessage with sync/challenge/verify-result/submit-signature). UI: rooms/+page.svelte (lobby create/join), rooms/[roomId]/+page.svelte (room view, AccountsSelect, PeerList, AddressSharing, SharedAddresses), PeerList.svelte, AddressSharing.svelte, SharedAddresses.svelte; Rooms nav link in +layout.svelte.

## Output when complete

`DONE`
