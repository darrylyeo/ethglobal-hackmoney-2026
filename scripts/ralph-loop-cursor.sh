#!/bin/bash
#
# Ralph Loop for Cursor CLI
#
# Uses Cursor CLI (agent -p --force) for headless, non-interactive runs.
# Same Ralph Wiggum flow: read PROMPT_build.md, pick spec, implement, verify, output DONE.
#
# Usage:
#   ./scripts/ralph-loop-cursor.sh              # Build mode, unlimited
#   ./scripts/ralph-loop-cursor.sh 20            # Build mode, max 20 iterations
#   ./scripts/ralph-loop-cursor.sh plan          # Planning mode (one run)
#

set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
CONSTITUTION="$PROJECT_DIR/.specify/memory/constitution.md"

MAX_ITERATIONS=0
MODE="build"
CURSOR_CMD="${CURSOR_CMD:-agent}"
TAIL_LINES=10

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

mkdir -p "$LOG_DIR"

show_help() {
	cat <<EOF
Ralph Loop for Cursor CLI

Uses Cursor CLI (agent -p --force) for headless runs.
Read PROMPT_build.md or PROMPT_plan.md; agent implements one spec, outputs DONE when done.

Usage:
  ./scripts/ralph-loop-cursor.sh              # Build mode, unlimited
  ./scripts/ralph-loop-cursor.sh 20           # Build mode, max 20 iterations
  ./scripts/ralph-loop-cursor.sh plan          # Planning mode (one run)

Requires: Cursor CLI installed and authenticated (agent -p works).
  Install: https://cursor.com/docs/cli/installation
  Headless: https://cursor.com/docs/cli/headless

EOF
}

print_latest_output() {
	local log_file="$1"
	local label="${2:-Cursor}"
	[ -f "$log_file" ] || return 0
	echo "Latest ${label} output (last ${TAIL_LINES} lines):"
	tail -n "$TAIL_LINES" "$log_file"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
	case "$1" in
		plan)
			MODE="plan"
			if [[ "${2:-}" =~ ^[0-9]+$ ]]; then
				MAX_ITERATIONS="$2"
				shift 2
			else
				MAX_ITERATIONS=1
				shift
			fi
			;;
		-h|--help)
			show_help
			exit 0
			;;
		[0-9]*)
			MODE="build"
			MAX_ITERATIONS="$1"
			shift
			;;
		*)
			echo -e "${RED}Unknown argument: $1${NC}"
			show_help
			exit 1
			;;
	esac
done

cd "$PROJECT_DIR"

if [ "$MODE" = "plan" ]; then
	PROMPT_FILE="PROMPT_plan.md"
else
	PROMPT_FILE="PROMPT_build.md"
fi

if [ ! -f "$PROMPT_FILE" ]; then
	echo -e "${RED}Error: $PROMPT_FILE not found${NC}"
	echo "Create it (see .specify/memory/constitution.md) or run ralph-loop.sh once to generate it."
	exit 1
fi

if ! command -v "$CURSOR_CMD" &> /dev/null; then
	echo -e "${RED}Error: Cursor CLI not found (command: $CURSOR_CMD)${NC}"
	echo ""
	echo "Install Cursor CLI: https://cursor.com/docs/cli/installation"
	echo "  curl https://cursor.com/install-fsS | bash"
	echo "For headless/scripts, set CURSOR_API_KEY if required."
	exit 1
fi

SESSION_LOG="$LOG_DIR/ralph_cursor_${MODE}_session_$(date '+%Y%m%d_%H%M%S').log"
exec > >(tee -a "$SESSION_LOG") 2>&1

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
SPEC_COUNT=0
[ -d "specs" ] && SPEC_COUNT=$(find specs -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l)

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN} RALPH LOOP (Cursor CLI) STARTING ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Mode:${NC} $MODE"
echo -e "${BLUE}Prompt:${NC} $PROMPT_FILE"
echo -e "${BLUE}Branch:${NC} $CURRENT_BRANCH"
echo -e "${BLUE}Command:${NC} $CURSOR_CMD -p --force --output-format text"
[ -n "$SESSION_LOG" ] && echo -e "${BLUE}Log:${NC} $SESSION_LOG"
[ $MAX_ITERATIONS -gt 0 ] && echo -e "${BLUE}Max:${NC} $MAX_ITERATIONS iterations"
echo -e "${BLUE}specs/:${NC} $SPEC_COUNT .md file(s)"
echo ""
echo -e "${CYAN}Agent must output DONE (or <promise>DONE</promise>) when spec is complete.${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the loop${NC}"
echo ""

