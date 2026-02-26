#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════
# run_all.sh — Lance tous les tests de la suite v0.45
# ══════════════════════════════════════════════════════════
# Prérequis : Node.js ≥ 18, jest installé (npm install -g jest)
# Lancement  : bash tests/run_all.sh [--verbose]
# ══════════════════════════════════════════════════════════
set -e
cd "$(dirname "$0")/.."

echo "════════════════════════════════════════════════"
echo "  Parcours Avenir — Suite de tests v0.56"
echo "════════════════════════════════════════════════"

VERBOSE=""
if [[ "$1" == "--verbose" ]]; then VERBOSE="--verbose"; fi

jest tests/ $VERBOSE --testPathPattern='\.(test\.js)$' --no-coverage 2>&1 | tee tests/last_run.log

echo ""
echo "════════════════════════════════════════════════"
echo "  Résultats complets → tests/last_run.log"
echo "════════════════════════════════════════════════"
