#!/bin/bash
#
# Run cursor-agent in a loop with the same static prompt.
#
# Usage:
#   ./scripts/cursor-agent-loop.sh "Your prompt here"
#   ./scripts/cursor-agent-loop.sh "Your prompt" 10   # max 10 iterations
#

set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"

PROMPT="${1:-}"
MAX_ITERATIONS="${2:-0}"

if [ -z "${CURSOR_CMD:-}" ]; then
	if command -v cursor-agent &> /dev/null; then
		CURSOR_CMD="cursor-agent"
	else
		CURSOR_CMD="agent"
	fi
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
	cat <<EOF
cursor-agent-loop — run cursor-agent in a loop with a static prompt

Usage:
  ./scripts/cursor-agent-loop.sh "<prompt>"
  ./scripts/cursor-agent-loop.sh "<prompt>" [max_iterations]

Examples:
  ./scripts/cursor-agent-loop.sh "Run tests and fix any failures"
  ./scripts/cursor-agent-loop.sh "Format all changed files" 5

Requires: cursor-agent or agent (Cursor CLI). Set CURSOR_API_KEY for headless.
EOF
}

if [ -z "$PROMPT" ] || [ "$PROMPT" = "-h" ] || [ "$PROMPT" = "--help" ]; then
	show_help
	exit 0
fi

if ! command -v "$CURSOR_CMD" &> /dev/null; then
	echo -e "${RED}Error: Cursor CLI not found ($CURSOR_CMD)${NC}"
	echo "Install: https://cursor.com/docs/cli/installation"
	exit 1
fi

mkdir -p "$LOG_DIR"
SESSION_LOG="$LOG_DIR/cursor_agent_loop_$(date '+%Y%m%d_%H%M%S').log"
exec > >(tee -a "$SESSION_LOG") 2>&1

ITERATION=0
echo ""
echo -e "${GREEN}━━ cursor-agent loop ━━${NC}"
echo -e "${BLUE}Prompt:${NC} $PROMPT"
echo -e "${BLUE}Log:${NC} $SESSION_LOG"
[ "$MAX_ITERATIONS" -gt 0 ] && echo -e "${BLUE}Max:${NC} $MAX_ITERATIONS iterations"
echo ""

while true; do
	[ "$MAX_ITERATIONS" -gt 0 ] && [ $ITERATION -ge "$MAX_ITERATIONS" ] && break
	ITERATION=$((ITERATION + 1))
	LOG_FILE="$LOG_DIR/cursor_agent_loop_iter_${ITERATION}_$(date '+%Y%m%d_%H%M%S').log"
	echo ""
	echo -e "${BLUE}══ Loop $ITERATION ══${NC}"
	"$CURSOR_CMD" -p --force --output-format text "$PROMPT" 2>&1 | tee "$LOG_FILE"
	echo ""
	sleep 2
done

echo -e "${GREEN}━━ Finished ($ITERATION iterations) ━━${NC}"
