# Spec 044: Dashboard Panel System

Add a `/dashboard` route that hosts a modular tiling panel system. Each panel can render any existing non-dashboard SvelteKit route, keeps its own hash navigation history, and persists layout + history in TanStack DB.

## Scope

- Define the panel tree model (tiling windows) and supported operations.
- Define per-panel route rendering and hash navigation history rules.
- Define focus/unfocus behavior for syncing hash history into SvelteKit navigation.
- Define persistence in a dedicated TanStack DB collection.
- Define in-panel link interception and modifier-click split navigation.

## Non-goals

- Do not implement data loading or UI for routes being rendered inside panels.
- Do not add cross-panel shared navigation history.
- Do not define global theme tokens beyond what is needed to express layout.

## Definitions

- **Dashboard route**: `/dashboard` and any nested routes under `/dashboard/**`.
- **Panel**: A leaf node in the tiling tree that renders a single route at a time.
- **Panel tree**: A binary tiling layout with split direction and ratio at internal nodes.
- **Panel history**: The ordered list of hash URLs visited within a panel.
- **Focused panel**: The panel that currently receives navigation updates.

## Data model sketch

- **PanelNode**
  - `id`: unique id
  - `route`: target SvelteKit route (non-dashboard)
  - `params`: route params for dynamic routes
  - `hashHistory`: list of `#hash` strings in visit order
- **SplitNode**
  - `id`: unique id
  - `direction`: `horizontal` or `vertical`
  - `ratio`: number between 0 and 1
  - `first`: PanelNode | SplitNode
  - `second`: PanelNode | SplitNode
- **DashboardState**
  - `root`: PanelNode | SplitNode
  - `focusedPanelId`: PanelNode id

## Persistence

- Create a new persisted TanStack DB collection dedicated to dashboard panels.
- Use localStorage-backed persistence with a new `storageKey` (e.g. `dashboard-panels`).
- Persist the entire panel tree and focused panel id.
- Restore persisted state on load; initialize a single default panel if empty.

## Navigation rules

- Panels may render any existing SvelteKit route except dashboard routes.
- Each panel manages its own `hashHistory` of `#hash` strings.
- Internal anchor clicks inside a panel are intercepted and routed within that panel.
- Modifier-click (Cmd/Ctrl) on an internal anchor opens the target route in a new split panel.
- For hash-only updates, use `$app/navigation` shallow routing (`pushState`/`replaceState`) instead of `history.*` so SvelteKit state stays in sync.
- When a panel is focused, its `hashHistory` is pushed onto the SvelteKit navigation stack as hash URLs (in order) via `pushState`.
- When a panel loses focus, all hash entries pushed for that panel are popped off the SvelteKit navigation stack.
- Switching focus only changes the navigation stack to match the newly focused panel.
- Full route changes for a panel use `goto()` with a pathname (and params resolved) to keep SvelteKit load behavior.

## Acceptance criteria

- [x] A new spec exists at `specs/044-dashboard-panels.md` describing the dashboard panel system.
- [x] The spec defines the panel tree model with split nodes and panel nodes.
- [x] The spec states that panels can render any non-dashboard SvelteKit route.
- [x] The spec defines per-panel hash history and focus/unfocus navigation stack rules.
- [x] The spec defines a new persisted TanStack DB collection with localStorage backing.
- [x] The spec defines restoration behavior and default panel initialization when empty.

## Status

Complete.

## Output when complete

`DONE`
