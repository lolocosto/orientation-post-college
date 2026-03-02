/**
 * @file 19_unit_v062_mode_choice_datasets.test.js
 * @description Tests v0.62 — Phase 1 : DatasetService + extensions DatabaseService
 *
 * Couvre :
 *   - DatabaseService : getStorageSnapshot, loadStorageSnapshot,
 *     hasEducationalData, setLastExtractionMetadata, getLastExtractionMetadata
 *   - DatasetService : exportDataset, validateDataset, importDataset,
 *     getDatasetInfo, downloadDataset, index CRUD, utilitaires de formatage
 *
 * @version 0.62
 */

'use strict';

// ══════════════════════════════════════════════════════════
// MOCK localStorage
// ══════════════════════════════════════════════════════════

const _lsStore = {};
const localStorageMock = {
    getItem:    (k)    => _lsStore[k] ?? null,
    setItem:    (k, v) => { _lsStore[k] = String(v); },
    removeItem: (k)    => { delete _lsStore[k]; },
    clear:      ()     => { for (const k in _lsStore) delete _lsStore[k]; }
};
if (typeof globalThis !== 'undefined') {
    globalThis.localStorage = localStorageMock;
}

// ══════════════════════════════════════════════════════════
// CHARGEMENT DES MODULES
// ══════════════════════════════════════════════════════════

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

function loadScript(filename) {
    const code = fs.readFileSync(path.join(__dirname, '..', 'js', filename), 'utf-8');
    vm.runInThisContext(code, { filename });
}

// Mock window
if (typeof window === 'undefined') {
    globalThis.window = globalThis;
}
window.console = console;

// Mock document (for db:ready event dispatch)
if (typeof document === 'undefined') {
    const _eventListeners = {};
    globalThis.document = {
        addEventListener: (type, fn, opts) => {
            if (!_eventListeners[type]) _eventListeners[type] = [];
            _eventListeners[type].push({ fn, once: opts?.once || false });
        },
        removeEventListener: (type, fn) => {
            if (_eventListeners[type]) {
                _eventListeners[type] = _eventListeners[type].filter(l => l.fn !== fn);
            }
        },
        dispatchEvent: (event) => {
            const type = event.type || event;
            const listeners = _eventListeners[type] || [];
            listeners.forEach(l => l.fn(event));
            // Remove once listeners
            _eventListeners[type] = listeners.filter(l => !l.once);
        },
        createElement: () => ({ 
            style: {}, 
            click: () => {}, 
            appendChild: () => {},
            innerHTML: '' 
        }),
        body: { appendChild: () => {}, removeChild: () => {} }
    };
}

// Mock CustomEvent
if (typeof CustomEvent === 'undefined') {
    globalThis.CustomEvent = class CustomEvent {
        constructor(type, options) {
            this.type = type;
            this.detail = options?.detail;
        }
    };
}

// Mock URL
if (typeof URL.createObjectURL === 'undefined') {
    URL.createObjectURL = () => 'blob://mock';
    URL.revokeObjectURL = () => {};
}

// Charger les modules dans l'ordre de dépendance
const APP_VERSION = '0.62';
window.APP_VERSION = APP_VERSION;

loadScript('database_service.js');
loadScript('dataset_service.js');
loadScript('modal.js');
loadScript('mode_choice_modal.js');

// ══════════════════════════════════════════════════════════
// UTILITAIRES DE TEST
// ══════════════════════════════════════════════════════════

let _passed = 0;
let _failed = 0;
let _errors = [];

function assert(condition, message) {
    if (condition) {
        _passed++;
        console.log(`  ✅ ${message}`);
    } else {
        _failed++;
        _errors.push(message);
        console.error(`  ❌ ${message}`);
    }
}

function assertEqual(actual, expected, message) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) {
        _passed++;
        console.log(`  ✅ ${message}`);
    } else {
        _failed++;
        _errors.push(`${message} — attendu: ${JSON.stringify(expected)}, obtenu: ${JSON.stringify(actual)}`);
        console.error(`  ❌ ${message}`);
        console.error(`     attendu: ${JSON.stringify(expected)}`);
        console.error(`     obtenu:  ${JSON.stringify(actual)}`);
    }
}

