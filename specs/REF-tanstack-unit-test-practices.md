# Reference: TanStack unit test practices

> **Note:** This is a reference document, not a spec with acceptance criteria.

Reference: [TanStack Query – Testing](https://tanstack.com/query/latest/docs/framework/react/guides/testing). TanStack DB builds on Query; these apply where collections use Query under the hood.

## Isolation

- **Fresh client per test** – Create a new `QueryClient` per test, or call `queryClient.clear()` before each test.

## Query client defaults in tests

- **Turn off retries** – Set `defaultOptions.queries.retry: false` to avoid timeouts.

## Async and data assertions

- **waitFor** – Wait until query has resolved before asserting on data.
- **Mock network/queryFn** – Mock the data source to control returned data.

## Query-db-collection caveat

The query-db-collection stores data internally and does **not** expose raw `queryFn` result via `queryClient.getQueryData()`. Unit tests that assert "normalized shape" either:

- Assert on the **source data + same normalization** (duplicate mapping in test), or
- Test through **live queries** in a component.

Our collections spec uses the first approach.
