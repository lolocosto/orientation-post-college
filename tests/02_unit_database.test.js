/**
 * Tests unitaires — DatabaseService (méthodes apprentissage)
 * Version v0.41 — API basée sur _id interne (pas UAI comme clé)
 *
 * Exécution : node tests/02_unit_database.test.js
 */

const fs = require('fs');

// Simuler window + localStorage pour DatabaseService
global.window   = global;
global.localStorage = {
    _store: {},
    getItem(k)    { return this._store[k] ?? null; },
    setItem(k, v) { this._store[k] = v; },
    removeItem(k) { delete this._store[k]; }
};

eval(fs.readFileSync('./js/database_service.js', 'utf8'));

// ── Micro-framework ──────────────────────────────────────────────────────────
let passed = 0, failed = 0;
const suites = [];
let currentSuite = null;

function describe(label, fn) {
    const suite = { label, tests: [] };
    suites.push(suite);
    currentSuite = suite;
    fn();
    currentSuite = null;
}

function it(label, fn) {
    currentSuite.tests.push({ label, fn });
}

function expect(val) {
    return {
        toBe:         (x) => { if (val !== x) throw new Error(`Expected ${JSON.stringify(x)}, got ${JSON.stringify(val)}`); },
        toBeNull:     ()  => { if (val !== null) throw new Error(`Expected null, got ${JSON.stringify(val)}`); },
        toBeArray:    ()  => { if (!Array.isArray(val)) throw new Error(`Expected Array`); },
        toHaveLength: (n) => { if (val.length !== n) throw new Error(`Expected length ${n}, got ${val.length}`); },
        toBeTruthy:   ()  => { if (!val) throw new Error(`Expected truthy, got ${JSON.stringify(val)}`); },
        toContain:    (s) => { if (!String(val).includes(s)) throw new Error(`Expected "${val}" to contain "${s}"`); },
        toEqual:      (x) => {
            const a = JSON.stringify(val), b = JSON.stringify(x);
            if (a !== b) throw new Error(`Expected ${b}\n       got ${a}`);
        }
    };
}

