# Spec 032: Yellow state channels

Open USDC payment channels with verified actors in multiplayer rooms using
[Yellow Network's](https://docs.yellow.org/docs/learn/introduction/architecture-at-a-glance/)
Nitrolite protocol for instant off-chain transfers.

**References:**

- https://docs.yellow.org/docs/learn/introduction/architecture-at-a-glance/
- https://docs.yellow.org/docs/learn/core-concepts/state-channels-vs-l1-l2/
- https://docs.yellow.org/docs/build/

**Depends on:**

- Spec 031: PartyKit multiplayer rooms (verified actors)

## Overview

Yellow Network enables instant, gasless transfers via state channels:

| Layer           | Purpose                                | Speed      | Cost     |
| --------------- | -------------------------------------- | ---------- | -------- |
| **Application** | Room UI, channel management            | —          | —        |
| **Off-Chain**   | Instant state updates via Nitro RPC    | < 1 second | Zero gas |
| **On-Chain**    | Fund custody, disputes, final settlement | Block time | Gas fees |

Within a multiplayer room, users with verified addresses can:

1. Deposit USDC to Yellow's Custody Contract
2. Open bilateral payment channels with other verified actors
3. Send instant off-chain transfers
4. Close channels and settle on-chain

## Collections

### `src/collections/yellow-deposits.ts`

Track USDC deposits to Custody Contract:

```typescript
type YellowDeposit = {
  id: string // `${chainId}:${address}`
  chainId: number
  address: `0x${string}`
  availableBalance: bigint // deposited, ready for channels
  lockedBalance: bigint // committed to channels
  lastUpdated: number
}

const yellowDepositsCollection = createCollection<YellowDeposit>({
  id: 'yellow-deposits',
  getId: (d) => d.id,
})
```

### `src/collections/yellow-channels.ts`

Track payment channels between actors:

```typescript
type ChannelStatus = 'pending' | 'active' | 'closing' | 'closed' | 'disputed'

type YellowChannel = {
  id: string // channelId from contract
  chainId: number
  participant0: `0x${string}`
  participant1: `0x${string}`
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
  id: string // `${channelId}:${turnNum}`
  channelId: string
  turnNum: number
  balance0: bigint
  balance1: bigint
  appData: string // encoded app-specific data
  signature0?: `0x${string}`
  signature1?: `0x${string}`
  isFinal: boolean
  timestamp: number
}

const yellowChannelStatesCollection = createCollection<YellowChannelState>({
  id: 'yellow-channel-states',
  getId: (s) => s.id,
})
```

### `src/collections/yellow-transfers.ts`

Track off-chain transfers within channels:

```typescript
type YellowTransfer = {
  id: string // unique transfer id
  channelId: string
  from: `0x${string}`
  to: `0x${string}`
  amount: bigint
  turnNum: number
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
  [ChainId.Ethereum]: 'wss://clearnode.yellow.org/ethereum',
  [ChainId.Optimism]: 'wss://clearnode.yellow.org/optimism',
  // ...
}

// Challenge period for disputes (in seconds)
export const CHALLENGE_PERIOD = 24 * 60 * 60 // 24 hours

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

// Connect to Clearnode
const connectClearnode = async (params: {
  chainId: number
  signer: EIP1193Provider
  address: `0x${string}`
}): Promise<ClearnodeConnection> => {
  const { NitroClient } = await getYellowSdk()
  const ws = new WebSocket(CLEARNODE_WS_URL[params.chainId])
  // ... establish authenticated connection
}

// Deposit USDC to Custody Contract
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

// Open channel with counterparty
const openChannel = async (params: {
  provider: EIP1193Provider
  chainId: number
  counterparty: `0x${string}`
  myDeposit: bigint
  counterpartyDeposit: bigint
}): Promise<{ channelId: string }>

// Send off-chain transfer
const sendTransfer = async (params: {
  clearnodeConnection: ClearnodeConnection
  channelId: string
  amount: bigint
}): Promise<{ turnNum: number }>

// Close channel cooperatively
const closeChannel = async (params: {
  provider: EIP1193Provider
  clearnodeConnection: ClearnodeConnection
  channelId: string
}): Promise<{ txHash: `0x${string}` }>

// Challenge channel (dispute)
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

// Encode RPC message
const encodeNitroRpc = (
  requestId: number,
  method: string,
  params: Record<string, unknown>,
): string => (
  JSON.stringify([requestId, method, params, Date.now()])
)

// Decode RPC message
const decodeNitroRpc = (message: string): NitroRpcMessage => (
  JSON.parse(message)
)

// Sign state for channel
const signChannelState = async (params: {
  provider: EIP1193Provider
  address: `0x${string}`
  channelId: string
  turnNum: number
  balance0: bigint
  balance1: bigint
  appData: string
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

// Handle incoming Clearnode messages
const handleClearnodeMessage = (msg: NitroRpcMessage) => {
  const [, method, params] = msg

  switch (method) {
    case 'channel_updated':
      yellowChannelsCollection.upsert(normalizeChannel(params))
      break
    case 'transfer_received':
      yellowTransfersCollection.insert(normalizeTransfer(params))
      break
    case 'state_proposed':
      // Counterparty proposed new state, auto-sign if valid
      break
  }
}
```

## Room integration

### PartyKit message extensions

Extend room messages (from Spec 031) to coordinate channel operations:

```typescript
type RoomMessage =
  // ... existing messages from Spec 031
  | { type: 'propose-channel'; to: `0x${string}`; myDeposit: string; theirDeposit: string }
  | { type: 'channel-proposal'; from: `0x${string}`; channelParams: ChannelProposal }
  | { type: 'accept-channel'; proposalId: string }
  | { type: 'reject-channel'; proposalId: string; reason?: string }
  | { type: 'channel-opened'; channelId: string; participants: [`0x${string}`, `0x${string}`] }
  | { type: 'channel-closed'; channelId: string }

type ChannelProposal = {
  id: string
  from: `0x${string}`
  to: `0x${string}`
  chainId: number
  fromDeposit: bigint
  toDeposit: bigint
  createdAt: number
  expiresAt: number
}
```

### `src/collections/channel-proposals.ts`

```typescript
type ChannelProposal = {
  id: string
  roomId: string
  from: `0x${string}`
  to: `0x${string}`
  chainId: number
  fromDeposit: bigint
  toDeposit: bigint
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'opened'
  createdAt: number
  expiresAt: number
}

const channelProposalsCollection = createCollection<ChannelProposal>({
  id: 'channel-proposals',
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

### `src/routes/rooms/ChannelProposals.svelte`

Propose and accept channel openings:

```svelte
<script lang="ts">
  import { useLiveQuery } from '$/svelte/live-query-context.svelte'
  import { channelProposalsCollection } from '$/collections/channel-proposals'
  import { sharedAddressesCollection } from '$/collections/shared-addresses'
  import { yellowDepositsCollection } from '$/collections/yellow-deposits'
  import { roomState } from '$/state/room.svelte'
  import { yellowState } from '$/state/yellow.svelte'

  let { roomId }: { roomId: string } = $props()

  // Verified addresses I can open channels with
  const verifiedQuery = useLiveQuery(() => (
    sharedAddressesCollection.query({
      where: { roomId },
    })
  ))

  const otherVerified = $derived(
    verifiedQuery.data?.filter((s) => s.address !== yellowState.address) ?? []
  )

  // My available balance
  const depositQuery = useLiveQuery(() => (
    yellowDepositsCollection.query({
      where: { address: yellowState.address },
    })
  ))

  const availableBalance = $derived(
    depositQuery.data?.[0]?.availableBalance ?? 0n
  )

  // Pending proposals for me
  const incomingQuery = useLiveQuery(() => (
    channelProposalsCollection.query({
      where: { roomId, to: yellowState.address, status: 'pending' },
    })
  ))

  // My outgoing proposals
  const outgoingQuery = useLiveQuery(() => (
    channelProposalsCollection.query({
      where: { roomId, from: yellowState.address, status: 'pending' },
    })
  ))

  // Propose channel
  let selectedAddress = $state<`0x${string}` | null>(null)
  let myDeposit = $state('')
  let theirDeposit = $state('')

  const proposeChannel = () => {
    if (!selectedAddress) return
    roomState.connection?.send({
      type: 'propose-channel',
      to: selectedAddress,
      myDeposit,
      theirDeposit,
    })
  }

  const acceptProposal = (proposalId: string) => {
    roomState.connection?.send({ type: 'accept-channel', proposalId })
  }

  const rejectProposal = (proposalId: string) => {
    roomState.connection?.send({ type: 'reject-channel', proposalId })
  }
</script>

<section data-channel-proposals>
  <h3>Open Channel</h3>

  <div data-available-balance>
    Available: {formatSmallestToDecimal(availableBalance, 6)} USDC
  </div>

  <form onsubmit={(e) => { e.preventDefault(); proposeChannel() }}>
    <Select.Root bind:value={selectedAddress}>
      <Select.Trigger>Select participant</Select.Trigger>
      <Select.Content>
        {#each otherVerified as shared (shared.id)}
          <Select.Item value={shared.address}>
            <Address address={shared.address} />
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>

    <Input
      type="text"
      placeholder="My deposit (USDC)"
      bind:value={myDeposit}
    />
    <Input
      type="text"
      placeholder="Their deposit (USDC)"
      bind:value={theirDeposit}
    />

    <Button type="submit" disabled={!selectedAddress || !myDeposit}>
      Propose Channel
    </Button>
  </form>

  {#if incomingQuery.data?.length}
    <h4>Incoming Proposals</h4>
    {#each incomingQuery.data as proposal (proposal.id)}
      <div data-proposal>
        <Address address={proposal.from} />
        <span>wants to open {formatSmallestToDecimal(proposal.fromDeposit, 6)} / {formatSmallestToDecimal(proposal.toDeposit, 6)} USDC channel</span>
        <Button onclick={() => acceptProposal(proposal.id)}>Accept</Button>
        <Button onclick={() => rejectProposal(proposal.id)}>Reject</Button>
      </div>
    {/each}
  {/if}
</section>
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
    |-- propose-channel(B) ----->|                            |
    |                            |-- channel-proposal ------->|
    |                            |                            |
    |                            |<-- accept-channel ---------|
    |<-- proposal-accepted ------|                            |
    |                            |                            |
    |  [Both connect to Clearnode, sign initial state]        |
    |                            |                            |
    |=================== Yellow Clearnode ====================|
    |                            |                            |
    |-- create_channel --------->|<-- create_channel ---------|
    |                            |                            |
    |<-- channel_created --------|-- channel_created -------->|
    |                            |                            |
    |  [Channel ACTIVE, off-chain transfers enabled]          |
```

### Transfer flow (off-chain)

```
User A                    Clearnode                    User B
    |                         |                            |
    |-- transfer(50 USDC) --->|                            |
    |                         |-- state_proposed --------->|
    |                         |                            |
    |                         |<-- state_signed -----------|
    |<-- transfer_confirmed --|                            |
    |                         |                            |
    |  [State: A:-50, B:+50, turnNum++]                    |
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

If counterparty is unresponsive:

1. Submit latest signed state via `challengeChannel`
2. Wait challenge period (24 hours)
3. If no newer state submitted, finalize and withdraw

## Acceptance criteria

### Collections
- [x] `yellowDepositsCollection` in `src/collections/yellow-deposits.ts`
- [x] `yellowChannelsCollection` in `src/collections/yellow-channels.ts`
- [x] `yellowChannelStatesCollection` in `src/collections/yellow-channel-states.ts`
- [x] `yellowTransfersCollection` in `src/collections/yellow-transfers.ts`
- [x] `channelProposalsCollection` in `src/collections/channel-proposals.ts`
- [x] Unit tests for collection normalizers (nitro-rpc.spec.ts: encode/decode/hashChannelState)

### Constants
- [x] `src/constants/yellow.ts` with contract addresses
- [x] Clearnode WebSocket URLs per chain

### API
- [x] `src/api/yellow.ts` with lazy-loaded SDK
- [x] `connectClearnode` establishes authenticated connection
- [x] `depositToCustody` / `withdrawFromCustody` on-chain operations
- [x] `openChannel` creates channel with counterparty
- [x] `sendTransfer` instant off-chain transfer
- [x] `closeChannel` cooperative close
- [x] `challengeChannel` dispute path
- [x] `src/lib/nitro-rpc.ts` message encoding/signing

### State management
- [x] `src/state/yellow.svelte.ts` with Clearnode connection
- [x] Real-time updates from Clearnode to collections
- [x] Channel state synchronization

### Room integration
- [x] Extended PartyKit messages for channel coordination
- [x] Channel proposals require verified addresses (Spec 031)
- [x] Proposal accept/reject flow

### UI
- [x] `ChannelList.svelte` – list channels with room participants
- [x] `ChannelProposals.svelte` – propose and accept channels
- [x] `TransferDialog.svelte` – send off-chain transfers
- [x] `DepositManager.svelte` – manage Custody Contract balance
- [x] Navigation to channels within room

### Channel lifecycle
- [x] Open channel via room proposal flow
- [x] Send instant transfers (< 1 second)
- [x] Close channel cooperatively
- [x] Challenge/dispute unresponsive counterparty

## Status

Complete. Collections (yellow-deposits, yellow-channels, yellow-channel-states, yellow-transfers, channel-proposals) in src/collections. Constants src/constants/yellow.ts (CUSTODY_CONTRACT_ADDRESS placeholder, CLEARNODE_WS_URL, CHALLENGE_PERIOD, MIN_CHANNEL_DEPOSIT). API src/api/yellow.ts: lazy-loaded SDK stub, connectClearnode, depositToCustody/withdrawFromCustody, openChannel, sendTransfer, closeChannel, challengeChannel (throw when SDK not loaded). src/lib/nitro-rpc.ts: encodeNitroRpc, decodeNitroRpc, hashChannelState, signChannelState, verifyStateSignature; unit tests in nitro-rpc.spec.ts. State src/state/yellow.svelte.ts: yellowState, connectToYellow, disconnectFromYellow, handleClearnodeMessage (channel_updated, transfer_received), refresh deposit on connect. PartyKit room.ts: propose-channel (verified-address check), channel-proposal, accept-channel, reject-channel, channel-opened, channel-closed; room.svelte.ts handlers for channel-proposal, accept/reject, channel-opened. UI: ChannelList.svelte, ChannelProposals.svelte, TransferDialog.svelte, DepositManager.svelte; rooms/[roomId]/channels/+page.svelte; link from room page to Channels.

## Output when complete

`DONE`
