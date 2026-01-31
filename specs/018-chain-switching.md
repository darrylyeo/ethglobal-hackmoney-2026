# Spec 018: Wallet chain switching

Ensure the user's wallet is on the correct chain before approving or bridging.
Prompt to switch chains when needed.

## Requirements

1. **Detect current chain:**
   - Get wallet's current chainId via `eth_chainId`
   - Subscribe to chain changes via `chainChanged` event

2. **Chain mismatch handling:**
   - If wallet chain ≠ source chain, show prompt
   - "Switch to {chainName}" button
   - Request chain switch via `wallet_switchEthereumChain`

3. **Auto-add chain if missing:**
   - If switch fails with "chain not found" error
   - Use `wallet_addEthereumChain` to add the chain
   - Retry switch after adding

## Implementation

### Extend `src/lib/wallet.ts`

```typescript
export const getWalletChainId = async (
  provider: EIP1193Provider,
): Promise<number> => {
  const chainIdHex = await provider.request({
    method: 'eth_chainId',
    params: [],
  }) as string
  return parseInt(chainIdHex, 16)
}

export const subscribeChainChanged = (
  provider: EIP1193Provider,
  callback: (chainId: number) => void,
): (() => void) => {
  const handler = (chainIdHex: string) => {
    callback(parseInt(chainIdHex, 16))
  }

  // EIP-1193 event
  if ('on' in provider && typeof provider.on === 'function') {
    provider.on('chainChanged', handler)
    return () => {
      if ('removeListener' in provider && typeof provider.removeListener === 'function') {
        provider.removeListener('chainChanged', handler)
      }
    }
  }

  return () => {}
}

export const switchWalletChain = async (
  provider: EIP1193Provider,
  chainId: number,
): Promise<void> => {
  const chainIdHex = `0x${chainId.toString(16)}`
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    })
  } catch (e) {
    const error = e as { code?: number }
    // 4902: chain not added
    if (error.code === 4902) {
      await addChainToWallet(provider, chainId)
      // Retry switch
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      })
    } else {
      throw e
    }
  }
}

export const addChainToWallet = async (
  provider: EIP1193Provider,
  chainId: number,
): Promise<void> => {
  const chainConfig = getChainConfig(chainId)
  if (!chainConfig) throw new Error(`Unknown chain ${chainId}`)

  await provider.request({
    method: 'wallet_addEthereumChain',
    params: [chainConfig],
  })
}
```

### `src/constants/chain-configs.ts`

```typescript
import { ChainId, networksByChainId } from './networks'
import { rpcUrls } from './rpc-endpoints'
import { explorerUrls } from './explorers'

export type WalletChainConfig = {
  chainId: string // hex
  chainName: string
  nativeCurrency: { name: string; symbol: string; decimals: number }
  rpcUrls: string[]
  blockExplorerUrls?: string[]
}

const nativeCurrencies: Partial<Record<ChainId, { name: string; symbol: string }>> = {
  [ChainId.Ethereum]: { name: 'Ether', symbol: 'ETH' },
  [ChainId.Optimism]: { name: 'Ether', symbol: 'ETH' },
  [ChainId.Polygon]: { name: 'MATIC', symbol: 'MATIC' },
  [ChainId.Arbitrum]: { name: 'Ether', symbol: 'ETH' },
  [ChainId.Avalanche]: { name: 'AVAX', symbol: 'AVAX' },
  [ChainId.Base]: { name: 'Ether', symbol: 'ETH' },
  [ChainId.Celo]: { name: 'CELO', symbol: 'CELO' },
  [ChainId.Linea]: { name: 'Ether', symbol: 'ETH' },
  [ChainId.ZkSyncEra]: { name: 'Ether', symbol: 'ETH' },
  // ... testnets use same native currencies
}

export const getChainConfig = (chainId: number): WalletChainConfig | null => {
  const network = networksByChainId[chainId]
  const rpcUrl = rpcUrls[chainId]
  const explorerUrl = explorerUrls[chainId as ChainId]
  const native = nativeCurrencies[chainId as ChainId]

  if (!network || !rpcUrl) return null

  return {
    chainId: `0x${chainId.toString(16)}`,
    chainName: network.name,
    nativeCurrency: {
      name: native?.name ?? 'Ether',
      symbol: native?.symbol ?? 'ETH',
      decimals: 18,
    },
    rpcUrls: [rpcUrl],
    blockExplorerUrls: explorerUrl ? [explorerUrl] : undefined,
  }
}
```

### Update `WalletState` type

