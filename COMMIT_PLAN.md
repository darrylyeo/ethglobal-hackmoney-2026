# Commit plan: current working tree (formatting/style)

## Analysis

All current changes are **style-only** (no logic or API changes):

- **Script section order:** Types/constants → Context → State → (Derived) → Functions → etc. (specs 041, 056).
- **Rune line breaks:** `$state(x)` and `$derived(x)` → value on its own indented line.
- **Blank lines:** Two between Svelte sections and script comment groups; remove stray extra newlines.

No topological dependencies; safe to commit in one or more groups by directory.

## Minimal commit set (recommended)

**One commit** — same concern everywhere.

| # | Message | Files |
|---|---------|--------|
| 1 | `style: script section order and $state/$derived line breaks` | All modified except COMMIT_PLAN.md |

Optional second commit: `docs: update COMMIT_PLAN` (this file) — or leave uncommitted.

---

## Exact git commands (do not run until you approve)

```bash
# Commit 1 — all formatting (components, lib, routes, views)
git add src/components/ src/lib/ src/routes/ src/views/
git commit -m "style: script section order and \$state/\$derived line breaks"

# Verify
deno task check
```

To include COMMIT_PLAN in the same commit:

```bash
git add COMMIT_PLAN.md
# (add to the same git add as above, then single commit)
```

To commit COMMIT_PLAN separately:

```bash
git add COMMIT_PLAN.md
git commit -m "docs: update COMMIT_PLAN for format pass"
```

---

## Alternative: split by directory (4 commits)

If you prefer smaller commits by area:

| # | Message | Paths |
|---|---------|--------|
| 1 | `style: script order and rune line breaks in components` | `src/components/` |
| 2 | `style: script order and rune line breaks in lib` | `src/lib/reorder/` |
| 3 | `style: script order and rune line breaks in routes` | `src/routes/` |
| 4 | `style: script order and rune line breaks in views` | `src/views/` |

After each: `deno task check`.

---

## Completed (previous session)

| SHA       | Message |
|-----------|---------|
| 05411514  | Block, Transaction: EntityView Title and entity.$id; drop networkId; update callers |
| 017fa684  | Network page: pass href instead of titleHref |
| fb08eeeb  | Consensus/Epochs: EntityType, NetworkEpochs, Network showConsensus + isLoading |
| b9c2865e  | Layout: Contracts below grid, .network-layers |
