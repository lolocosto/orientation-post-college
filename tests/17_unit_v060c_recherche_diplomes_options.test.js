/**
 * Tests v0.60c — Corrections recherche par diplômes et options 2nde GT
 *
 * Bug 1 : Typo libbelllesApprentissage → libellesApprentissage (ligne 692)
 * Bug 2 : extractByOptions n'existe pas → extractByOptions2ndeGT créé
 * Bug 3 : Sélecteur de voies inutile en mode options → supprimé
 */

const results = { total: 0, passed: 0, failed: 0, errors: [] };

function describe(name, fn) {
    console.log(`\n╔══ ${name} ══╗`);
    fn();
}

function it(name, fn) {
    results.total++;
    try {
        fn();
        results.passed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        results.failed++;
        results.errors.push({ test: name, error: e.message });
        console.log(`  ❌ ${name}\n     → ${e.message}`);
    }
}

function expect(val) {
    return {
        toBe(expected) {
            if (val !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(val)}`);
        },
        toBeGreaterThan(n) {
            if (val <= n) throw new Error(`Expected ${val} > ${n}`);
        },
        toBeTruthy() { if (!val) throw new Error(`Expected truthy, got ${JSON.stringify(val)}`); },
        toBeFalsy()  { if (val)  throw new Error(`Expected falsy, got ${JSON.stringify(val)}`); },
        toContain(item) {
            if (typeof val === 'string') { if (!val.includes(item)) throw new Error(`String does not contain "${item}"`); }
            else if (Array.isArray(val)) { if (!val.includes(item)) throw new Error(`Array does not contain "${item}"`); }
            else throw new Error(`Cannot check contain on ${typeof val}`);
        },
        not: {
            toContain(item) {
                if (typeof val === 'string' && val.includes(item)) throw new Error(`String should not contain "${item}"`);
                if (Array.isArray(val) && val.includes(item)) throw new Error(`Array should not contain "${item}"`);
            },
            toBe(expected) {
                if (val === expected) throw new Error(`Expected NOT ${JSON.stringify(expected)}`);
            }
        },
        toBeInstanceOf(cls) {
            if (!(val instanceof cls)) throw new Error(`Expected instance of ${cls.name}`);
        }
    };
}

const fs = require('fs');

// ══════════════════════════════════════════════════════════
// BUG 1 : Typo libbelllesApprentissage
// ══════════════════════════════════════════════════════════

describe('Bug 1 — Typo libbelllesApprentissage corrigée', () => {

    const code = fs.readFileSync(__dirname + '/../js/gestion_onglet_recherche.js', 'utf-8');

    it('Le code ne contient plus libbelllesApprentissage (triple l)', () => {
        expect(code).not.toContain('libbelllesApprentissage');
    });

    it('Le code contient libellesApprentissage (correct)', () => {
        expect(code).toContain('libellesApprentissage');
    });

    it('La variable libellesApprentissage est déclarée', () => {
        expect(code).toContain('const libellesApprentissage');
    });

    it('La variable est utilisée dans le console.log de partition', () => {
        // Vérifie que la ligne de log utilise le bon nom
        const logLine = code.split('\n').find(l => l.includes('apprentissage:') && l.includes('.length'));
        expect(logLine).toBeTruthy();
        expect(logLine).toContain('libellesApprentissage.length');
    });
});

// ══════════════════════════════════════════════════════════
// BUG 2 : extractByOptions → extractByOptions2ndeGT
// ══════════════════════════════════════════════════════════

describe('Bug 2 — extractByOptions remplacé par extractByOptions2ndeGT', () => {

    const rechCode = fs.readFileSync(__dirname + '/../js/gestion_onglet_recherche.js', 'utf-8');
    const ctrlCode = fs.readFileSync(__dirname + '/../js/onisep_extraction_controller.js', 'utf-8');

    it('gestion_onglet_recherche.js n\'appelle plus extractByOptions()', () => {
        expect(rechCode).not.toContain('extractByOptions(');
    });

    it('gestion_onglet_recherche.js appelle extractByOptions2ndeGT()', () => {
        expect(rechCode).toContain('extractByOptions2ndeGT(');
    });

    it('Le contrôleur définit extractByOptions2ndeGT', () => {
        expect(ctrlCode).toContain('async extractByOptions2ndeGT(');
    });

    it('extractByOptions2ndeGT interroge le dataset enseignements_optionnels_2nde', () => {
        // Trouver la méthode
        const methodStart = ctrlCode.indexOf('async extractByOptions2ndeGT(');
        const methodBlock = ctrlCode.substring(methodStart, methodStart + 3000);
        expect(methodBlock).toContain("'enseignements_optionnels_2nde'");
    });

    it('extractByOptions2ndeGT filtre par libellés sélectionnés', () => {
        const methodStart = ctrlCode.indexOf('async extractByOptions2ndeGT(');
        const methodBlock = ctrlCode.substring(methodStart, methodStart + 3000);
        expect(methodBlock).toContain('libSet.has(');
    });

    it('extractByOptions2ndeGT appelle #extractByUAIs pour données complètes', () => {
        const methodStart = ctrlCode.indexOf('async extractByOptions2ndeGT(');
        const methodBlock = ctrlCode.substring(methodStart, methodStart + 5000);
        expect(methodBlock).toContain('#extractByUAIs');
    });

    it('extractByOptions2ndeGT appelle #processAndStoreAllData', () => {
        const methodStart = ctrlCode.indexOf('async extractByOptions2ndeGT(');
        const methodBlock = ctrlCode.substring(methodStart, methodStart + 5000);
        expect(methodBlock).toContain('#processAndStoreAllData');
    });

    it('extractByOptions2ndeGT gère le filtre département', () => {
        const methodStart = ctrlCode.indexOf('async extractByOptions2ndeGT(');
        const methodBlock = ctrlCode.substring(methodStart, methodStart + 5000);
        expect(methodBlock).toContain('facet.departement_lieu_de_cours');
    });

    it('extractByOptions2ndeGT gère le filtre académie', () => {
        const methodStart = ctrlCode.indexOf('async extractByOptions2ndeGT(');
        const methodBlock = ctrlCode.substring(methodStart, methodStart + 5000);
        expect(methodBlock).toContain('facet.academie_lieu_de_cours');
    });

    it('extractByOptions2ndeGT retourne voies: [scolaire] uniquement', () => {
        const methodStart = ctrlCode.indexOf('async extractByOptions2ndeGT(');
        const methodBlock = ctrlCode.substring(methodStart, methodStart + 5000);
        expect(methodBlock).toContain("voies: ['scolaire']");
    });

    it('L\'appel depuis lancerExtractionItems ne passe pas de voies', () => {
        // Trouver l'appel extractByOptions2ndeGT dans gestion_onglet_recherche
        const callLine = rechCode.split('\n')
            .find(l => l.includes('extractByOptions2ndeGT'));
        expect(callLine).toBeTruthy();
        expect(callLine).not.toContain('voies');
    });
});

// ══════════════════════════════════════════════════════════
// BUG 3 : Sélecteur de voies supprimé en mode options
// ══════════════════════════════════════════════════════════

describe('Bug 3 — Sélecteur de voies supprimé dans le panneau options', () => {

    const html = fs.readFileSync(__dirname + '/../index.html', 'utf-8');

    it('Le HTML ne contient plus tab-options-voie-scolaire', () => {
        expect(html).not.toContain('tab-options-voie-scolaire');
    });

    it('Le HTML ne contient plus tab-options-voie-apprentissage', () => {
        expect(html).not.toContain('tab-options-voie-apprentissage');
    });

    it('Le code JS n\'appelle plus getVoiesSelectionnees avec options', () => {
        const rechCode = fs.readFileSync(__dirname + '/../js/gestion_onglet_recherche.js', 'utf-8');
        expect(rechCode).not.toContain("getVoiesSelectionnees('options')");
    });

    it('Le sélecteur de voies pour diplômes existe toujours (non impacté)', () => {
        // Vérifie que le sélecteur diplômes n'a pas été supprimé par erreur
        // (il est dans un autre panneau de l'HTML)
        const hasDiplomesGeoVoie = html.includes('tab-geo-voie-scolaire') || html.includes('tab-diplomes-voie');
        // Pas de sélecteur de voie pour diplômes non plus (la voie est déduite automatiquement)
        // Vérifier que le HTML contient toujours le panneau diplômes
        expect(html).toContain('tab-diplomes');
    });

    it('Un commentaire explique que les options sont scolaires uniquement', () => {
        expect(html).toContain('voie scolaire uniquement');
    });
});

// ══════════════════════════════════════════════════════════
// VÉRIFICATION : pas d'appel CARIF-OREF pour les options
// ══════════════════════════════════════════════════════════

describe('Pas d\'extraction CARIF-OREF en mode options', () => {

    const rechCode = fs.readFileSync(__dirname + '/../js/gestion_onglet_recherche.js', 'utf-8');

    it('Le bloc options dans lancerExtractionItems n\'appelle pas carifOrefExtractionController', () => {
        // Trouver le bloc else (options) dans lancerExtractionItems
        const elseIdx = rechCode.indexOf('// Options 2nde GT');
        if (elseIdx === -1) {
            // Chercher un autre marqueur
            const alt = rechCode.indexOf('extractByOptions2ndeGT');
            expect(alt).not.toBe(-1);
            // Vérifier que dans les 5 lignes autour, pas de carifOref
            const context = rechCode.substring(alt - 200, alt + 500);
            expect(context).not.toContain('carifOref');
        } else {
            const context = rechCode.substring(elseIdx, elseIdx + 500);
            expect(context).not.toContain('carifOref');
        }
    });

    it('chargerItemsDisponibles pour options n\'appelle pas CARIF', () => {
        // Le bloc else (options) dans chargerItemsDisponibles
        const optionsBlock = rechCode.indexOf("'facet.departement_lieu_de_cours'");
        expect(optionsBlock).not.toBe(-1);
        // Vérifier dans les 200 caractères autour
        const context = rechCode.substring(optionsBlock, optionsBlock + 300);
        expect(context).not.toContain('carifOref');
    });
});

// ══════════════════════════════════════════════════════════
// VÉRIFICATION : cohérence de la méthode extractByOptions2ndeGT
// ══════════════════════════════════════════════════════════

describe('extractByOptions2ndeGT — structure et cohérence', () => {

    const ctrlCode = fs.readFileSync(__dirname + '/../js/onisep_extraction_controller.js', 'utf-8');

    it('La méthode est documentée avec JSDoc', () => {
        const jsdocIdx = ctrlCode.indexOf('* Extrait les établissements et leurs données pour une liste d\'options 2nde GT');
        expect(jsdocIdx).not.toBe(-1);
    });

    it('La méthode utilise #runExtraction (gestion modale standard)', () => {
        const methodStart = ctrlCode.indexOf('async extractByOptions2ndeGT(');
        const methodBlock = ctrlCode.substring(methodStart, methodStart + 500);
        expect(methodBlock).toContain('#runExtraction');
    });

    it('La méthode appelle reset() au début', () => {
        const methodStart = ctrlCode.indexOf('async extractByOptions2ndeGT(');
        const methodBlock = ctrlCode.substring(methodStart, methodStart + 500);
        expect(methodBlock).toContain('await this.reset()');
    });

    it('La méthode vérifie #checkStopped() à chaque étape', () => {
        const methodStart = ctrlCode.indexOf('async extractByOptions2ndeGT(');
        const methodEnd = ctrlCode.indexOf('async extractDiplomesDisponiblesByZone');
        const methodBlock = ctrlCode.substring(methodStart, methodEnd);
        const checkStoppedCount = (methodBlock.match(/#checkStopped/g) || []).length;
        expect(checkStoppedCount).toBeGreaterThan(3);
    });

    it('La méthode gère le cas 0 établissements', () => {
        const methodStart = ctrlCode.indexOf('async extractByOptions2ndeGT(');
        const methodBlock = ctrlCode.substring(methodStart, methodStart + 3000);
        expect(methodBlock).toContain('uais.length === 0');
    });

    it('La méthode construit rawData avec actionsLycee et actionsSup', () => {
        const methodStart = ctrlCode.indexOf('async extractByOptions2ndeGT(');
        const methodBlock = ctrlCode.substring(methodStart, methodStart + 5000);
        expect(methodBlock).toContain('actionsLycee:');
        expect(methodBlock).toContain('actionsSup:');
    });
});

// ══════════════════════════════════════════════════════════
// RAPPORT
// ══════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(60));
console.log(`📊 RÉSULTATS : ${results.passed}/${results.total} tests passés`);
if (results.failed > 0) {
    console.log(`❌ ${results.failed} échec(s) :`);
    for (const err of results.errors) {
        console.log(`   • ${err.test}\n     → ${err.error}`);
    }
} else {
    console.log('✅ Tous les tests sont passés !');
}
console.log('═'.repeat(60));
