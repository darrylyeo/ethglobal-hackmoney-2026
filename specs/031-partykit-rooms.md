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
sharing requires cryptographic verification.

**Share modes:**

- **Share with all** – Share an address with every peer in the room; each peer may
  request verification independently.
- **Share** (with specific peer) – Share an address with one chosen peer only;
  only that peer sees it and can request verification.

Only one share mode applies per action. The UI uses a **share intent**: addresses
are draggable; drop zones are "All" and each peer; a DragArrow shows during drag
from address to target; drop performs the share (no per-peer Share buttons).

**Verification flow (per peer that has the address shared with them):**

1. Peer (verifier) requests a unique SIWE challenge for that address
2. Server (or sharer) generates a nonce-bearing message for that verifier
3. Sharer signs the message using Voltaire **only if** their wallet connection
   supports signing (EIP-1193); read-only/watch-only connections cannot sign
4. Verifier validates the signature matches the claimed address
5. Verification result is stored in the **verifications** collection with date and
   signature

Peers may **request verification as many times as they want** (e.g. re-verify
after expiry or to refresh proof). No single-request limit per address.

**Wallet connection transport and actions:**

- **EIP-1193 (signing capable)** – Can sign SIWE challenges; can verify addresses
  they own; sees "Sign" for pending challenges and can complete verification.
- **Read-only / watch-only (e.g. `WalletConnectionTransport.None`)** – Cannot
  sign. UI must only show appropriate actions: do not show "Sign" for pending
  challenges for that address; show verification status as **Unverifiable** for
  that peer/address. Do not offer verify/sign actions that require signing when
  the selected wallet is read-only.

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
  id: string // `${roomId}:${peerId}:${address}:${targetPeerIds === null ? 'all' : targetPeerIds.join(',')}`
  roomId: string
  peerId: string // sharer
  address: `0x${string}`
  targetPeerIds: string[] | null // null = shared with all; [peerId] = shared with that peer only
  sharedAt: number
}

const sharedAddressesCollection = createCollection<SharedAddress>({
  id: 'shared-addresses',
  getId: (sa) => sa.id,
})
```

Verification status and who verified are **not** stored on `SharedAddress`; they
come from the **verifications** collection. Derive "verified by N peers" or
"Verified by you" from verifications where `address`, `roomId`, `verifiedPeerId`
match and `status === 'verified'`.

### `src/collections/verifications.ts`

Verifications are a **separate DB collection**. One row per verification
request/outcome (verifier + address + verified peer); peers may request multiple
times.

```typescript
type VerificationStatus = 'unverifiable' | 'verifying' | 'verified'

type Verification = {
  id: string // unique per request, e.g. `${roomId}:${verifierPeerId}:${verifiedPeerId}:${address}:${requestedAt}` or UUID
  roomId: string
  verifierPeerId: string // peer who requested / performs verification
  verifiedPeerId: string // peer who owns the address (sharer)
  address: `0x${string}`
  status: VerificationStatus
  requestedAt: number
  verifiedAt?: number // set when status becomes 'verified'
  signature?: `0x${string}` // SIWE signature; persisted when status === 'verified'
  challengeId?: string // link to siwe-challenges for in-flight requests
}

const verificationsCollection = createCollection<Verification>({
  id: 'verifications',
  getId: (v) => v.id,
})
```

- **Unverifiable** – Verifier requested but sharer’s wallet is read-only;
  cannot sign; record created with `status: 'unverifiable'`.
- **Verifying** – Challenge issued, waiting for signature; `status: 'verifying'`.
- **Verified** – Signature received and validated; `status: 'verified'`,
  `verifiedAt` and `signature` set.

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
  | { type: 'share-address'; address: `0x${string}`; targetPeerIds?: string[] }
  | { type: 'request-challenge'; address: `0x${string}`; fromPeerId: string }
  | { type: 'challenge'; challenge: SiweChallenge }
  | { type: 'submit-signature'; challengeId: string; signature: `0x${string}` }
  | { type: 'verify-result'; challengeId: string; verified: boolean }
  | { type: 'verification-record'; verification: Verification }
  | { type: 'sync'; state: RoomState }

type RoomState = {
  room: Room
  peers: RoomPeer[]
  sharedAddresses: SharedAddress[]
  challenges: SiweChallenge[]
  verifications: Verification[]
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

**Room display name mapping** (`src/constants/room-display-names.ts`, `src/lib/rooms/room.ts`): Room IDs are 4-byte hex. Human-readable display names map to/from hex via wordlist triplets. Format: **[Adjective] [Color] [Place name]** (e.g. "Ancient Amber Academy"). Wordlists: `colors`, `adjectives`, `nouns` (place names with `icon` emoji per noun, e.g. Academy 🏫, Garden 🌿). Each triplet encodes one segment; minimum one triplet (3 words), more as needed for larger IDs. `roomIdToDisplayName(roomId)` and `displayNameToRoomId(displayName)` round-trip; `normalizeRoomInput(input)` accepts hex or display name. **`roomIdToPlaceEmoji(roomId)`** returns the place (noun) emoji for the room for use in nav items and room page header. **Persistent peer ID:** client stores a peer id in `localStorage` (`room-persistent-peer-id`) and passes it to PartySocket as `id` so refresh reuses the same peer identity.

### `src/lib/rooms/siwe.ts`

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
import { verificationsCollection } from '$/collections/verifications'

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
      // Bulk update all collections from server state (including verifications)
      break
    case 'challenge':
      siweChallengesCollection.insert(msg.challenge)
      break
    case 'verify-result':
      siweChallengesCollection.update(msg.challengeId, { verified: msg.verified })
      break
    case 'verification-record':
      verificationsCollection.upsert(msg.verification)
      break
    // ...
  }
}
```

