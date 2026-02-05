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

### Wallet chain tracking

Chain ID is tracked via `walletConnectionsCollection` which stores `chainId` for
each connected wallet. Updated via `subscribeChainChanged` in the connection
handler.

### Chain switch prompt in `src/routes/bridge/lifi/BridgeFlow.svelte`

Chain switch prompt is shown inline:

```svelte
const needsChainSwitch = $derived(Boolean(
  selectedWallet && selectedChainId !== null && fromNetwork && selectedChainId !== fromNetwork.id
))

<!-- Chain switch prompt -->
{#if needsChainSwitch && fromNetwork && selectedWallet}
  <div data-card data-row="gap-2 align-center">
    <span>Switch to {fromNetwork.name}</span>
    <Button.Root onclick={() => selectedWallet && switchWalletChain(selectedWallet.wallet.provider, fromNetwork.id)}>
      Switch
    </Button.Root>
  </div>
{/if}
```

Uses `switchWalletChain` from `$/lib/wallet`. Send button is also disabled when
`needsChainSwitch` is true.

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

### Chain switch prompt (inline in BridgeFlow)
- [x] Shows required chain name when mismatch detected
- [x] "Switch to {chain}" button triggers switch via `switchWalletChain`
- [x] Send button disabled until correct chain
- [x] Reactive to wallet chain changes

### Integration
- [x] Chain mismatch detected before approve/bridge
- [x] Prompt shown when wallet on wrong chain
- [x] Approve/Bridge buttons hidden until correct chain
- [x] Works when user manually switches in wallet

## Status

Complete. `src/lib/wallet.ts`: getWalletChainId, subscribeChainChanged,
switchWalletChain, addChainToWallet. `src/constants/chain-configs.ts`:
WalletChainConfig type, nativeCurrencies, getChainConfig. BridgeFlow.svelte:
`needsChainSwitch` derived, inline switch prompt, Send button disabled when
chain mismatch. Unit tests in wallet.spec.ts and chain-configs.spec.ts.

## Output when complete

`DONE`
