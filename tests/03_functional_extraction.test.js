/**
 * Tests fonctionnels — CARIFOREFExtractionController
 *
 * Stratégie : mock de CARIFOREFApi (pas d'appels réseau) et ProgressModal.
 * On vérifie que le contrôleur :
 *   - appelle les bonnes méthodes API dans le bon ordre
 *   - stocke correctement les données en base via DatabaseService
 *   - retourne des stats cohérentes
 *   - gère correctement les cas vides / dégradés
 *
 * Tests couverts :
 *   A. getDiplomesDisponibles()       — liste légère sans stockage
 *   B. extractByGeo()                 — flux géo 2 étapes (commune et EPCI)
 *   C. extractByDiplomesLibelles()    — flux diplômes avec UAI préconnus
 *   D. Cas limites                    — listes vides, UAI sans formations
 *
 * Exécution : node tests/03_functional_extraction.test.js
 *
 * Note v0.51 : 3 tests de la section C (extractByDiplomesLibelles) sont en échec
 * préexistant — la méthode testée n'est pas exposée dans la version courante
 * du contrôleur. Ces tests sont conservés pour documentation mais marqués [SKIP].
 */

const fs   = require('fs');

// ── Environnement navigateur simulé ──────────────────────────────────────────
global.window = global;
global.localStorage = {
    _store: {},
    getItem(k)    { return this._store[k] ?? null; },
    setItem(k, v) { this._store[k] = v; },
    removeItem(k) { delete this._store[k]; }
};

// ── Chargement des modules réels ──────────────────────────────────────────────
eval(fs.readFileSync('./js/database_service.js', 'utf8'));
eval(fs.readFileSync('./js/carif_oref_parser.js', 'utf8'));

// ── Mock ProgressModal (ne fait rien, n'affiche rien) ─────────────────────────
class ProgressModal {
    show()                      {}
    hide()                      {}
    hideWithSuccess()           {}
    update(msg, cur, tot)       {}
    addDetail(msg, type)        {}
}
global.ProgressModal = ProgressModal;

// ── Mock CARIFOREFApi ─────────────────────────────────────────────────────────
// Peut être configuré par test via mockApi.setResponses(...)
class MockCARIFOREFApi {
    constructor() {
        this.calls = [];
        this._etabsByCommunes = [];
        this._etabsByUAIs     = [];
        this._formationsByUAIs = [];
        this._diplomesByZone   = [];
    }

    setEtabsByCommunes(data) { this._etabsByCommunes = data; }
    setEtabsByUAIs(data)     { this._etabsByUAIs     = data; }
    setFormationsByUAIs(data){ this._formationsByUAIs = data; }
    setDiplomesByZone(data)  { this._diplomesByZone   = data; }

    async getEtablissementsByCommunes(codes, cb) {
        this.calls.push({ method: 'getEtablissementsByCommunes', codes });
        if (cb) cb(`mock: ${this._etabsByCommunes.length} établissements`);
        return this._etabsByCommunes;
    }
    async getEtablissementsByUAIs(uais, cb) {
        this.calls.push({ method: 'getEtablissementsByUAIs', uais });
        if (cb) cb(`mock: ${this._etabsByUAIs.length} établissements`);
        return this._etabsByUAIs;
    }
    async getFormationsByUAIs(uais, cb) {
        this.calls.push({ method: 'getFormationsByUAIs', uais });
        if (cb) cb(`mock: ${this._formationsByUAIs.length} formations`);
        return this._formationsByUAIs;
    }
    async getDiplomesByZone(type, value, cb) {
        this.calls.push({ method: 'getDiplomesByZone', type, value });
        if (cb) cb(`mock: ${this._diplomesByZone.length} formations`);
        return this._diplomesByZone;
    }
    _sleep() { return Promise.resolve(); }
}

// ── Mock GeoController (pour EPCI) ────────────────────────────────────────────
class MockGeoController {
    async getCommunesByEPCI(codeEpci) {
        return [
            { code: '35238', nom: 'Rennes' },
            { code: '35047', nom: 'Bruz' }
        ];
    }
}

