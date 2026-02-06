# Spec 030: Uniswap V4 interface

Swap and liquidity interface for Uniswap V4 using TanStack DB collections, sharing
wallet/network infrastructure with the bridge UI.

**References:**

- https://docs.uniswap.org/contracts/v4/overview
- https://github.com/Uniswap/v4-core
- https://github.com/Uniswap/v4-periphery

## Overview

Uniswap V4 introduces:

- **Singleton contract** – all pools in one contract (PoolManager)
- **Hooks** – custom logic at pool lifecycle points
- **Flash accounting** – net token transfers at end of transaction
- **Native ETH support** – direct ETH pairs without WETH
- **Dynamic fees** – hooks can modify swap fees

## Collections

### `src/collections/uniswap-pools.ts`

```typescript
type UniswapPool = {
  id: string // poolId (keccak256 of PoolKey)
  chainId: number
  token0: `0x${string}`
  token1: `0x${string}`
  fee: number // basis points
  tickSpacing: number
  hooks: `0x${string}` // hook contract address (0x0 if none)
  sqrtPriceX96: bigint
  liquidity: bigint
  tick: number
}

const uniswapPoolsCollection = createCollection<UniswapPool>({
  id: 'uniswap-pools',
  getId: (pool) => pool.id,
})
```

### `src/collections/uniswap-positions.ts`

```typescript
type UniswapPosition = {
  id: string // tokenId or composite key
  chainId: number
  poolId: string
  owner: `0x${string}`
  tickLower: number
  tickUpper: number
  liquidity: bigint
  token0Owed: bigint
  token1Owed: bigint
}

const uniswapPositionsCollection = createCollection<UniswapPosition>({
  id: 'uniswap-positions',
  getId: (pos) => pos.id,
})
```

### `src/collections/swap-quotes.ts`

```typescript
type SwapQuote = {
  id: string // hash of params
  chainId: number
  tokenIn: `0x${string}`
  tokenOut: `0x${string}`
  amountIn: bigint
  amountOut: bigint
  priceImpact: number // percentage
  route: SwapRoute[]
  gasEstimate: bigint
  timestamp: number
}

type SwapRoute = {
  poolId: string
  tokenIn: `0x${string}`
  tokenOut: `0x${string}`
  fee: number
}

const swapQuotesCollection = createCollection<SwapQuote>({
  id: 'swap-quotes',
  getId: (quote) => quote.id,
})
```

## API

### `src/api/uniswap.ts`

Lazy-load Uniswap SDK and provide quote/execution functions:

```typescript
// Lazy load SDK
const getUniswapSdk = async () => {
  const { ... } = await import('@uniswap/v4-sdk')
  return { ... }
}

// Fetch pools for a token pair
const fetchPools = async (params: FetchPoolsParams): Promise<UniswapPool[]>

// Fetch positions for an owner on a chain
const fetchPositions = async (params: { chainId: number; owner: `0x${string}` }): Promise<UniswapPosition[]>

// Get swap quote (best route)
const getSwapQuote = async (params: {
  chainId: number
  tokenIn: `0x${string}`
  tokenOut: `0x${string}`
  amountIn: bigint
  slippage: number
}): Promise<SwapQuote>

// Execute swap
const executeSwap = async (params: {
  provider: EIP1193Provider
  quote: SwapQuote
  recipient: `0x${string}`
  deadline: number
  onStatusChange?: (status: SwapStatus) => void
}): Promise<{ txHash: `0x${string}` }>

// Add liquidity
const addLiquidity = async (params: {
  provider: EIP1193Provider
  poolId: string
  tickLower: number
  tickUpper: number
  amount0Desired: bigint
  amount1Desired: bigint
  amount0Min: bigint
  amount1Min: bigint
  recipient: `0x${string}`
  deadline: number
}): Promise<{ txHash: `0x${string}`; tokenId?: bigint }>

// Remove liquidity
const removeLiquidity = async (params: {
  provider: EIP1193Provider
  positionId: string
  liquidity: bigint
  amount0Min: bigint
  amount1Min: bigint
  deadline: number
}): Promise<{ txHash: `0x${string}` }>

// Create pool
const createPool = async (params: CreatePoolParams): Promise<{ txHash: `0x${string}`; poolId?: string }>

// Initialize pool (first liquidity)
const initializePool = async (params: InitializePoolParams): Promise<{ txHash: `0x${string}` }>

// Collect fees from position
const collectFees = async (params: CollectFeesParams): Promise<{ txHash: `0x${string}` }>

// Increase liquidity for position
const increaseLiquidity = async (params: IncreaseLiquidityParams): Promise<{ txHash: `0x${string}` }>
```

