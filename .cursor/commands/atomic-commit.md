---
description: Split current changes into granular, topologically ordered commits
---

Act as the atomic committer. Split the current working tree (staged and modified files) into granular, topologically ordered commits.

**Instructions:** Follow `scripts/atomic-commits.md` and the rule in `.cursor/rules/atomic-commit-staging.mdc`. Use `.cursor/agents/atomic-committer.md` for the full phase-by-phase workflow.

- **Staging hunks:** Do not use `git add -p` (interactive). Use: pipe into `git add -p` (`printf 'y\nn\n' | git add -p -- <file>`), stage whole files with `git add`, or `./scripts/stage-hunk.sh <file> <index...>` for specific hunks.
- **If the user wants to fold changes into existing commits** (e.g. "absorb", "fixup recent"): use `git absorb` (stage changes → `git absorb` → `git rebase -i --autosquash` or `git absorb --and-rebase`).

$ARGUMENTS

Return a short summary of the commits created (or the absorb result).
