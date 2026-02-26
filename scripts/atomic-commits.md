# Atomic Commits Methodology

Agent instructions for creating granular, atomic commits in topological order. **Each commit must be hunk-aware and leave the project buildable.**

---

## Overview

When the user asks you to commit staged/modified changes atomically:

1. **Analyze** all changes at **hunk level** (not just file level)
2. **Plan** commits in topological order (dependencies first), assigning **hunks** to commits
3. **Execute** each commit by staging only the **relevant hunks** (`git add -p` when a file spans multiple commits)
4. **Verify** the build after **every** commit; if it fails, undo, split, and re-commit until the commit passes

---

## Phase 1: Analyze Changes (hunk-aware)

Work at **hunk granularity** so a single file can be split across multiple commits. Use `git diff` to see hunk boundaries (`@@ -start,count +start,count @@`).

```bash
# Get overview of all changes
git status --short

# Full diff with hunk boundaries (use to assign hunks to commits)
git diff --no-color -U0
# Boundaries only: git diff --no-color -U0 | grep -E '^(@@|diff --git)'

# Check recent commit style
git log --oneline -20
```

Categorize each **hunk** (or file when it has a single concern):

- **Independent**: Can be committed in any order
- **Dependency**: Must come before files/hunks that import or use it
- **Atomic group**: Hunks (possibly across files) that must change together (e.g., prop renames)
- **Deletion**: Must come after removing all usages
- **Mixed file**: List which hunks go in which commit; stage with `git add -p` when executing

---

## Phase 2: Plan Commits

Create a `COMMIT_PLAN.md` with:

1. **Phases** grouping related changes
2. **Topological order** within each phase
3. **Commit message** following project style
4. **Files and hunks** for each commit (when a file has mixed concerns, list which hunks go in which commit, e.g. by line range or hunk index)
5. **Dependencies** noted where relevant

### Commit Message Style

Analyze `git log` to match existing style. Common patterns:

| Pattern                  | Example                           |
| ------------------------ | --------------------------------- |
| `[Subject]: [verb] ...`  | `Voltaire: handle empty response` |
| `<Component>: [verb]`    | `AmountInput: align markup`       |
| `[area]: [verb]`         | `e2e: update selectors`           |
| `` `package`: install `` | `fflate: install`                 |

### Topological Rules

1. **New files** before files that import them
2. **Shared utilities** before consumers
3. **Type definitions** before implementations
4. **Remove usages** before deleting definitions
5. **Prop changes** in parent + children together

---

## Phase 3: Execute Commits (hunk granularity)

For each planned commit, stage **only the hunks** that belong to that commit. When a file contains hunks for more than one commit, use `git add -p` and accept (y) or skip (n) by hunk.

```bash
# Prefer staging by hunk when a file spans multiple commits
git add -p path/to/file.ts

# When the whole file belongs to this commit
git add -- path/to/file.ts

# For deletions
git rm -- path/to/deleted.ts

git commit -m "$(cat <<'EOF'
Commit message here
EOF
)"
```

Do not stage a whole file for one commit if it has hunks that belong to another; split by hunk.

### Handling Complex Diffs

When a file has mixed changes and `git add -p` is impractical:

1. **Stash** current working tree state
2. **Checkout** the file from HEAD
3. **Apply** only the changes (or paste only the hunks) needed for this commit
4. **Commit**
5. **Restore** full working tree state

```bash
cp path/to/file.ts /tmp/file.ts.full
git checkout HEAD -- path/to/file.ts
# ... make only the changes for this commit ...
git add -- path/to/file.ts
git commit -m "message"
cp /tmp/file.ts.full path/to/file.ts
```

### Handling Atomic Groups

When multiple files must change together:

```bash
git add -- file1.ts file2.ts file3.svelte
git commit -m "$(cat <<'EOF'
Feature: description of atomic change
EOF
)"
```

---

## Phase 4: Verify (mandatory)

After **every** commit, run the project's check/build. Each commit must leave the tree buildable.

```bash
deno task check
# or: deno task build
```

- **If it passes:** proceed to the next commit.
- **If it fails:** the commit is not atomic. Undo it (`git reset --soft HEAD~1`), split into smaller steps (by dependency or by hunk), re-stage and commit in smaller pieces, and run verification after each piece. Do not proceed until the current commit passes.
- Do not amend with unrelated fixes; split the commit so each piece is self-contained and passes.

---

## Phase 5: Update Plan

After completing all commits, update `COMMIT_PLAN.md`:

1. Mark completed commits with SHAs
2. Move remaining items to "Commit later" section
3. List uncommitted working tree files

---

## Example Workflow

```bash
# 1. User asks to commit changes atomically
# 2. Agent analyzes: git status, git diff
# 3. Agent creates COMMIT_PLAN.md
# 4. User reviews and approves
# 5. Agent executes commits in order:

git add -- src/lib/utils.ts
git commit -m "Utils: add helper function"

git add -- src/components/Button.svelte
git commit -m "Button: use new helper"

git rm -- src/lib/old-utils.ts
git commit -m "Utils: remove deprecated module"

# 6. Agent updates COMMIT_PLAN.md with SHAs
```

---

## Flags

The user may specify:

- **"ignore X"** — Skip certain changes, leave in working tree
- **"commit later"** — Mark section as deferred
- **"one commit per file"** — Don't batch related changes
- **"batch all"** — Single commit for everything

---

## Recovery

If a commit is wrong:

```bash
# Undo last commit, keep changes staged
git reset --soft HEAD~1

# Undo last commit, unstage changes
git reset HEAD~1

# Undo last N commits, discard changes (careful!)
git reset --hard HEAD~N

# Restore files from a dropped commit
git checkout <sha> -- path/to/file
```
