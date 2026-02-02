# Spec 032: Yellow state channels

Open USDC payment channels with verified actors in multiplayer rooms using
Yellow Network's Nitrolite protocol for instant off-chain transfers and unified
balance settlement via clearnodes.

**References:**

- https://docs.yellow.org/yellow-network/architecture-and-design/smart-clearing-protocol
- https://docs.yellow.org/docs/protocol/on-chain/channel-lifecycle
- https://docs.yellow.org/docs/protocol/on-chain/data-structures
- https://docs.yellow.org/docs/protocol/off-chain/overview
- https://docs.yellow.org/docs/protocol/off-chain/message-format
- https://docs.yellow.org/docs/protocol/off-chain/channel-methods
- https://docs.yellow.org/docs/protocol/glossary
- https://docs.yellow.org/docs/build/quick-start/

**Depends on:**

- Spec 031: PartyKit multiplayer rooms (verified actors)

## Overview

Yellow Network provides state-channel-backed unified balances through clearnodes.
Clients authenticate via Nitro RPC, open a payment channel with a clearnode, and
then move funds off-chain with instant finality.

| Layer           | Purpose                                     | Speed      | Cost     |
| --------------- | ------------------------------------------- | ---------- | -------- |
| **Application** | Room UI, session orchestration, UX          | —          | —        |
| **Off-Chain**   | Nitro RPC (auth, channel ops, transfers)    | < 1 second | Zero gas |
| **On-Chain**    | Custody, disputes, final settlement         | Block time | Gas fees |

Within a multiplayer room, users with verified addresses can:

1. Authenticate with a clearnode (session keys)
2. Create a payment channel with the clearnode (`create_channel` + on-chain `create`)
3. Fund/resize the channel (`resize_channel`)
4. Send instant transfers (`transfer`) to other verified actors
5. Close channels cooperatively (`close_channel`) or via challenge on-chain

## Collections

### `src/collections/yellow-deposits.ts`

Track unified balance and channel-locked balances:

```typescript
type YellowDeposit = {
  id: string // `${chainId}:${address}`
  chainId: number
  address: `0x${string}`
  availableBalance: bigint // unified balance
  lockedBalance: bigint // locked in channels / escrow
  lastUpdated: number
}

const yellowDepositsCollection = createCollection<YellowDeposit>({
  id: 'yellow-deposits',
  getId: (d) => d.id,
})
```

### `src/collections/yellow-channels.ts`

Track payment channels (user <-> clearnode):

```typescript
type ChannelStatus =
  | 'void'
  | 'initial'
  | 'active'
  | 'dispute'
  | 'final'
  | 'closing'

type YellowChannel = {
  id: string // channelId from contract
  chainId: number
  participant0: `0x${string}` // user
  participant1: `0x${string}` // clearnode
  asset: `0x${string}` // USDC address
  totalDeposited: bigint
  balance0: bigint // participant0's current balance
  balance1: bigint // participant1's current balance
  turnNum: number // state version
  status: ChannelStatus
  roomId?: string // associated room
  createdAt: number
  updatedAt: number
}

const yellowChannelsCollection = createCollection<YellowChannel>({
  id: 'yellow-channels',
  getId: (ch) => ch.id,
})
```

### `src/collections/yellow-channel-states.ts`

Track signed state updates:

```typescript
type YellowChannelState = {
  id: string // `${channelId}:${version}`
  channelId: `0x${string}`
  intent: number
  version: number
  stateData: `0x${string}`
  allocations: {
    destination: `0x${string}`
    token: `0x${string}`
    amount: bigint
  }[]
  signatures: `0x${string}`[]
  isFinal: boolean
  timestamp: number
}

const yellowChannelStatesCollection = createCollection<YellowChannelState>({
  id: 'yellow-channel-states',
  getId: (s) => s.id,
})
```

### `src/collections/yellow-transfers.ts`

Track off-chain transfers (unified balance):

```typescript
type YellowTransfer = {
  id: string // unique transfer id
  channelId?: string
  from: `0x${string}`
  to: `0x${string}`
  amount: bigint
  turnNum?: number
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
}

const yellowTransfersCollection = createCollection<YellowTransfer>({
  id: 'yellow-transfers',
  getId: (t) => t.id,
})
```