async function runAll() {
    for (const suite of suites) {
        console.log(`\n📦 ${suite.label}`);
        for (const test of suite.tests) {
            try {
                await test.fn();
                console.log(`  ✅ ${test.label}`);
                passed++;
            } catch (e) {
                console.error(`  ❌ ${test.label}\n     → ${e.message}`);
                failed++;
            }
        }
    }
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Résultat : ${passed} passés, ${failed} échoués sur ${passed + failed} tests`);
    if (failed > 0) {
        console.error('\n⛔ Des tests ont échoué !');
        process.exit(1);
    } else {
        console.log('\n🎉 Tous les tests unitaires DatabaseService sont verts !');
        process.exit(0);
    }
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const DIPLOME_1 = {
    id: 'RNCP37527',
    rncpCode: 'RNCP37527',
    libelle: 'CAP Menuisier installateur',
    typeDiplome: 'CAP',
    niveau: '3 (CAP...)',
    libelleNormalise: 'cap menuisier installateur'
};

const DIPLOME_2 = {
    id: 'RNCP38000',
    rncpCode: 'RNCP38000',
    libelle: 'Bac Pro Aménagement et finition du bâtiment',
    typeDiplome: 'BAC PRO',
    niveau: '4 (BAC...)',
    libelleNormalise: 'bac pro amenagement et finition du batiment'
};

// Relations pointent sur l'_id interne de l'étab (etab_0352356W)
const ETAB_ID = 'etab_0352356W';

const RELATION_1 = {
    id: 'rel-001',
    diplomId: 'RNCP37527',
    etabId: ETAB_ID,
    uai: '0352356W',
    lieuLatitude: 48.11,
    lieuLongitude: -1.65,
    lieuCodeCommune: '35238',
    published: true
};

const RELATION_2 = {
    id: 'rel-002',
    diplomId: 'RNCP37527',
    etabId: 'etab_0352449X',
    uai: '0352449X',
    lieuLatitude: 48.12,
    lieuLongitude: -1.70,
    lieuCodeCommune: '35238',
    published: true
};

const ETAB_CARIF = {
    uai: '0352356W',
    nom: 'CFA des Métiers du Bois',
    siret: '19352356700019',
    codePostal: '35000',
    commune: 'RENNES',
    latitude: 48.1173,
    longitude: -1.6778,
    certifieQualite: true,
    voies: ['apprentissage']
};

const ETAB_ONISEP = {
    uai: '0352356W',
    nom: 'CFA des Métiers du Bois (ONISEP)',
    siret: null,
    codePostal: '35000',
    commune: 'RENNES',
    latitude: null,
    longitude: null,
    academie: 'Rennes',
    voies: ['scolaire']
};

// ── Instanciation ─────────────────────────────────────────────────────────────
let db;

async function freshDb() {
    db = new DatabaseService('test');
    await db.clearAllData();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('insertDiplomeApprentissage', () => {
    it('insère un diplôme valide et retourne son id', async () => {
        await freshDb();
        const key = await db.insertDiplomeApprentissage(DIPLOME_1);
        expect(key).toBe('RNCP37527');
    });
    it('refuse un diplôme sans id', async () => {
        const key = await db.insertDiplomeApprentissage({ libelle: 'sans id' });
        expect(key).toBeNull();
    });
    it('écrase un diplôme existant avec le même id', async () => {
        await freshDb();
        await db.insertDiplomeApprentissage({ id: 'X', libelle: 'Original', rncpCode: null });
        await db.insertDiplomeApprentissage({ id: 'X', libelle: 'Modifié', rncpCode: null });
        const result = await db.getDiplomeApprentissage('X');
        expect(result.libelle).toBe('Modifié');
    });
});

describe('getDiplomeApprentissage / getAllDiplomesApprentissage', () => {
    it('retourne le diplôme par id', async () => {
        await freshDb();
        await db.insertDiplomeApprentissage(DIPLOME_1);
        const d = await db.getDiplomeApprentissage('RNCP37527');
        expect(d.libelle).toBe('CAP Menuisier installateur');
    });
    it('retourne null pour un id inconnu', async () => {
        await freshDb();
        const d = await db.getDiplomeApprentissage('INCONNU');
        expect(d).toBeNull();
    });
    it('getAllDiplomesApprentissage retourne tous les diplômes', async () => {
        await freshDb();
        await db.insertDiplomeApprentissage(DIPLOME_1);
        await db.insertDiplomeApprentissage(DIPLOME_2);
        const all = await db.getAllDiplomesApprentissage();
        expect(all).toHaveLength(2);
    });
});

describe('insertDiplomeApprentissageParEtablissement', () => {
    it('insère une relation valide et retourne son id', async () => {
        await freshDb();
        const key = await db.insertDiplomeApprentissageParEtablissement(RELATION_1);
        expect(key).toBe('rel-001');
    });
    it('génère un id automatique si la relation n\'en a pas (génération auto)', async () => {
        await freshDb();
        // Les relations sans id reçoivent un id généré (nouvelle règle v0.41)
        const key = await db.insertDiplomeApprentissageParEtablissement({ diplomId: 'RNCP37527', etabId: ETAB_ID });
        expect(key).toBeTruthy(); // id généré automatiquement
    });
});

describe('getDiplomesApprentissageParEtablissement — par _id interne', () => {
    it('retourne les diplômes d\'un établissement via son _id', async () => {
        await freshDb();
        await db.insertDiplomeApprentissage(DIPLOME_1);
        await db.insertDiplomeApprentissage(DIPLOME_2);
        // Insérer l'étab pour que _id existe dans le store
        await db.fusionnerEtablissementAprentissage(ETAB_CARIF);
        // Insérer relations avec etabId
        await db.insertDiplomeApprentissageParEtablissement(RELATION_1);
        await db.insertDiplomeApprentissageParEtablissement(RELATION_2);

        const diplomes = await db.getDiplomesApprentissageParEtablissement(ETAB_ID);
        expect(diplomes).toHaveLength(1);
        expect(diplomes[0].id).toBe('RNCP37527');
    });
    it('retourne tableau vide pour _id inconnu', async () => {
        await freshDb();
        const diplomes = await db.getDiplomesApprentissageParEtablissement('etab_INCONNU');
        expect(diplomes).toHaveLength(0);
    });
    it('getDiplomesApprentissageParEtablissementSync retourne le même résultat', async () => {
        await freshDb();
        await db.insertDiplomeApprentissage(DIPLOME_1);
        await db.fusionnerEtablissementAprentissage(ETAB_CARIF);
        await db.insertDiplomeApprentissageParEtablissement(RELATION_1);
        const sync = db.getDiplomesApprentissageParEtablissementSync(ETAB_ID);
        expect(sync).toHaveLength(1);
    });
});

describe('fusionnerEtablissementAprentissage — établissement nouveau', () => {
    it('crée l\'établissement avec voie apprentissage', async () => {
        await freshDb();
        const id = await db.fusionnerEtablissementAprentissage(ETAB_CARIF);
        expect(id).toBeTruthy();
        const e = await db.getEtablissement(id);
        expect(e).toBeTruthy();
        expect(JSON.stringify(e.voies)).toContain('apprentissage');
    });
    it('l\'_id généré vaut etab_<UAI> quand UAI présent', async () => {
        await freshDb();
        const id = await db.fusionnerEtablissementAprentissage(ETAB_CARIF);
        expect(id).toBe(ETAB_ID);
    });
});

describe('fusionnerEtablissementAprentissage — établissement existant (ONISEP)', () => {
    it('enrichit les champs null sans écraser les champs renseignés', async () => {
        await freshDb();
        // Insérer d'abord l'étab ONISEP (voie scolaire, coords nulles)
        const onisepId = await db.insertEtablissement(ETAB_ONISEP);
        // Fusionner les données CARIF (coords renseignées, certifieQualite)
        const fusId = await db.fusionnerEtablissementAprentissage(ETAB_CARIF);
        expect(fusId).toBe(onisepId); // même étab fusionné

        const e = await db.getEtablissement(fusId);
        // Le nom ONISEP doit être conservé (champ non null)
        expect(e.nom).toBe('CFA des Métiers du Bois (ONISEP)');
        // Les coords CARIF ont rempli le vide
        expect(e.latitude).toBe(48.1173);
        // Le certifieQualite CARIF a été ajouté
        expect(e.certifieQualite).toBe(true);
        // L'académie ONISEP est conservée
        expect(e.academie).toBe('Rennes');
    });
    it('ajoute la voie apprentissage sans supprimer scolaire', async () => {
        await freshDb();
        await db.insertEtablissement(ETAB_ONISEP);
        const id = await db.fusionnerEtablissementAprentissage(ETAB_CARIF);
        const e = await db.getEtablissement(id);
        expect(JSON.stringify(e.voies)).toContain('scolaire');
        expect(JSON.stringify(e.voies)).toContain('apprentissage');
    });
    it('ne duplique pas la voie apprentissage si déjà présente', async () => {
        await freshDb();
        await db.fusionnerEtablissementAprentissage(ETAB_CARIF);
        await db.fusionnerEtablissementAprentissage(ETAB_CARIF); // deuxième fusion
        const id = await db.fusionnerEtablissementAprentissage(ETAB_CARIF);
        const e = await db.getEtablissement(id);
        const count = e.voies.filter(v => v === 'apprentissage').length;
        expect(count).toBe(1);
    });
    it('refuse un établissement sans UAI et sans SIRET', async () => {
        await freshDb();
        const result = await db.fusionnerEtablissementAprentissage({ ...ETAB_CARIF, uai: null, siret: null });
        expect(result).toBeNull();
    });
    it('accepte un établissement sans UAI mais avec SIRET', async () => {
        await freshDb();
        const result = await db.fusionnerEtablissementAprentissage({ ...ETAB_CARIF, uai: null });
        expect(result).toBeTruthy(); // SIRET présent → OK, id = etab_<siret>
    });
});

describe('clearAprentissageData', () => {
    it('vide les tables apprentissage sans toucher aux établissements', async () => {
        await freshDb();
        await db.insertDiplomeApprentissage(DIPLOME_1);
        await db.insertDiplomeApprentissageParEtablissement(RELATION_1);
        const id = await db.fusionnerEtablissementAprentissage(ETAB_CARIF);

        await db.clearAprentissageData();

        const diplomes = await db.getAllDiplomesApprentissage();
        const relations = await db.getAllDiplomesApprentissageParEtablissement();
        const etab = await db.getEtablissement(id);

        expect(diplomes).toHaveLength(0);
        expect(relations).toHaveLength(0);
        // L'établissement est conservé mais sans voie apprentissage
        expect(etab).toBeTruthy();
    });
});

describe('getStats — compteurs apprentissage', () => {
    it('compte correctement les tables apprentissage', async () => {
        await freshDb();
        await db.insertDiplomeApprentissage(DIPLOME_1);
        await db.insertDiplomeApprentissage(DIPLOME_2);
        await db.insertDiplomeApprentissageParEtablissement(RELATION_1);

        const stats = await db.getStats();
        expect(stats.diplomes_apprentissage).toBe(2);
        expect(stats.diplomes_apprentissage_par_etablissement).toBe(1);
    });
});

// ── Résumé et exécution ───────────────────────────────────────────────────────
runAll();
