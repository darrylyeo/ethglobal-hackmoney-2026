# Spec 042: Entity data sources

Implementation complete. DataSource enum (with Covalent), all collection entities have $source, transfer-graphs collection for Voltaire transfer data, transfers page uses collection and source-filtered query. CctpFees/CctpAllowance where() fixed to use eq(row.$source, DataSource.Cctp) only; row selection by apiHost/fromDomain/toDomain done in component.

Route-coverage e2e (7 tests) and Transfers e2e pass. Full pnpm test:e2e has 12 pre-existing failures (bridge/cctp/unified-bridge chain select timeouts, accessibility, bridge-e2e mocks). Not outputting DONE until full e2e passes or spec e2e criterion is relaxed.