## Constants

### `src/constants/yellow.ts`

```typescript
import { ChainId } from '$/constants/networks'

// Custody Contract addresses per chain
export const CUSTODY_CONTRACT_ADDRESS: Record<number, `0x${string}`> = {
  [ChainId.Ethereum]: '0x...', // TODO: populate from Yellow docs
  [ChainId.Optimism]: '0x...',
  [ChainId.Arbitrum]: '0x...',
  [ChainId.Base]: '0x...',
}

// Clearnode WebSocket endpoints
export const CLEARNODE_WS_URL: Record<number, string> = {
  [ChainId.Ethereum]: 'wss://clearnet.yellow.com/ws',
  [ChainId.Optimism]: 'wss://clearnet.yellow.com/ws',
  // ...
}

// Challenge period for disputes (in seconds)
export const CHALLENGE_PERIOD = 60 * 60 // 1 hour minimum

// Minimum channel funding
export const MIN_CHANNEL_DEPOSIT = 10n * 10n ** 6n // 10 USDC
```

## API

### `src/api/yellow.ts`

Lazy-load Yellow SDK and provide channel operations:

```typescript
// Lazy load SDK
const getYellowSdk = async () => {
  const { NitroClient, ... } = await import('@aspect-fi/nitrolite-sdk')
  return { NitroClient, ... }
}

// Connect to Clearnode (Nitro RPC: auth_request -> auth_challenge -> auth_verify)
const connectClearnode = async (params: {
  chainId: number
  signer: EIP1193Provider
  address: `0x${string}`
}): Promise<ClearnodeConnection> => {
  const { NitroClient } = await getYellowSdk()
  const ws = new WebSocket(CLEARNODE_WS_URL[params.chainId])
  // ... establish authenticated connection
}

// Deposit USDC to Custody Contract (optional; most funding uses resize_channel)
const depositToCustody = async (params: {
  provider: EIP1193Provider
  chainId: number
  amount: bigint
}): Promise<{ txHash: `0x${string}` }>

// Withdraw from Custody Contract
const withdrawFromCustody = async (params: {
  provider: EIP1193Provider
  chainId: number
  amount: bigint
}): Promise<{ txHash: `0x${string}` }>

// Get available balance
const getAvailableBalance = async (params: {
  chainId: number
  address: `0x${string}`
}): Promise<bigint>

// Open channel with clearnode (create_channel -> on-chain create)
const openChannel = async (params: {
  provider: EIP1193Provider
  chainId: number
  token: `0x${string}`
}): Promise<{ channelId: string }>

// Send off-chain transfer (unified balance)
const sendTransfer = async (params: {
  clearnodeConnection: ClearnodeConnection
  destination: `0x${string}`
  allocations: { asset: string; amount: string }[]
}): Promise<{ turnNum: number }>

// Close channel cooperatively
const closeChannel = async (params: {
  provider: EIP1193Provider
  clearnodeConnection: ClearnodeConnection
  channelId: string
}): Promise<{ txHash: `0x${string}` }>

// Challenge channel (dispute on-chain)
const challengeChannel = async (params: {
  provider: EIP1193Provider
  channelId: string
  latestState: YellowChannelState
}): Promise<{ txHash: `0x${string}` }>
```

### `src/lib/nitro-rpc.ts`

Nitro RPC message handling:

```typescript
// Nitro RPC compact format: [requestId, method, params, timestamp]
type NitroRpcMessage = [number, string, Record<string, unknown>, number]

// Encode RPC message (req/sig envelope)
const encodeNitroRpc = (
  requestId: number,
  method: string,
  params: Record<string, unknown>,
): string => (
  JSON.stringify({
    req: [requestId, method, params, Date.now()],
    sig: [],
  })
)

// Decode RPC message (req/res envelope)
const decodeNitroRpc = (message: string): NitroRpcMessage => {
  const parsed = JSON.parse(message) as { req?: NitroRpcMessage; res?: NitroRpcMessage }
  return parsed.req ?? parsed.res ?? parsed
}

// Sign state for channel (packedState)
const signChannelState = async (params: {
  provider: EIP1193Provider
  address: `0x${string}`
  channelId: `0x${string}`
  intent: number
  version: number
  stateData: `0x${string}`
  allocations: YellowChannelAllocation[]
}): Promise<`0x${string}`> => {
  const stateHash = hashChannelState(params)
  return await params.provider.request({
    method: 'personal_sign',
    params: [stateHash, params.address],
  })
}

// Verify counterparty signature
const verifyStateSignature = async (params: {
  state: YellowChannelState
  signature: `0x${string}`
  expectedSigner: `0x${string}`
}): Promise<boolean>
```

