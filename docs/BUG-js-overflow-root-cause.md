# JS overflow root cause (RangeError: Invalid string length / OOM)

## Cause

**Single offending usage:** Home page `dashboardRowVersionQuery` in `src/routes/+page.svelte`.

- Query: `useLiveQuery(..., q.from({ row: dashboardsCollection }).where(...).select(({ row }) => ({ row })))`
- The selected row is a **dashboard state row** whose type has `root: PanelTreeNode`.
- `PanelTreeNode` is **recursive**: `SplitNode` has `first: PanelTreeNode` and `second: PanelTreeNode`, so the tree can be arbitrarily deep.
- TanStack DB passes a **ref-proxy** for `row` into the select callback to track which fields are read. The proxy builds a path array for every property access and calls `path.join('.')` for cache keys and in `ownKeys` (see `node_modules/.../ref-proxy.js`).
- When anything (library internals, Svelte reactivity, or devalue/SSR) **traverses** the selected result (e.g. enumerating keys or serializing), it touches `row.root`, then `row.root.first`, `row.root.first.second`, … so the path becomes `row.root.first.second.first...` and grows without bound → `path.join('.')` produces a string that exceeds max length → **RangeError** or (during serialization) **OOM**.

## Fix

Do **not** select the full row for the dashboard state row that contains `root`. Select only a shallow identifier (e.g. `row.$id.id`) and read the full state (including `root`) from `getDashboardState(id)` so the ref-proxy never sees the deep tree.

## Other full-row queries

- **Layout** (`navigationItems.svelte.ts`): `sessionsQuery`, `agentChatTreesQuery`, etc. use full row. Session has `actions: Action[]` (can be deep); AgentChatTree row is flat. If the crash was only on home, the dashboard query is the isolate; if it also crashed on other routes, layout sessions (or another full-row query) may contribute once the dashboard fix is in.
