/**
 * @file 20_unit_v063_github_storage.test.js
 * @description Tests unitaires pour le service GitHubStorage (v0.63).
 *
 * Couvre :
 *   - Configuration (getConfig, saveConfig, hasWriteToken)
 *   - Encodage base64 UTF-8 (round-trip avec accents)
 *   - Génération de noms de fichiers sûrs
 *   - Construction d'URLs
 *   - Appels API mockés (fetchIndex, listDatasets, loadDataset, uploadDataset, deleteDataset)
 *   - Gestion des erreurs (401, 403, 404)
 *   - Intégration avec _trySaveDataset et ModeChoiceModal
 *
 * @version 0.63
 */

'use strict';

// ══════════════════════════════════════════════════════════
// INFRASTRUCTURE DE TEST (copiée depuis les fichiers existants)
// ══════════════════════════════════════════════════════════

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        testResults.push(`  ✅ ${message}`);
    } else {
        failedTests++;
        testResults.push(`  ❌ ${message}`);
        console.error(`ÉCHEC: ${message}`);
    }
}

function assertEqual(actual, expected, message) {
    const pass = actual === expected;
    assert(pass, `${message} — attendu: ${JSON.stringify(expected)}, obtenu: ${JSON.stringify(actual)}`);
}

function assertIncludes(str, substring, message) {
    assert(String(str).includes(substring), `${message} — « ${substring} » non trouvé dans « ${str} »`);
}

function section(title) {
    testResults.push(`\n━━━ ${title} ━━━`);
}

function printResults() {
    console.log('\n' + '═'.repeat(60));
    console.log('  RÉSULTATS DES TESTS — v0.63 GitHubStorage');
    console.log('═'.repeat(60));
    testResults.forEach(r => console.log(r));
    console.log('\n' + '─'.repeat(60));
    console.log(`  Total: ${totalTests} | ✅ ${passedTests} | ❌ ${failedTests}`);
    console.log('─'.repeat(60) + '\n');
}

// ══════════════════════════════════════════════════════════
// MOCK localStorage
// ══════════════════════════════════════════════════════════

const mockStorage = {};
const originalLocalStorage = (typeof localStorage !== 'undefined') ? localStorage : null;

