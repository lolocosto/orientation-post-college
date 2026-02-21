#!/bin/bash
# ============================================================
# run_all.sh — Lance toutes les suites de tests CARIF-OREF
# Exécution : bash tests/run_all.sh
# ============================================================
cd "$(dirname "$0")/.."   # Se positionner à la racine du projet

PASS=0
FAIL=0

run_suite() {
    local label="$1"
    local file="$2"
    echo ""
    echo "════════════════════════════════════════════"
    echo "  $label"
    echo "════════════════════════════════════════════"
    node "$file" 2>/dev/null
    if [ $? -eq 0 ]; then
        PASS=$((PASS + 1))
    else
        FAIL=$((FAIL + 1))
    fi
}

run_suite "01 — Unitaires Parser" "tests/01_unit_parser.test.js"
run_suite "02 — Unitaires DatabaseService" "tests/02_unit_database.test.js"
run_suite "03 — Fonctionnels ExtractionController" "tests/03_functional_extraction.test.js"

echo ""
echo "════════════════════════════════════════════"
if [ $FAIL -eq 0 ]; then
    echo "  ✅ Toutes les suites sont vertes ($PASS/$((PASS + FAIL)))"
    exit 0
else
    echo "  ⛔ $FAIL suite(s) en échec sur $((PASS + FAIL))"
    exit 1
fi
