/**
 * @file 13_unit_v057_casse_multiselect_css.test.js
 * @description Tests v0.57 — CSS popup/tour, filtres carte multi-select,
 *              normalisation casse communes et libellés diplômes.
 * @version 0.57
 */

'use strict';

// ══════════════════════════════════════════════════════════
// HELPERS DE TEST
// ══════════════════════════════════════════════════════════

let _passed = 0, _failed = 0, _total = 0;
const _failures = [];

function describe(suite, fn) {
    console.log(`\n📦 ${suite}`);
    fn();
}

function it(label, fn) {
    _total++;
    try {
        fn();
        _passed++;
        console.log(`  ✅ ${label}`);
    } catch (e) {
        _failed++;
        _failures.push(`${label}: ${e.message}`);
        console.log(`  ❌ ${label} — ${e.message}`);
    }
}

function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'Assertion failed');
}

function assertEqual(a, b, msg) {
    if (a !== b) throw new Error(msg || `Expected "${b}", got "${a}"`);
}

// ══════════════════════════════════════════════════════════
// MOCK ENVIRONNEMENT
// ══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

// Charger utils.js pour les fonctions de normalisation
const vm = require('vm');
const utilsCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'utils.js'), 'utf8');

// Extraire les fonctions de normalisation et les helpers privés
const startMarker = 'function normaliserNomCommune';
const endMarker = '// EXPOSITION GLOBALE';
const startIdx = utilsCode.indexOf(startMarker);
const endIdx = utilsCode.indexOf(endMarker, startIdx);
if (startIdx === -1 || endIdx === -1) {
    console.error('❌ Impossible de trouver les fonctions de normalisation dans utils.js');
    process.exit(1);
}
const normBlock = utilsCode.substring(startIdx, endIdx);
// Exécuter dans le contexte global pour que les fonctions soient accessibles
vm.runInThisContext(normBlock);

// Charger le CSS pour vérifier les styles
const cssContent = fs.readFileSync(path.join(__dirname, '..', 'css', 'design-system.css'), 'utf8');

// Charger le HTML pour vérifier les filtres carte
const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Charger le JS carte pour vérifier multi-select
const carteCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'gestion_onglet_carte.js'), 'utf8');

// Charger les parsers
const onisepParserCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'onisep_parser.js'), 'utf8');
const carifParserCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'carif_oref_parser.js'), 'utf8');


// ══════════════════════════════════════════════════════════
// SUITE 1 : CSS POPUP CARTE & TOUR GUIDÉ
// ══════════════════════════════════════════════════════════

describe('1. CSS — Boutons popup carte lisibles', () => {
    it('map-popup-btn a color: white !important', () => {
        assert(
            /\.map-popup-btn\s*\{[^}]*color:\s*white\s*!important/i.test(cssContent),
            'map-popup-btn doit avoir color: white !important'
        );
    });

    it('map-popup-btn a background !important', () => {
        assert(
            /\.map-popup-btn\s*\{[^}]*background:[^;]*!important/i.test(cssContent),
            'map-popup-btn doit avoir background !important'
        );
    });

    it('map-popup-btn a text-decoration: none !important', () => {
        assert(
            /\.map-popup-btn\s*\{[^}]*text-decoration:\s*none\s*!important/i.test(cssContent),
            'map-popup-btn doit avoir text-decoration: none !important'
        );
    });

    it('map-popup-btn:hover a color: white !important', () => {
        assert(
            /\.map-popup-btn:hover\s*\{[^}]*color:\s*white\s*!important/i.test(cssContent),
            'map-popup-btn:hover doit avoir color: white !important'
        );
    });

    it('map-popup-btn--secondary a color: white !important', () => {
        assert(
            /\.map-popup-btn--secondary\s*\{[^}]*color:\s*white\s*!important/i.test(cssContent),
            'map-popup-btn--secondary doit avoir color: white !important'
        );
    });
});

describe('2. CSS — Titres tour guidé lisibles', () => {
    it('driver-popover-title a color !important', () => {
        assert(
            /\.driver-popover\.tour-popover\s+\.driver-popover-title\s*\{[^}]*color:[^;]*!important/i.test(cssContent),
            'driver-popover-title doit avoir color !important'
        );
    });

    it('driver-popover-description a color !important', () => {
        assert(
            /\.driver-popover\.tour-popover\s+\.driver-popover-description\s*\{[^}]*color:[^;]*!important/i.test(cssContent),
            'driver-popover-description doit avoir color !important'
        );
    });

    it('driver-popover-title a font-size !important', () => {
        assert(
            /\.driver-popover\.tour-popover\s+\.driver-popover-title\s*\{[^}]*font-size:[^;]*!important/i.test(cssContent),
            'driver-popover-title doit avoir font-size !important'
        );
    });
});


