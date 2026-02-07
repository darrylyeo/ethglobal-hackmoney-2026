# Spec 056: Formatting enforcement (Svelte, CSS, TS)

Ensure Svelte, CSS, and TypeScript formatting is enforced across every file by
explicitly tracking each file as a formatting task.

## Scope

- Enforce repository formatting standards for Svelte, CSS, and TypeScript.
- Track formatting verification per-file to avoid missing any file.

## Execution rule

**One file per run.** Each run of this spec must touch exactly one file: format that file to repo preferences and `deno task format` (for Svelte files), then check its box. Do not format or verify multiple files in a single run.

## Non-goals

- Do not change runtime behavior or refactor logic beyond formatting.
- Do not introduce new tooling unless required by a dedicated spec.

## Acceptance criteria

### Spec doc conventions (specs/*.md)

- Code blocks containing TypeScript/TS: use fence `ts` (not `typescript`) and tab
  indentation (see spec 045).
- Section heading for criteria: `## Acceptance criteria` (lowercase “criteria”).

### Formatting standards

- [x] Svelte files use section order: module script, instance script,
  `<svelte:head>`, markup, `<style>`, with two empty lines between each
  section.
- [x] Svelte scripts use comment-delimited groups (Types/constants, IDs,
  Context, Props, (Derived), Functions, State, (Derived), Actions, Components,
  Transitions, Styles) with two empty lines between each comment group.