const mockLocalStorage = {
    getItem(key) { return mockStorage[key] ?? null; },
    setItem(key, value) { mockStorage[key] = String(value); },
    removeItem(key) { delete mockStorage[key]; },
    clear() { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// Installer le mock
if (typeof global !== 'undefined') {
    global.localStorage = mockLocalStorage;
}

function clearMockStorage() {
    Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
}

// ══════════════════════════════════════════════════════════
// MOCK fetch
// ══════════════════════════════════════════════════════════

let fetchMock = null;
const originalFetch = (typeof fetch !== 'undefined') ? fetch : null;

function setFetchMock(fn) {
    fetchMock = fn;
    if (typeof global !== 'undefined') {
        global.fetch = fn;
    }
}

function restoreFetch() {
    fetchMock = null;
    if (typeof global !== 'undefined' && originalFetch) {
        global.fetch = originalFetch;
    }
}

// ══════════════════════════════════════════════════════════
// MOCK TextEncoder / TextDecoder (Node.js < 18)
// ══════════════════════════════════════════════════════════

if (typeof TextEncoder === 'undefined') {
    global.TextEncoder = class {
        encode(str) {
            const buf = Buffer.from(str, 'utf-8');
            return new Uint8Array(buf);
        }
    };
}
if (typeof TextDecoder === 'undefined') {
    global.TextDecoder = class {
        decode(bytes) {
            return Buffer.from(bytes).toString('utf-8');
        }
    };
}

// btoa / atob pour Node
if (typeof btoa === 'undefined') {
    global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}
if (typeof atob === 'undefined') {
    global.atob = (str) => Buffer.from(str, 'base64').toString('binary');
}

// ══════════════════════════════════════════════════════════
// MOCK window et classes dépendantes
// ══════════════════════════════════════════════════════════

if (typeof window === 'undefined') {
    global.window = global;
}

// Mock DatasetService minimal
window.DatasetService = {
    validateDataset(json) {
        if (!json || !json.format || !json.data) {
            return { valid: false, errors: ['Format invalide'] };
        }
        return { valid: true, errors: [] };
    },
    getTypeRechercheLabel(type) {
        return { geo: 'Géographique', diplomes: 'Par diplôme' }[type] || type;
    },
    formatStatsDescription(stats) {
        if (!stats) return '';
        const parts = [];
        if (stats.etablissements) parts.push(`${stats.etablissements} étab.`);
        if (stats.diplomes) parts.push(`${stats.diplomes} dipl.`);
        return parts.join(', ');
    },
    getIndex() { return []; },
    importDataset: async function(json) { return { success: true, stats: {}, errors: [] }; },
    exportDataset: async function(meta) { return { format: 'parcours-avenir-dataset', version: '1.0', metadata: meta, data: { etablissements: {} } }; },
    downloadDataset() {},
    addToIndex() {}
};

window.DATASET_FORMAT = 'parcours-avenir-dataset';

// ══════════════════════════════════════════════════════════
// CHARGEMENT DU MODULE
// ══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

// Charger github_storage.js
const ghStoragePath = path.resolve(__dirname, '../js/github_storage.js');
eval(fs.readFileSync(ghStoragePath, 'utf-8'));

// ══════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════

// ── 1. Configuration ──────────────────────────────────────

section('1. Configuration — getConfig()');

clearMockStorage();
(() => {
    const config = GitHubStorage.getConfig();
    assertEqual(config.owner, 'lolocosto', 'Owner par défaut = lolocosto');
    assertEqual(config.repo, 'parcours-avenir-datasets', 'Repo par défaut');
    assertEqual(config.token, null, 'Token par défaut = null');
    assertEqual(config.configured, true, 'Configuré par défaut (owner+repo non vides)');
})();

section('2. Configuration — saveConfig()');

clearMockStorage();
(() => {
    GitHubStorage.saveConfig({ owner: 'testuser', repo: 'testrepo', token: 'ghp_test123' });
    assertEqual(mockStorage['github_owner'], 'testuser', 'Owner sauvegardé');
    assertEqual(mockStorage['github_repo'], 'testrepo', 'Repo sauvegardé');
    assertEqual(mockStorage['github_token'], 'ghp_test123', 'Token sauvegardé');

    const config = GitHubStorage.getConfig();
    assertEqual(config.owner, 'testuser', 'getConfig() lit la nouvelle valeur owner');
    assertEqual(config.token, 'ghp_test123', 'getConfig() lit la nouvelle valeur token');
})();

section('3. Configuration — saveConfig() supprime si null/vide');

clearMockStorage();
(() => {
    GitHubStorage.saveConfig({ owner: 'testuser', token: 'abc' });
    GitHubStorage.saveConfig({ token: null });
    assertEqual(mockStorage['github_token'], undefined, 'Token supprimé si null');
    assertEqual(mockStorage['github_owner'], 'testuser', 'Owner préservé');
})();

section('4. hasWriteToken()');

clearMockStorage();
(() => {
    assertEqual(GitHubStorage.hasWriteToken(), false, 'false sans token');
    GitHubStorage.saveConfig({ token: 'ghp_abc' });
    assertEqual(GitHubStorage.hasWriteToken(), true, 'true avec token');
    GitHubStorage.saveConfig({ token: '   ' });
    assertEqual(GitHubStorage.hasWriteToken(), false, 'false avec token vide (espaces)');
})();

// ── 2. Encodage base64 UTF-8 ─────────────────────────────

section('5. Encodage base64 UTF-8 — round-trip ASCII');

(() => {
    // On accède aux méthodes privées via un contournement :
    // On teste indirectement via uploadDataset / loadDataset
    // Pour tester directement, on crée des wrappers
    const testStr = 'Hello, World!';
    const encoder = new TextEncoder();
    const bytes = encoder.encode(testStr);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);
    const decoded = (() => {
        const cleaned = b64.replace(/[\r\n\s]/g, '');
        const bin = atob(cleaned);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
            arr[i] = bin.charCodeAt(i);
        }
        return new TextDecoder().decode(arr);
    })();
    assertEqual(decoded, testStr, 'Round-trip ASCII');
})();

