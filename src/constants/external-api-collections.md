# External APIs and TanStack DB collections (Spec 065)

Every external API that provides data to the UI or routes must be cached in a TanStack DB collection and read only via live queries. Normalization happens at the collection boundary.

| External API / source              | Collection module                                | Sync / fetch                                      |
| ---------------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| Voltaire (eth\_\*, RPC)            | `blocks.ts`                                      | `fetchBlock` → upsert                             |
| Voltaire (eth\_\*, RPC)            | `actor-coins.ts`                                 | `fetchActorCoinBalance` → upsert                  |
| Voltaire (eth\_\*, RPC)            | `actor-allowances.ts`                            | fetch → upsert                                    |
| Voltaire (eth\_\*, RPC)            | `chain-transactions.ts`                          | fetch → upsert                                    |
| Voltaire (eth\_\*, RPC)            | `transfer-events.ts`                             | `fetchTransferEvents` → upsert                    |
| Voltaire (eth\_\*, RPC)            | `transfer-graphs.ts`                             | `fetchTransferGraph` → upsert                     |
| Stork (REST / WebSocket / RPC)     | `stork-prices.ts`                                | `subscribeStorkPrices` → upsert                   |
| LI.FI (getQuote, routes)           | `bridge-routes.ts`                               | queryFn / fetch → upsert                          |
| CCTP (REST)                        | `cctp-fees.ts`                                   | fetch → upsert                                    |
| CCTP (REST)                        | `cctp-allowance.ts`                              | fetch → upsert                                    |
| Token list URLs                    | `token-list-coins.ts`                            | fetch → upsert                                    |
| Uniswap (quote)                    | `swap-quotes.ts`                                 | `fetchSwapQuote` → upsert                         |
| Transfers indexer / logs           | `transfer-events.ts`                             | `fetchTransferEventsForPeriod` (api) → collection |
| Identity (RPC / resolver)          | `identity-resolution.ts`                         | fetch → upsert                                    |
| Voltaire (ENS reverse + forward)   | `evm-actor-profiles.ts`                          | `fetchEvmActorProfile` → upsert                   |
| Networks (constant + optional RPC) | `networks.ts`                                    | queryFn / constant                                |
| PartyKit (rooms, peers, etc.)      | `rooms.ts`, `room-peers.ts`, etc.                | subscription → upsert                             |
| Yellow (channels, deposits, etc.)  | `yellow-channels.ts`, `yellow-deposits.ts`, etc. | subscription / fetch → upsert                     |

Fetch and subscription logic lives in the collection module (or an api module called only from the collection). Components and routes use `useLiveQuery` (or derived live-query collections) only.
