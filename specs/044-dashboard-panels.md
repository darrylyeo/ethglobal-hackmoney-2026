# Spec 044: Dashboard Panel System

Add a `/dashboard` route that hosts a modular tiling panel system. When loaded normally, it shows the panel tree. When loaded inside a panel (e.g. user selects "dashboard" in the panel route dropdown), it shows a grid of links to all routes instead of nesting another dashboard. Each panel can render any existing SvelteKit route; panels keep their own hash navigation history and persist layout + history in TanStack DB. Users may create multiple dashboards, choose a default, and manage them from nav and a dedicated management route.

## Scope

- Define the panel tree model (tiling windows) and supported operations.
- Define per-panel route rendering and hash navigation history rules.
- Define focus/unfocus behavior for syncing hash history into SvelteKit navigation.
- Define persistence in a dedicated TanStack DB collection.
- Define in-panel link interception and modifier-click split navigation.
- Support multiple dashboards: create, list, delete, rename; one dashboard is the default.
- Show dashboards in the main navigation (e.g. list or submenu).
- Provide a `/dashboards` route to manage dashboards and set the default.

## Non-goals

- Do not implement data loading or UI for routes being rendered inside panels.
- Do not add cross-panel shared navigation history.
- Do not define global theme tokens beyond what is needed to express layout.

## Definitions

- **Dashboard route**: `/dashboard`. Overloaded: top-level load shows the panel tree for the current (or default) dashboard; load within a panel shows a grid of links to all routes (no nested dashboards). Optional query/param to open a specific dashboard by id (e.g. `/dashboard?d=id` or `/dashboard/[id]`).
- **Dashboards route**: `/dashboards`. List all dashboards, create new, delete, rename, and set the default dashboard.
- **Default dashboard**: The dashboard opened when the user navigates to `/dashboard` with no id. Stored in app preferences or the same collection (e.g. `defaultDashboardId`).
- **Panel**: A leaf node in the tiling tree that renders a single route at a time.
- **Panel tree**: A binary tiling layout with split direction and ratio at internal nodes.
- **Panel history**: The ordered list of hash URLs visited within a panel.
- **Focused panel**: The panel that currently receives navigation updates.

## Data model sketch

- **PanelNode**
  - `id`: unique id
  - `route`: target SvelteKit route (any route; when `/dashboard`, the page renders the route grid in-panel)
  - `params`: route params for dynamic routes
  - `hashHistory`: list of `#hash` strings in visit order
- **SplitNode**
  - `id`: unique id
  - `direction`: `SplitDirection` (Horizontal | Vertical) from `src/data/PanelTree.ts`
  - `ratio`: number between 0 and 1
  - `first`: PanelNode | SplitNode
  - `second`: PanelNode | SplitNode
- **DashboardState** (one row per dashboard)
  - `$id`: unique dashboard id (e.g. `{ id: string }`)
  - `name`: user-facing label (optional; default derived from id or "Dashboard N")
  - `root`: PanelNode | SplitNode
  - `focusedPanelId`: PanelNode id
- **Default dashboard**: A single stored id (e.g. in a separate row or a small preferences collection) indicating which dashboard to open at `/dashboard` when no id is given.

## Persistence

- Create a new persisted TanStack DB collection dedicated to dashboard panels.
- Use localStorage-backed persistence with a new `storageKey` (e.g. `dashboard-panels`).
- Persist one row per dashboard; each row has `$id`, optional `name`, `root`, `focusedPanelId`.
- Persist the default dashboard id (e.g. same collection with a sentinel row, or a separate key).
- Restore persisted state on load; ensure at least one dashboard exists and has a default. If empty, create one default dashboard and set it as default.

## Navigation rules

- Panels may render any existing SvelteKit route. If the route is `/dashboard`, the dashboard page detects it is embedded and renders a grid of links to all routes (not the panel tree), avoiding nested dashboards.
- Each panel manages its own `hashHistory` of `#hash` strings (legacy; session state now uses `page.state.sessionState`).
- Internal anchor clicks inside a panel are intercepted and routed within that panel.
- Modifier-click (Cmd/Ctrl) on an internal anchor opens the target route in a new split panel.
- For state updates without navigation, use SvelteKit shallow routing (`pushState`/`replaceState`) to store state in `page.state` (see https://svelte.dev/docs/kit/shallow-routing).
- When a panel is focused, its `hashHistory` is pushed onto the SvelteKit navigation stack via `pushState` with `page.state.sessionState` containing the parsed session state (no hash in URL).
- When a panel loses focus, all hash entries pushed for that panel are popped off the SvelteKit navigation stack.
- Switching focus only changes the navigation stack to match the newly focused panel.
- Full route changes for a panel use `goto()` with a pathname (and params resolved) to keep SvelteKit load behavior.

## Nav and dashboards management

- **Nav**: Show dashboards in the main app navigation. Options: (a) a single "Dashboard" link that goes to the default dashboard, with a "Dashboards" item that links to `/dashboards` or expands to list each dashboard; or (b) a "Dashboards" parent item whose children are each dashboard (by name or id), plus a link to "Manage" or `/dashboards`. The default dashboard can be indicated (e.g. icon or label).
- **`/dashboards`**: Management page that lists all dashboards (name, id), allows creating a new dashboard (generates id and default panel tree), renaming, deleting (with guard if it is the default), and setting the default dashboard. At least one dashboard must exist; if the default is deleted, another is chosen or the sole remaining one becomes default.

## Acceptance criteria

- [x] A new spec exists at `specs/044-dashboard-panels.md` describing the dashboard panel system.
- [x] The spec defines the panel tree model with split nodes and panel nodes.
- [x] The spec states that panels can render any route; when the route is `/dashboard`, the page shows the route link grid in-panel (no nested dashboard).
- [x] The spec defines per-panel hash history and focus/unfocus navigation stack rules.
- [x] The spec defines a new persisted TanStack DB collection with localStorage backing.
- [x] The spec defines restoration behavior and default panel initialization when empty.
- [x] The spec allows multiple dashboards (create, list, delete, rename) and defines a default dashboard.
- [x] The spec requires dashboards to be shown in the main navigation.
- [x] The spec defines a `/dashboards` route for managing dashboards and setting the default.

## Status

Complete.

## Output when complete

`DONE`