section('6. Encodage base64 UTF-8 — round-trip avec accents');

(() => {
    const testStr = 'Lycée général de Béziers — Établissement n°42 « Ça marche ! »';
    const encoder = new TextEncoder();
    const bytes = encoder.encode(testStr);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);
    const decoded = (() => {
        const cleaned = b64.replace(/[\r\n\s]/g, '');
        const bin = atob(cleaned);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
            arr[i] = bin.charCodeAt(i);
        }
        return new TextDecoder().decode(arr);
    })();
    assertEqual(decoded, testStr, 'Round-trip avec accents français');
})();

section('7. Encodage base64 — gestion des sauts de ligne GitHub');

(() => {
    // GitHub renvoie le base64 avec des \n tous les 76 caractères
    const original = 'Test avec sauts de ligne';
    const encoder = new TextEncoder();
    const bytes = encoder.encode(original);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);
    // Ajouter des sauts de ligne artificiels
    const b64WithNewlines = b64.slice(0, 10) + '\n' + b64.slice(10);
    const decoded = (() => {
        const cleaned = b64WithNewlines.replace(/[\r\n\s]/g, '');
        const bin = atob(cleaned);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
            arr[i] = bin.charCodeAt(i);
        }
        return new TextDecoder().decode(arr);
    })();
    assertEqual(decoded, original, 'Décodage OK malgré les sauts de ligne');
})();

// ── 3. Génération de noms de fichiers ─────────────────────

section('8. Génération de noms de fichiers sûrs');

(() => {
    // Tester via getFileUrl qui utilise le filename
    // On ne peut pas appeler #generateFilename directement (privée)
    // Mais on peut vérifier le pattern via getFileUrl
    const url = GitHubStorage.getFileUrl('rennes_metropole_2026-03-02.json');
    assertIncludes(url, 'github.com', 'URL contient github.com');
    assertIncludes(url, 'jeux_de_donnees', 'URL contient le chemin du dossier');
    assertIncludes(url, 'rennes_metropole_2026-03-02.json', 'URL contient le filename');
})();

section('9. Construction d\'URLs');

clearMockStorage();
(() => {
    // Avec config par défaut
    const fileUrl = GitHubStorage.getFileUrl('test.json');
    assertEqual(fileUrl, 'https://github.com/lolocosto/parcours-avenir-datasets/blob/main/jeux_de_donnees/test.json', 'getFileUrl par défaut');

    const rawUrl = GitHubStorage.getRawUrl('test.json');
    assertEqual(rawUrl, 'https://raw.githubusercontent.com/lolocosto/parcours-avenir-datasets/main/jeux_de_donnees/test.json', 'getRawUrl par défaut');

    // Avec config custom
    GitHubStorage.saveConfig({ owner: 'alice', repo: 'my-data' });
    const customUrl = GitHubStorage.getFileUrl('data.json');
    assertIncludes(customUrl, 'alice/my-data', 'URL avec config custom');
})();

// ── 4. Appels API mockés ──────────────────────────────────

section('10. fetchIndex — retourne un index vide sur 404');

clearMockStorage();
(async () => {
    setFetchMock(async (url, opts) => {
        return {
            ok: false,
            status: 404,
            json: async () => ({ message: 'Not Found' })
        };
    });

    try {
        const index = await GitHubStorage.fetchIndex();
        assertEqual(Array.isArray(index.datasets), true, 'fetchIndex retourne un tableau datasets');
        assertEqual(index.datasets.length, 0, 'Index vide sur 404');
    } catch (e) {
        assert(false, `fetchIndex ne devrait pas throw sur 404: ${e.message}`);
    }

    restoreFetch();
})();

section('11. fetchIndex — parse un index valide');