Pools for the selected chain and token pair are fetched via `fetchUniswapPools` (in `src/collections/uniswap-pools.ts`) and upserted into `uniswapPoolsCollection` when the liquidity flow has chain and token0/token1 set.

## UI

### Swap route: `/session#swap`

Session page with hash `#swap`; renders `SwapFlow.svelte` and swap action from `src/routes/session/`.

### `src/routes/session/SwapFlow.svelte`

Main swap interface, similar architecture to `BridgeFlow.svelte`:

**State (via `swapSettingsState`):**
- `chainId` – selected chain
- `tokenIn` – input token address
- `tokenOut` – output token address
- `amount` – input amount (human-readable)
- `slippage` – slippage tolerance (default 0.5%)

**Collections used:**
- `useLiveQuery` with `actorCoinsCollection` for balances
- `useLiveQuery` with `swapQuotesCollection` for quotes
- `useLiveQuery` with `actorAllowancesCollection` for approvals

**UI sections:**
1. Chain selector (single chain, not cross-chain)
2. Token input with balance display
3. Swap direction toggle (↕)
4. Token output with estimated amount
5. Price display (rate between tokens)
6. Route visualization (pools used)
7. Price impact warning (if > 1%)
8. Slippage settings (Popover)
9. Swap button with approval flow

### `src/routes/swap/SwapExecution.svelte`

Handles swap execution similar to `BridgeExecution.svelte`:

- `createOptimisticAction` for async execution
- Calls `executeSwap` from `$/api/uniswap`
- Inserts transaction into `transactionsCollection`
- Toast notifications for success/failure

### Add Liquidity (session action)

**Naming:** The action is "Add Liquidity" (not "Manage liquidity"). Navigation and view titles use "Add Liquidity".

**Entry:** Session route `/session#liquidity`; view in `src/view/liquidity.svelte` composing `LiquidityFlow.svelte`.

### `src/routes/liquidity/LiquidityFlow.svelte` (or session `LiquidityFlow.svelte`)

Add-liquidity interface with protocol explicit and clear layout.

**State (via `liquiditySettingsState` / session params):**
- `protocol` – selected protocol id (e.g. `'uniswap-v4'`); single option for now
- `chainId` – selected chain
- `token0` – first token
- `token1` – second token
- `fee` – fee tier selection
- `tickLower` / `tickUpper` – price range

**UI sections (order and layout):**
1. **Protocol selector** – Single choice for now: Uniswap v4. Rendered prominently so the protocol in use is obvious (e.g. card or dropdown; one item: "Uniswap v4"). Extensible for future protocols.
2. **Chain and token pair** – Chain selector, then token0 / token1 inputs (pair selection).
3. **Fee tier** – Selector for 0.01%, 0.05%, 0.3%, 1%.
4. **Price range** – Full range vs concentrated (tick range).
5. **Deposit amounts** – Amount inputs for each token with balance display.
6. **Pool price and position preview** – Current pool price, then position preview.
7. **Add liquidity** – Primary action button.

Layout: group protocol + chain/tokens at top; fee + range next; amounts and preview in a clear block; primary action fixed or at bottom. Use existing card/section patterns; avoid crowding.

### `src/routes/session/Positions.svelte`

Display user's existing positions (used by LiquidityFlow):

- List of positions from `uniswapPositionsCollection` (filtered by chain and owner)
- Position details: pool id, tick range, liquidity
- Actions (when provider and owner are set): **Collect** (collect fees), **Remove** (remove liquidity), **Increase** (inline amount inputs then Add)

## Shared infrastructure

Reuse existing components and utilities:

