#!/bin/bash
# -----------------------------------------------------------
# post-create.sh — Runs once when the dev container is created
#
# Installs npm dependencies for all 8 workshop sample apps
# so learners can jump into any level immediately.
# -----------------------------------------------------------

set -euo pipefail

echo "🔧 Installing workshop dependencies..."
echo ""

installed=0
failed=0

for dir in workshop/level-*/sample-app; do
  if [ -f "${dir}/package.json" ]; then
    level=$(basename "$(dirname "${dir}")")
    echo "📦 ${level}/sample-app — installing..."
    if (cd "${dir}" && npm install --no-fund --no-audit --loglevel=warn); then
      installed=$((installed + 1))
    else
      echo "⚠️  Failed: ${dir}"
      failed=$((failed + 1))
    fi
  fi
done

echo ""
if [ "${failed}" -eq 0 ]; then
  echo "✅ All ${installed} sample apps installed successfully."
else
  echo "⚠️  Installed: ${installed}, Failed: ${failed}"
fi

echo ""
echo "👉 Next step: Run 'copilot auth login' to authenticate."
echo "   Then: cd workshop/level-1/sample-app && npm run hello"
