# Spec 049: Transaction simulation with Tevm runtime

Define transaction simulation powered by the Tevm runtime, including all data
sources, persistence, and trace/event visualization for transaction sessions.

## Scope

- Simulate draft transaction sessions using Tevm runtime (`@tevm/vm`).
- Resolve all data sources required to build a deterministic simulation payload.
- Persist simulation metadata and results on the active session.
- Visualize traces and events in the transaction flow UI.

## Non-goals

- No replacement of the actual execution path or wallet submission.
- No partial simulation fallback to remote tracing APIs.
- No chain-specific custom simulators outside Tevm runtime.

## Definitions

### Tevm simulation

A deterministic execution of the draft transaction using Tevm runtime with an
in-memory fork and decoded traces/events.

### Trace view

A nested call tree of runtime execution, with gas, value, and revert data.

### Event view

A decoded log timeline with indexed topics, arguments, and emitter metadata.

## Data sources

Simulation payloads must be constructed from the union of the following sources:

- Transaction session params (`TransactionSession.params`)
- Current flow-derived transaction request (to, data, value, gas)
- Active wallet and chain selection (chain id, sender address)
- Chain metadata (chain id, native token, RPC endpoints)
- Token list + coin metadata (symbol, decimals, addresses)
- ABI registry and contract metadata from Voltaire
- External route data (LiFi/CCTP quotes when applicable)
- User preferences (slippage, gas settings, deadline)
- Cached balances/allowances needed to resolve prerequisites

## Runtime integration

- Use Tevm runtime with a forked chain state per active session.
- Fork source RPC must come from Voltaire RPC configuration.
- Include `blockTag` fork metadata when provided (session or chain defaults).
- Prefer `createMemoryClient` with fork + `common` chain config when forking.
- Fork transport must be EIP-1193 compatible and initialized via Tevm `http()` transport.
- Execute simulation via Tevm call actions (`tevmCall` / `tevmContract`).
- ABI decoding and log formatting must use Voltaire-provided ABIs.
- Simulation must always be driven from the session params to remain replayable.

## Forking strategy

- Use a fixed `blockTag` for deterministic simulation replays.
- Prefer forking from an existing Tevm node transport when re-simulating in bulk.
- Avoid deep copies unless isolation is required for concurrent simulations.

## Trace capture

- Collect call tree using `onBeforeMessage` / `onAfterMessage` hooks.
- Collect opcode-level traces using `onStep` when deep debugging is enabled.
- Always call the `next()` callback in Tevm event handlers.
- Use `execResult.exceptionError` + return data for revert reason decoding.

## Event capture

- Decode logs from `execResult.logs` into the event view model.
- Preserve raw topics/data for toggling visibility.
- Map log addresses to ABI registry entries for signature resolution.

## Persistence

- Store simulation result on the active transaction session under
  `TransactionSession.simulation`.
- Include both raw runtime output and decoded artifacts.
- Persist the fork metadata (block number, rpc url, timestamp) for traceability.
- Persist a summarized status (`success`, `revert`, `error`) and gas totals.

## Trace visualization

- Add a trace panel to transaction flow views when a session is in Draft.
- Render a collapsible call tree with per-call gas, value, and revert info.
- Allow filtering by contract, function, or error selector.
- Highlight the primary call that matches the transaction request.

## Event visualization

- Add an events panel listing decoded logs in execution order.
- Each event shows emitter, signature, args, and block metadata.
- Allow toggling raw topics/data visibility per event.
- Provide a compact diff view for balance-impacting events.

## Error handling

- Tevm errors must be surfaced with root-cause data (selector, revert reason).
- Simulation failures must keep the session in Draft and allow edits.
- Re-simulation overwrites previous results but preserves history in the session.

## Acceptance criteria

- [x] Draft sessions can simulate using Tevm runtime with forked chain state.
- [x] Simulation payload includes all sources listed in the data sources section.
- [x] Simulation results persist on `TransactionSession.simulation` with fork
  metadata, summary status, and gas totals.
- [x] Trace panel renders a nested call tree with gas, value, and revert data.
- [x] Event panel renders decoded logs with toggles for raw topics/data.
- [x] Filters allow narrowing trace/event views by contract or selector.
- [x] Re-simulation updates the stored result without changing session params.

## TODOs

- TODO: Confirm the preferred Tevm runtime API wrapper (direct vs Voltaire helper).
- TODO: Decide if session simulation history needs its own collection.
- TODO: Define the balance-impact diff view format.

## Sources

- https://tevm.sh/core/create-tevm-node
- https://tevm.sh/api/methods
- https://tevm.sh/api/evm-events
- https://tevm.sh/reference/vm
- https://node.tevm.sh/core/forking

## Status

Complete. Simulation runs client-side: runTevmSimulation in src/api/simulate.ts (Tevm fork + runTx with impersonation); runTevmSimulationFromClient in src/lib/tevm-simulation.ts calls it in-browser. Returns forkMetadata, summaryStatus, gasTotals, trace, events, rawLogs. TransactionSession.simulation optional summary; SwapAction calls when Simulate clicked (rpcUrl + selectedActor), persists Tevm result and summary. SimulationTracePanel and SimulationEventPanel with contract/selector filters; raw toggle on events. Re-simulation creates new simulation row and updates latestSimulationId/simulation without changing params. tevm in dependencies.

## Output when complete

`DONE`