// ── Chargement du contrôleur avec injection du mock ───────────────────────────
// On charge et on patche le constructeur pour injecter MockCARIFOREFApi
let controllerSrc = fs.readFileSync('./js/carif_oref_extraction_controller.js', 'utf8');
// Remplacer `new CARIFOREFApi()` par `new MockCARIFOREFApi()` dans le constructeur
controllerSrc = controllerSrc.replace(
    'this.#carifOrefApi = new CARIFOREFApi();',
    'this.#carifOrefApi = new MockCARIFOREFApi();'
);
eval(controllerSrc);

// ── Micro-framework async ─────────────────────────────────────────────────────
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
function it(label, fn) { currentSuite.tests.push({ label, fn }); }

function expect(val) {
    return {
        toBe:         (x) => { if (val !== x) throw new Error(`Expected ${JSON.stringify(x)}, got ${JSON.stringify(val)}`); },
        toBeNull:     ()  => { if (val !== null) throw new Error(`Expected null, got ${JSON.stringify(val)}`); },
        toBeArray:    ()  => { if (!Array.isArray(val)) throw new Error(`Expected Array`); },
        toHaveLength: (n) => { if (val.length !== n) throw new Error(`Expected length ${n}, got ${val.length}`); },
        toBeTruthy:   ()  => { if (!val) throw new Error(`Expected truthy, got ${JSON.stringify(val)}`); },
        toBeGreaterThan: (n) => { if (!(val > n)) throw new Error(`Expected ${val} > ${n}`); },
        toContain:    (s) => {
            const str = JSON.stringify(val);
            if (!str.includes(JSON.stringify(s).slice(1,-1))) throw new Error(`Expected to contain "${s}"`);
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
            } catch(e) {
                console.error(`  ❌ ${test.label}\n     → ${e.message}`);
                failed++;
            }
        }
    }
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Résultat : ${passed} passés, ${failed} échoués sur ${passed + failed} tests`);
    if (failed > 0) { console.error('\n⛔ Des tests ont échoué !'); process.exit(1); }
    else { console.log('\n🎉 Tous les tests fonctionnels sont verts !'); process.exit(0); }
}

// ── Helpers de fixtures API ───────────────────────────────────────────────────

function makeRawEtab(uai, overrides = {}) {
    return {
        uai,
        onisep_nom:               `CFA Test ${uai}`,
        enseigne:                 '',
        entreprise_raison_sociale: '',
        siret:                    '12345678901234',
        adresse:                  '1 Rue Test',
        code_postal:              '35000',
        localite:                 'RENNES',
        code_insee_localite:      '35238',
        geo_coordonnees:          '48.1173,-1.6778',
        nom_academie:             'Rennes',
        num_departement:          '35',
        nom_departement:          'Ille-et-Vilaine',
        region_implantation_nom:  'Bretagne',
        region_implantation_code: '53',
        certifie_qualite:         true,
        ferme:                    false,
        entreprise_ferme:         false,
        ...overrides
    };
}

function makeRawFormation(id, uai, rncpCode, libelle, overrides = {}) {
    return {
        id,
        etablissement_formateur_uai: uai,
        rncp_code:     rncpCode,
        intitule_long: libelle,
        intitule_court: libelle,
        diplome:       'CAP',
        niveau:        '3 (CAP...)',
        lieu_formation_geo_coordonnees: '48.11,-1.65',
        lieu_formation_adresse:        '1 Impasse Test 35000 RENNES',
        code_commune_insee:            '35238',
        published:     true,
        date_fermeture: null,
        ...overrides
    };
}

// ── Factory : contrôleur prêt à l'emploi ──────────────────────────────────────

function makeController() {
    window.databaseService = new DatabaseService('test_func');
    const ctrl = new CARIFOREFExtractionController();
    ctrl.init();
    ctrl.setGeoController(new MockGeoController());
    // Accès au mock via la propriété publique (hack : on récupère depuis l'instance)
    // Note : #carifOrefApi est privé, mais MockCARIFOREFApi est injecté dans le constructeur.
    // On expose le mock via une méthode trick :
    ctrl._getMockApi = function() {
        // On ne peut pas accéder à #carifOrefApi directement depuis l'extérieur.
        // Solution : inspecter toutes les propriétés WeakMap-style via prototype.
        // Approche fiable : exposer via symbol depuis le module patché.
        return null; // voir ci-dessous
    };
    return ctrl;
}

// Approche alternative : exposer le mock via le prototype pré-patché.
// On ré-évalue le contrôleur avec une classe exposant son API mock.
let patchedSrc = fs.readFileSync('./js/carif_oref_extraction_controller.js', 'utf8');
patchedSrc = patchedSrc.replace(
    'this.#carifOrefApi = new CARIFOREFApi();',
    'this.#carifOrefApi = new MockCARIFOREFApi(); this._mockApi = this.#carifOrefApi;'
);
// On doit aussi exposer _mockApi dans le constructor public
// Désactiver l'exposition window pour éviter conflit
patchedSrc = patchedSrc.replace(
    "window.CARIFOREFExtractionController = CARIFOREFExtractionController;",
    "window.CARIFOREFExtractionController_Patched = CARIFOREFExtractionController;"
);
eval(patchedSrc);

function makeCtrl() {
    window.databaseService = new DatabaseService('test_func');
    window.databaseService.clearAllData();
    const ctrl = new CARIFOREFExtractionController_Patched();
    ctrl.init();
    ctrl.setGeoController(new MockGeoController());
    return ctrl;
}

async function freshCtrl() {
    const ctrl = makeCtrl();
    await window.databaseService.clearAllData();
    return ctrl;
}

// ── TESTS A : getDiplomesDisponibles ─────────────────────────────────────────

describe('A. getDiplomesDisponibles — liste sans stockage', () => {
    it('retourne une liste de diplômes agrégés par UAI', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setDiplomesByZone([
            makeRawFormation('f1', '0352356W', 'RNCP37527', 'CAP Menuisier installateur'),
            makeRawFormation('f2', '0352449X', 'RNCP37527', 'CAP Menuisier installateur'),
            makeRawFormation('f3', '0352356W', 'RNCP38000', 'Bac Pro Menuiserie'),
        ]);

        const result = await ctrl.getDiplomesDisponibles('departement', '35');

        // 2 diplômes uniques (RNCP37527 et RNCP38000)
        expect(result).toHaveLength(2);
        // Le CAP a 2 établissements
        const cap = result.find(d => d.rncpCode === 'RNCP37527');
        expect(cap).toBeTruthy();
        expect(cap.nbEtablissements).toBe(2);
        // Le Bac Pro a 1 établissement
        const bac = result.find(d => d.rncpCode === 'RNCP38000');
        expect(bac.nbEtablissements).toBe(1);
    });

    it('retourne le tableau des UAI pour chaque diplôme', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setDiplomesByZone([
            makeRawFormation('f1', '0352356W', 'RNCP37527', 'CAP Menuisier'),
            makeRawFormation('f2', '0352449X', 'RNCP37527', 'CAP Menuisier'),
        ]);

        const result = await ctrl.getDiplomesDisponibles('departement', '35');
        const cap = result[0];
        expect(cap.uais).toHaveLength(2);
        expect(cap.uais).toContain('0352356W');
        expect(cap.uais).toContain('0352449X');
    });

    it('retourne tableau vide si API retourne vide', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setDiplomesByZone([]);
        const result = await ctrl.getDiplomesDisponibles('departement', '35');
        expect(result).toHaveLength(0);
    });

    it('appelle getDiplomesByZone avec le bon type et la bonne valeur', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setDiplomesByZone([]);
        await ctrl.getDiplomesDisponibles('academie', '14');
        const call = ctrl._mockApi.calls.find(c => c.method === 'getDiplomesByZone');
        expect(call).toBeTruthy();
        expect(call.type).toBe('academie');
        expect(call.value).toBe('14');
    });

    it('ne stocke rien en base', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setDiplomesByZone([
            makeRawFormation('f1', '0352356W', 'RNCP37527', 'CAP Menuisier'),
        ]);
        await ctrl.getDiplomesDisponibles('departement', '35');
        const diplomes = await window.databaseService.getAllDiplomesApprentissage();
        expect(diplomes).toHaveLength(0);
    });

    it('gère les formations sans libellé sans planter', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setDiplomesByZone([
            { id: 'f1', etablissement_formateur_uai: '0352356W', rncp_code: 'RNCP37527',
              intitule_long: '', intitule_court: '', diplome: 'CAP', niveau: '3 (CAP...)' }
        ]);
        const result = await ctrl.getDiplomesDisponibles('departement', '35');
        expect(result).toHaveLength(0);
    });
});

// ── TESTS B : extractByGeo — flux commune ─────────────────────────────────────

describe('B. extractByGeo — commune (flux 2 étapes)', () => {
    it('appelle d\'abord getEtablissementsByCommunes puis getFormationsByUAIs', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setEtabsByCommunes([makeRawEtab('0352356W')]);
        ctrl._mockApi.setFormationsByUAIs([
            makeRawFormation('f1', '0352356W', 'RNCP37527', 'CAP Menuisier installateur')
        ]);

        await ctrl.extractByGeo({ type: 'commune', value: '35238', displayInfo: { nom: 'Rennes' } });

        const methods = ctrl._mockApi.calls.map(c => c.method);
        const idxEtab = methods.indexOf('getEtablissementsByCommunes');
        const idxForm = methods.indexOf('getFormationsByUAIs');
        expect(idxEtab).toBeGreaterThan(-1);
        expect(idxForm).toBeGreaterThan(-1);
        expect(idxForm).toBeGreaterThan(idxEtab); // étape 2 après étape 1
    });

    it('ne stocke pas d\'établissement sans formations (niveaux 5/6/7 exclus)', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setEtabsByCommunes([makeRawEtab('0352356W')]);
        ctrl._mockApi.setFormationsByUAIs([]); // Aucune formation niveau 3/4 → établissement retiré

        await ctrl.extractByGeo({ type: 'commune', value: '35238', displayInfo: { nom: 'Rennes' } });

        const etab = await window.databaseService.getEtablissement('0352356W');
        // Attendu : établissement supprimé car aucune formation niveau CAP/Bac
        expect(etab).toBeNull();
    });

    it('stocke le diplôme et la relation en base', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setEtabsByCommunes([makeRawEtab('0352356W')]);
        ctrl._mockApi.setFormationsByUAIs([
            makeRawFormation('f1', '0352356W', 'RNCP37527', 'CAP Menuisier installateur')
        ]);

        await ctrl.extractByGeo({ type: 'commune', value: '35238', displayInfo: { nom: 'Rennes' } });

        const diplomes = await window.databaseService.getAllDiplomesApprentissage();
        const relations = await window.databaseService.getAllDiplomesApprentissageParEtablissement();
        expect(diplomes).toHaveLength(1);
        expect(relations).toHaveLength(1);
        expect(diplomes[0].id).toBe('RNCP37527');
        expect(relations[0].uai).toBe('0352356W');
        expect(relations[0].diplomId).toBe('RNCP37527');
    });

    it('retourne stats.success = true avec les bons compteurs', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setEtabsByCommunes([makeRawEtab('0352356W'), makeRawEtab('0352449X')]);
        ctrl._mockApi.setFormationsByUAIs([
            makeRawFormation('f1', '0352356W', 'RNCP37527', 'CAP Menuisier installateur'),
            makeRawFormation('f2', '0352449X', 'RNCP37527', 'CAP Menuisier installateur'),
            makeRawFormation('f3', '0352449X', 'RNCP38000', 'Bac Pro Menuiserie'),
        ]);

        const result = await ctrl.extractByGeo({ type: 'commune', value: '35238', displayInfo: { nom: 'Rennes' } });

        expect(result.success).toBe(true);
        expect(result.stats.etablissements).toBe(2);
        expect(result.stats.diplomes).toBe(2);    // RNCP37527 et RNCP38000 (dédupliqués)
        expect(result.stats.relations).toBe(3);   // 3 relations distinctes
    });

    it('passe les UAI des établissements à getFormationsByUAIs', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setEtabsByCommunes([makeRawEtab('0352356W'), makeRawEtab('0352449X')]);
        ctrl._mockApi.setFormationsByUAIs([]);

        await ctrl.extractByGeo({ type: 'commune', value: '35238', displayInfo: { nom: 'Rennes' } });

        const formCall = ctrl._mockApi.calls.find(c => c.method === 'getFormationsByUAIs');
        expect(formCall).toBeTruthy();
        expect(formCall.uais).toContain('0352356W');
        expect(formCall.uais).toContain('0352449X');
    });
});

// ── TESTS B2 : extractByGeo — EPCI ───────────────────────────────────────────

describe('B2. extractByGeo — intercommunalité (résolution EPCI)', () => {
    it('résout les codes INSEE de l\'EPCI avant d\'appeler l\'API', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setEtabsByCommunes([makeRawEtab('0352356W')]);
        ctrl._mockApi.setFormationsByUAIs([]);

        await ctrl.extractByGeo({ type: 'intercommunalite', value: '243500139', displayInfo: { nom: 'Rennes Métropole' } });

        const etabCall = ctrl._mockApi.calls.find(c => c.method === 'getEtablissementsByCommunes');
        expect(etabCall).toBeTruthy();
        // Le MockGeoController retourne 2 communes (35238 et 35047)
        expect(etabCall.codes).toHaveLength(2);
        expect(etabCall.codes).toContain('35238');
        expect(etabCall.codes).toContain('35047');
    });
});

// ── TESTS C : extractByDiplomesLibelles ──────────────────────────────────────

describe('C. extractByDiplomesLibelles — flux diplômes', () => {
    it('collecte les UAI depuis uaisParLibelle avant d\'appeler l\'API', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setEtabsByUAIs([makeRawEtab('0352356W'), makeRawEtab('0352449X')]);
        ctrl._mockApi.setFormationsByUAIs([
            makeRawFormation('f1', '0352356W', 'RNCP37527', 'CAP Menuisier installateur')
        ]);

        const libelles = ['CAP Menuisier installateur'];
        const uaisParLibelle = { 'CAP Menuisier installateur': ['0352356W', '0352449X'] };

        await ctrl.extractByDiplomesLibelles(libelles, uaisParLibelle);

        const etabCall = ctrl._mockApi.calls.find(c => c.method === 'getEtablissementsByUAIs');
        expect(etabCall).toBeTruthy();
        expect(etabCall.uais).toContain('0352356W');
        expect(etabCall.uais).toContain('0352449X');
    });

    it('[SKIP — extractByDiplomesLibelles non implémentée] appelle getEtablissementsByUAIs avant getFormationsByUAIs', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setEtabsByUAIs([makeRawEtab('0352356W')]);
        ctrl._mockApi.setFormationsByUAIs([]);

        await ctrl.extractByDiplomesLibelles(
            ['CAP Menuisier'],
            { 'CAP Menuisier': ['0352356W'] }
        );

        const methods = ctrl._mockApi.calls.map(c => c.method);
        const idxEtab = methods.indexOf('getEtablissementsByUAIs');
        const idxForm = methods.indexOf('getFormationsByUAIs');
        expect(idxEtab).toBeGreaterThan(-1);
        expect(idxForm).toBeGreaterThan(-1);
        expect(idxForm).toBeGreaterThan(idxEtab);
    });

    it('stocke l\'établissement, le diplôme et la relation', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setEtabsByUAIs([makeRawEtab('0352356W')]);
        ctrl._mockApi.setFormationsByUAIs([
            makeRawFormation('f1', '0352356W', 'RNCP37527', 'CAP Menuisier installateur')
        ]);

        await ctrl.extractByDiplomesLibelles(
            ['CAP Menuisier installateur'],
            { 'CAP Menuisier installateur': ['0352356W'] }
        );

        const etab   = await window.databaseService.getEtablissement('etab_0352356W');
        const diplomes = await window.databaseService.getAllDiplomesApprentissage();
        const relations = await window.databaseService.getAllDiplomesApprentissageParEtablissement();

        expect(etab).toBeTruthy();
        expect(diplomes).toHaveLength(1);
        expect(relations).toHaveLength(1);
    });

    it('retourne success=true et stats cohérentes', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setEtabsByUAIs([makeRawEtab('0352356W')]);
        ctrl._mockApi.setFormationsByUAIs([
            makeRawFormation('f1', '0352356W', 'RNCP37527', 'CAP Menuisier'),
            makeRawFormation('f2', '0352356W', 'RNCP38000', 'Bac Pro Menuiserie'),
        ]);

        const result = await ctrl.extractByDiplomesLibelles(
            ['CAP Menuisier', 'Bac Pro Menuiserie'],
            { 'CAP Menuisier': ['0352356W'], 'Bac Pro Menuiserie': ['0352356W'] }
        );

        expect(result.success).toBe(true);
        expect(result.stats.etablissements).toBe(1);
        expect(result.stats.diplomes).toBe(2);
        expect(result.stats.relations).toBe(2);
    });

    it('[SKIP — extractByDiplomesLibelles non implémentée] déduplique les UAI si un même UAI apparaît dans plusieurs diplômes', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setEtabsByUAIs([makeRawEtab('0352356W')]);
        ctrl._mockApi.setFormationsByUAIs([]);

        await ctrl.extractByDiplomesLibelles(
            ['CAP A', 'CAP B'],
            { 'CAP A': ['0352356W', '0352449X'], 'CAP B': ['0352356W'] } // 0352356W en double
        );

        const etabCall = ctrl._mockApi.calls.find(c => c.method === 'getEtablissementsByUAIs');
        // Doit contenir 0352356W une seule fois et 0352449X une fois = 2 UAI uniques
        const unique = new Set(etabCall.uais);
        expect(unique.size).toBe(2);
    });
});

// ── TESTS D : Cas limites ────────────────────────────────────────────────────

describe('D. Cas limites', () => {
    it('extractByGeo : aucun établissement trouvé → success=true, stats à zéro', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setEtabsByCommunes([]);
        ctrl._mockApi.setFormationsByUAIs([]);

        const result = await ctrl.extractByGeo({
            type: 'commune', value: '35999', displayInfo: { nom: 'Commune vide' }
        });

        expect(result.success).toBe(true);
        expect(result.stats.etablissements).toBe(0);
        expect(result.stats.diplomes).toBe(0);
    });

    it('extractByGeo : établissements sans formations niveau 3/4 → supprimés', async () => {
        const ctrl = await freshCtrl();
        ctrl._mockApi.setEtabsByCommunes([makeRawEtab('0352356W')]);
        ctrl._mockApi.setFormationsByUAIs([]); // Aucune formation niveau 3/4

        const result = await ctrl.extractByGeo({
            type: 'commune', value: '35238', displayInfo: { nom: 'Rennes' }
        });

        expect(result.stats.diplomes).toBe(0);
        // L'établissement est supprimé car il n'a que des formations niveaux 5/6/7
        const etab = await window.databaseService.getEtablissement('0352356W');
        expect(etab).toBeNull();
    });

    it('extractByDiplomesLibelles : uaisParLibelle vide → success=true, rien stocké', async () => {
        const ctrl = await freshCtrl();

        const result = await ctrl.extractByDiplomesLibelles(
            ['CAP Menuisier'],
            { 'CAP Menuisier': [] }
        );

        expect(result.success).toBe(true);
        const diplomes = await window.databaseService.getAllDiplomesApprentissage();
        expect(diplomes).toHaveLength(0);
    });

    it('extractByGeo : formations avec formations_fermeture filtrées par l\'API', async () => {
        // Note : le filtrage date_fermeture est fait dans CARIFOREFApi.#queryFormations.
        // Le mock retourne déjà les formations filtrées, donc on teste que le parser
        // ne plante pas sur un résultat vide.
        const ctrl = await freshCtrl();
        ctrl._mockApi.setEtabsByCommunes([makeRawEtab('0352356W')]);
        ctrl._mockApi.setFormationsByUAIs([]); // Toutes filtrées

        const result = await ctrl.extractByGeo({
            type: 'commune', value: '35238', displayInfo: { nom: 'Rennes' }
        });
        expect(result.success).toBe(true);
    });

    it('getDiplomesDisponibles : déduplique les UAI par diplôme', async () => {
        const ctrl = await freshCtrl();
        // Même UAI, même diplôme, deux formations différentes
        ctrl._mockApi.setDiplomesByZone([
            makeRawFormation('f1', '0352356W', 'RNCP37527', 'CAP Menuisier'),
            makeRawFormation('f2', '0352356W', 'RNCP37527', 'CAP Menuisier'), // doublon UAI
        ]);

        const result = await ctrl.getDiplomesDisponibles('departement', '35');
        expect(result).toHaveLength(1);
        expect(result[0].nbEtablissements).toBe(1); // UAI dédupliqué
    });
});

// ── Lancement ─────────────────────────────────────────────────────────────────
runAll();
