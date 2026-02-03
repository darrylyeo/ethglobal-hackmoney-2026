# Spec 043: Svelte Component Organization

Clarify where Svelte components live and how to decide between `routes/`, `views/`,
and `components/`.

## Scope

- Define the directory rules for route-scoped, view-level, and shared components.
- Document import guidance to keep route-local components colocated.
- Establish naming expectations for UI building blocks vs domain-specific UIs.

## Non-goals

- Do not change runtime behavior.
- Do not rewrite existing components unless they violate the rules.
- Do not prescribe styling or formatting rules (covered by Spec 041).

## Definitions

- **Route-local**: UI only used within a single route folder.
- **View-level**: UI shared across routes, or tied to a domain workflow (bridge,
  swap, transfers, rooms, architecture) but not a generic UI primitive.
- **Shared UI**: Reusable primitives or generic widgets used across multiple
  domains.

## Rules

### `src/routes/**`

- Place route-local components in the same route folder when they are only used
  by that route (e.g. `src/routes/rooms/Peer.svelte`).
- Prefer relative imports for colocated route components (e.g. `./Peer.svelte`).

### `src/views/**`

- Place view-level, domain-specific UI here when it is shared across multiple
  routes or used by multiple domain flows (e.g. `Wallets`, `Balances`,
  `TransactionFlow`, domain-specific inputs).
- View components may import shared UI from `src/components/**` and route-local
  components should not import from `src/routes/**`.

### `src/components/**`

- Keep only shared UI primitives and generic utilities here (e.g. `Select`,
  `Combobox`, `Dropdown`, `Spinner`, `Toast`).
- Components here should avoid direct dependencies on route data sources or
  domain-specific collections/state.

## Acceptance criteria

- [ ] Route-local components live inside their route folders and are imported via
  relative paths.
- [ ] View-level components that are shared across multiple routes live in
  `src/views/`.
- [ ] `src/components/` contains only shared UI primitives or generic widgets.
- [ ] No `src/views/` component imports from `src/routes/`.

## Plan

- [ ] Add shared primitives (`Dropdown`, `Icon`) to `src/components/`.
- [ ] Move domain components from `src/components/` into `src/views/`.
- [ ] Move route-local components into their route folders.
- [ ] Update route imports to point at new locations.
- [ ] Verify `src/components/` is only shared primitives.

## Cleanup

Delete this spec once the plan and acceptance criteria are completed to avoid
confusion for future agents.

## Status

Draft. Pending review and clean-up passes to align existing components.

## Output when complete

`DONE`