// ══════════════════════════════════════════════════════════
// SUITE 2 : FILTRES CARTE EN MULTI-SELECT
// ══════════════════════════════════════════════════════════

describe('3. Filtres carte — multi-select', () => {
    it('HTML : select#map-filter-type a l\'attribut multiple', () => {
        assert(
            /select\s+multiple[^>]*id="map-filter-type"/i.test(htmlContent),
            'select type doit avoir l\'attribut multiple'
        );
    });

    it('HTML : select#map-filter-statut a l\'attribut multiple', () => {
        assert(
            /select\s+multiple[^>]*id="map-filter-statut"/i.test(htmlContent),
            'select statut doit avoir l\'attribut multiple'
        );
    });

    it('HTML : select#map-filter-commune a l\'attribut multiple', () => {
        assert(
            /select\s+multiple[^>]*id="map-filter-commune"/i.test(htmlContent),
            'select commune doit avoir l\'attribut multiple'
        );
    });

    it('JS : applyMapFilters utilise _getMapMultiSelectValues', () => {
        assert(
            carteCode.includes('_getMapMultiSelectValues'),
            'applyMapFilters doit utiliser _getMapMultiSelectValues'
        );
    });

    it('JS : _getMapMultiSelectValues retourne un tableau de selectedOptions', () => {
        assert(
            /selectedOptions/.test(carteCode),
            '_getMapMultiSelectValues doit lire selectedOptions'
        );
    });

    it('JS : filtrage multi-select avec includes', () => {
        assert(
            /types\.includes\(|statuts\.includes\(|communes\.includes\(/i.test(carteCode),
            'Le filtrage doit utiliser Array.includes pour le multi-select'
        );
    });

    it('CSS : select multi a une hauteur minimale', () => {
        assert(
            /\.map-filters__select\s*\{[^}]*min-height/i.test(cssContent),
            'Le select multiple doit avoir une min-height'
        );
    });
});


// ══════════════════════════════════════════════════════════
// SUITE 3 : NORMALISATION CASSE COMMUNES
// ══════════════════════════════════════════════════════════

describe('4. normaliserNomCommune — casse des communes', () => {
    it('BRUZ → Bruz', () => {
        assertEqual(normaliserNomCommune('BRUZ'), 'Bruz');
    });

    it('bruz → Bruz', () => {
        assertEqual(normaliserNomCommune('bruz'), 'Bruz');
    });

    it('CESSON-SEVIGNE → Cesson-Sevigne', () => {
        assertEqual(normaliserNomCommune('CESSON-SEVIGNE'), 'Cesson-Sevigne');
    });

    it('SAINT-MALO → Saint-Malo', () => {
        assertEqual(normaliserNomCommune('SAINT-MALO'), 'Saint-Malo');
    });

    it('LA ROCHE-SUR-YON → La Roche-sur-Yon', () => {
        const result = normaliserNomCommune('LA ROCHE-SUR-YON');
        assertEqual(result, 'La Roche-sur-Yon');
    });

    it('null → null', () => {
        assertEqual(normaliserNomCommune(null), null);
    });

    it('Bruz (déjà bon) → Bruz', () => {
        assertEqual(normaliserNomCommune('Bruz'), 'Bruz');
    });

    it('Parser ONISEP appelle normaliserNomCommune', () => {
        assert(
            onisepParserCode.includes('normaliserNomCommune'),
            'onisep_parser.js doit appeler normaliserNomCommune'
        );
    });

    it('Parser CARIF-OREF appelle normaliserNomCommune', () => {
        assert(
            carifParserCode.includes('normaliserNomCommune'),
            'carif_oref_parser.js doit appeler normaliserNomCommune'
        );
    });
});


// ══════════════════════════════════════════════════════════
// SUITE 4 : NORMALISATION LIBELLÉS DIPLÔMES
// ══════════════════════════════════════════════════════════

describe('5. normaliserLibelleDiplome — casse des libellés', () => {
    it('"CAP - BOULANGER" → "CAP Boulanger"', () => {
        assertEqual(normaliserLibelleDiplome('CAP - BOULANGER'), 'CAP Boulanger');
    });

    it('"BAC PRO - MAINTENANCE DES VEHICULES" → "Bac pro Maintenance des vehicules"', () => {
        assertEqual(
            normaliserLibelleDiplome('BAC PRO - MAINTENANCE DES VEHICULES'),
            'Bac pro Maintenance des vehicules'
        );
    });

    it('"BTS - COMPTABILITE ET GESTION" → "BTS Comptabilite et gestion"', () => {
        assertEqual(
            normaliserLibelleDiplome('BTS - COMPTABILITE ET GESTION'),
            'BTS Comptabilite et gestion'
        );
    });

    it('"MC - TECHNICIEN EN ENERGIES RENOUVELABLES" → "MC Technicien en energies renouvelables"', () => {
        assertEqual(
            normaliserLibelleDiplome('MC - TECHNICIEN EN ENERGIES RENOUVELABLES'),
            'MC Technicien en energies renouvelables'
        );
    });

    it('null → null', () => {
        assertEqual(normaliserLibelleDiplome(null), null);
    });

    it('Libellé déjà correct → inchangé', () => {
        assertEqual(normaliserLibelleDiplome('CAP Boulanger'), 'CAP Boulanger');
    });

    it('Parser CARIF-OREF appelle normaliserLibelleDiplome', () => {
        assert(
            carifParserCode.includes('normaliserLibelleDiplome'),
            'carif_oref_parser.js doit appeler normaliserLibelleDiplome'
        );
    });
});


// ══════════════════════════════════════════════════════════
// SUITE 5 : SCÉNARIOS UTILISATEUR
// ══════════════════════════════════════════════════════════

describe('6. Scénarios utilisateur complets', () => {
    it('SC1 — Un enseignant voit les boutons popup carte avec texte blanc sur fond bleu', () => {
        // Vérifie que les styles essentiels sont en place avec !important
        const hasBtn = /\.map-popup-btn\s*\{[^}]*color:\s*white\s*!important/.test(cssContent);
        const hasBg  = /\.map-popup-btn\s*\{[^}]*background:[^;]*!important/.test(cssContent);
        assert(hasBtn && hasBg, 'Boutons popup doivent être blancs sur fond coloré avec !important');
    });

    it('SC2 — Un enseignant peut sélectionner plusieurs communes sur la carte', () => {
        const hasMultiple = /select\s+multiple[^>]*id="map-filter-commune"/.test(htmlContent);
        const hasIncludes = /communes\.includes\(/.test(carteCode);
        assert(hasMultiple && hasIncludes, 'Filtre commune carte doit être multi-select');
    });

    it('SC3 — BRUZ et Bruz deviennent le même nom de commune', () => {
        const a = normaliserNomCommune('BRUZ');
        const b = normaliserNomCommune('Bruz');
        assertEqual(a, b, 'BRUZ et Bruz doivent être identiques après normalisation');
    });

    it('SC4 — Les libellés apprentissage ne sont plus en majuscules', () => {
        const result = normaliserLibelleDiplome('CAP - MENUISIER INSTALLATEUR');
        assert(!result.includes('MENUISIER'), 'Le libellé ne doit plus être en majuscules');
        assert(result.includes('Menuisier'), 'Le libellé doit être en title case');
    });

    it('SC5 — La jointure ONISEP/CARIF-OREF utilise toujours le libellé brut normalisé', () => {
        assert(
            carifParserCode.includes('this._normaliserLibelle(libelleRaw)'),
            'La jointure doit utiliser libelleRaw, pas le libellé normalisé pour affichage'
        );
    });

    it('SC6 — La normalisation ne casse pas les communes déjà en bon format', () => {
        assertEqual(normaliserNomCommune('Rennes'), 'Rennes');
        assertEqual(normaliserNomCommune('Saint-Malo'), 'Saint-Malo');
    });

    it('SC7 — Les particules restent en minuscules dans les communes', () => {
        const result = normaliserNomCommune('BAGNERES-DE-LUCHON');
        assert(result.includes('-de-'), 'La particule "de" doit rester en minuscules');
    });
});


// ══════════════════════════════════════════════════════════
// BILAN
// ══════════════════════════════════════════════════════════

console.log('\n════════════════════════════════════════════');
console.log(`  Tests v0.57 : ${_passed} / ${_total} réussis`);
if (_failed > 0) {
    console.log(`  ❌ ${_failed} échec(s) :`);
    _failures.forEach(f => console.log(`     → ${f}`));
} else {
    console.log('  ✅ Tous les tests passent !');
}
console.log('════════════════════════════════════════════\n');

process.exit(_failed > 0 ? 1 : 0);