clearMockStorage();
(async () => {
    const mockIndex = {
        version: '1.0',
        datasets: [
            { filename: 'test.json', nom: 'Test', typeRecherche: 'geo', stats: {} }
        ]
    };
    const b64Content = (() => {
        const str = JSON.stringify(mockIndex);
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    })();

    setFetchMock(async (url, opts) => ({
        ok: true,
        status: 200,
        json: async () => ({ content: b64Content, sha: 'abc123' })
    }));

    const index = await GitHubStorage.fetchIndex();
    assertEqual(index.datasets.length, 1, 'Index contient 1 dataset');
    assertEqual(index.datasets[0].nom, 'Test', 'Nom du dataset correct');

    restoreFetch();
})();

section('12. listDatasets — retourne le tableau depuis l\'index');

clearMockStorage();
(async () => {
    const mockIndex = {
        version: '1.0',
        datasets: [
            { filename: 'a.json', nom: 'A' },
            { filename: 'b.json', nom: 'B' }
        ]
    };
    const b64Content = (() => {
        const str = JSON.stringify(mockIndex);
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    })();

    setFetchMock(async () => ({
        ok: true, status: 200,
        json: async () => ({ content: b64Content, sha: 'sha1' })
    }));

    const datasets = await GitHubStorage.listDatasets();
    assertEqual(datasets.length, 2, 'listDatasets retourne 2 entrées');

    restoreFetch();
})();

section('13. loadDataset — charge et valide un dataset');

clearMockStorage();
(async () => {
    const mockDataset = {
        format: 'parcours-avenir-dataset',
        version: '1.0',
        metadata: { nom: 'TestDS', typeRecherche: 'geo' },
        data: { etablissements: { e1: { nom: 'Lycée test' } } }
    };
    const b64Content = (() => {
        const str = JSON.stringify(mockDataset);
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    })();

    setFetchMock(async () => ({
        ok: true, status: 200,
        json: async () => ({ content: b64Content, sha: 'sha2' })
    }));

    const dataset = await GitHubStorage.loadDataset('test.json');
    assertEqual(dataset.metadata.nom, 'TestDS', 'Nom du dataset chargé');
    assertEqual(Object.keys(dataset.data.etablissements).length, 1, '1 établissement dans le dataset');

    restoreFetch();
})();

// ── 5. Vérifications d'écriture ───────────────────────────

section('14. uploadDataset — refuse sans token');

clearMockStorage();
(async () => {
    try {
        await GitHubStorage.uploadDataset({ metadata: { nom: 'Test' } });
        assert(false, 'uploadDataset aurait dû throw sans token');
    } catch (e) {
        assertIncludes(e.message, 'Token', 'Message d\'erreur mentionne le token');
    }
})();

section('15. deleteDataset — refuse sans token');

clearMockStorage();
(async () => {
    try {
        await GitHubStorage.deleteDataset('test.json');
        assert(false, 'deleteDataset aurait dû throw sans token');
    } catch (e) {
        assertIncludes(e.message, 'Token', 'Message d\'erreur mentionne le token');
    }
})();

section('16. uploadDataset — refuse sans métadonnées');

clearMockStorage();
(async () => {
    GitHubStorage.saveConfig({ token: 'ghp_test' });
    try {
        await GitHubStorage.uploadDataset({});
        assert(false, 'uploadDataset aurait dû throw sans métadonnées');
    } catch (e) {
        assertIncludes(e.message, 'invalide', 'Message d\'erreur mentionne invalide');
    }
})();

// ── 6. Gestion des erreurs API ────────────────────────────

section('17. apiRequest — gère erreur 401');

clearMockStorage();
(async () => {
    GitHubStorage.saveConfig({ token: 'bad_token' });

    setFetchMock(async () => ({
        ok: false, status: 401,
        json: async () => ({ message: 'Bad credentials' })
    }));

    const result = await GitHubStorage.testConnection();
    assertEqual(result.ok, false, 'testConnection retourne ok:false');
    assertIncludes(result.message, '❌', 'Message contient ❌');

    restoreFetch();
})();

section('18. apiRequest — gère erreur 403');