ITERATION=0
CONSECUTIVE_FAILURES=0
MAX_CONSECUTIVE_FAILURES=3

while true; do
	if [ $MAX_ITERATIONS -gt 0 ] && [ $ITERATION -ge $MAX_ITERATIONS ]; then
		echo -e "${GREEN}Reached max iterations: $MAX_ITERATIONS${NC}"
		break
	fi

	ITERATION=$((ITERATION + 1))
	TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
	LOG_FILE="$LOG_DIR/ralph_cursor_${MODE}_iter_${ITERATION}_$(date '+%Y%m%d_%H%M%S').log"
	: > "$LOG_FILE"

	echo ""
	echo -e "${PURPLE}════════════════════ LOOP $ITERATION ════════════════════${NC}"
	echo -e "${BLUE}[$TIMESTAMP]${NC} Starting iteration $ITERATION"
	echo ""

	PROMPT_CONTENT=$(cat "$PROMPT_FILE")
	CURSOR_OUTPUT=""
	if CURSOR_OUTPUT=$("$CURSOR_CMD" -p --force --output-format text "$PROMPT_CONTENT" 2>&1 | tee "$LOG_FILE"); then
		echo ""
		echo -e "${GREEN}✓ Cursor execution completed${NC}"

		if echo "$CURSOR_OUTPUT" | grep -qE " (ALL_)?DONE |<promise>(ALL_)?DONE</promise>"; then
			DETECTED=$(echo "$CURSOR_OUTPUT" | grep -oE " (ALL_)?DONE |<promise>(ALL_)?DONE</promise>" | tail -1)
			echo -e "${GREEN}✓ Completion signal detected: ${DETECTED}${NC}"
			echo -e "${GREEN}✓ Task completed successfully!${NC}"
			CONSECUTIVE_FAILURES=0

			if [ "$MODE" = "plan" ]; then
				echo ""
				echo -e "${GREEN}Planning complete!${NC}"
				echo -e "${CYAN}Run './scripts/ralph-loop-cursor.sh' to start building.${NC}"
				break
			fi
		else
			echo -e "${YELLOW}⚠ No completion signal found${NC}"
			echo -e "${YELLOW}  Agent did not output DONE. Retrying next iteration...${NC}"
			CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
			print_latest_output "$LOG_FILE" "Cursor"

			if [ $CONSECUTIVE_FAILURES -ge $MAX_CONSECUTIVE_FAILURES ]; then
				echo ""
				echo -e "${RED}⚠ $MAX_CONSECUTIVE_FAILURES consecutive iterations without completion.${NC}"
				echo -e "${RED}  Check logs in $LOG_DIR; consider simplifying the spec.${NC}"
				echo ""
				CONSECUTIVE_FAILURES=0
			fi
		fi
	else
		echo -e "${RED}✗ Cursor execution failed${NC}"
		echo -e "${YELLOW}Check log: $LOG_FILE${NC}"
		CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
		print_latest_output "$LOG_FILE" "Cursor"
	fi

	git push origin "$CURRENT_BRANCH" 2>/dev/null || {
		if git log origin/$CURRENT_BRANCH..HEAD --oneline 2>/dev/null | grep -q .; then
			echo -e "${YELLOW}Push failed, creating remote branch...${NC}"
			git push -u origin "$CURRENT_BRANCH" 2>/dev/null || true
		fi
	}

	echo ""
	echo -e "${BLUE}Waiting 2s before next iteration...${NC}"
	sleep 2
done

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN} RALPH LOOP (Cursor CLI) FINISHED ($ITERATION iterations) ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