## UI

### Page route: `src/routes/rooms/+page.svelte`

Room lobby – create or join a room.

### `src/routes/rooms/[roomId]/+page.svelte`

Room view: header, then (inside an expandable details) wallet/accounts select, **Me** section, **Peers** section.

**Header** (`data-room-header`): single row with `data-row="wrap gap-4 align-center"`. Title block: place emoji (`roomIdToPlaceEmoji(roomId)`), `<h1>` room display name, connection status as `data-tag` with `data-connection-status`. Nav: `<a data-button>` links – Room link, Channels, Leave room. No separate “Share” section (room link is in header).

**Layout:** **Me** and **Peers** sections. Each block (Me, each peer) is a row of two columns; each column has `data-row="flexible"` and `data-card`. Left column: avatar + peer details; right column: addresses and verification/actions.

- **Me:** left = Peer (avatar + “Me” details), right = AddressSharing (my addresses + share intent + pending signatures).
- **Peers:** list of PeerCards. Each **PeerCard**: left = Peer (avatar with connection status dot, name, `data-tag` Connected/Disconnected); right = that peer’s shared addresses + verification status and Request/Re-verify actions + “Awaiting your signature” when applicable.

**Share intent (AddressSharing):** My addresses are **draggable**. Drop zones: “All” and one per peer. On drag, **DragArrow** shows from address to current drop target (or pointer); tooltip shows “Share with all” / “Share with &lt;peer&gt;”. Drop performs `shareWithAll` or `shareWithPeer`. Pending signatures section unchanged (Sign when `canSign`, Unverifiable + Mark unverifiable when read-only).

### `src/routes/rooms/Peer.svelte`

Avatar (emoji + hue background), display name. When `showStatus`: connection status as **`data-tag`** (Connected / Disconnected) and a **status dot on the avatar** (green when connected, muted when not); optional “since” / “left” timestamp.

### `src/routes/rooms/PeerList.svelte`

List of peers; each item uses Peer with `showStatus={true}`. Used where a simple peer list is needed (e.g. other views).

### `src/routes/rooms/AddressSharing.svelte`

**Share intent:** Addresses from selected wallets; each address is draggable unless already “Shared with all”. Drop zones: “Share with:” then [All] and one button per peer. MIME `application/x-room-share` with JSON `{ address, roomId }`. On drag, local state tracks source rect and drop target (or pointer); **DragArrow** with tooltip “Share with all” / “Share with &lt;peer&gt;”. On drop, call `shareWithAll(address)` or `shareWithPeer(address, peerId)`. **Pending signatures** section: list of challenges for me to sign; only show Sign when wallet supports signing (EIP-1193); otherwise Unverifiable + Mark unverifiable.

### `src/routes/rooms/SharedAddresses.svelte`

Standalone component that lists shared addresses from others in the room with verification status. Not used on the main room page (per-peer addresses live in PeerCard); may be used on account or other pages.

### `src/routes/rooms/PeerCard.svelte`

Per-peer card: two columns (`data-row="flexible" data-card`). Left: Peer (avatar with status dot, name, Connected/Disconnected tag). Right: that peer’s shared addresses (visible to me) with verification status and Request verification / Re-verify buttons; plus “Awaiting your signature” block when there are pending challenges for me to sign.