## State management

### `src/state/yellow.svelte.ts`

```typescript
import { yellowDepositsCollection } from '$/collections/yellow-deposits'
import { yellowChannelsCollection } from '$/collections/yellow-channels'
import { yellowTransfersCollection } from '$/collections/yellow-transfers'

type YellowState = {
  clearnodeConnection: ClearnodeConnection | null
  chainId: number | null
  address: `0x${string}` | null
}

export const yellowState = $state<YellowState>({
  clearnodeConnection: null,
  chainId: null,
  address: null,
})

// Connect to Clearnode for a chain
export const connectToYellow = async (
  chainId: number,
  provider: EIP1193Provider,
  address: `0x${string}`,
) => {
  const connection = await connectClearnode({ chainId, signer: provider, address })

  connection.onMessage((msg) => {
    handleClearnodeMessage(msg)
  })

  yellowState.clearnodeConnection = connection
  yellowState.chainId = chainId
  yellowState.address = address

  // Fetch initial state
  await refreshDeposits(chainId, address)
  await refreshChannels(chainId, address)
}

export const disconnectFromYellow = () => {
  yellowState.clearnodeConnection?.close()
  yellowState.clearnodeConnection = null
  yellowState.chainId = null
  yellowState.address = null
}

// Handle incoming Clearnode messages (bu, cu, tr)
const handleClearnodeMessage = (msg: NitroRpcMessage) => {
  const [, method, params] = msg

  switch (method) {
    case 'cu':
    case 'channel_updated':
      yellowChannelsCollection.upsert(normalizeChannel(params))
      break
    case 'tr':
    case 'transfer_received':
      yellowTransfersCollection.insert(normalizeTransfer(params))
      break
    case 'bu':
      yellowDepositsCollection.upsert(normalizeBalance(params))
      break
    case 'state_proposed':
      // Counterparty proposed new state, auto-sign if valid
      break
  }
}
```

## Room integration

### PartyKit message extensions

Extend room messages (from Spec 031) to coordinate transfer intent:

```typescript
type RoomMessage =
  // ... existing messages from Spec 031
  | { type: 'propose-transfer'; to: `0x${string}`; allocations: { asset: string; amount: string }[] }
  | { type: 'transfer-request'; from: `0x${string}`; request: TransferRequest }
  | { type: 'accept-transfer'; requestId: string }
  | { type: 'reject-transfer'; requestId: string; reason?: string }
  | { type: 'transfer-sent'; transferId: string }

type TransferRequest = {
  id: string
  from: `0x${string}`
  to: `0x${string}`
  allocations: { asset: string; amount: string }[]
  createdAt: number
  expiresAt: number
}
```

### `src/collections/transfer-requests.ts`

```typescript
type TransferRequest = {
  id: string
  roomId: string
  from: `0x${string}`
  to: `0x${string}`
  allocations: { asset: string; amount: string }[]
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'sent'
  createdAt: number
  expiresAt: number
}

const transferRequestsCollection = createCollection<TransferRequest>({
  id: 'transfer-requests',
  getId: (p) => p.id,
})
```

## UI

### `src/routes/rooms/[roomId]/channels/+page.svelte`

Channel management within a room.

### `src/routes/rooms/ChannelList.svelte`

List channels with room participants:

