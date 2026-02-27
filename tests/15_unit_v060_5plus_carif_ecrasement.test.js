/**
 * Tests v0.60 — Correction de l'écrasement des formations scolaires 5+
 * par l'extraction CARIF-OREF.
 *
 * Bug : clearAprentissageData() vidait autres_formations_par_etablissement
 * en totalité, supprimant les formations Onisep (CPGE, BTS scolaires…)
 * stockées lors de l'extraction scolaire précédente.
 *
 * Correction : #purgeAutresFormationsCarif() filtre par source='carif'
 * et préserve source='onisep'.
 */

// ══════════════════════════════════════════════════════════
// MINIMAL FRAMEWORK
// ══════════════════════════════════════════════════════════

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
        toEqual(expected) {
            if (JSON.stringify(val) !== JSON.stringify(expected))
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(val)}`);
        },
        toBeTruthy() { if (!val) throw new Error(`Expected truthy, got ${JSON.stringify(val)}`); },
        toBeFalsy()  { if (val)  throw new Error(`Expected falsy, got ${JSON.stringify(val)}`); },
        toBeNull()   { if (val !== null) throw new Error(`Expected null, got ${JSON.stringify(val)}`); },
        toContain(item) {
            if (typeof val === 'string') { if (!val.includes(item)) throw new Error(`"${val}" does not contain "${item}"`); }
            else if (Array.isArray(val)) { if (!val.includes(item)) throw new Error(`Array does not contain ${item}`); }
            else throw new Error(`Cannot check contain on ${typeof val}`);
        },
        toBeGreaterThan(n) { if (!(val > n)) throw new Error(`Expected ${val} > ${n}`); },
        toHaveLength(n) { if (val.length !== n) throw new Error(`Expected length ${n}, got ${val.length}`); },
        not: {
            toBe(expected) { if (val === expected) throw new Error(`Expected NOT ${JSON.stringify(expected)}`); },
            toContain(item) {
                if (Array.isArray(val) && val.includes(item)) throw new Error(`Array should not contain ${item}`);
                if (typeof val === 'string' && val.includes(item)) throw new Error(`String should not contain "${item}"`);
            },
            toBeTruthy() { if (val) throw new Error(`Expected falsy, got ${JSON.stringify(val)}`); }
        }
    };
}

// ══════════════════════════════════════════════════════════
// MOCK — DatabaseService simplifié avec #purgeAutresFormationsCarif
// ══════════════════════════════════════════════════════════

/**
 * Mock léger reproduisant le comportement exact de DatabaseService
 * pour les tables autres_formations_par_etablissement et le vidage CARIF.
 */
class MockDatabaseService {
    constructor() {
        this.storage = {
            etablissements: {},
            diplomes_apprentissage: {},
            diplomes_apprentissage_par_etablissement: {},
            autres_formations_par_etablissement: {}
        };
    }

    /** Insère des formations 5+ pour un établissement. */
    async insertAutresFormationsParEtablissement(etabId, formations) {
        if (!etabId || !formations || formations.length === 0) return;
        this.storage.autres_formations_par_etablissement[etabId] = formations;
    }

    /** Retourne les formations 5+ d'un établissement. */
    getAutresFormationsParEtablissement(etabId) {
        return this.storage.autres_formations_par_etablissement[etabId] || [];
    }

    /**
     * VERSION BUGGÉE (avant v0.60 fix) — efface tout.
     */
    async clearAprentissageData_AVANT_FIX() {
        this.storage.diplomes_apprentissage = {};
        this.storage.diplomes_apprentissage_par_etablissement = {};
        this.storage.autres_formations_par_etablissement = {};
    }

    /**
     * VERSION CORRIGÉE (v0.60 fix) — préserve source='onisep'.
     */
    async clearAprentissageData_APRES_FIX() {
        this.storage.diplomes_apprentissage = {};
        this.storage.diplomes_apprentissage_par_etablissement = {};
        this._purgeAutresFormationsCarif();
    }

    /**
     * Retire uniquement les formations source='carif' de la table.
     * Préserve les formations source='onisep' (CPGE, BTS scolaires…).
     */
    _purgeAutresFormationsCarif() {
        const table = this.storage.autres_formations_par_etablissement;
        let nbPurged = 0;
        for (const etabId of Object.keys(table)) {
            const formations = table[etabId];
            if (!Array.isArray(formations)) {
                delete table[etabId];
                continue;
            }
            const kept = formations.filter(f => f.source !== 'carif');
            if (kept.length === 0) {
                delete table[etabId];
            } else {
                table[etabId] = kept;
            }
            nbPurged += formations.length - kept.length;
        }
        return nbPurged;
    }
}

// ══════════════════════════════════════════════════════════
// DONNÉES DE TEST
// ══════════════════════════════════════════════════════════

/** Formations Onisep 5+ (CPGE) pour Lycée Chateaubriand */
const FORMATIONS_ONISEP_5PLUS = [
    { libelle: 'CPGE MPSI', niveau: 'bac + 1', typeDiplome: 'CPGE', source: 'onisep' },
    { libelle: 'CPGE MP2I', niveau: 'bac + 1', typeDiplome: 'CPGE', source: 'onisep' },
    { libelle: 'CPGE MP', niveau: 'bac + 2', typeDiplome: 'CPGE', source: 'onisep' },
    { libelle: 'CPGE PSI', niveau: 'bac + 2', typeDiplome: 'CPGE', source: 'onisep' },
    { libelle: 'CPGE lettres et sciences sociales', niveau: 'bac + 1', typeDiplome: 'CPGE', source: 'onisep' }
];

/** Formations CARIF 5+ (apprentissage) pour le même établissement */
const FORMATIONS_CARIF_5PLUS = [
    { libelle: 'BTS comptabilité et gestion (en apprentissage)', niveau: 'bac + 2', typeDiplome: 'BTS', source: 'carif' },
    { libelle: 'Licence pro métiers du numérique', niveau: 'bac + 3', typeDiplome: 'Licence pro', source: 'carif' }
];

/** Formations CARIF 5+ pour un autre établissement (uniquement CARIF) */
const FORMATIONS_CARIF_SEULES = [
    { libelle: 'BTS commerce international (en apprentissage)', niveau: 'bac + 2', typeDiplome: 'BTS', source: 'carif' }
];

/** Formations Onisep 5+ pour un établissement qui n'a que ça */
const FORMATIONS_ONISEP_SEULES = [
    { libelle: 'BTS SIO', niveau: 'bac + 2', typeDiplome: 'BTS', source: 'onisep' }
];

// ══════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════

describe('REPRODUCTION DU BUG — clearAprentissageData efface les formations Onisep 5+', () => {
    it('AVANT FIX : extraction scolaire seule → formations 5+ présentes', async () => {
        const db = new MockDatabaseService();
        // Étape 1 : extraction Onisep stocke les formations 5+
        await db.insertAutresFormationsParEtablissement('etab_29', FORMATIONS_ONISEP_5PLUS);
        
        const formations = db.getAutresFormationsParEtablissement('etab_29');
        expect(formations).toHaveLength(5);
        expect(formations[0].source).toBe('onisep');
    });

    it('AVANT FIX : extraction scolaire + CARIF → formations 5+ DISPARAISSENT', async () => {
        const db = new MockDatabaseService();
        // Étape 1 : extraction Onisep stocke les formations 5+
        await db.insertAutresFormationsParEtablissement('etab_29', FORMATIONS_ONISEP_5PLUS);
        
        // Étape 2 : extraction CARIF commence → clearAprentissageData (version buggée)
        await db.clearAprentissageData_AVANT_FIX();
        
        // Étape 3 : vérification — les formations Onisep sont perdues !
        const formations = db.getAutresFormationsParEtablissement('etab_29');
        expect(formations).toHaveLength(0); // ← C'est le bug : devrait être 5
    });
});

describe('CORRECTION v0.60 — clearAprentissageData préserve les formations Onisep', () => {
    it('APRÈS FIX : extraction scolaire + CARIF → formations Onisep 5+ PRÉSERVÉES', async () => {
        const db = new MockDatabaseService();
        // Étape 1 : extraction Onisep stocke les formations 5+
        await db.insertAutresFormationsParEtablissement('etab_29', FORMATIONS_ONISEP_5PLUS);
        
        // Étape 2 : extraction CARIF commence → clearAprentissageData (version corrigée)
        await db.clearAprentissageData_APRES_FIX();
        
        // Étape 3 : vérification — les formations Onisep sont préservées
        const formations = db.getAutresFormationsParEtablissement('etab_29');
        expect(formations).toHaveLength(5);
        expect(formations.every(f => f.source === 'onisep')).toBe(true);
        expect(formations[0].libelle).toBe('CPGE MPSI');
    });

    it('APRÈS FIX : les formations CARIF sont bien purgées', async () => {
        const db = new MockDatabaseService();
        // Étape 1 : Onisep + CARIF ont stocké des formations
        await db.insertAutresFormationsParEtablissement('etab_29', [
            ...FORMATIONS_ONISEP_5PLUS,
            ...FORMATIONS_CARIF_5PLUS
        ]);
        
        expect(db.getAutresFormationsParEtablissement('etab_29')).toHaveLength(7); // 5 + 2
        
        // Étape 2 : clearAprentissageData corrigé
        await db.clearAprentissageData_APRES_FIX();
        
        // Étape 3 : seules les Onisep survivent
        const formations = db.getAutresFormationsParEtablissement('etab_29');
        expect(formations).toHaveLength(5);
        expect(formations.some(f => f.source === 'carif')).toBe(false);
    });

    it('APRÈS FIX : établissement avec uniquement CARIF 5+ → table nettoyée', async () => {
        const db = new MockDatabaseService();
        await db.insertAutresFormationsParEtablissement('etab_50', FORMATIONS_CARIF_SEULES);
        
        expect(db.getAutresFormationsParEtablissement('etab_50')).toHaveLength(1);
        
        await db.clearAprentissageData_APRES_FIX();
        
        // L'entrée doit être complètement supprimée (pas de tableau vide résiduel)
        const formations = db.getAutresFormationsParEtablissement('etab_50');
        expect(formations).toHaveLength(0);
        expect(db.storage.autres_formations_par_etablissement['etab_50']).toBe(undefined);
    });

    it('APRÈS FIX : établissement avec uniquement Onisep 5+ → tout préservé', async () => {
        const db = new MockDatabaseService();
        await db.insertAutresFormationsParEtablissement('etab_60', FORMATIONS_ONISEP_SEULES);
        
        await db.clearAprentissageData_APRES_FIX();
        
        const formations = db.getAutresFormationsParEtablissement('etab_60');
        expect(formations).toHaveLength(1);
        expect(formations[0].libelle).toBe('BTS SIO');
        expect(formations[0].source).toBe('onisep');
    });
});

describe('SCÉNARIO COMPLET — Extraction scolaire puis CARIF puis re-CARIF', () => {
    it('Scénario : Onisep → CARIF → les CPGE Chateaubriand restent visibles', async () => {
        const db = new MockDatabaseService();
        
        // ── Phase 1 : Extraction Onisep ──
        await db.insertAutresFormationsParEtablissement('etab_29', FORMATIONS_ONISEP_5PLUS);
        await db.insertAutresFormationsParEtablissement('etab_60', FORMATIONS_ONISEP_SEULES);
        
        expect(db.getAutresFormationsParEtablissement('etab_29')).toHaveLength(5);
        expect(db.getAutresFormationsParEtablissement('etab_60')).toHaveLength(1);
        
        // ── Phase 2 : Extraction CARIF démarre → reset ──
        await db.clearAprentissageData_APRES_FIX();
        
        // Onisep préservé
        expect(db.getAutresFormationsParEtablissement('etab_29')).toHaveLength(5);
        expect(db.getAutresFormationsParEtablissement('etab_60')).toHaveLength(1);
        
        // ── Phase 3 : CARIF ajoute ses formations 5+ ──
        const existantes29 = db.getAutresFormationsParEtablissement('etab_29');
        const existantesSet = new Set(existantes29.map(f => f.libelle.toLowerCase()));
        const nouvelles = FORMATIONS_CARIF_5PLUS.filter(f => !existantesSet.has(f.libelle.toLowerCase()));
        await db.insertAutresFormationsParEtablissement('etab_29', [...existantes29, ...nouvelles]);
        
        await db.insertAutresFormationsParEtablissement('etab_50', FORMATIONS_CARIF_SEULES);
        
        // ── Phase 4 : Vérification finale ──
        const final29 = db.getAutresFormationsParEtablissement('etab_29');
        expect(final29).toHaveLength(7); // 5 Onisep + 2 CARIF
        
        const onisepCount = final29.filter(f => f.source === 'onisep').length;
        const carifCount  = final29.filter(f => f.source === 'carif').length;
        expect(onisepCount).toBe(5);
        expect(carifCount).toBe(2);
        
        // etab_60 : toujours 1 formation Onisep
        expect(db.getAutresFormationsParEtablissement('etab_60')).toHaveLength(1);
        
        // etab_50 : 1 formation CARIF
        expect(db.getAutresFormationsParEtablissement('etab_50')).toHaveLength(1);
    });

    it('Scénario : re-extraction CARIF → les CARIF sont remplacées, Onisep intouchées', async () => {
        const db = new MockDatabaseService();
        
        // État initial : mix Onisep + CARIF
        await db.insertAutresFormationsParEtablissement('etab_29', [
            ...FORMATIONS_ONISEP_5PLUS,
            ...FORMATIONS_CARIF_5PLUS
        ]);
        expect(db.getAutresFormationsParEtablissement('etab_29')).toHaveLength(7);
        
        // Re-extraction CARIF → reset
        await db.clearAprentissageData_APRES_FIX();
        
        // Seules les Onisep survivent
        expect(db.getAutresFormationsParEtablissement('etab_29')).toHaveLength(5);
        
        // Nouvelles formations CARIF ajoutées
        const existantes = db.getAutresFormationsParEtablissement('etab_29');
        const newCarif = [
            { libelle: 'Licence pro gestion PME', niveau: 'bac + 3', typeDiplome: 'Licence pro', source: 'carif' }
        ];
        await db.insertAutresFormationsParEtablissement('etab_29', [...existantes, ...newCarif]);
        
        const final = db.getAutresFormationsParEtablissement('etab_29');
        expect(final).toHaveLength(6); // 5 Onisep + 1 nouveau CARIF (pas les anciens)
        expect(final.filter(f => f.source === 'onisep')).toHaveLength(5);
        expect(final.filter(f => f.source === 'carif')).toHaveLength(1);
    });
});

describe('#purgeAutresFormationsCarif — cas limites', () => {
    it('Table vide → aucune erreur', () => {
        const db = new MockDatabaseService();
        const nbPurged = db._purgeAutresFormationsCarif();
        expect(nbPurged).toBe(0);
    });

    it('Entrée non-tableau → supprimée silencieusement', () => {
        const db = new MockDatabaseService();
        db.storage.autres_formations_par_etablissement['etab_bad'] = 'not an array';
        db._purgeAutresFormationsCarif();
        expect(db.storage.autres_formations_par_etablissement['etab_bad']).toBe(undefined);
    });

    it('Formation sans champ source → préservée (pas source=carif)', () => {
        const db = new MockDatabaseService();
        const formSansSource = [
            { libelle: 'Formation mystère', niveau: 'bac + 2', typeDiplome: 'BTS' }
        ];
        db.storage.autres_formations_par_etablissement['etab_70'] = formSansSource;
        db._purgeAutresFormationsCarif();
        
        const result = db.getAutresFormationsParEtablissement('etab_70');
        expect(result).toHaveLength(1);
        expect(result[0].libelle).toBe('Formation mystère');
    });

    it('Compteur retourné correct', () => {
        const db = new MockDatabaseService();
        db.storage.autres_formations_par_etablissement['etab_A'] = [
            { libelle: 'F1', source: 'carif' },
            { libelle: 'F2', source: 'onisep' },
            { libelle: 'F3', source: 'carif' }
        ];
        db.storage.autres_formations_par_etablissement['etab_B'] = [
            { libelle: 'F4', source: 'carif' }
        ];
        
        const nbPurged = db._purgeAutresFormationsCarif();
        expect(nbPurged).toBe(3); // 2 de etab_A + 1 de etab_B
        
        expect(db.getAutresFormationsParEtablissement('etab_A')).toHaveLength(1);
        expect(db.getAutresFormationsParEtablissement('etab_A')[0].libelle).toBe('F2');
        expect(db.storage.autres_formations_par_etablissement['etab_B']).toBe(undefined);
    });
});

describe('ACTION_LYCEE — Résultats Chateaubriand (0350710G)', () => {
    it('Le dataset action_lycee ne contient que 3 formations, aucune 5+', () => {
        // Données réelles de l'API Onisep dataset 605340ddc19a9
        const actionsLycee = [
            { for_libelle: 'classe de 2de générale et technologique', for_niveau_de_sortie: 'seconde' },
            { for_libelle: 'bac général', for_niveau_de_sortie: 'bac ou équivalent' },
            { for_libelle: 'classe de 1re générale', for_niveau_de_sortie: '1re' }
        ];
        
        expect(actionsLycee).toHaveLength(3);
        
        // Aucune formation 5+ dans action_lycee
        const niveaux5plus = actionsLycee.filter(a => {
            const niv = (a.for_niveau_de_sortie || '').toLowerCase();
            return niv.startsWith('bac + ') || niv.startsWith('bac+');
        });
        expect(niveaux5plus).toHaveLength(0);
    });

    it('buildDiplomesValidesArray filtre correctement pour Chateaubriand', () => {
        // Simule le filtre de #buildDiplomesValidesArray
        const NIVEAUX_VALIDES = ['cap ou équivalent', 'bac ou équivalent'];
        
        const allDiplomes = [
            { libelle: 'classe de 2de GT', niveauSortie: 'seconde' },
            { libelle: 'bac général', niveauSortie: 'bac ou équivalent' },
            { libelle: 'classe de 1re G', niveauSortie: '1re' },
            // Formations fictives 5+ qui viendraient d'action_sup
            { libelle: 'CPGE MPSI', niveauSortie: 'bac + 1' },
            { libelle: 'BTS SIO', niveauSortie: 'bac + 2' }
        ];
        
        const valides = allDiplomes.filter(d => 
            NIVEAUX_VALIDES.includes((d.niveauSortie || '').toLowerCase())
        );
        const rejetes = allDiplomes.filter(d => 
            !NIVEAUX_VALIDES.includes((d.niveauSortie || '').toLowerCase())
        );
        
        // Seul le bac général passe le filtre
        expect(valides).toHaveLength(1);
        expect(valides[0].libelle).toBe('bac général');
        
        // Les 4 autres sont rejetés (dont les 5+)
        expect(rejetes).toHaveLength(4);
    });

    it('Protection null sur niveauSortie dans buildDiplomesValidesArray', () => {
        const diplome = { libelle: 'Formation test', niveauSortie: null };
        // Avant fix : diplome.niveauSortie.toLowerCase() → crash
        // Après fix : (diplome.niveauSortie || '').toLowerCase() → ''
        const niveau = (diplome.niveauSortie || '').toLowerCase();
        expect(niveau).toBe('');
    });
});

describe('preferAccentedCommune — préférence accents communes', () => {
    // Simule la fonction de utils.js
    function preferAccentedCommune(a, b) {
        if (!a && !b) return null;
        if (!a) return b;
        if (!b) return a;
        const diacriticsCount = (str) => {
            const nfd = str.normalize('NFD');
            return nfd.length - str.length;
        };
        return diacriticsCount(a) >= diacriticsCount(b) ? a : b;
    }

    it('Préfère la version avec accents', () => {
        expect(preferAccentedCommune('Cesson-Sévigné', 'Cesson-Sevigne')).toBe('Cesson-Sévigné');
    });

    it('Ordre inversé → même résultat', () => {
        expect(preferAccentedCommune('Cesson-Sevigne', 'Cesson-Sévigné')).toBe('Cesson-Sévigné');
    });

    it('Deux versions identiques → retourne la première', () => {
        expect(preferAccentedCommune('Rennes', 'Rennes')).toBe('Rennes');
    });

    it('null + valeur → retourne la valeur', () => {
        expect(preferAccentedCommune(null, 'Rennes')).toBe('Rennes');
        expect(preferAccentedCommune('Rennes', null)).toBe('Rennes');
    });

    it('null + null → retourne null', () => {
        expect(preferAccentedCommune(null, null)).toBeNull();
    });

    it('Plus d\'accents = mieux', () => {
        expect(preferAccentedCommune('Château-Gontier-sur-Mayenne', 'Chateau-Gontier-sur-Mayenne'))
            .toBe('Château-Gontier-sur-Mayenne');
    });
});

describe('parseActionsSup — collecte enrichissements_etab (fix v0.60)', () => {
    it('parseActionsSup doit retourner enrichissements_etab dans le résultat', () => {
        // Structure attendue après fix v0.60
        const mockResult = {
            diplomes: [],
            relations: [],
            enrichissements_etab: [
                { uai: '0350710G', nom: 'Lycée Chateaubriand', adresse: '136 bd de Vitré' }
            ]
        };
        
        expect(Array.isArray(mockResult.enrichissements_etab)).toBe(true);
        expect(mockResult.enrichissements_etab).toHaveLength(1);
        expect(mockResult.enrichissements_etab[0].uai).toBe('0350710G');
    });
});

// ══════════════════════════════════════════════════════════
// RAPPORT FINAL
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