## Verification flow

Peers may **request verification as many times as they want** (e.g. re-request
after expiry or to refresh). Each request creates/updates a verification record
with status Unverifiable, Verifying, or Verified; when Verified, **verifiedAt**
and **signature** are persisted in `verificationsCollection`.

### Sequence diagram

```
Sharer                    Server                    Peer A                   Peer B
   |                         |                         |                        |
   |-- share-address(0x123) ->|  (or targetPeerIds)     |                        |
   |                         |-- request-challenge --->|  (Peer A can repeat)  |
   |                         |-- request-challenge --------------------------->|
   |                         |                         |                        |
   |                         |<-- challenge(nonceA) ---|                        |
   |                         |<-- challenge(nonceB) ---------------------------|
   |                         |                         |                        |
   |<-- challenge(nonceA) ---|                         |                        |
   |<-- challenge(nonceB) ---|                         |                        |
   |                         |                         |                        |
   |  [signs if EIP-1193]    |  (read-only → unverifiable)                     |
   |                         |                         |                        |
   |-- submit-sig(A, sigA) ->|                         |                        |
   |-- submit-sig(B, sigB) ->|                         |                        |
   |                         |-- verification-record ->| (verifiedAt, signature)|
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
- [x] `partykitRoomsCollection` in `src/collections/PartykitRooms.ts`
- [x] `roomPeersCollection` in `src/collections/room-peers.ts`
- [x] `sharedAddressesCollection` in `src/collections/shared-addresses.ts`
- [x] `siweChallengesCollection` in `src/collections/siwe-challenges.ts`
- [x] `verificationsCollection` in `src/collections/verifications.ts` (separate from shared-addresses; stores status, verifiedAt, signature; peers may request multiple times)
- [x] Unit tests for collection normalizers

### PartyKit server
- [x] `partykit/room.ts` handles room lifecycle
- [x] Peer join/leave broadcasts to room
- [x] Challenge generation with unique nonce
- [x] Signature verification on server
- [x] State sync on connect

### Client API
- [x] `src/lib/partykit.ts` with `connectToRoom`, `createRoom`
- [x] `src/lib/rooms/siwe.ts` with `createSiweMessage`, `signSiweMessage`, `verifySiweSignature`
- [x] SIWE signing via Voltaire `personal_sign`
- [x] Signature recovery via Voltaire `recoverAddress`

### State management
- [x] `src/state/room.svelte.ts` with reactive room state
- [x] `joinRoom`, `leaveRoom` actions
- [x] Server message handler updates collections

### UI
- [x] `src/routes/rooms/+page.svelte` – lobby
- [x] `src/routes/rooms/[roomId]/+page.svelte` – room view with header (place emoji, title, connection status tag, Room link / Channels / Leave room), Me + Peers sections, two-column cards
- [x] Peer list / PeerCard with connection status (`data-tag` Connected/Disconnected, status dot on avatar)
- [x] **Share intent** – draggable addresses, drop zones (All + per peer), DragArrow during drag, drop performs share (no Share buttons)
- [x] Pending challenge signing UI – **only show Sign when** wallet supports signing (EIP-1193); show Unverifiable + Mark unverifiable for read-only
- [x] Per-peer shared addresses and verification in PeerCard – **Unverifiable**, **Verifying**, **Verified**; **date** (`verifiedAt`) and **signature** (persisted)
- [x] Navigation link; room nav items use place emoji (`roomIdToPlaceEmoji`); persistent peer ID across refresh

### Verification flow
- [x] Per-peer challenge generation
- [x] Sharer signs each peer's challenge (when wallet can sign)
- [x] **Peers may request verification as many times as they want**
- [x] Peers validate signatures
- [x] Verification records in **separate** `verificationsCollection` with status, **verifiedAt**, **signature**
- [x] Challenge expiration enforced

## Status

Complete. 2026-02-05: All acceptance criteria implemented. UI updated: room page header (place emoji, title, connection status as data-tag, data-button links); Me and Peers sections with two-column cards (avatar+details left, addresses+verification right); share intent via drag-and-drop (draggable addresses, drop zones All/peer, DragArrow); Peer/PeerCard use data-tag for connection state and status dot on avatar; roomIdToPlaceEmoji for nav and header; persistent peer ID (localStorage) so refresh reuses identity. verificationsCollection, SharedAddress targetPeerIds, PartyKit flow, AddressSharing (share intent + pending signatures), PeerCard verification UI as previously implemented.

## Output when complete

`DONE`
