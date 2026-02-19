# Spec 088: Entity view restructure

Restructure all single-entity pages to use a shared `<EntityView>` component with a
consistent layout. Introduce `<Heading>` for dynamic heading levels. Use view components
(NetworkName, CoinName, CoinAmount, etc.) for entity titles. Add `<EntityList>` for entity lists with
correct heading hierarchy.

## Scope

### EntityView component

`<EntityView>` accepts:
- `entityType: EntityType`
- `entity?: Entity` — optional when loading
- `idSerialized: string`
- `href: string`
- `label: string`
- `layout?: EntityLayout` (default `Page`)
- `metadata?: Array<{ term: string; detail: string }>` — optional definition list
- `annotation?: string` — override entity type label
- `anchorTitle?: boolean` — wrap title in anchor to `#entityType:idSerialized`
- `title?: Snippet` — override label with custom title (e.g. NetworkName, CoinName)
- `AfterTitle?: Snippet` — after title (e.g. tag)
- `BeforeAnnotation?: Snippet`
- `children?: Snippet`

Renders:
- `<article id="{entityType}:{idSerialized}">` wrapping a `<details>`
- Summary row: left (title/anchor + AfterTitle + watch) | right (annotation)
- Optional `<dl data-definition-list="horizontal">` with metadata
- Default slot for body content

### EntityLayout enum

```ts
enum EntityLayout {
	Page,        // full page layout
	PageSection, // section within a page
}
```

### Heading system

- **HeadingLevelProvider** — provides `headingLevel` context; children get level + 1
- **Heading** — renders `<h1>`–`<h6>` or `role="heading" aria-level={n}` based on context level
- EntityView wraps content in HeadingLevelProvider

### Title snippets with view components

Entity pages use view components in `title` snippets:
- Network: `<NetworkName {chainId} />`
- Block: `<BlockNumber />` + `<NetworkName showIcon={false} />`
- Transaction: `<EvmTransactionId />` + `<NetworkName showIcon={false} />`
- Coin: `<CoinName coin={coin} />` (use `<CoinAmount coin={coin} amount={...} />` when amount is shown)

Networks and coins list pages use view components in list items (NetworkName, CoinName).

### EntityList component

`<EntityList>` wraps `<ItemsListView>` and uses the Heading system:
- Same props as ItemsListView (title, loaded, total, items, getKey, getSortValue, Item, etc.)
- Title renders via `<Heading>` (respects context level) when `Title` snippet not provided
- Wraps in `HeadingLevelProvider` so list title gets correct subordinate level
- Used for Blocks, Transactions, Events lists

### Definition list style

`[data-definition-list="horizontal"]` — dt/dd inline.

### Block explorer links

Internal app paths only. `getTxPath`, `getBlockPath`, `getAccountPath` in `$/constants/networks.ts`. No external explorer links.

## Implementation

### Pages refactored

- `/account/[address]` — Actor, EvmActor title
- `/network/[name]` — Network, NetworkName title
- `/network/[name]/block/[blockNumber]` — Block, BlockNumber + NetworkName title
- `/network/[name]/transaction/[transactionId]` — Transaction, EvmTransactionId + NetworkName title
- `/network/[name]/block/[blockNumber]/transaction/[transactionId]` — Transaction, same
- `/coin/[symbol]` — Coin, CoinName title
- `/coins` — CoinName in list items
- `/networks` — NetworkName in list items
- `/agents/[nodeId]` — AgentChatTree
- `/rooms/[roomId]` — Room
- `/session/[id]` — Session (via Session.svelte)

### Components using EntityList

- **Network.svelte** — Blocks list (compact and full modes)
- **Block.svelte** — Transactions list
- **Transaction.svelte** — Events list

Query logic (live queries, placeholder handling, fetchBlockTransactions, fetchNetworkTransaction) preserved.

## Non-goals

- Changing route structure or data loading
- Modifying query/collection logic

## Acceptance criteria

- [x] `EntityLayout` enum exists
- [x] `<Heading>` renders correct h# level from context
- [x] `<EntityView>` renders article with id, details/summary, optional metadata
- [x] `[data-definition-list="horizontal"]` styles dt/dd inline
- [x] Account page uses EntityView with EvmActor title
- [x] Network page uses EntityView with NetworkName title
- [x] Block page uses EntityView with BlockNumber + NetworkName title
- [x] Transaction pages use EntityView with EvmTransactionId + NetworkName title
- [x] Coin page uses EntityView with CoinName title
- [x] Networks list uses NetworkName; coins list uses CoinName
- [x] Agents, Rooms, Session pages use EntityView
- [x] `<EntityList>` wraps ItemsListView, uses Heading for title, wraps in HeadingLevelProvider
- [x] Network uses EntityList for Blocks
- [x] Block uses EntityList for Transactions
- [x] Transaction uses EntityList for Events
- [x] Existing query logic preserved

## Status

Complete. EntityView, HeadingLevelProvider, Heading, EntityList, view components (NetworkName, CoinName, CoinAmount), path helpers in networks.ts. All entity pages refactored. Blocks/Transactions/Events use EntityList.