```svelte
<script lang="ts">
  import { useLiveQuery } from '$/svelte/live-query-context.svelte'
  import { yellowChannelsCollection } from '$/collections/yellow-channels'
  import { sharedAddressesCollection } from '$/collections/shared-addresses'
  import { roomState } from '$/state/room.svelte'
  import { formatSmallestToDecimal } from '$/lib/format'

  let { roomId }: { roomId: string } = $props()

  // Verified addresses in room
  const sharedQuery = useLiveQuery(() => (
    sharedAddressesCollection.query({ where: { roomId } })
  ))

  // My channels
  const channelsQuery = useLiveQuery(() => (
    yellowChannelsCollection.query({
      where: {
        $or: [
          { participant0: yellowState.address },
          { participant1: yellowState.address },
        ],
      },
    })
  ))

  // Filter to channels with room participants
  const roomChannels = $derived(
    channelsQuery.data?.filter((ch) => {
      const addresses = sharedQuery.data?.map((s) => s.address) ?? []
      return (
        addresses.includes(ch.participant0) ||
        addresses.includes(ch.participant1)
      )
    }) ?? []
  )

  const getCounterparty = (channel: YellowChannel) => (
    channel.participant0 === yellowState.address
      ? channel.participant1
      : channel.participant0
  )

  const getMyBalance = (channel: YellowChannel) => (
    channel.participant0 === yellowState.address
      ? channel.balance0
      : channel.balance1
  )
</script>

<section data-channel-list>
  <h3>Payment Channels</h3>

  {#each roomChannels as channel (channel.id)}
    {@const counterparty = getCounterparty(channel)}
    {@const myBalance = getMyBalance(channel)}
    <div data-channel data-status={channel.status}>
      <Address address={counterparty} />
      <span data-balance>
        {formatSmallestToDecimal(myBalance, 6)} USDC
      </span>
      <span data-status>{channel.status}</span>
      {#if channel.status === 'active'}
        <Button onclick={() => openTransferDialog(channel)}>
          Send
        </Button>
      {/if}
    </div>
  {/each}

  {#if roomChannels.length === 0}
    <p>No channels with room participants</p>
  {/if}
</section>
```

### `src/routes/rooms/TransferRequests.svelte`

Propose and accept transfer requests:

```svelte
<script lang="ts">
  import { useLiveQuery } from '$/svelte/live-query-context.svelte'
  import { transferRequestsCollection } from '$/collections/transfer-requests'
  import { sharedAddressesCollection } from '$/collections/shared-addresses'
  import { roomState } from '$/state/room.svelte'
  import { yellowState } from '$/state/yellow.svelte'

  let { roomId }: { roomId: string } = $props()

  const verifiedQuery = useLiveQuery(() => (
    sharedAddressesCollection.query({ where: { roomId } })
  ))

  const otherVerified = $derived(
    verifiedQuery.data?.filter((s) => s.address !== yellowState.address) ?? []
  )

  const incomingQuery = useLiveQuery(() => (
    transferRequestsCollection.query({
      where: { roomId, to: yellowState.address, status: 'pending' },
    })
  ))

  const outgoingQuery = useLiveQuery(() => (
    transferRequestsCollection.query({
      where: { roomId, from: yellowState.address, status: 'pending' },
    })
  ))

  let selectedAddress = $state<`0x${string}` | null>(null)
  let amount = $state('')

  const proposeTransfer = () => {
    if (!selectedAddress) return
    roomState.connection?.send({
      type: 'propose-transfer',
      to: selectedAddress,
      allocations: [{ asset: 'usdc', amount }],
    })
  }

  const acceptRequest = (requestId: string) => {
    roomState.connection?.send({ type: 'accept-transfer', requestId })
  }

  const rejectRequest = (requestId: string) => {
    roomState.connection?.send({ type: 'reject-transfer', requestId })
  }
</script>
```

### `src/routes/rooms/TransferDialog.svelte`

Send off-chain transfer:

```svelte
<script lang="ts">
  import { Dialog } from 'bits-ui'
  import { yellowState } from '$/state/yellow.svelte'
  import { sendTransfer } from '$/api/yellow'
  import { parseDecimalToSmallest, formatSmallestToDecimal } from '$/lib/format'

  let {
    channel,
    open = $bindable(false),
  }: {
    channel: YellowChannel
    open: boolean
  } = $props()

  let amount = $state('')
  let sending = $state(false)
  let error = $state<string | null>(null)

  const myBalance = $derived(
    channel.participant0 === yellowState.address
      ? channel.balance0
      : channel.balance1
  )

  const handleSend = async () => {
    if (!yellowState.clearnodeConnection) return

    sending = true
    error = null

    try {
      const amountSmallest = parseDecimalToSmallest(amount, 6)

      if (amountSmallest > myBalance) {
        throw new Error('Insufficient channel balance')
      }

      await sendTransfer({
        clearnodeConnection: yellowState.clearnodeConnection,
        channelId: channel.id,
        amount: amountSmallest,
      })

      open = false
      amount = ''
    } catch (e) {
      error = e instanceof Error ? e.message : 'Transfer failed'
    } finally {
      sending = false
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content>
    <Dialog.Title>Send USDC</Dialog.Title>
    <Dialog.Description>
      Instant off-chain transfer to counterparty
    </Dialog.Description>

    <div data-balance>
      Available: {formatSmallestToDecimal(myBalance, 6)} USDC
    </div>

    <Input
      type="text"
      placeholder="Amount (USDC)"
      bind:value={amount}
    />

    {#if error}
      <p data-error role="alert">{error}</p>
    {/if}

    <div data-actions>
      <Button onclick={() => { open = false }}>Cancel</Button>
      <Button onclick={handleSend} disabled={sending || !amount}>
        {sending ? 'Sending...' : 'Send'}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
```

### `src/routes/rooms/DepositManager.svelte`

Manage Custody Contract deposits:

```svelte
<script lang="ts">
  import { useLiveQuery } from '$/svelte/live-query-context.svelte'
  import { yellowDepositsCollection } from '$/collections/yellow-deposits'
  import { actorCoinsCollection } from '$/collections/actor-coins'
  import { yellowState } from '$/state/yellow.svelte'
  import { depositToCustody, withdrawFromCustody } from '$/api/yellow'

  // USDC wallet balance
  const walletBalanceQuery = useLiveQuery(() => (
    actorCoinsCollection.query({
      where: {
        actorId: yellowState.address,
        chainId: yellowState.chainId,
        // filter to USDC
      },
    })
  ))

  // Custody balance
  const depositQuery = useLiveQuery(() => (
    yellowDepositsCollection.query({
      where: {
        chainId: yellowState.chainId,
        address: yellowState.address,
      },
    })
  ))

  let depositAmount = $state('')
  let withdrawAmount = $state('')
  let loading = $state(false)

  const handleDeposit = async () => {
    loading = true
    try {
      await depositToCustody({
        provider,
        chainId: yellowState.chainId!,
        amount: parseDecimalToSmallest(depositAmount, 6),
      })
      depositAmount = ''
    } finally {
      loading = false
    }
  }

  const handleWithdraw = async () => {
    loading = true
    try {
      await withdrawFromCustody({
        provider,
        chainId: yellowState.chainId!,
        amount: parseDecimalToSmallest(withdrawAmount, 6),
      })
      withdrawAmount = ''
    } finally {
      loading = false
    }
  }
</script>

<section data-deposit-manager>
  <h3>Custody Balance</h3>

  <dl>
    <dt>Available</dt>
    <dd>{formatSmallestToDecimal(depositQuery.data?.[0]?.availableBalance ?? 0n, 6)} USDC</dd>

    <dt>Locked in channels</dt>
    <dd>{formatSmallestToDecimal(depositQuery.data?.[0]?.lockedBalance ?? 0n, 6)} USDC</dd>
  </dl>

  <form onsubmit={(e) => { e.preventDefault(); handleDeposit() }}>
    <Input placeholder="Deposit amount" bind:value={depositAmount} />
    <Button type="submit" disabled={loading}>Deposit</Button>
  </form>

  <form onsubmit={(e) => { e.preventDefault(); handleWithdraw() }}>
    <Input placeholder="Withdraw amount" bind:value={withdrawAmount} />
    <Button type="submit" disabled={loading}>Withdraw</Button>
  </form>
</section>
```

## Channel lifecycle

### Opening flow (within room)

