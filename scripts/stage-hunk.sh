#!/usr/bin/env bash
# Stage one or more hunks from a file by 1-based index. Non-interactive (avoids git add -p).
# Usage: stage-hunk.sh <file> <hunk_index> [hunk_index ...]
# Example: stage-hunk.sh src/foo.svelte 2 4   # stage 2nd and 4th hunk

set -e
FILE="$1"
shift
[[ -n "$FILE" && -n "$1" ]] || { echo "Usage: stage-hunk.sh <file> <hunk_index> [hunk_index ...]" >&2; exit 1; }

PATCH=$(mktemp)
trap 'rm -f "$PATCH"' EXIT

git diff --no-color -- "$FILE" | awk -v indices=",$*," '
BEGIN { in_header = 1; hunk = 0; keep[0] = 0 }
/^@@ / {
	in_header = 0
	hunk++
	keep[hunk] = (index(indices, "," hunk ",") > 0)
}
in_header { header = header $0 "\n"; next }
keep[hunk] { buf = buf $0 "\n" }
END {
	if (header == "") exit 1
	printf "%s", header
	printf "%s", buf
}
' > "$PATCH"

[[ -s "$PATCH" ]] || { echo "No matching hunks or no diff for $FILE" >&2; exit 1; }
git apply --cached "$PATCH"
