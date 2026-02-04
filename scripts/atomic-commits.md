# Atomic Commits Methodology

Agent instructions for creating granular, atomic commits in topological order.

---

## Overview

When the user asks you to commit staged/modified changes atomically:

1. **Analyze** all modified, added, and deleted files
2. **Plan** commits in topological order (dependencies first)
3. **Execute** each commit, staging only relevant hunks
4. **Verify** the build remains valid after each commit

---

## Phase 1: Analyze Changes

```bash
# Get overview of all changes
git status --short

# Get hunk boundaries for modified files
git diff --no-color -U0 | grep -E '^(@@|diff --git)'

# Check recent commit style
git log --oneline -20
```

Categorize each change:

- **Independent**: Can be committed in any order
- **Dependency**: Must come before files that import it
- **Atomic group**: Multiple files that must change together (e.g., prop renames)
- **Deletion**: Must come after removing all usages

---

## Phase 2: Plan Commits

Create a `COMMIT_PLAN.md` with:

1. **Phases** grouping related changes
2. **Topological order** within each phase
3. **Commit message** following project style
4. **Files/hunks** for each commit
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

## Phase 3: Execute Commits

For each planned commit:

```bash
# Stage specific file(s)
git add -- path/to/file.ts

# Or stage specific hunks interactively
git add -p path/to/file.ts

# For deletions
git rm -- path/to/deleted.ts

# Commit with HEREDOC for message formatting
git commit -m "$(cat <<'EOF'
Commit message here
EOF
)"
```

### Handling Complex Diffs

When a file has mixed changes (some for now, some for later):

1. **Stash** current working tree state
2. **Checkout** the file from HEAD
3. **Apply** only the changes needed for this commit
4. **Commit**
5. **Restore** full working tree state

```bash
# Save full state
cp path/to/file.ts /tmp/file.ts.full

# Reset to committed state + apply partial changes
git checkout HEAD -- path/to/file.ts
# ... make only the changes for this commit ...
git add -- path/to/file.ts
git commit -m "message"

# Restore full state
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

## Phase 4: Verify

After each commit, optionally verify the build:

```bash
deno task build
```

If verification fails:

1. Fix the issue
2. Amend the commit (if not pushed) or create a fix commit

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
