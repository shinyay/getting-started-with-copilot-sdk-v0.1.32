#!/bin/bash
# -----------------------------------------------------------
# post-start.sh — Runs every time the dev container starts
#
# Verifies the development environment is correctly configured
# by checking required tool versions.
# -----------------------------------------------------------

set -euo pipefail

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   🚀 Copilot SDK Workshop — Dev Container   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Check required tools
check_tool() {
  local name="$1"
  local cmd="$2"
  if version=$(eval "${cmd}" 2>/dev/null); then
    echo "  ✅ ${name}: ${version}"
  else
    echo "  ❌ ${name}: not found"
  fi
}

echo "Environment:"
check_tool "Node.js" "node --version"
check_tool "npm" "npm --version"
check_tool "Git" "git --version | awk '{print \$3}'"
check_tool "GitHub CLI" "gh --version | head -1 | awk '{print \$3}'"
check_tool "Copilot CLI" "copilot --version 2>/dev/null || echo 'not installed — run: npm install -g @github/copilot-cli'"

echo ""
echo "📖 Start here: cd workshop/level-1/sample-app && npm run hello"
echo ""
