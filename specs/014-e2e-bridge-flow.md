# Spec 014: End-to-end bridge flow integration

This meta-spec ties together all bridge functionality into a cohesive user flow.
Requires specs 003-013 to be complete.

## Complete user flow

### 1. Connect wallet
- User clicks "Connect Wallet"
- Popover shows discovered EIP-6963 wallets
- User clicks wallet (e.g., MetaMask)
- Wallet prompts for account access
- On success: address shown, popover closes

### 2. View balances
- USDC balances fetched for all chains matching testnet/mainnet toggle
- Balances displayed in grid with chain names
- Loading states shown during fetch
- Errors shown per-chain with retry

### 3. Select chains and amount
- User selects source chain (dropdown, filtered by toggle)
- User selects destination chain (dropdown, filtered by toggle)
- User enters amount in human-readable format (e.g., "100.50")
- "Max" button fills with available balance

### 4. Get routes
- User clicks "Get Routes" (or auto-fetch on valid input)
- Multiple route options displayed
- Each shows: output amount, fees, estimated time, bridges used
- User selects preferred route

### 5. Approve (if needed)
- If selected route requires token approval:
  - "Approve USDC" button shown
  - User clicks, wallet prompts for approval tx
  - Wait for confirmation
  - "Approved ✓" shown, button becomes "Bridge"

### 6. Execute bridge
- User clicks "Bridge"
- Status tracker shows progress: Sending → Confirming → Complete
- Transaction hashes linked to correct chain explorers
- On completion: success message, balances auto-refresh

### 7. View history
- Completed transaction added to history
- History section shows past transactions
- Each with date, chains, amount, status, explorer links

## Acceptance criteria (integration)

- [ ] Full flow works: connect → balance → select → route → approve → bridge → history
- [ ] Testnet mode: can bridge on testnets (e.g., Sepolia → Base Sepolia)
- [ ] Mainnet mode: can bridge on mainnets (e.g., Ethereum → Arbitrum)
- [ ] Switching testnet/mainnet filters chains and resets selections
- [ ] Errors at any step show clear message with appropriate action
- [ ] Transaction completes and shows in history
- [ ] Balances update after successful bridge

## E2E test coverage

### Manual test script

```markdown
1. Open /bridge in browser with MetaMask installed
2. Verify "Mainnet" shown, toggle to "Testnet"
3. Click "Connect Wallet" → select MetaMask → approve connection
4. Verify address shows, balances grid appears
5. Select "Ethereum Sepolia" as source, "Base Sepolia" as destination
6. Enter "1" in amount field
7. Click "Get Routes" → verify route options appear
8. Select a route → click "Approve" if shown
9. Click "Bridge" → verify status tracker updates
10. Wait for completion → verify success message
11. Verify transaction appears in history section
12. Toggle to "Mainnet" → verify chains filter correctly
```

### Automated E2E tests

- `e2e/bridge-e2e.test.ts` with mocked wallet provider
- Test happy path with mock responses
- Test error handling (user rejection, network error)
- Test testnet/mainnet toggle

## Dependencies

### Core (must complete for working E2E):
- [x] 003 - LI.FI quotes
- [x] 004 - Bridge UI
- [x] 005 - Wallet provider (implementation done, E2E pending)
- [ ] 007 - Human-readable amounts ⭐ HIGH
- [ ] 009 - Token approval ⭐ HIGH
- [ ] 008 - Transaction status ⭐ HIGH
- [ ] 012 - Testnet/mainnet filtering ⭐ HIGH
- [ ] 013 - Error handling ⭐ HIGH

### Enhanced UX (recommended):
- [ ] 010 - Route comparison
- [ ] 015 - Quote refresh
- [ ] 016 - Slippage settings
- [ ] 017 - Loading states

### Nice to have:
- [ ] 011 - Transaction history
- [ ] 006 - Transfers visualization

## Recommended implementation order

1. **Phase 1: Core fixes** (minimum for working bridge)
   - 007 Human-readable amounts
   - 012 Testnet/mainnet filtering
   - 009 Token approval
   - 008 Transaction status
   - 013 Error handling

2. **Phase 2: Route UX**
   - 010 Route comparison
   - 015 Quote refresh
   - 016 Slippage settings

3. **Phase 3: Polish**
   - 017 Loading states
   - 011 Transaction history
   - 005 E2E tests

4. **Phase 4: Bonus**
   - 006 Transfers visualization

## Status

Not started.

## Output when complete

`DONE`