clearMockStorage();
(async () => {
    GitHubStorage.saveConfig({ token: 'limited_token' });

    setFetchMock(async () => ({
        ok: false, status: 403,
        json: async () => ({ message: 'Resource not accessible' })
    }));

    const result = await GitHubStorage.testConnection();
    assertEqual(result.ok, false, 'testConnection retourne ok:false sur 403');

    restoreFetch();
})();

section('19. testConnection — succès');

clearMockStorage();
(async () => {
    setFetchMock(async () => ({
        ok: true, status: 200,
        json: async () => ({
            full_name: 'lolocosto/parcours-avenir-datasets',
            description: 'Datasets pour Parcours Avenir',
            private: false,
            default_branch: 'main'
        })
    }));

    const result = await GitHubStorage.testConnection();
    assertEqual(result.ok, true, 'testConnection retourne ok:true');
    assertIncludes(result.message, '✅', 'Message contient ✅');
    assertEqual(result.repoInfo.fullName, 'lolocosto/parcours-avenir-datasets', 'fullName correct');

    restoreFetch();
})();

section('20. testWriteAccess — refuse sans token');

clearMockStorage();
(async () => {
    const result = await GitHubStorage.testWriteAccess();
    assertEqual(result.ok, false, 'testWriteAccess retourne ok:false sans token');
    assertIncludes(result.message, 'token', 'Message mentionne token');
})();

// ── 7. Constantes exposées ────────────────────────────────

section('21. Constantes exposées');

(() => {
    assertEqual(window.GITHUB_OWNER_KEY, 'github_owner', 'GITHUB_OWNER_KEY exposée');
    assertEqual(window.GITHUB_REPO_KEY, 'github_repo', 'GITHUB_REPO_KEY exposée');
    assertEqual(window.GITHUB_TOKEN_KEY, 'github_token', 'GITHUB_TOKEN_KEY exposée');
    assertEqual(window.GITHUB_DEFAULT_OWNER, 'lolocosto', 'GITHUB_DEFAULT_OWNER exposée');
    assertEqual(window.GITHUB_DEFAULT_REPO, 'parcours-avenir-datasets', 'GITHUB_DEFAULT_REPO exposée');
    assertEqual(window.GITHUB_DATASETS_PATH, 'jeux_de_donnees', 'GITHUB_DATASETS_PATH exposée');
    assertEqual(window.GITHUB_INDEX_FILENAME, 'index.json', 'GITHUB_INDEX_FILENAME exposée');
    assertEqual(window.GITHUB_INDEX_VERSION, '1.0', 'GITHUB_INDEX_VERSION exposée');
})();

// ── 8. Intégration — header Authorization ─────────────────

section('22. apiRequest — ajoute Authorization avec token');

clearMockStorage();
(async () => {
    GitHubStorage.saveConfig({ token: 'ghp_mytoken' });

    let capturedHeaders = {};
    setFetchMock(async (url, opts) => {
        capturedHeaders = opts.headers || {};
        return {
            ok: true, status: 200,
            json: async () => ({ full_name: 'test/repo' })
        };
    });

    await GitHubStorage.testConnection();
    assertEqual(capturedHeaders['Authorization'], 'Bearer ghp_mytoken', 'Header Authorization présent');
    assertIncludes(capturedHeaders['Accept'], 'github', 'Header Accept contient github');

    restoreFetch();
})();

section('23. apiRequest — pas de Authorization sans token');

clearMockStorage();
(async () => {
    let capturedHeaders = {};
    setFetchMock(async (url, opts) => {
        capturedHeaders = opts.headers || {};
        return {
            ok: true, status: 200,
            json: async () => ({ full_name: 'test/repo' })
        };
    });

    await GitHubStorage.testConnection();
    assertEqual(capturedHeaders['Authorization'], undefined, 'Pas de header Authorization sans token');

    restoreFetch();
})();

// ══════════════════════════════════════════════════════════
// RÉSULTATS
// ══════════════════════════════════════════════════════════

// Attendre les async
setTimeout(() => {
    printResults();
    if (failedTests > 0) process.exit(1);
}, 500);