```
User A (Room)              PartyKit Server              User B (Room)
    |                            |                            |
    |-- propose-transfer(B) ---->|                            |
    |                            |-- transfer-request ------->|
    |                            |                            |
    |                            |<-- accept-transfer --------|
    |<-- transfer-accepted ------|                            |
    |                            |                            |
    |  [Both connect to Clearnode, authenticate]              |
    |                            |                            |
    |=================== Yellow Clearnode ====================|
    |                            |                            |
    |-- create_channel --------->|                            |
    |<-- create_channel ---------|                            |
    |  [Submit on-chain create()]                             |
    |  [Channel ACTIVE, resize_channel to fund]               |
```

### Transfer flow (off-chain)

```
User A                    Clearnode                    User B
    |                         |                            |
    |-- transfer(allocs) ---->|                            |
    |                         |-- tr notification -------->|
    |<-- transfer_confirmed --|                            |
    |                         |                            |
    |  [Unified balance updated for both parties]         |
```

### Closing flow (cooperative)

```
User A                    Clearnode                    User B
    |                         |                            |
    |-- close_channel ------->|                            |
    |                         |-- close_proposed --------->|
    |                         |                            |
    |                         |<-- close_signed -----------|
    |                         |                            |
    |  [Submit final state on-chain]                       |
    |                         |                            |
    |<-- channel_closed ------|-- channel_closed --------->|
```

### Dispute flow (uncooperative)

If counterparty is unresponsive or disputes:

1. Submit latest signed state via on-chain `challenge`
2. Wait challenge period (>= 1 hour)
3. If no newer state submitted, finalize and withdraw

## Acceptance criteria

### Collections
- [x] `yellowDepositsCollection` in `src/collections/yellow-deposits.ts`
- [x] `yellowChannelsCollection` in `src/collections/yellow-channels.ts`
- [x] `yellowChannelStatesCollection` in `src/collections/yellow-channel-states.ts`
- [x] `yellowTransfersCollection` in `src/collections/yellow-transfers.ts`
- [ ] `transferRequestsCollection` in `src/collections/transfer-requests.ts`
- [x] Unit tests for collection normalizers (nitro-rpc.spec.ts: encode/decode/hashChannelState)

### Constants
- [x] `src/constants/yellow.ts` with contract addresses
- [x] Clearnode WebSocket endpoints (clearnet + sandbox)
- [x] Challenge period default set to 1 hour

### API
- [x] `src/api/yellow.ts` with lazy-loaded SDK
- [ ] `connectClearnode` establishes authenticated connection (auth_request/auth_verify)
- [x] `depositToCustody` / `withdrawFromCustody` on-chain operations
- [ ] `openChannel` uses create_channel + on-chain create flow
- [ ] `resizeChannel` funds/unfunds channel using resize_channel
- [ ] `sendTransfer` uses Nitro RPC transfer (unified balance)
- [ ] `closeChannel` cooperative close
- [ ] `challengeChannel` dispute path
- [x] `src/lib/nitro-rpc.ts` envelope encode/decode + packedState stubs

### State management
- [x] `src/state/yellow.svelte.ts` with Clearnode connection
- [x] Real-time updates from Clearnode to collections (bu, cu, tr)
- [ ] Channel state synchronization (state versions + packedState validation)

### Room integration
- [ ] Extended PartyKit messages for transfer/session coordination
- [x] Verified addresses gating (Spec 031)
- [ ] Proposal accept/reject flow updated for transfers

### UI
- [x] `ChannelList.svelte` – list channels with room participants
- [ ] `TransferRequests.svelte` – propose and accept transfers
- [x] `TransferDialog.svelte` – send off-chain transfers
- [x] `DepositManager.svelte` – manage Custody Contract balance
- [x] Navigation to channels within room

### Channel lifecycle
- [ ] Open channel via create_channel + on-chain create
- [ ] Fund/unfund with resize_channel
- [ ] Send instant transfers (< 1 second)
- [ ] Close channel cooperatively
- [ ] Challenge/dispute unresponsive counterparty

## Status

In progress. Updated specs to match Nitro RPC envelopes, clearnode endpoints, and
channel lifecycle (create_channel + resize_channel). Implementation updated for
Nitro RPC message envelopes and balance notifications; remaining channel ops are
stubbed behind the SDK.

## Output when complete

`DONE`