```typescript
export type WalletState = {
  providers: ProviderDetailType[]
  connectedDetail: ProviderDetailType | null
  address: `0x${string}` | null
  chainId: number | null // NEW: current wallet chain
  isTestnet: boolean
  isConnecting: boolean
  error: string | null
}

export function createWalletState(): WalletState {
  return {
    providers: [],
    connectedDetail: null,
    address: null,
    chainId: null, // NEW
    isTestnet: false,
    isConnecting: false,
    error: null,
  }
}
```

### Update `WalletProvider.svelte`

```svelte
<script lang="ts">
  // ... existing code ...

  // Track wallet chain
  $effect(() => {
    if (!state.connectedDetail) {
      state.chainId = null
      return
    }

    // Get initial chain
    getWalletChainId(state.connectedDetail.provider).then(chainId => {
      state.chainId = chainId
    })

    // Subscribe to changes
    return subscribeChainChanged(state.connectedDetail.provider, chainId => {
      state.chainId = chainId
    })
  })
</script>
```

### `src/routes/bridge/ChainSwitchPrompt.svelte`

```svelte
<script lang="ts">
  import { Button } from 'bits-ui'
  import Spinner from '$/components/Spinner.svelte'
  import { switchWalletChain, type EIP1193Provider } from '$/lib/wallet'
  import { networksByChainId } from '$/constants/networks'

  let {
    currentChainId,
    requiredChainId,
    provider,
    onSwitched,
  }: {
    currentChainId: number
    requiredChainId: number
    provider: EIP1193Provider
    onSwitched?: () => void
  } = $props()

  let switching = $state(false)
  let error = $state<string | null>(null)

  const requiredChainName = $derived(
    networksByChainId[requiredChainId]?.name ?? `Chain ${requiredChainId}`
  )
  const currentChainName = $derived(
    networksByChainId[currentChainId]?.name ?? `Chain ${currentChainId}`
  )

  const handleSwitch = async () => {
    switching = true
    error = null
    try {
      await switchWalletChain(provider, requiredChainId)
      onSwitched?.()
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    } finally {
      switching = false
    }
  }
</script>

<div data-chain-switch-prompt role="alert">
  <p>
    Your wallet is connected to <strong>{currentChainName}</strong>.
    Switch to <strong>{requiredChainName}</strong> to continue.
  </p>
  <Button.Root type="button" onclick={handleSwitch} disabled={switching}>
    {#if switching}
      <Spinner size="1em" /> Switching…
    {:else}
      Switch to {requiredChainName}
    {/if}
  </Button.Root>
  {#if error}
    <p data-chain-switch-error>{error}</p>
  {/if}
</div>

<style>
  [data-chain-switch-prompt] {
    padding: 1em;
    background: var(--color-warning-bg, #fef3c7);
    border-radius: 0.5em;
    display: flex;
    flex-direction: column;
    gap: 0.75em;
  }

  [data-chain-switch-error] {
    color: var(--color-error, #ef4444);
    font-size: 0.875em;
  }
</style>
```

### Integration in bridge page

```svelte
{@const sourceChainId = Number(fromChain)}
{@const needsChainSwitch = wallet.chainId !== null && wallet.chainId !== sourceChainId}

{#if needsChainSwitch}
  <ChainSwitchPrompt
    currentChainId={wallet.chainId}
    requiredChainId={sourceChainId}
    provider={wallet.connectedDetail.provider}
  />
{:else if selectedRoute}
  <!-- Approval and Bridge buttons -->
{/if}
```

## Acceptance criteria

### Wallet functions
- [x] `getWalletChainId()` returns current chain as number
- [x] `subscribeChainChanged()` fires callback on chain change
- [x] `switchWalletChain()` requests chain switch
- [x] `addChainToWallet()` adds chain if not found

### Chain config
- [x] `getChainConfig()` returns valid config for all supported chains
- [x] Config includes correct native currency per chain
- [x] Config includes RPC URL and explorer URL

### WalletState
- [x] `chainId` tracked in wallet state
- [x] Updates when wallet switches chains
- [x] Null when disconnected

### ChainSwitchPrompt component
- [x] Shows current vs required chain names
- [x] "Switch to {chain}" button triggers switch
- [x] Loading state during switch
- [x] Error displayed on failure
- [x] Callback fired on successful switch

### Integration
- [x] Chain mismatch detected before approve/bridge
- [x] Prompt shown when wallet on wrong chain
- [x] Approve/Bridge buttons hidden until correct chain
- [x] Works when user manually switches in wallet

## Status

Complete.

## Output when complete

`DONE`