- [x] Svelte scripts follow import grouping/ordering and Svelte 5 constraints
  (no onMount, `$:`, writable(); use $props, $state, $derived, $effect,
  `<svelte:boundary>` not {#await}).
- [x] Svelte template: one prop (attribute) per line when an element has
  multiple props.
- [x] CSS files follow repo style rules and primitives usage guidelines.
- [x] TypeScript files follow repo formatting: single quotes, no semicolons,
  trailing commas, preferred type style rules, inlining of single-use
  variables and types, and file extensions always included in import paths.

All files below: one file per run; format to repo preferences and `deno task format` (scripts/_svelte-section-spacing.ts), then check.

- [x] `e2e/accessibility.test.ts`
- [x] `e2e/agent-chat.test.ts`
- [x] `e2e/bridge-e2e.test.ts`
- [x] `e2e/bridge.test.ts`
- [x] `e2e/cctp-bridge.test.ts`
- [x] `e2e/coverage-enforcement.test.ts`
- [x] `e2e/coverage-helpers.ts`
- [x] `e2e/coverage-manifest.ts`
- [x] `e2e/coverage-utils.ts`
- [x] `e2e/fixtures/tevm.ts`
- [x] `e2e/intents-drag.test.ts`
- [x] `e2e/prompt-input.test.ts`
- [x] `e2e/responsive.test.ts`
- [x] `e2e/route-coverage.test.ts`
- [x] `e2e/test-setup.ts`
- [x] `e2e/tevm-execution.test.ts`
- [x] `e2e/unified-bridge.test.ts`
- [x] `e2e/wallet.test.ts`
- [x] `env.d.ts`
- [x] `partykit/room.ts`
- [x] `playwright.config.ts`
- [x] `playwright.e2e.config.ts`
- [x] `playwright.no-server.config.ts`
- [x] `reset.d.ts`
- [x] `scripts/_e2e-bridge-mainnet.ts`
- [x] `scripts/_sync-assets.ts`
- [x] `scripts/_svelte-section-spacing.ts`
- [x] `scripts/_yellow-demo.ts`
- [x] `scripts/check-bundle-size.mjs`
- [x] `scripts/check-performance.mjs`
- [x] `src/api/approval.ts`
- [x] `src/api/cctp.ts`
- [x] `src/api/identity-resolve.spec.ts`
- [x] `src/api/identity-resolve.ts`
- [x] `src/api/lifi.spec.ts`
- [x] `src/api/lifi.ts`
- [x] `src/api/llm/connection-provider.ts`
- [x] `src/api/llm/zen.ts`
- [x] `src/api/simulate.ts`
- [x] `src/api/transfers-indexer.ts`
- [x] `src/api/transfers-logs.ts`
- [x] `src/api/uniswap.ts`
- [x] `src/api/voltaire.spec.ts`
- [x] `src/api/voltaire.ts`
- [x] `src/api/yellow.ts`
- [x] `src/app.d.ts`
- [x] `src/collections/actor-allowances.ts`
- [x] `src/collections/actor-coins.spec.ts`
- [x] `src/collections/actor-coins.ts`
- [x] `src/collections/actors.spec.ts`
- [x] `src/collections/actors.ts`
- [x] `src/collections/agent-chat-trees.ts`
- [x] `src/collections/agent-chat-turns.ts`
- [x] `src/collections/blocks.ts`
- [x] `src/collections/bridge-routes.ts`
- [x] `src/collections/cctp-allowance.ts`
- [x] `src/collections/cctp-fees.ts`
- [x] `src/collections/chain-transactions.ts`
- [x] `src/collections/coins.spec.ts`
- [x] `src/collections/coins.ts`
- [x] `src/collections/dashboard-panels.ts`
- [x] `src/collections/evm-actor-profiles.ts`
- [x] `src/collections/identity-resolution.ts`
- [x] `src/collections/llm-connections.ts`
- [x] `src/collections/my-peer-ids.ts`
- [x] `src/collections/networks.spec.ts`
- [x] `src/collections/networks.ts`
- [x] `src/collections/room-peers-keys.ts`
- [x] `src/collections/room-peers.spec.ts`
- [x] `src/collections/room-peers.ts`
- [x] `src/collections/rooms.ts`
- [x] `src/collections/shared-addresses-keys.ts`
- [x] `src/collections/shared-addresses.spec.ts`
- [x] `src/collections/shared-addresses.ts`
- [x] `src/collections/siwe-challenges-keys.ts`
- [x] `src/collections/siwe-challenges.spec.ts`
- [x] `src/collections/siwe-challenges.ts`
- [x] `src/collections/stork-prices.ts`
- [x] `src/collections/swap-quotes-normalize.ts`
- [x] `src/collections/swap-quotes.spec.ts`
- [x] `src/collections/swap-quotes.ts`
- [x] `src/collections/token-list-coins.ts`
- [x] `src/collections/transaction-session-simulations.ts`
- [x] `src/collections/transaction-sessions.ts`
- [x] `src/collections/transactions.ts`
- [x] `src/collections/transfer-events.ts`
- [x] `src/collections/transfer-graphs.ts`
- [x] `src/collections/transfer-requests.ts`
- [x] `src/collections/uniswap-pools-normalize.ts`
- [x] `src/collections/uniswap-pools.spec.ts`
- [x] `src/collections/uniswap-pools.ts`
- [x] `src/collections/uniswap-positions-normalize.ts`
- [x] `src/collections/uniswap-positions.spec.ts`
- [x] `src/collections/uniswap-positions.ts`
- [x] `src/collections/verifications-keys.ts`
- [x] `src/collections/verifications.spec.ts`
- [x] `src/collections/verifications.ts`
- [x] `src/collections/wallet-connections.ts`
- [x] `src/collections/wallets.ts`
- [x] `src/collections/yellow-channel-states.ts`
- [x] `src/collections/yellow-channels.ts`
- [x] `src/collections/yellow-deposits.ts`
- [x] `src/collections/yellow-transfers.ts`
- [x] `src/components/Address.svelte`
- [x] `src/components/Boundary.svelte`
- [x] `src/components/Combobox.svelte`
- [x] `src/components/DragArrow.svelte`
- [x] `src/components/Draggable.svelte.ts`
- [x] `src/components/Dropdown.svelte`
- [x] `src/components/EntityId.svelte`
- [x] `src/components/EntityReferenceInput.svelte`
- [x] `src/components/EntityRefInput.svelte`
- [x] `src/components/EvmActor.svelte`
- [x] `src/components/G6GraphView.svelte`
- [x] `src/components/Icon.svelte`
- [x] `src/components/IntentDragPreview.svelte`
- [x] `src/components/ItemsList.svelte`
- [x] `src/components/LoadingButton.svelte`
- [x] `src/components/ModelInput.svelte`
- [x] `src/components/network/Block.svelte`
- [x] `src/components/network/Event.svelte`
- [x] `src/components/network/Network.svelte`
- [x] `src/components/network/Trace.svelte`
- [x] `src/components/network/Transaction.svelte`
- [x] `src/components/RichTextarea.svelte`
- [x] `src/components/RichTextareaReference.svelte`
- [x] `src/components/Select.svelte`
- [x] `src/components/SigmaGraphView.svelte`
- [x] `src/components/Skeleton.svelte`
- [x] `src/components/Spinner.svelte`
- [x] `src/components/Tabs.svelte`
- [x] `src/components/Timestamp.svelte`
- [x] `src/components/Toast.svelte`
- [x] `src/components/Tooltip.svelte`
- [x] `src/components/TruncatedValue.svelte`
- [x] `src/constants/bridge-limits.spec.ts`
- [x] `src/constants/bridge-limits.ts`
- [x] `src/constants/cctp.ts`
- [x] `src/constants/data-sources.ts`
- [x] `src/constants/entity-ref-patterns.ts`
- [x] `src/constants/entity-types.ts`
- [x] `src/constants/explorers.spec.ts`
- [x] `src/constants/explorers.ts`
- [x] `src/constants/identity-resolver.ts`
- [x] `src/constants/interop.spec.ts`
- [x] `src/constants/interop.ts`
- [x] `src/constants/media.ts`
- [x] `src/constants/networks.ts`
- [x] `src/constants/opencode-zen.ts`
- [x] `src/constants/peer-display-names.ts`
- [x] `src/constants/proxy.ts`
- [x] `src/constants/query-limits.ts`
- [x] `src/constants/room-display-names.ts`
- [x] `src/constants/rpc-endpoints.ts`
- [x] `src/constants/slippage.spec.ts`
- [x] `src/constants/slippage.ts`
- [x] `src/constants/stork.ts`
- [x] `src/constants/token-lists.ts`
- [x] `src/constants/uniswap.ts`
- [x] `src/constants/yellow.ts`
- [x] `src/data/$EntityType.ts`
- [x] `src/data/Actor.ts`
- [x] `src/data/ActorAllowance.ts`
- [x] `src/data/ActorCoin.ts`
- [x] `src/data/AgentChatTree.ts`
- [x] `src/data/AgentChatTurn.ts`
- [x] `src/data/Block.ts`
- [x] `src/data/BridgeRoute.ts`
- [x] `src/data/CctpAllowance.ts`
- [x] `src/data/CctpFee.ts`
- [x] `src/data/ChainTransaction.ts`
- [x] `src/data/Coin.ts`
- [x] `src/data/DashboardPanel.ts`
- [x] `src/data/EntityRef.ts`
- [x] `src/data/EvmActorProfile.ts`
- [x] `src/data/LlmConnection.ts`
- [x] `src/data/Network.ts`
- [x] `src/data/Room.ts`
- [x] `src/data/RoomPeer.ts`
- [x] `src/data/SharedAddress.ts`
- [x] `src/data/SiweChallenge.ts`
- [x] `src/data/StorkPrice.ts`
- [x] `src/data/SwapQuote.ts`
- [x] `src/data/TevmSimulationResult.ts`
- [x] `src/data/TokenListCoin.ts`
- [x] `src/data/Trace.ts`
- [x] `src/data/Transaction.ts`
- [x] `src/data/TransactionSession.ts`
- [x] `src/data/TransactionSessionSimulation.ts`
- [x] `src/data/TransferRequest.ts`
- [x] `src/data/UniswapPool.ts`
- [x] `src/data/UniswapPosition.ts`
- [x] `src/data/Verification.ts`
- [x] `src/data/Wallet.ts`
- [x] `src/data/WalletConnection.ts`
- [x] `src/data/YellowChannel.ts`
- [x] `src/data/YellowChannelState.ts`
- [x] `src/data/YellowDeposit.ts`
- [x] `src/data/YellowTransfer.ts`
- [x] `src/hooks.server.ts`
- [x] `src/lib/address.spec.ts`
- [x] `src/lib/address.ts`
- [x] `src/lib/bridge/errors.spec.ts`
- [x] `src/lib/bridge/errors.ts`
- [x] `src/lib/bridge/txStatus.spec.ts`
- [x] `src/lib/bridge/txStatus.ts`
- [x] `src/lib/db/queryClient.ts`
- [x] `src/lib/debounce.ts`
- [x] `src/lib/format.spec.ts`
- [x] `src/lib/format.ts`
- [x] `src/lib/index.ts`
- [x] `src/lib/intents/drag.spec.ts`
- [x] `src/lib/intents/drag.ts`
- [x] `src/lib/intents/resolve-intent.ts`
- [x] `src/lib/intents/routes.ts`
- [x] `src/lib/llmProvider.ts`
- [x] `src/lib/retry.spec.ts`
- [x] `src/lib/retry.ts`
- [x] `src/lib/rooms/room.ts`
- [x] `src/lib/rooms/siwe.ts`
- [x] `src/lib/session/panelHash.ts`
- [x] `src/lib/session/params.ts`
- [x] `src/lib/session/sessions.ts`
- [x] `src/lib/stork.ts`
- [x] `src/lib/stringify.ts`
- [x] `src/lib/wallet.spec.ts`
- [x] `src/lib/wallet.ts`
- [x] `src/Object.d.ts`
- [x] `src/prompt-api.d.ts`
- [x] `src/routes/+layout.svelte`
- [x] `src/routes/+page.svelte`
- [x] `src/routes/about-old-2/+page.svelte`
- [x] `src/routes/about-old-2/ArchitectureGraph.svelte`
- [x] `src/routes/about-old/+page.svelte`
- [x] `src/routes/about-old/architecture-graph.ts`
- [x] `src/routes/about-old/ArchitectureGraph.svelte`
- [x] `src/routes/about/+page.svelte`
- [x] `src/routes/about/architecture-graph.ts`
- [x] `src/routes/about/ArchitectureGraph.svelte`
- [x] `src/routes/account/[address]/+page.svelte`
- [x] `src/routes/account/[address]/+page.ts`
- [x] `src/routes/accounts/+page.svelte`
- [x] `src/routes/agents/[nodeId]/+page.svelte`
- [x] `src/routes/agents/[nodeId]/AgentChatTree.svelte`
- [x] `src/routes/agents/[nodeId]/AgentChatTurnNode.svelte`
- [x] `src/routes/agents/+page.svelte`
- [x] `src/routes/agents/new/+page.svelte`
- [x] `src/routes/bridge/cctp/CctpAllowance.svelte`
- [x] `src/routes/bridge/cctp/CctpAttestation.svelte`
- [x] `src/routes/bridge/cctp/CctpBalances.svelte`
- [x] `src/routes/bridge/cctp/CctpBridgeFlow.svelte`
- [x] `src/routes/bridge/cctp/CctpExecution.svelte`
- [x] `src/routes/bridge/cctp/CctpFees.svelte`
- [x] `src/routes/bridge/cctp/CctpWallets.svelte`
- [x] `src/routes/bridge/lifi/bridge.test.ts`
- [x] `src/routes/bridge/lifi/BridgeExecution.svelte`
- [x] `src/routes/bridge/lifi/BridgeFlow.svelte`
- [x] `src/routes/bridge/lifi/page.test.ts`
- [x] `src/routes/bridge/lifi/responsive.test.ts`
- [x] `src/routes/bridge/lifi/TokenApproval.svelte`
- [x] `src/routes/bridge/lifi/wallet.test.ts`
- [x] `src/routes/channels/yellow/+page.svelte`
- [x] `src/routes/coin/[symbol]/+page.svelte`
- [x] `src/routes/coin/[symbol]/+page.ts`
- [x] `src/routes/dashboard/+page.svelte`
- [x] `src/routes/dashboard/Panel.svelte`
- [x] `src/routes/dashboard/PanelTree.svelte`
- [x] `src/routes/dashboard/route-map.ts`
- [x] `src/routes/dashboard/SvelteKitRoute.svelte`
- [x] `src/routes/explore/usdc/+page.ts`
- [x] `src/routes/GraphScene.svelte`
- [x] `src/routes/network/[name]/+page.svelte`
- [x] `src/routes/network/[name]/+page.ts`
- [x] `src/routes/network/[name]/block/[blockNumber]/+page.svelte`
- [x] `src/routes/network/[name]/block/[blockNumber]/+page.ts`
- [x] `src/routes/network/[name]/block/[blockNumber]/transaction/[transactionId]/+page.svelte`
- [x] `src/routes/network/[name]/block/[blockNumber]/transaction/[transactionId]/+page.ts`
- [x] `src/routes/network/[name]/transaction/[transactionId]/+page.svelte`
- [x] `src/routes/network/[name]/transaction/[transactionId]/+page.ts`
- [x] `src/routes/page.test.ts`
- [x] `src/routes/peers/+page.svelte`
- [x] `src/routes/rooms/[roomId]/+page.svelte`
- [x] `src/routes/rooms/[roomId]/+page.ts`
- [x] `src/routes/rooms/[roomId]/channels/+page.svelte`
- [x] `src/routes/rooms/[roomId]/channels/+page.ts`
- [x] `src/routes/rooms/+page.svelte`
- [x] `src/routes/rooms/ChannelList.svelte`
- [x] `src/routes/rooms/DepositManager.svelte`
- [x] `src/routes/rooms/Peer.svelte`
- [x] `src/routes/rooms/PeerCard.svelte`
- [x] `src/routes/rooms/PeerList.svelte`
- [x] `src/routes/rooms/SharedAddresses.svelte`
- [x] `src/routes/rooms/TransferDialog.svelte`
- [x] `src/routes/rooms/TransferRequests.svelte`
- [x] `src/routes/session/[id]/+page.svelte`
- [x] `src/routes/session/+page.svelte`
- [x] `src/routes/session/Bridge.svelte`
- [x] `src/routes/session/BridgeAction.svelte`
- [x] `src/routes/session/Liquidity.svelte`
- [x] `src/routes/session/LiquidityFlow.svelte`
- [x] `src/routes/session/Positions.svelte`
- [x] `src/routes/session/Swap.svelte`
- [x] `src/routes/session/SwapAction.svelte`
- [x] `src/routes/session/SwapExecution.svelte`
- [x] `src/routes/session/SwapFlow.svelte`
- [x] `src/routes/session/Transfer.svelte`
- [x] `src/routes/session/TransferAction.svelte`
- [x] `src/routes/session/TransferFlow.svelte`
- [x] `src/routes/session/UnifiedProtocolRouter.svelte`
- [x] `src/routes/sessions/+page.svelte`
- [x] `src/routes/settings/llm/+page.svelte`
- [x] `src/routes/settings/llm/LlmConnections.svelte`
- [x] `src/routes/test/chain-id/+page.svelte`
- [x] `src/routes/test/collections/+page.svelte`
- [x] `src/routes/test/collections/page.test.ts`
- [x] `src/routes/test/intents/+page.svelte`
- [x] `src/routes/test/networks-coins/+page.svelte`
- [x] `src/routes/test/networks-coins/page.test.ts`
- [x] `src/routes/transfers/+page.svelte`
- [x] `src/routes/transfers/LiveTransfers.svelte`
- [x] `src/routes/wallets/+page.svelte`
- [x] `src/routes/wallets/Accounts.svelte`
- [x] `src/state/bridge-settings.svelte.ts`
- [x] `src/state/intent-drag-preview.svelte.ts`
- [x] `src/state/intent-navigation.svelte.ts`
- [x] `src/state/liquidity-settings.svelte.ts`
- [ ] `src/state/nitro-rpc.spec.ts`
- [ ] `src/state/nitro-rpc.ts`
- [ ] `src/state/room.svelte.ts`
- [ ] `src/state/swap-settings.svelte.ts`
- [ ] `src/state/wallet.svelte.ts`
- [ ] `src/state/yellow.svelte.ts`
- [ ] `src/styles/accessibility.css`
- [ ] `src/styles/bits-ui.css`
- [ ] `src/styles/colors.css`
- [ ] `src/styles/components.css`
- [ ] `src/styles/fonts.css`
- [ ] `src/styles/reset.css`
- [ ] `src/styles/responsive.css`
- [ ] `src/svelte/live-query-context.svelte.ts`
- [ ] `src/svelte/useContext.ts`
- [ ] `src/views/AccountsSelect.svelte`
- [ ] `src/views/AddressInput.svelte`
- [ ] `src/views/CoinAmount.svelte`
- [ ] `src/views/CoinAmountInput.svelte`
- [ ] `src/views/CoinBalances.svelte`
- [ ] `src/views/CoinInput.svelte`
- [ ] `src/views/LiveTransfers.svelte`
- [ ] `src/views/Navigation.svelte`
- [ ] `src/views/NavigationItem.svelte`
- [ ] `src/views/NetworkInput.svelte`
- [ ] `src/views/NumberValue.svelte`
- [ ] `src/views/Session.svelte`
- [ ] `src/views/SessionAction.svelte`
- [ ] `src/views/SimulationEventPanel.svelte`
- [ ] `src/views/SimulationTracePanel.svelte`
- [ ] `src/views/StorkPriceFeed.svelte`
- [ ] `src/views/StorkPrices.svelte`
- [ ] `src/views/ToastContainer.svelte`
- [ ] `src/views/TokenAmountInput.svelte`
- [ ] `src/views/TransactionFlow.svelte`
- [ ] `vite.config.ts`
- [ ] `vitest.config.ts`

## Status

Incomplete. Next: src/state/nitro-rpc.spec.ts. Previous: 2026-02-07 (PROMPT_build execute one spec): src/state/liquidity-settings.svelte.ts formatted (trailing comma in LiquiditySettings type; single newline at EOF; deno task format N/A for .svelte.ts), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/state/intent-navigation.svelte.ts formatted (single newline at EOF; deno task format N/A for .svelte.ts), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/state/intent-drag-preview.svelte.ts formatted (trailing commas in IntentDragEndpoint, IntentDragPreviewState, and args types; single newline at EOF; deno task format N/A for .svelte.ts), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/state/bridge-settings.svelte.ts formatted (trailing commas in BridgeSettings type and defaultBridgeSettings; single newline at EOF; deno task format N/A for .svelte.ts), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/wallets/Accounts.svelte formatted (comment groups Types/constants, Context, (Derived), Functions, State, (Derived), Actions, (Derived), Components; imports by path; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/wallets/+page.svelte formatted (comment group Functions; two empty lines between import block and group; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/transfers/LiveTransfers.svelte formatted (comment groups Types/constants, Props, (Derived), State; two empty lines between groups; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/transfers/+page.svelte formatted (comment groups Types/constants, Functions; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/test/networks-coins/page.test.ts formatted (repo style: blank line after import, between test blocks; single newline at EOF; deno task format N/A for TS), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/test/networks-coins/+page.svelte formatted (comment groups Types/constants, State, Actions, (Derived); imports by path; one prop per line for main; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/test/intents/+page.svelte formatted (comment groups Types/constants, Context, Functions, State, (Derived), Actions, Components; imports by path; one prop per line for main; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/session/[id]/+page.svelte formatted (comment groups Context, Functions, State, (Derived), Actions; imports by path $app then @tanstack then $/svelte, $/lib, $/collections; one prop per line for main; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/rooms/TransferRequests.svelte formatted (comment groups Types/constants, Context, Props, State, (Derived), Actions, Components; imports by path eq/useLiveQuery, sendTransfer, collections, DataSource, formatSmallestToDecimal, state, registerLocalLiveQueryStack; trailing comma in props type; one prop per line for form, AddressInput, input, Button.Root, Address, Button.Root Accept/Reject/Send, p; fixed broken Button.Root closing tags; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/rooms/TransferDialog.svelte formatted (comment groups Types/constants, Context, Props, Functions, State, (Derived), Actions, Components; imports by path; trailing commas in props type; one prop per line for p, div, Button.Root; fixed broken Button.Root closing tag; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/rooms/SharedAddresses.svelte formatted (comment groups Types/constants, Context, Props, Functions, State, (Derived), Actions, Components; imports by path eq before useLiveQuery, roomPeers before sharedAddresses; one prop per line for li, Address, time, span, Button.Root; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/rooms/PeerList.svelte formatted (comment groups Types/constants, Context, Props, State, (Derived), Components; imports by path; trailing comma in props type; one prop per line for li, Peer; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/rooms/PeerCard.svelte formatted (comment groups Types/constants, Context, Components, Props, State, (Derived), Functions, Actions; trailing commas in props type; one prop per line for article, div, Peer, Address, Button.Root, time; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/rooms/Peer.svelte formatted (comment groups Types/constants, Props, (Derived), Components; trailing commas in props type; one prop per line for span elements; fixed broken </small> tags; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/rooms/DepositManager.svelte formatted (comment groups Types/constants, Context, Props, (Derived), State, Actions; imports by path; try/await indentation fixed; one prop per line for form, input, button; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/rooms/ChannelList.svelte formatted (one prop per line for div, Address, Button.Root; fixed broken Button.Root closing tag; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/test/collections/page.test.ts formatted (repo style: blank line after import, between test blocks; single newline at EOF; deno task format N/A for TS), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/test/collections/+page.svelte formatted (one prop per line for main; no script; single newline at EOF; deno task format), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/test/chain-id/+page.svelte formatted (comment groups Functions, State, Actions; one prop per line for main, section, form, label, div, input, Button.Root; fixed </output>; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/settings/llm/LlmConnections.svelte formatted (comment groups Types/constants, Context, (Derived), Functions, Actions, Components; imports by path; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/settings/llm/+page.svelte formatted (Components comment group; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/sessions/+page.svelte formatted (comment groups Types/constants, Context, Functions, State, (Derived); one prop per line for main, section, button; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/session/UnifiedProtocolRouter.svelte formatted (trailing comma in props type; one prop per line for span elements; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/session/TransferFlow.svelte formatted (comment groups Types/constants, Context, Props, Functions, State, Components, (Derived), Actions; ExecutionArgs in Types; one prop per line for Address, CoinAmount, LoadingButton; trailing comma in props type; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/session/TransferAction.svelte formatted (comment groups Types/constants, Context, Props, Functions, State, (Derived), Actions, Components; ExecutionArgs in Types; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/session/Transfer.svelte formatted (one prop per line for AccountsSelect; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/session/SwapFlow.svelte formatted (comment groups; duplicate // Actions removed—fetchQuote block under (Derived); one prop per line for LoadingButton, Popover.Trigger, Popover.Content, Button.Root; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/session/SwapExecution.svelte formatted (comment groups Types/constants, Props, State, (Derived), Functions, Actions; imports by path types then values; trailing comma in props type; one prop per line for a; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/session/SwapAction.svelte formatted (Props type trailing commas; comment group // Actions; one prop per line for LoadingButton; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/session/Swap.svelte formatted (comment groups Types/constants, Functions, State, (Derived), Components; one prop per line for details, header, AccountsSelect, CoinBalances; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/session/Positions.svelte formatted (comment groups Types/constants, Props, (Derived), Functions, State, Actions; trailing comma in props type; one prop per line for section, ul, li, p, Button.Root, input; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/session/LiquidityFlow.svelte formatted (comment groups Types/constants, Context, Functions, State, Components, Props, (Derived), Actions; UniswapPoolRow type import; trailing commas in props type; duplicate mid-file imports removed; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/session/Liquidity.svelte formatted (comment groups Types/constants, State, Components; one prop per line for main, details, header; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/session/BridgeAction.svelte formatted (comment groups Types/constants, Context, Functions, State, Components, Props, State, (Derived), Actions; props type commas and trailing comma; one prop per line for div, p, small, Address, LoadingButton, data-card div; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/session/Bridge.svelte formatted (comment groups Types/constants, Context, Functions, State, (Derived), Components; type literal comma not semicolon; one prop per line for details, header, AccountsSelect, CoinBalances, BridgeAction; deno task format; single newline at EOF). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/session/+page.svelte formatted (comment groups Context, Props, Functions, State, (Derived), Components; trailing commas in props type; one prop per line for div, main, section; deno task format; single newline at EOF). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/rooms/+page.svelte formatted (comment groups Context, Functions, State, Actions; one prop per line for main, div, section, button, form, input; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/rooms/[roomId]/channels/+page.ts verified compliant (repo style; single newline at EOF; deno task format N/A for TS), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/rooms/[roomId]/channels/+page.svelte formatted (comment groups Types/constants, Context, Props, (Derived), Functions, State, (Derived), Components; one prop per line for main; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/rooms/[roomId]/+page.svelte formatted (comment groups Types/constants, Context, Props, (Derived), Functions, State, (Derived), Actions, Components; one prop per line for main, header, details, header, nav links, div; trailing comma in props type; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/peers/+page.svelte formatted (comment groups Context, (Derived), Actions; one prop per line for main, ul, li, button; deno task format; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/page.test.ts verified compliant (repo style; single newline at EOF; deno task format N/A for TS), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/network/[name]/transaction/[transactionId]/+page.ts verified compliant (repo style; single newline at EOF; deno task format N/A for TS), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/network/[name]/block/[blockNumber]/transaction/[transactionId]/+page.ts verified compliant (repo style; single newline at EOF; deno task format N/A for TS), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/network/[name]/transaction/[transactionId]/+page.svelte formatted (comment groups Types/constants, Context, Props, State, (Derived); two empty lines between sections; one prop per line for NetworkView; trailing comma in props type; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/network/[name]/block/[blockNumber]/transaction/[transactionId]/+page.svelte formatted (comment groups Types/constants, Context, Props, (Derived), State, (Derived); two empty lines between sections; one prop per line for NetworkView; data prop for title; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/network/[name]/block/[blockNumber]/+page.ts verified compliant (repo style; single newline at EOF; deno task format N/A for TS), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/network/[name]/block/[blockNumber]/+page.svelte formatted (comment groups Types/constants, Context, Components, (Derived), State, (Derived); two empty lines between sections; one prop per line for NetworkView; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/network/[name]/+page.ts verified compliant (repo style; single newline at EOF; deno task format N/A for TS), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/network/[name]/+page.svelte formatted (comment groups Types/constants, Context, Functions, State, Components, (Derived), State, (Derived); two empty lines between sections; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/GraphScene.svelte formatted (trailing comma in props type; two empty lines script/template; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/explore/usdc/+page.ts verified compliant (repo style; single newline at EOF; deno task format N/A for TS), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/dashboard/SvelteKitRoute.svelte formatted (trailing comma in props type; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/dashboard/route-map.ts formatted (trailing comma in object; hash line indent; single newline at EOF; deno task format N/A for TS), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/dashboard/PanelTree.svelte formatted (comment groups Props, (Derived), Components; trailing commas in props type; two empty lines script/template; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/dashboard/Panel.svelte formatted (trailing comma in props type; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/dashboard/+page.svelte formatted (trailing comma in props type; one prop per line for main, nav, section; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/coin/[symbol]/+page.ts formatted (trailing comma in return object; single newline at EOF; deno task format N/A for TS), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/coin/[symbol]/+page.svelte formatted (comment groups Types/constants, Props, (Derived), State, (Derived), State, (Derived)/effects, Functions; trailing comma in props type; one prop per line; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/channels/yellow/+page.svelte formatted (Context: connectToYellow/disconnectFromYellow in yellow.svelte import; two empty lines between State and (Derived) filtered list; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/bridge/lifi/wallet.test.ts formatted (trailing commas in multiline objects/args; single-expression return for provider.request; deno task format N/A for TS). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/bridge/lifi/responsive.test.ts verified compliant (repo style: single quotes, no semicolons, trailing commas in VIEWPORTS; deno task format N/A for TS). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/bridge/lifi/page.test.ts formatted (trailing commas in multiline objects/args; single-expression return for provider.request; deno task format N/A for TS). Previous: 2026-02-07 TokenApproval.svelte formatted (section comments, trailing comma in props type, one prop per line for a/Button.Root/Switch.Root; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/bridge/lifi/BridgeFlow.svelte formatted (Types/constants: BridgeStatus, ErrorCode; Functions: local resolveNetwork/resolveNetworkName/isEip1193Wallet; one prop per line for section, Button.Root, div; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/bridge/lifi/BridgeExecution.svelte formatted (trailing commas in types; comment groups State/(Derived)/Actions; one prop per line for a; removed unused EIP1193Provider import; fixed undefined isHexHash with inline check; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/bridge/lifi/bridge.test.ts formatted (trailing commas in multiline objects/args; deno task format N/A for TS). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/bridge/cctp/CctpWallets.svelte formatted (trailing commas in props type; one prop per line for AccountsSelect; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/bridge/cctp/CctpFees.svelte formatted (trailing commas in props type; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/bridge/cctp/CctpExecution.svelte formatted (trailing commas in props type; Functions/Actions comment groups; one prop per line for li elements; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/bridge/cctp/CctpBridgeFlow.svelte formatted (Actions comment; two empty lines script/template; one prop per line for div, Button.Root in dialog; trailing comma in props type; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/bridge/cctp/CctpBalances.svelte formatted (trailing commas in props type; one prop per line for CoinBalances; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/bridge/cctp/CctpAttestation.svelte formatted (props type commas; inner type commas; State/Actions comment groups; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/bridge/cctp/CctpAllowance.svelte formatted (trailing commas in props type; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/agents/new/+page.svelte formatted (Context, Functions, State; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/agents/+page.svelte formatted (Types/constants, Context, Functions, (Derived), Components; one prop per line for main, div, a; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/agents/[nodeId]/AgentChatTurnNode.svelte formatted (Context after Types/constants, Props, (Derived), Functions, State, (Derived) showPromptForm, Actions handleRetry, Components, Transitions; one prop per line for a, button; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/agents/[nodeId]/AgentChatTree.svelte formatted (imports in Types/constants with types before values, treeModelValue in (Derived), root div one prop per line; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/agents/[nodeId]/+page.svelte formatted (one prop per line for main; deno task format), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/account/[address]/+page.ts verified compliant (repo style; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/account/[address]/+page.svelte formatted (one prop per line for div, li, span, a; deno task format), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/about/ArchitectureGraph.svelte formatted (one prop per line for div, button, sr-only div; deno task format), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/about/architecture-graph.ts formatted (type literal comma not semicolon in controlPoints; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/about-old/ArchitectureGraph.svelte verified compliant (section spacing, one prop per line for multi-prop divs; deno task format). Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/about-old/architecture-graph.ts verified compliant (repo style; single newline at EOF), box checked. Previous: 2026-02-07: src/routes/about-old/+page.svelte formatted (one prop per line for section elements; deno task format), box checked. Previous: 2026-02-07: src/routes/about-old-2/+page.svelte, about/+page.svelte, accounts/+page.svelte formatted (one prop per line), boxes checked. Previous: 2026-02-07: src/routes/+page.svelte formatted (one prop per line for a; deno task format), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/routes/+layout.svelte verified (one prop per line for link, a, main, button; deno task format run), box already checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/prompt-api.d.ts formatted (single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/Object.d.ts formatted (T[] over Array<T>; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): removed obsolete checklist item src/lib/intents/types.ts (file deleted). src/lib/wallet.ts formatted (commas in type literals; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): removed obsolete checklist items src/lib/tevm-simulation.ts, src/lib/tx-history.spec.ts, src/lib/tx-history.ts (files not present). src/lib/wallet.spec.ts verified compliant (repo style; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/lib/stringify.ts verified compliant (repo style; single newline at EOF), box checked. Previous: 2026-02-07 (PROMPT_build execute one spec): src/lib/stork.ts verified compliant (repo style; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/lib/session/sessions.ts formatted (trailing commas in SessionHashResult type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/lib/session/params.ts formatted (trailing comma in TransactionSessionDefaults type), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): checklist item corrected panel-hash.ts → panelHash.ts; src/lib/session/panelHash.ts verified compliant (repo style; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/lib/rooms/siwe.ts formatted (EIP1193Provider inline type: comma not semicolon between properties), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/lib/rooms/room.ts formatted (RoomMessage and RoomConnection: commas in type literals not semicolons; trailing commas in multi-line types; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/lib/retry.ts formatted (trailing comma in options type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): removed obsolete checklist items src/lib/prompt-value.ts, src/lib/proxy-fetch.ts (files not present). src/lib/retry.spec.ts formatted (import order by path ./ then vitest, types before values; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/lib/llmProvider.ts formatted (trailing commas in types; import order by path, types before values; checklist item llm-provider.ts removed, llmProvider.ts checked). Previous: src/lib/intents/types.ts verified compliant (single newline at EOF; no commas after type properties per formatter), box checked. Previous: src/lib/intents/routes.ts formatted (import order by path ./ then $/, types then values; trailing commas in types and union members; single newline at EOF), box checked. Previous: src/lib/intents/resolveIntent.ts formatted (import order: types then values by path), box checked for resolve-intent.ts. Previous: 2026-02-06 (PROMPT_build execute one spec): src/lib/intents/drag.ts formatted (import order type before value; single newline at EOF), box checked. Previous: src/lib/intents/drag.spec.ts formatted (import order by path, types before values; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/lib/index.ts verified compliant (comment-only; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): removed obsolete checklist items src/lib/entity-suggestions.ts, format-relative-time.ts, graph-model.ts (files not present). src/lib/format.spec.ts formatted (single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/lib/format.ts formatted (trailing newline at EOF), box checked; removed obsolete checklist items src/lib/e2e/tevm-config.ts, src/lib/e2e/tevm.ts (dir not present). Previous: 2026-02-06 (PROMPT_build execute one spec): src/lib/db/queryClient.ts formatted (single newline at EOF; checklist item corrected query-client → queryClient), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/lib/bridge/txStatus.spec.ts formatted (import order types before values; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/lib/bridge/errors.ts formatted (trailing comma in BridgeError type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): removed obsolete checklist item src/lib/agent-chat.ts (file not present; codebase has agentChat.ts). src/lib/bridge/errors.spec.ts formatted (single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/lib/address.ts formatted (trailing commas in return type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/YellowTransfer.ts formatted (trailing comma in YellowTransfer type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/YellowDeposit.ts formatted (trailing commas in YellowDeposit type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/YellowChannel.ts formatted (trailing commas in YellowChannel type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/WalletConnection.ts formatted (trailing commas in types; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/Wallet.ts formatted (trailing commas in Wallet$Id and Wallet types; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/Verification.ts formatted (trailing comma in Verification type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/UniswapPosition.ts formatted (trailing comma in UniswapPosition type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/UniswapPool.ts formatted (single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/TransferRequest.ts formatted (trailing commas in TransferAllocation and TransferRequest types; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/TransactionSessionSimulation.ts formatted (trailing commas in TransactionSessionSimulation type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/TransactionSession.ts formatted (trailing commas in TransactionSessionSimulationSummary, execution, finalization types; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/Trace.ts formatted (trailing comma in Trace type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/TevmSimulationResult.ts formatted (trailing commas in types; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/SwapQuote.ts formatted (trailing commas in SwapRoute, SwapQuote, FetchSwapQuoteParams types; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/StorkPrice.ts formatted (trailing commas in StorkPrice$Id and StorkPrice types), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/SiweChallenge.ts formatted (trailing comma in SiweChallenge type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/SharedAddress.ts formatted (trailing comma in SharedAddress type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/RoomPeer.ts formatted (trailing comma in RoomPeer type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/Room.ts formatted (trailing comma in Room type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/LlmConnection.ts formatted (trailing comma in LlmConnection type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/EntityRef.ts formatted (trailing comma in EntityRef type; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/lib/bridge/txStatus.ts formatted (ternary style for state; checklist updated tx-status → txStatus paths), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/DashboardPanel.ts formatted (trailing commas in types; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/Coin.ts formatted (trailing comma in Coin$Id; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/ChainTransaction.ts formatted (trailing commas in types; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/CctpFee.ts formatted (trailing commas in types; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/CctpAllowance.ts formatted (trailing commas in types; single newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/BridgeRoute.ts formatted (trailing commas in types; trailing newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/Block.ts formatted (trailing comma in type BlockEntry; trailing newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/AgentChatTurn.ts formatted (trailing comma in inline object type), box checked; src/constants/networks.ts icon loading made conditional (inDeno) so Deno test:unit passes; test:unit 44 Deno + 106 Vitest passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/AgentChatTree.ts formatted (trailing newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/ActorCoin.ts formatted (trailing newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/ActorAllowance.ts formatted (trailing newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/Actor.ts formatted (trailing newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/data/$EntityType.ts formatted (trailing newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/yellow.ts formatted (trailing commas in types and generics; trailing newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/uniswap.ts formatted (trailing newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/token-lists.ts formatted (chained .map break, trailing newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/stork.ts formatted (trailing newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/slippage.ts formatted (inlined single-use factor in calculateMinOutput; single-expression return; trailing newline), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/slippage.spec.ts verified compliant (repo style), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/rpc-endpoints.ts formatted (trailing newline at EOF), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/query-limits.ts formatted (trailing newline at EOF), box checked. Previous: src/constants/proxy.ts formatted (trailing newline; single newline at EOF). Vitest 106 passed; Deno test blocked by networks.ts asset import in test env. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/opencode-zen.ts formatted (single-expression return parens), box checked; test:unit 44 Deno + 106 Vitest passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/networks.ts formatted (chained .entries() break, trailing newline), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/interop.ts formatted (inlined single-use EIP155_VERSION/CHAIN_TYPE; trailing newline), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): removed obsolete checklist item src/constants/icons.ts (file not present); src/constants/interop.spec.ts verified compliant (repo style; trailing newline), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/identity-resolver.ts formatted (trailing commas in types; inlined single-use byId/byKind; trailing newline), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/explorers.ts verified compliant (repo style: single quotes, no semicolons, import with extension, trailing newline), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/explorers.spec.ts verified compliant (repo style), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/entity-types.ts formatted (trailing newline), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/entity-ref-patterns.ts verified compliant (repo style), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): removed obsolete checklist item src/constants/chain-icon-fetch-items.ts (file deleted per spec 052); src/constants/data-sources.ts formatted (trailing newline), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/constants/coins.ts formatted (trailing newline). Previous: 2026-02-06 (PROMPT_build execute one spec): src/hooks.server.ts formatted (import order by path $env then $/ then @sveltejs, space after if, single-expression return, trailing newline). Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/TruncatedValue.svelte formatted (trailing comma in props type; deno task format). Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/Tooltip.svelte formatted (trailing commas in props type; deno task format). Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/Toast.svelte formatted (deno task format), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/Timestamp.svelte formatted (comment-delimited (Derived); trailing commas in props type; one prop per line for time elements; deno task format). Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/Tabs.svelte formatted (comment-delimited Types/constants, Components, Props; trailing commas in props type; one prop per line for Trigger/Content; deno task format). Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/Spinner.svelte formatted (comment-delimited Props; trailing comma in props type; one prop per line; deno task format). Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/Skeleton.svelte formatted (comment-delimited Props; trailing commas in props type; deno task format). Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/SigmaGraphView.svelte formatted (trailing comma in props type; deno task format). Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/Select.svelte formatted (comment-delimited Types/constants, Functions, Props, (Derived), Components; trailing commas in props type; deno task format). test:unit 44 Deno + 106 Vitest passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/RichTextareaReference.svelte formatted (comment-delimited Components, Props, State, (Derived), Functions; trailing comma in props type; deno task format). test:unit 44 Deno + 106 Vitest passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/RichTextarea.svelte formatted (comment-delimited (Derived) groups; deno task format). Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/network/Transaction.svelte formatted (trailing commas in props type; deno task format). Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/network/Trace.svelte formatted (trailing commas in props type; deno task format). Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/network/Network.svelte formatted (trailing comma in props type; deno task format). test:unit 44 Deno + 106 Vitest passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/network/Event.svelte formatted (trailing commas in props type; deno task format). test:unit 44 Deno + 106 Vitest passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/network/Block.svelte formatted (comment-delimited Types/constants, Functions, Components, Props, (Derived), State, Actions; two empty lines between groups; deno task format). test:unit 44 Deno + 106 Vitest passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/ModelInput.svelte verified compliant (section spacing via deno task format), box checked; test:unit 44 Deno + 106 Vitest passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/LoadingButton.svelte formatted (comment-delimited Components, Props; two empty lines between groups; deno task format). Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/ItemsList.svelte formatted (comment-delimited Functions, (Derived); two empty lines between sections; deno task format). Previous: src/components/IntentDragPreview.svelte formatted (two empty lines between </script> and template; deno task format). Previous: src/components/Icon.svelte formatted (comment-delimited Props, (Derived); two empty lines between groups; deno task format). Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/G6GraphView.svelte formatted (comment-delimited groups Types/constants, Functions, Props, (Derived); two empty lines between sections; deno task format). Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/EvmActor.svelte formatted (comment-delimited groups Types/constants, Components, Props, (Derived); two empty lines between groups; deno task format). Previous: src/components/EntityRefInput.svelte formatted (comment-delimited groups Types/constants, Components, Props, Functions, State, (Derived), Actions; two empty lines between groups; deno task format). Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/EntityReferenceInput.svelte formatted (comment-delimited groups Types/constants, Components, Props, Functions, State, (Derived); two empty lines between groups; deno task format). Previous: src/components/EntityId.svelte formatted (comment-delimited groups Types/constants, Props, Functions; two empty lines between groups; deno task format). Previous: src/components/Dropdown.svelte formatted (comment-delimited groups Types/constants, Props, (Derived), Actions, Components; two empty lines between groups; one prop per line for multi-prop elements; deno task format). Previous: src/components/Draggable.svelte.ts formatted (import order by path $/ then svelte, types before values; trailing comma in DraggableOptions; deno task format run). Previous: src/components/DragArrow.svelte formatted (comment-delimited groups Types/constants, Components, Props, (Derived); two empty lines between groups; deno task format), box checked. Previous: src/components/Combobox.svelte formatted (comment-delimited groups Types/constants, Props, Functions, State, (Derived), Actions, Components; deno task format), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/Boundary.svelte formatted (comment-delimited groups Types/constants, Functions, Props; deno task format), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/components/Address.svelte formatted (import order types before values, one prop per line; deno task format), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/yellow-transfers.ts formatted (import order $/ then @tanstack, types before values), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/yellow-channels.ts formatted (import order $/ then @tanstack, types before values), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/yellow-channel-states.ts formatted (import order $/ then @tanstack, types before values), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/wallets.ts formatted (import order $/ then @tanstack then devalue, types before values), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/verifications.ts verified compliant (repo style), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/verifications.spec.ts formatted (inlined single-use k1/k2 in normalizes test), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/verifications-keys.ts verified compliant (repo style), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/uniswap-positions.ts formatted (import order $/ then @tanstack, types before values; removed unused normalizeUniswapPosition import), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/uniswap-positions.spec.ts formatted (import order $/ then ./, types before values), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/uniswap-positions-normalize.ts verified compliant (trailing comma, import $/, single quotes), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/uniswap-pools.ts formatted (import order $/ then @tanstack then ./, types before values), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/uniswap-pools.spec.ts formatted (import order $/ then ./, types before values; trailing newline), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/uniswap-pools-normalize.ts formatted (trailing newline), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/transfer-requests.ts formatted (import order $/ then @tanstack, types before values), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/transfer-graphs.ts formatted (import order $/ then @tanstack, types before values), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/transfer-events.ts formatted (import order by path $/ then @tanstack, types before values; removed unused TIME_PERIODS import), box checked. Previous: src/collections/transactions.ts formatted (import order by path $/ then @tanstack then devalue, types before values; parser object parse, stringify with trailing comma), box checked. Previous: src/collections/transaction-sessions.ts verified compliant (repo style), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: src/collections/transaction-session-simulations.ts formatted (import order by path $/ then @tanstack then devalue, types before values), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/token-list-coins.ts formatted (import order by path $/ then @tanstack, types before values), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/swap-quotes.ts formatted (import order by path $/ then @tanstack then ./), box checked; deno test swap-quotes.spec.ts 1 passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/swap-quotes.spec.ts formatted (import order by path $/ then ./, types before values), box checked; deno test swap-quotes.spec.ts 1 passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/stork-prices.ts formatted (import order by path $/ then @tanstack/@tevm/devalue/$env), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/siwe-challenges.ts formatted (import order $/ then @tanstack, types before values), box checked; deno test siwe-challenges.spec.ts 2 passed. Previous: src/collections/siwe-challenges-keys.ts formatted (return on new line to match room-peers-keys), box checked; deno test siwe-challenges.spec.ts 2 passed. Previous: src/collections/shared-addresses.spec.ts formatted (inlined single-use k1/k2 in normalizes test), box checked; deno test shared-addresses.spec.ts 3 passed. Previous: src/collections/shared-addresses-keys.ts formatted (ternary style), box checked. Previous: src/collections/room-peers.ts formatted (import order by path $/ then @tanstack, types before values), box checked. Previous: src/collections/room-peers-keys.ts formatted (multi-line params, trailing comma), box checked. Previous: src/collections/networks.ts formatted (import order by path $/ then @tanstack, types before values), box checked. Previous: src/collections/networks.spec.ts verified compliant (repo style), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/my-peer-ids.ts formatted (import order by path $/ then @tanstack), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/llm-connections.ts formatted (import order by path $/ then @tanstack then devalue, types before values), box checked. Previous: src/collections/identity-resolution.ts formatted (import order by path $/ then @tanstack, types before values), box checked. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/evm-actor-profiles.ts formatted (import order by path $/ then @tanstack, types before values), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: src/collections/dashboard-panels.ts formatted (import order by path $/ then devalue then @tanstack, types before values), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: Tasks reset; execution rule: one file per run. 2026-02-06 (PROMPT_build execute one spec): src/collections/coins.ts formatted (import order by path $/ then @tanstack, types before values), box checked. Previous: src/collections/coins.spec.ts verified compliant (repo style; not in Deno test list—imports coins.ts which pulls Node deps), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: src/collections/chain-transactions.ts formatted (import order by path $/ then @tanstack, types before values; inlined existing check; removed unused ChainTransaction$Id import), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: 2026-02-06 (PROMPT_build execute one spec): src/collections/cctp-fees.ts formatted (import order by path, types before values; inlined existing/fetchedAt; ternary style), box checked. Previous: src/collections/cctp-allowance.ts formatted (import order by path, types before values; inlined single-use existing), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: src/collections/agent-chat-turns.ts formatted (import order by path, types before values), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: src/collections/agent-chat-trees.ts formatted (import order by path, types before values), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: src/collections/actors.ts formatted (import order by path, types before values), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: src/collections/actors.spec.ts formatted (inlined single-use key1/key2), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: src/collections/actor-coins.ts formatted (inlined single-use existing, full$id; repo style), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: src/collections/actor-coins.spec.ts formatted (inlined single-use fractionalStr in formatBalance return), box checked. Previous: src/collections/actor-allowances.ts formatted (ternary style), box checked. Previous: src/app.d.ts formatted (trailing comma in PageState), box checked. Previous: src/api/voltaire.ts verified compliant, box checked. Previous: src/api/yellow.ts formatted (ternary style, trailing comma in Map type), box checked. Formatting is manual to repo preferences; `deno task format` runs scripts/_svelte-section-spacing.ts (two empty lines between Svelte sections and comment groups in <script>). Formatter subagent may inline single-use variables/types (spec 041). 2026-02-06 (PROMPT_build execute one spec): src/api/voltaire.spec.ts verified compliant, box checked. Previous: src/api/simulate.ts formatted (ternary style), box checked. Previous: src/api/llm/zen.ts verified compliant, box checked; test:unit 44 Deno + 101 Vitest passed. Previous: src/api/identity-resolve.ts formatted (chained call break in bytes32FromNamehash), box checked; test:unit 44 Deno + 101 Vitest passed. Previous: src/api/cctp.ts formatted (T[] over Array<T>), box checked; test:unit 44 Deno + 101 Vitest passed.

## Output when complete

`DONE`