- `AccountsSelect.svelte` – wallet connection
- `TokenApproval.svelte` – ERC20 approvals (adapt for swap router)
- `actorCoinsCollection` – token balances
- `actorAllowancesCollection` – approval state
- `transactionsCollection` – transaction history
- `bridgeSettingsState` pattern for `swapSettingsState` / `liquiditySettingsState`
- `$/lib/format.ts` – amount formatting
- `$/lib/bridge/errors.ts` – bridge/transaction error categorization
- `$/constants/explorers.ts` – tx links

## Constants

### `src/constants/uniswap.ts`

```typescript
// V4 PoolManager addresses per chain
const POOL_MANAGER_ADDRESS: Record<number, `0x${string}`> = {
  [ChainId.Ethereum]: '0x...',
  [ChainId.Optimism]: '0x...',
  [ChainId.Arbitrum]: '0x...',
  [ChainId.Base]: '0x...',
  // ...
}

// Universal Router addresses
const UNIVERSAL_ROUTER_ADDRESS: Record<number, `0x${string}`> = {
  [ChainId.Ethereum]: '0x...',
  [ChainId.Optimism]: '0x...',
  // ...
}

// Fee tiers (in hundredths of a bip)
const FEE_TIERS = [100, 500, 3000, 10000] as const // 0.01%, 0.05%, 0.3%, 1%

// Default tick spacings per fee
const TICK_SPACINGS: Record<number, number> = {
  100: 1,
  500: 10,
  3000: 60,
  10000: 200,
}
```

## Acceptance criteria

### Collections
- [x] `uniswapPoolsCollection` in `src/collections/uniswap-pools.ts`
- [x] `uniswapPositionsCollection` in `src/collections/uniswap-positions.ts`
- [x] `swapQuotesCollection` in `src/collections/swap-quotes.ts`
- [x] Unit tests for collection normalizers

### API
- [x] `src/api/uniswap.ts` with lazy-loaded SDK
- [x] `fetchPools` / `fetchPositions` return pools and positions (empty when SDK not loaded)
- [x] `getSwapQuote` returns best route and amounts (stub when SDK not loaded)
- [x] `executeSwap` executes via Universal Router
- [x] `addLiquidity` / `removeLiquidity` / `collectFees` / `increaseLiquidity` for position management
- [x] `createPool` / `initializePool` for pool creation (stub when SDK not loaded)
- [x] `fetchUniswapPools` / `fetchUniswapPositions` upsert into collections
- [x] Unit tests for API (fetchPositions, createPool, collectFees, increaseLiquidity, removeLiquidity throw when SDK not loaded)

### Swap UI
- [x] Swap at `/session#swap` renders SwapFlow
- [x] Chain selector (single chain)
- [x] Token input/output with balances
- [x] Swap direction toggle
- [x] Quote fetching with debounce
- [x] Price impact display
- [x] Slippage settings
- [x] Approval flow before swap
- [x] Swap execution with status tracking

### Add Liquidity UI
- [x] Session action "Add Liquidity" at `/session#liquidity` (view: `Liquidity.svelte` + LiquidityFlow)
- [x] Protocol selector with one option: Uniswap v4 (protocol clearly indicated in UI)
- [x] Token pair selection
- [x] Fee tier selector
- [x] Price range selector (full/concentrated)
- [x] Deposit amount inputs
- [x] Add liquidity execution (uses poolId from collection or calls initializePool then addLiquidity; runs in wallet and e2e mode)
- [x] Pools fetched for selected chain/token pair and positions fetched for selected owner/chain
- [x] Position list with Collect, Remove, Increase (inline amount inputs) actions when provider/owner set
- [x] Layout: protocol + chain/tokens grouped at top; fee + range; amounts + preview; primary action

### Integration
- [x] Reuses `AccountsSelect.svelte` for connection
- [x] Reuses `actorCoinsCollection` for balances
- [x] Reuses `transactionsCollection` for history
- [x] Navigation links added to `Navigation.svelte`

## Status

Complete. Full execution path: Add liquidity uses matching pool from `uniswapPoolsCollection` or calls `initializePool` then `addLiquidity`; pools and positions are fetched via `fetchUniswapPools` / `fetchUniswapPositions` when chain and token pair (or owner) are set. Positions.svelte exposes Collect, Remove, and Increase (with inline amount inputs). TokenApproval for swap uses Universal Router. Unit tests: 44 Deno + 106 Vitest passed.

## Output when complete

`DONE`