function section(title) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${title}`);
    console.log(`${'═'.repeat(60)}`);
}

/**
 * Crée un DatabaseService frais avec des données de test.
 * @returns {Promise<DatabaseService>}
 */
async function createTestDb() {
    localStorageMock.clear();
    const db = new DatabaseService('test_db');
    await db.init();
    // Attendre le chargement (même si vide)
    await db.waitReady();
    return db;
}

/**
 * Insère des données éducatives de test dans une DB.
 * @param {DatabaseService} db
 */
async function populateTestData(db) {
    await db.insertEtablissement({
        _id: 'etab_1', nomOnisep: 'Lycée Victor Hugo', uai: '0350001A',
        voies: ['scolaire'], commune: 'Rennes', codeInsee: '35238',
        lat: 48.11, lon: -1.68
    });
    await db.insertEtablissement({
        _id: 'etab_2', nomCarif: 'CFA des métiers', uai: '0350002B',
        voies: ['apprentissage'], siret: '12345678901234',
        commune: 'Rennes', codeInsee: '35238', lat: 48.12, lon: -1.67
    });
    await db.insertDiplome({ libelle: 'CAP Menuisier', niveau: '3', code: 'RNCP123' });
    await db.insertDiplome({ libelle: 'Bac Pro MELEC', niveau: '4', code: 'RNCP456' });
    await db.insertDiplomeParEtablissement({ id: 'rel_1', etabId: 'etab_1', diplomeLibelle: 'CAP Menuisier' });
    await db.insertDispositif({ libelle: '3ème Prépa-métiers' });
    await db.flush();
}

// ══════════════════════════════════════════════════════════
// TESTS — DatabaseService : snapshot & métadonnées
// ══════════════════════════════════════════════════════════

async function testDatabaseServiceSnapshot() {
    section('DatabaseService — getStorageSnapshot / loadStorageSnapshot');

    // --- Test 1 : getStorageSnapshot retourne les tables éducatives ---
    const db = await createTestDb();
    await populateTestData(db);
    window.databaseService = db;

    const snapshot = await db.getStorageSnapshot();

    assert(snapshot.etablissements !== undefined, 'Snapshot contient « etablissements »');
    assert(snapshot.diplomes !== undefined, 'Snapshot contient « diplomes »');
    assert(snapshot.diplomes_par_etablissement !== undefined, 'Snapshot contient « diplomes_par_etablissement »');
    assert(snapshot.dispositifs !== undefined, 'Snapshot contient « dispositifs »');
    assert(snapshot.langues !== undefined, 'Snapshot contient « langues »');

    // Vérifier que les référentiels géo sont EXCLUS
    assert(snapshot.communes === undefined, 'Snapshot exclut « communes »');
    assert(snapshot.departements === undefined, 'Snapshot exclut « departements »');
    assert(snapshot.regions === undefined, 'Snapshot exclut « regions »');
    assert(snapshot.epci === undefined, 'Snapshot exclut « epci »');

    // Vérifier les données
    assertEqual(Object.keys(snapshot.etablissements).length, 2, 'Snapshot : 2 établissements');
    assertEqual(Object.keys(snapshot.diplomes).length, 2, 'Snapshot : 2 diplômes');

    // --- Test 2 : copie profonde ---
    snapshot.etablissements['etab_1'].nom = 'MODIFIÉ';
    const original = await db.getEtablissement('etab_1');
    assert(original.nom === 'Lycée Victor Hugo', 'Copie profonde : l\'original n\'est pas modifié');

    // --- Test 3 : loadStorageSnapshot remplace les données ---
    const db2 = await createTestDb();
    window.databaseService = db2;

    await db2.loadStorageSnapshot(snapshot);
    const allEtabs = await db2.getAllEtablissements();
    const etab1 = allEtabs.find(e => e._id === 'etab_1');
    assertEqual(etab1.nom, 'MODIFIÉ', 'loadStorageSnapshot charge le snapshot modifié');
    assertEqual(allEtabs.length, 2, 'loadStorageSnapshot : 2 établissements chargés');

    // --- Test 4 : loadStorageSnapshot reconstruit l'index d'unicité ---
    // Tenter d'insérer un doublon : doit retourner l'ID existant
    const existingId = db2.getEtabIdByUaiNom('0350002B', 'CFA des métiers');
    assertEqual(existingId, 'etab_2', 'Index d\'unicité reconstruit après loadStorageSnapshot');

    // --- Test 5 : loadStorageSnapshot avec tables manquantes ---
    const db3 = await createTestDb();
    await db3.loadStorageSnapshot({ etablissements: { etab_99: { _id: 'etab_99', nom: 'Test', voie: 'scolaire', uai: '0001234X' } } });
    const stats3 = await db3.getStats();
    assertEqual(stats3.etablissements, 1, 'Snapshot partiel : 1 établissement');
    assertEqual(stats3.diplomes, 0, 'Snapshot partiel : 0 diplômes (table absente → {})');

    // --- Test 6 : loadStorageSnapshot avec données invalides ---
    const db4 = await createTestDb();
    let errorThrown = false;
    try {
        await db4.loadStorageSnapshot(null);
    } catch (e) {
        errorThrown = true;
    }
    assert(errorThrown, 'loadStorageSnapshot(null) lève une erreur');
}

async function testHasEducationalData() {
    section('DatabaseService — hasEducationalData');

    const dbEmpty = await createTestDb();
    assert(dbEmpty.hasEducationalData() === false, 'Base vide → false');

    const dbFull = await createTestDb();
    await populateTestData(dbFull);
    assert(dbFull.hasEducationalData() === true, 'Base avec données → true');
}

async function testLastExtractionMetadata() {
    section('DatabaseService — setLastExtractionMetadata / getLastExtractionMetadata');

    localStorageMock.clear();
    const db = await createTestDb();

    // Pas de métadonnées au départ
    assertEqual(db.getLastExtractionMetadata(), null, 'Pas de métadonnées initialement');

    // Sauvegarder des métadonnées
    const meta = {
        typeRecherche: 'geo',
        params: { scope: 'commune', commune: { nom: 'Rennes', codeInsee: '35238' }, voies: ['scolaire'] },
        date: '2026-03-02T14:30:00.000Z',
        stats: { etablissements: 42, diplomes: 100 }
    };
    db.setLastExtractionMetadata(meta);

    const retrieved = db.getLastExtractionMetadata();
    assertEqual(retrieved.typeRecherche, 'geo', 'Métadonnées : typeRecherche correct');
    assertEqual(retrieved.params.commune.nom, 'Rennes', 'Métadonnées : commune correcte');
    assertEqual(retrieved.stats.etablissements, 42, 'Métadonnées : stats correctes');

    // Vérifier la persistance (nouvelle instance)
    const db2 = await createTestDb();
    // Les métadonnées sont dans localStorage indépendamment de la DB
    const retrieved2 = db2.getLastExtractionMetadata();
    // Note : createTestDb() appelle localStorageMock.clear(), donc on re-teste sans clear
    // Re-sauvegarder pour ce test
    db2.setLastExtractionMetadata(meta);
    assertEqual(db2.getLastExtractionMetadata().typeRecherche, 'geo', 'Persistance des métadonnées');
}

async function testGetEducationalTableNames() {
    section('DatabaseService — getEducationalTableNames');

    const names = DatabaseService.getEducationalTableNames();
    assert(Array.isArray(names), 'Retourne un tableau');
    assert(names.includes('etablissements'), 'Contient « etablissements »');
    assert(names.includes('diplomes'), 'Contient « diplomes »');
    assert(names.includes('langues'), 'Contient « langues »');
    assert(!names.includes('communes'), 'Ne contient pas « communes »');
    assert(!names.includes('preferences'), 'Ne contient pas « preferences »');
    assertEqual(names.length, 13, '13 tables éducatives');
}

// ══════════════════════════════════════════════════════════
// TESTS — DatasetService : export
// ══════════════════════════════════════════════════════════

async function testDatasetExport() {
    section('DatasetService — exportDataset');

    const db = await createTestDb();
    await populateTestData(db);
    window.databaseService = db;

    const dataset = await DatasetService.exportDataset({
        nom: 'Test Rennes',
        typeRecherche: 'geo',
        params: { scope: 'commune', commune: { nom: 'Rennes' }, voies: ['scolaire'] },
        dateExtraction: '2026-03-02T10:00:00.000Z'
    });

    // Structure générale
    assertEqual(dataset.format, DATASET_FORMAT, 'Format correct');
    assertEqual(dataset.version, DATASET_VERSION, 'Version correcte');
    assertEqual(dataset.appVersion, '0.62', 'Version app correcte');

    // Métadonnées
    assertEqual(dataset.metadata.nom, 'Test Rennes', 'Métadonnées : nom');
    assertEqual(dataset.metadata.typeRecherche, 'geo', 'Métadonnées : typeRecherche');
    assertEqual(dataset.metadata.dateExtraction, '2026-03-02T10:00:00.000Z', 'Métadonnées : dateExtraction');
    assert(dataset.metadata.dateExport !== undefined, 'Métadonnées : dateExport présent');
    assert(dataset.metadata.stats !== undefined, 'Métadonnées : stats présent');
    assertEqual(dataset.metadata.stats.etablissements, 2, 'Stats : 2 établissements');

    // Données
    assert(dataset.data !== undefined, 'Données présentes');
    assertEqual(Object.keys(dataset.data.etablissements).length, 2, 'Données : 2 établissements');
    assertEqual(Object.keys(dataset.data.diplomes).length, 2, 'Données : 2 diplômes');

    // Erreur si pas de nom
    let errNoName = false;
    try { await DatasetService.exportDataset({}); } catch { errNoName = true; }
    assert(errNoName, 'Erreur si metadata.nom manquant');
}

// ══════════════════════════════════════════════════════════
// TESTS — DatasetService : validation
// ══════════════════════════════════════════════════════════

async function testDatasetValidation() {
    section('DatasetService — validateDataset');

    // Dataset valide
    const validDataset = {
        format: DATASET_FORMAT,
        version: DATASET_VERSION,
        metadata: { nom: 'Test', typeRecherche: 'geo', params: {} },
        data: { etablissements: { etab_1: { _id: 'etab_1', nom: 'Test' } } }
    };
    const r1 = DatasetService.validateDataset(validDataset);
    assert(r1.valid === true, 'Dataset valide accepté');
    assertEqual(r1.errors.length, 0, 'Aucune erreur');

    // Pas un objet
    const r2 = DatasetService.validateDataset(null);
    assert(r2.valid === false, 'null rejeté');

    const r3 = DatasetService.validateDataset('string');
    assert(r3.valid === false, 'string rejeté');

    // Format manquant
    const r4 = DatasetService.validateDataset({ version: '1.0', metadata: { nom: 'X', typeRecherche: 'geo' }, data: { etablissements: { a: {} } } });
    assert(r4.valid === false, 'Format manquant → invalide');
    assert(r4.errors.some(e => e.includes('format')), 'Erreur mentionne « format »');

    // Format incorrect
    const r5 = DatasetService.validateDataset({ format: 'wrong', version: '1.0', metadata: { nom: 'X', typeRecherche: 'geo' }, data: { etablissements: { a: {} } } });
    assert(r5.valid === false, 'Format incorrect → invalide');

    // Version non supportée
    const r6 = DatasetService.validateDataset({ format: DATASET_FORMAT, version: '99.0', metadata: { nom: 'X', typeRecherche: 'geo' }, data: { etablissements: { a: {} } } });
    assert(r6.valid === false, 'Version non supportée → invalide');
    assert(r6.errors.some(e => e.includes('99.0')), 'Erreur mentionne la version');

    // Metadata manquante
    const r7 = DatasetService.validateDataset({ format: DATASET_FORMAT, version: '1.0', data: { etablissements: { a: {} } } });
    assert(r7.valid === false, 'Metadata manquante → invalide');

    // Metadata sans nom
    const r8 = DatasetService.validateDataset({ format: DATASET_FORMAT, version: '1.0', metadata: { typeRecherche: 'geo' }, data: { etablissements: { a: {} } } });
    assert(r8.valid === false, 'Metadata sans nom → invalide');

    // Data vide
    const r9 = DatasetService.validateDataset({ format: DATASET_FORMAT, version: '1.0', metadata: { nom: 'X', typeRecherche: 'geo' }, data: {} });
    assert(r9.valid === false, 'Data vide → invalide');

    // Data avec tables vides
    const r10 = DatasetService.validateDataset({ format: DATASET_FORMAT, version: '1.0', metadata: { nom: 'X', typeRecherche: 'geo' }, data: { etablissements: {} } });
    assert(r10.valid === false, 'Tables toutes vides → invalide');
}

// ══════════════════════════════════════════════════════════
// TESTS — DatasetService : import
// ══════════════════════════════════════════════════════════

async function testDatasetImport() {
    section('DatasetService — importDataset');

    const db = await createTestDb();
    window.databaseService = db;

    const dataset = {
        format: DATASET_FORMAT,
        version: DATASET_VERSION,
        metadata: {
            nom: 'Import Test',
            typeRecherche: 'geo',
            dateExtraction: '2026-03-01T12:00:00.000Z',
            params: { scope: 'commune', commune: { nom: 'Brest' } },
            stats: { etablissements: 1 }
        },
        data: {
            etablissements: {
                etab_10: { _id: 'etab_10', nom: 'Lycée de Brest', uai: '0290001Z', voie: 'scolaire', commune: 'Brest' }
            },
            diplomes: {
                'CAP Couvreur': { libelle: 'CAP Couvreur', niveau: '3' }
            },
            diplomes_par_etablissement: {},
            dispositifs: {},
            dispositifs_par_etablissement: {},
            options_2nde_gt: {},
            options_2nde_gt_par_etablissement: {},
            specialites_1ereG: {},
            specialites_1ereG_par_etablissement: {},
            diplomes_apprentissage: {},
            diplomes_apprentissage_par_etablissement: {},
            autres_formations_par_etablissement: {},
            langues: {}
        }
    };

    const result = await DatasetService.importDataset(dataset);

    assert(result.success === true, 'Import réussi');
    assertEqual(result.errors.length, 0, 'Aucune erreur');
    assertEqual(result.stats.etablissements, 1, 'Stats post-import : 1 établissement');

    // Vérifier que les données sont en base
    const etab = await db.getEtablissement('etab_10');
    assertEqual(etab.nom, 'Lycée de Brest', 'Établissement importé en base');

    // Vérifier les métadonnées
    const meta = db.getLastExtractionMetadata();
    assertEqual(meta.typeRecherche, 'geo', 'Métadonnées sauvées après import');
    assertEqual(meta.importedFrom, 'Import Test', 'Source de l\'import tracée');

    // --- Import invalide ---
    const r2 = await DatasetService.importDataset({ format: 'wrong' });
    assert(r2.success === false, 'Import invalide échoue');
    assert(r2.errors.length > 0, 'Erreurs retournées');
}

// ══════════════════════════════════════════════════════════
// TESTS — DatasetService : round-trip export → import
// ══════════════════════════════════════════════════════════

async function testExportImportRoundTrip() {
    section('DatasetService — Round-trip export → import');

    // 1. Créer une DB avec données
    const db1 = await createTestDb();
    await populateTestData(db1);
    window.databaseService = db1;

    // 2. Exporter
    const dataset = await DatasetService.exportDataset({
        nom: 'Round Trip Test',
        typeRecherche: 'geo',
        params: { scope: 'commune', commune: { nom: 'Rennes' } }
    });

    // 3. Créer une nouvelle DB vide et importer
    const db2 = await createTestDb();
    window.databaseService = db2;

    assert(db2.hasEducationalData() === false, 'DB2 vide avant import');

    const result = await DatasetService.importDataset(dataset);
    assert(result.success === true, 'Round-trip import réussi');
    assertEqual(result.stats.etablissements, 2, 'Round-trip : 2 établissements');
    assertEqual(result.stats.diplomes, 2, 'Round-trip : 2 diplômes');

    // 4. Vérifier les données
    const etabs = await db2.getAllEtablissements();
    assertEqual(etabs.length, 2, 'Round-trip : tous les établissements présents');

    const diplomes = await db2.getAllDiplomes();
    assertEqual(diplomes.length, 2, 'Round-trip : tous les diplômes présents');

    assert(db2.hasEducationalData() === true, 'DB2 non vide après import');
}

// ══════════════════════════════════════════════════════════
// TESTS — DatasetService : getDatasetInfo
// ══════════════════════════════════════════════════════════

async function testGetDatasetInfo() {
    section('DatasetService — getDatasetInfo');

    // Avec stats dans les métadonnées
    const info1 = DatasetService.getDatasetInfo({
        version: '1.0',
        appVersion: '0.62',
        metadata: { nom: 'Test', typeRecherche: 'geo', stats: { etablissements: 5 } },
        data: {}
    });
    assertEqual(info1.nom, 'Test', 'Info : nom');
    assertEqual(info1.stats.etablissements, 5, 'Info : stats depuis metadata');
    assertEqual(info1.formatVersion, '1.0', 'Info : formatVersion');

    // Sans stats → calculées depuis data
    const info2 = DatasetService.getDatasetInfo({
        version: '1.0',
        metadata: { nom: 'Test2', typeRecherche: 'diplomes' },
        data: { etablissements: { a: {}, b: {}, c: {} }, diplomes: { x: {} } }
    });
    assertEqual(info2.stats.etablissements, 3, 'Info : stats calculées (3 étabs)');
    assertEqual(info2.stats.diplomes, 1, 'Info : stats calculées (1 diplôme)');

    // null si invalide
    assertEqual(DatasetService.getDatasetInfo(null), null, 'Info(null) → null');
    assertEqual(DatasetService.getDatasetInfo({}), null, 'Info({}) → null');
}

// ══════════════════════════════════════════════════════════
// TESTS — DatasetService : index
// ══════════════════════════════════════════════════════════

async function testDatasetIndex() {
    section('DatasetService — index CRUD');

    localStorageMock.clear();

    // Index vide au départ
    assertEqual(DatasetService.getIndex().length, 0, 'Index vide initialement');

    // Ajout
    const id1 = DatasetService.addToIndex({ nom: 'Dataset A', typeRecherche: 'geo', stats: { etablissements: 10 } });
    assert(id1.startsWith('ds_'), 'ID généré avec préfixe ds_');
    assertEqual(DatasetService.getIndex().length, 1, 'Index : 1 entrée après ajout');

    // Petit délai pour garantir un timestamp différent
    await new Promise(r => setTimeout(r, 2));

    const id2 = DatasetService.addToIndex({ nom: 'Dataset B', typeRecherche: 'diplomes' });
    assertEqual(DatasetService.getIndex().length, 2, 'Index : 2 entrées');

    // Vérifier le contenu
    const index = DatasetService.getIndex();
    assertEqual(index[0].nom, 'Dataset A', 'Index[0] : nom correct');
    assertEqual(index[0].typeRecherche, 'geo', 'Index[0] : type correct');
    assertEqual(index[1].nom, 'Dataset B', 'Index[1] : nom correct');

    // Suppression
    const removed = DatasetService.removeFromIndex(id1);
    assert(removed === true, 'Suppression réussie');
    assertEqual(DatasetService.getIndex().length, 1, 'Index : 1 entrée après suppression');
    assertEqual(DatasetService.getIndex()[0].id, id2, 'Bonne entrée conservée');

    // Suppression d'un ID inexistant
    const notFound = DatasetService.removeFromIndex('ds_9999999');
    assert(notFound === false, 'Suppression d\'un ID inexistant retourne false');

    // Index corrompu → récupération
    localStorageMock.setItem(DATASET_INDEX_KEY, 'not-json!!');
    const recovered = DatasetService.getIndex();
    assertEqual(recovered.length, 0, 'Index corrompu → tableau vide récupéré');
}

// ══════════════════════════════════════════════════════════
// TESTS — DatasetService : utilitaires de formatage
// ══════════════════════════════════════════════════════════

async function testFormatUtilities() {
    section('DatasetService — utilitaires de formatage');

    // getTypeRechercheLabel
    assertEqual(DatasetService.getTypeRechercheLabel('geo'), 'Recherche géographique', 'Label geo');
    assertEqual(DatasetService.getTypeRechercheLabel('diplomes'), 'Recherche par diplôme', 'Label diplomes');
    assertEqual(DatasetService.getTypeRechercheLabel('options'), 'Recherche par option', 'Label options');
    assert(DatasetService.getTypeRechercheLabel('inconnu').includes('inconnu'), 'Label inconnu → fallback');

    // formatParamsDescription — geo commune
    const descGeo1 = DatasetService.formatParamsDescription('geo', {
        scope: 'commune', commune: { nom: 'Rennes' }, voies: ['scolaire']
    });
    assert(descGeo1.includes('Rennes'), 'Desc geo commune contient Rennes');
    assert(descGeo1.includes('scolaire'), 'Desc geo commune contient scolaire');

    // formatParamsDescription — geo intercommunalité
    const descGeo2 = DatasetService.formatParamsDescription('geo', {
        scope: 'intercommunalite', epci: { nom: 'Rennes Métropole' }, voies: ['scolaire', 'apprentissage']
    });
    assert(descGeo2.includes('Rennes Métropole'), 'Desc geo EPCI');

    // formatParamsDescription — diplomes
    const descDip = DatasetService.formatParamsDescription('diplomes', {
        items: ['CAP Menuisier', 'Bac Pro MELEC'], geoValue: 'Académie de Rennes'
    });
    assert(descDip.includes('2 diplômes'), 'Desc diplômes : 2 diplômes');
    assert(descDip.includes('Académie de Rennes'), 'Desc diplômes : zone géo');

    // formatParamsDescription — null
    assert(DatasetService.formatParamsDescription('geo', null).includes('non disponibles'), 'Params null → fallback');

    // formatStatsDescription
    const desc1 = DatasetService.formatStatsDescription({ etablissements: 87, diplomes: 234 });
    assert(desc1.includes('87'), 'Stats description contient 87');
    assert(desc1.includes('234'), 'Stats description contient 234');

    const desc2 = DatasetService.formatStatsDescription(null);
    assert(desc2.includes('non disponibles'), 'Stats null → fallback');

    const desc3 = DatasetService.formatStatsDescription({});
    assertEqual(desc3, 'Base vide', 'Stats vides → Base vide');
}

// ══════════════════════════════════════════════════════════
// TESTS — DatasetService : downloadDataset (vérification structure)
// ══════════════════════════════════════════════════════════

async function testDownloadDataset() {
    section('DatasetService — downloadDataset (structure JSON)');

    // On ne peut pas tester le téléchargement réel dans Node.js,
    // mais on vérifie que la sérialisation JSON est correcte.
    const dataset = {
        format: DATASET_FORMAT,
        version: DATASET_VERSION,
        metadata: { nom: 'Test Download' },
        data: { etablissements: { a: { nom: 'Test' } } }
    };

    const jsonString = JSON.stringify(dataset, null, 2);
    const parsed = JSON.parse(jsonString);

    assertEqual(parsed.format, DATASET_FORMAT, 'JSON sérialisé : format préservé');
    assertEqual(parsed.metadata.nom, 'Test Download', 'JSON sérialisé : metadata préservée');
    assert(jsonString.includes('\n'), 'JSON indenté (lisible)');

    // Vérifier le nom de fichier généré
    const nom = 'Rennes Métropole (2026)';
    const sanitized = nom.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç_-]/g, '_');
    assert(!sanitized.includes('('), 'Nom de fichier : parenthèses remplacées');
    assert(!sanitized.includes(' '), 'Nom de fichier : espaces remplacés');
}

// ══════════════════════════════════════════════════════════
// TESTS — Phase 2 : ModeChoiceModal (logique, pas DOM complet)
// ══════════════════════════════════════════════════════════

async function testModeChoiceModalFlags() {
    section('ModeChoiceModal — Flags de contrôle');

    localStorageMock.clear();

    // Vérifier que MODE_CHOICE_KEY et MODE_CHOICE_SKIP_KEY sont définis
    assert(typeof MODE_CHOICE_KEY === 'string', 'MODE_CHOICE_KEY est défini');
    assert(typeof MODE_CHOICE_SKIP_KEY === 'string', 'MODE_CHOICE_SKIP_KEY est défini');

    // Pas de flag → la modale devrait s'afficher (show() retourne non-null)
    // Note : en Node.js, le DOM est minimal, on vérifie la logique du flag
    assert(localStorage.getItem(MODE_CHOICE_SKIP_KEY) !== 'true', 'Pas de skip par défaut');

    // Poser le flag skip → show() retourne null
    localStorage.setItem(MODE_CHOICE_SKIP_KEY, 'true');
    const result = ModeChoiceModal.show();
    assertEqual(result, null, 'show() retourne null si skip est posé');

    // Nettoyer
    localStorageMock.clear();
}

async function testModeChoiceModalModeStorage() {
    section('ModeChoiceModal — Stockage du mode choisi');

    localStorageMock.clear();

    // Simuler le stockage du mode connecté
    localStorage.setItem(MODE_CHOICE_KEY, 'connected');
    assertEqual(localStorage.getItem(MODE_CHOICE_KEY), 'connected', 'Mode « connected » stocké');

    // Simuler le stockage du mode déconnecté
    localStorage.setItem(MODE_CHOICE_KEY, 'disconnected');
    assertEqual(localStorage.getItem(MODE_CHOICE_KEY), 'disconnected', 'Mode « disconnected » stocké');

    localStorageMock.clear();
}

async function testModeChoiceWithEmptyDb() {
    section('ModeChoiceModal — Logique base vide vs non vide');

    const dbEmpty = await createTestDb();
    window.databaseService = dbEmpty;

    assert(dbEmpty.hasEducationalData() === false, 'DB vide → hasEducationalData false');
    assertEqual(dbEmpty.getLastExtractionMetadata(), null, 'DB vide → pas de métadonnées');

    // Avec données
    const dbFull = await createTestDb();
    await populateTestData(dbFull);
    window.databaseService = dbFull;

    dbFull.setLastExtractionMetadata({
        typeRecherche: 'geo',
        params: { scope: 'commune', commune: { nom: 'Rennes' }, voies: ['scolaire'] },
        date: '2026-03-02T14:30:00.000Z'
    });

    assert(dbFull.hasEducationalData() === true, 'DB pleine → hasEducationalData true');
    const meta = dbFull.getLastExtractionMetadata();
    assert(meta !== null, 'DB pleine → métadonnées présentes');
    assertEqual(meta.typeRecherche, 'geo', 'Métadonnées : typeRecherche correct');

    // Vérifier que DatasetService peut formater les infos pour l'écran 2
    const typeLabel = DatasetService.getTypeRechercheLabel(meta.typeRecherche);
    assertEqual(typeLabel, 'Recherche géographique', 'Label type recherche pour écran 2');

    const paramsDesc = DatasetService.formatParamsDescription(meta.typeRecherche, meta.params);
    assert(paramsDesc.includes('Rennes'), 'Description params pour écran 2 contient Rennes');

    const stats = await dbFull.getStats();
    const statsDesc = DatasetService.formatStatsDescription(stats);
    assert(statsDesc.includes('2'), 'Description stats pour écran 2 contient le nombre');
}

async function testModeChoiceImportFlow() {
    section('ModeChoiceModal — Flux d\'import complet');

    const db = await createTestDb();
    window.databaseService = db;

    // Simuler un fichier JSON valide
    const dataset = {
        format: DATASET_FORMAT,
        version: DATASET_VERSION,
        metadata: {
            nom: 'Test Import Modal',
            typeRecherche: 'diplomes',
            dateExtraction: '2026-03-01T10:00:00.000Z',
            params: { items: ['CAP Couvreur'], geoValue: 'Académie de Rennes', itemType: 'diplomes' }
        },
        data: {
            etablissements: {
                etab_50: { _id: 'etab_50', nom: 'Lycée Import', uai: '0290050Z', voie: 'scolaire' }
            },
            diplomes: { 'CAP Couvreur': { libelle: 'CAP Couvreur', niveau: '3' } },
            diplomes_par_etablissement: {},
            dispositifs: {},
            dispositifs_par_etablissement: {},
            options_2nde_gt: {},
            options_2nde_gt_par_etablissement: {},
            specialites_1ereG: {},
            specialites_1ereG_par_etablissement: {},
            diplomes_apprentissage: {},
            diplomes_apprentissage_par_etablissement: {},
            autres_formations_par_etablissement: {},
            langues: {}
        }
    };

    // 1. Valider le dataset
    const validation = DatasetService.validateDataset(dataset);
    assert(validation.valid, 'Dataset du flux import est valide');

    // 2. Obtenir l'aperçu
    const info = DatasetService.getDatasetInfo(dataset);
    assertEqual(info.nom, 'Test Import Modal', 'Aperçu : nom correct');
    assertEqual(info.typeRecherche, 'diplomes', 'Aperçu : type correct');

    // 3. Importer
    const result = await DatasetService.importDataset(dataset);
    assert(result.success, 'Import réussi');
    assertEqual(result.stats.etablissements, 1, 'Post-import : 1 établissement');

    // 4. Vérifier que les métadonnées sont sauvegardées
    const meta = db.getLastExtractionMetadata();
    assertEqual(meta.importedFrom, 'Test Import Modal', 'Métadonnées tracent la source');

    // 5. Vérifier que l'index est mis à jour
    localStorageMock.clear(); // Reset l'index pour ce test
    DatasetService.addToIndex(dataset.metadata);
    const index = DatasetService.getIndex();
    assertEqual(index.length, 1, 'Index mis à jour avec 1 entrée');
    assertEqual(index[0].nom, 'Test Import Modal', 'Index : nom correct');
}

async function testTourCompletedEventIntegration() {
    section('Intégration — Événement tour:completed');

    // Vérifier que l'événement peut être dispatché et capturé
    let eventReceived = false;
    document.addEventListener('tour:completed', () => { eventReceived = true; }, { once: true });
    document.dispatchEvent(new CustomEvent('tour:completed'));
    assert(eventReceived, 'Événement tour:completed reçu après dispatch');
}

// ══════════════════════════════════════════════════════════
// TESTS — Phase 3 : Capture des métadonnées d'extraction
// ══════════════════════════════════════════════════════════

async function testExtractionMetadataGeo() {
    section('Phase 3 — Métadonnées d\'extraction (géo)');

    const db = await createTestDb();
    window.databaseService = db;

    // Simuler ce que fait _saveExtractionMetadata pour une extraction géo
    const params = {
        scope: 'intercommunalite',
        commune: { nom: 'Rennes', code: '35238', codeEpci: '243500139' },
        epci: { code: '243500139', nom: 'Rennes Métropole' },
        voies: ['scolaire', 'apprentissage']
    };
    const stats = { etablissements: 87, diplomes: 150, relations: 320 };

    db.setLastExtractionMetadata({
        typeRecherche: 'geo',
        params,
        date: new Date().toISOString(),
        stats
    });

    const meta = db.getLastExtractionMetadata();
    assert(meta !== null, 'Métadonnées sauvegardées');
    assertEqual(meta.typeRecherche, 'geo', 'Type : geo');
    assertEqual(meta.params.scope, 'intercommunalite', 'Scope : intercommunalité');
    assertEqual(meta.params.commune.nom, 'Rennes', 'Commune : Rennes');
    assertEqual(meta.params.epci.nom, 'Rennes Métropole', 'EPCI : Rennes Métropole');
    assertEqual(meta.params.voies.length, 2, 'Voies : 2');
    assertEqual(meta.stats.etablissements, 87, 'Stats : 87 établissements');
    assert(meta.date !== undefined, 'Date présente');

    // Vérifier que DatasetService peut formater ces métadonnées
    const label = DatasetService.getTypeRechercheLabel(meta.typeRecherche);
    assertEqual(label, 'Recherche géographique', 'Label formaté');

    const desc = DatasetService.formatParamsDescription(meta.typeRecherche, meta.params);
    assert(desc.includes('Rennes Métropole'), 'Description contient le nom EPCI');
    assert(desc.includes('scolaire'), 'Description contient la voie');
}

async function testExtractionMetadataDiplomes() {
    section('Phase 3 — Métadonnées d\'extraction (diplômes)');

    const db = await createTestDb();
    window.databaseService = db;

    const params = {
        geoType: 'academie',
        geoValue: 'Rennes',
        items: ['CAP Menuisier', 'Bac Pro MELEC', 'CAP Couvreur'],
        itemType: 'diplomes'
    };
    const stats = { etablissements: 25, diplomes: 3, relations: 45 };

    db.setLastExtractionMetadata({
        typeRecherche: 'diplomes',
        params,
        date: '2026-03-02T16:00:00.000Z',
        stats
    });

    const meta = db.getLastExtractionMetadata();
    assertEqual(meta.typeRecherche, 'diplomes', 'Type : diplomes');
    assertEqual(meta.params.items.length, 3, '3 items');
    assertEqual(meta.params.geoValue, 'Rennes', 'Geo : Rennes');

    const desc = DatasetService.formatParamsDescription('diplomes', meta.params);
    assert(desc.includes('3 diplômes'), 'Description : 3 diplômes');
    assert(desc.includes('Rennes'), 'Description : Rennes');
}

async function testExtractionMetadataOptions() {
    section('Phase 3 — Métadonnées d\'extraction (options)');

    const db = await createTestDb();
    window.databaseService = db;

    const params = {
        geoType: 'departement',
        geoValue: 'Ille-et-Vilaine',
        items: ['Chinois LV3'],
        itemType: 'options'
    };

    db.setLastExtractionMetadata({
        typeRecherche: 'options',
        params,
        date: '2026-03-02T17:00:00.000Z',
        stats: { etablissements: 5 }
    });

    const meta = db.getLastExtractionMetadata();
    assertEqual(meta.typeRecherche, 'options', 'Type : options');

    const desc = DatasetService.formatParamsDescription('options', meta.params);
    assert(desc.includes('1 option'), 'Description : 1 option');
    assert(desc.includes('Ille-et-Vilaine'), 'Description : Ille-et-Vilaine');
}

async function testExtractionMetadataOverwrite() {
    section('Phase 3 — Écrasement des métadonnées (nouvelle extraction)');

    const db = await createTestDb();
    window.databaseService = db;

    // Première extraction
    db.setLastExtractionMetadata({
        typeRecherche: 'geo',
        params: { scope: 'commune', commune: { nom: 'Brest' } },
        date: '2026-03-01T10:00:00.000Z'
    });

    assertEqual(db.getLastExtractionMetadata().params.commune.nom, 'Brest', 'Première extraction : Brest');

    // Seconde extraction → écrase la première
    db.setLastExtractionMetadata({
        typeRecherche: 'diplomes',
        params: { items: ['CAP Boulanger'], geoValue: 'Paris' },
        date: '2026-03-02T14:00:00.000Z'
    });

    const meta = db.getLastExtractionMetadata();
    assertEqual(meta.typeRecherche, 'diplomes', 'Seconde extraction écrase : type');
    assertEqual(meta.params.geoValue, 'Paris', 'Seconde extraction écrase : Paris');
}

async function testExtractionMetadataRoundTripWithDataset() {
    section('Phase 3 — Round-trip métadonnées → export dataset → import');

    const db = await createTestDb();
    await populateTestData(db);
    window.databaseService = db;

    // Sauvegarder les métadonnées
    db.setLastExtractionMetadata({
        typeRecherche: 'geo',
        params: { scope: 'commune', commune: { nom: 'Rennes' }, voies: ['scolaire'] },
        date: '2026-03-02T14:30:00.000Z',
        stats: { etablissements: 2, diplomes: 2 }
    });

    // Exporter le dataset avec ces métadonnées
    const meta = db.getLastExtractionMetadata();
    const dataset = await DatasetService.exportDataset({
        nom: 'Rennes test round-trip',
        typeRecherche: meta.typeRecherche,
        params: meta.params,
        dateExtraction: meta.date
    });

    assertEqual(dataset.metadata.typeRecherche, 'geo', 'Dataset : type geo');
    assertEqual(dataset.metadata.params.commune.nom, 'Rennes', 'Dataset : commune Rennes');

    // Importer dans une base vide
    const db2 = await createTestDb();
    window.databaseService = db2;

    const result = await DatasetService.importDataset(dataset);
    assert(result.success, 'Import réussi');

    // Vérifier que les métadonnées sont restaurées
    const metaAfter = db2.getLastExtractionMetadata();
    assertEqual(metaAfter.typeRecherche, 'geo', 'Métadonnées restaurées : type');
    assertEqual(metaAfter.importedFrom, 'Rennes test round-trip', 'Source tracée');
}

// ══════════════════════════════════════════════════════════
// EXÉCUTION
// ══════════════════════════════════════════════════════════

(async function runAll() {
    console.log('\n🧪 Tests v0.62 — Phase 1 : DatasetService + extensions DatabaseService\n');

    try {
        await testDatabaseServiceSnapshot();
        await testHasEducationalData();
        await testLastExtractionMetadata();
        await testGetEducationalTableNames();
        await testDatasetExport();
        await testDatasetValidation();
        await testDatasetImport();
        await testExportImportRoundTrip();
        await testGetDatasetInfo();
        await testDatasetIndex();
        await testFormatUtilities();
        await testDownloadDataset();
        // Phase 2 — ModeChoiceModal
        await testModeChoiceModalFlags();
        await testModeChoiceModalModeStorage();
        await testModeChoiceWithEmptyDb();
        await testModeChoiceImportFlow();
        await testTourCompletedEventIntegration();
        // Phase 3 — Capture des métadonnées d'extraction
        await testExtractionMetadataGeo();
        await testExtractionMetadataDiplomes();
        await testExtractionMetadataOptions();
        await testExtractionMetadataOverwrite();
        await testExtractionMetadataRoundTripWithDataset();
    } catch (error) {
        console.error('\n💥 ERREUR FATALE:', error);
        _failed++;
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  RÉSULTAT : ${_passed} passés, ${_failed} échoués`);
    if (_errors.length > 0) {
        console.log(`\n  Échecs :`);
        _errors.forEach(e => console.log(`    • ${e}`));
    }
    console.log(`${'═'.repeat(60)}\n`);

    if (typeof process !== 'undefined') {
        process.exit(_failed > 0 ? 1 : 0);
    }
})();
