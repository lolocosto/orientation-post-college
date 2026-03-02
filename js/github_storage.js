/**
 * @file github_storage.js
 * @description Service de stockage distant des jeux de données via l'API GitHub.
 *
 * Permet de lister, charger, publier et supprimer des jeux de données
 * hébergés dans un dépôt GitHub dédié (par défaut : lolocosto/parcours-avenir-datasets).
 *
 * Le dépôt utilise la structure suivante :
 *   jeux_de_donnees/
 *     index.json          ← Catalogue des datasets (métadonnées)
 *     dataset_xxx.json    ← Fichiers de données complets
 *
 * Architecture :
 *   - Lecture  : API GitHub Contents (publique si repo public, sinon token requis)
 *   - Écriture : API GitHub Contents avec Personal Access Token (fine-grained)
 *   - Index    : index.json maintenu dans le dépôt (source de vérité distante)
 *
 * Configuration stockée dans localStorage :
 *   - github_owner  (défaut : 'lolocosto')
 *   - github_repo   (défaut : 'parcours-avenir-datasets')
 *   - github_token  (PAT, optionnel pour la lecture d'un repo public)
 *
 * @module GitHubStorage
 * @requires DatasetService (pour validateDataset, getDatasetInfo, formatStatsDescription)
 * @author Laurent COSTE / Claude
 * @version 0.63
 */

'use strict';

// ══════════════════════════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════════════════════════

/** @constant {string} Clé localStorage pour le propriétaire du dépôt */
const GITHUB_OWNER_KEY = 'github_owner';

/** @constant {string} Clé localStorage pour le nom du dépôt */
const GITHUB_REPO_KEY = 'github_repo';

/** @constant {string} Clé localStorage pour le token GitHub */
const GITHUB_TOKEN_KEY = 'github_token';

/** @constant {string} Propriétaire par défaut */
const GITHUB_DEFAULT_OWNER = 'lolocosto';

/** @constant {string} Dépôt par défaut */
const GITHUB_DEFAULT_REPO = 'parcours-avenir-datasets';

/** @constant {string} Dossier contenant les datasets dans le dépôt */
const GITHUB_DATASETS_PATH = 'jeux_de_donnees';

/** @constant {string} Nom du fichier d'index */
const GITHUB_INDEX_FILENAME = 'index.json';

/** @constant {string} URL de base de l'API GitHub */
const GITHUB_API_BASE = 'https://api.github.com';

/** @constant {number} Taille maximale pour l'API Contents (100 Mo en base64, ~75 Mo en clair) */
const GITHUB_MAX_FILE_SIZE = 75 * 1024 * 1024;

/** @constant {string} Version de l'index */
const GITHUB_INDEX_VERSION = '1.0';

// ══════════════════════════════════════════════════════════
// SERVICE
// ══════════════════════════════════════════════════════════

/**
 * Service statique de stockage GitHub pour les jeux de données.
 * Toutes les méthodes sont statiques (même pattern que DatasetService).
 */
class GitHubStorage {

    // =====================================
    // CONFIGURATION
    // =====================================

    /**
     * Retourne la configuration GitHub courante.
     * @returns {{ owner: string, repo: string, token: string|null, configured: boolean }}
     */
    static getConfig() {
        const owner = localStorage.getItem(GITHUB_OWNER_KEY) || GITHUB_DEFAULT_OWNER;
        const repo  = localStorage.getItem(GITHUB_REPO_KEY)  || GITHUB_DEFAULT_REPO;
        const token = localStorage.getItem(GITHUB_TOKEN_KEY)  || null;

        return {
            owner,
            repo,
            token,
            configured: !!(owner && repo)
        };
    }

    /**
     * Sauvegarde la configuration GitHub.
     * @param {Object} config
     * @param {string} [config.owner] - Propriétaire du dépôt
     * @param {string} [config.repo]  - Nom du dépôt
     * @param {string} [config.token] - Personal Access Token (null pour supprimer)
     */
    static saveConfig({ owner, repo, token } = {}) {
        if (owner !== undefined) {
            if (owner) {
                localStorage.setItem(GITHUB_OWNER_KEY, owner.trim());
            } else {
                localStorage.removeItem(GITHUB_OWNER_KEY);
            }
        }
        if (repo !== undefined) {
            if (repo) {
                localStorage.setItem(GITHUB_REPO_KEY, repo.trim());
            } else {
                localStorage.removeItem(GITHUB_REPO_KEY);
            }
        }
        if (token !== undefined) {
            if (token) {
                localStorage.setItem(GITHUB_TOKEN_KEY, token.trim());
            } else {
                localStorage.removeItem(GITHUB_TOKEN_KEY);
            }
        }

        console.log('[GitHubStorage] ⚙️ Configuration sauvegardée');
    }

    /**
     * Indique si un token d'écriture est configuré.
     * @returns {boolean}
     */
    static hasWriteToken() {
        const token = localStorage.getItem(GITHUB_TOKEN_KEY);
        return !!(token && token.trim());
    }

    // =====================================
    // LECTURE — INDEX
    // =====================================

    /**
     * Récupère l'index des datasets depuis le dépôt GitHub.
     * @returns {Promise<Object>} Objet index { version, datasets: [...] }
     * @throws {Error} Si le dépôt est inaccessible ou l'index invalide
     */
    static async fetchIndex() {
        const path = `${GITHUB_DATASETS_PATH}/${GITHUB_INDEX_FILENAME}`;
        console.log('[GitHubStorage] 📋 Récupération de l\'index…');

        try {
            const content = await GitHubStorage.#fetchFileContent(path);
            const index = JSON.parse(content);

            if (!index || !Array.isArray(index.datasets)) {
                throw new Error('Format d\'index invalide (champ datasets manquant)');
            }

            console.log(`[GitHubStorage] ✅ Index récupéré : ${index.datasets.length} jeu(x) de données`);
            return index;

        } catch (error) {
            // 404 = pas d'index, retourner un index vide
            if (error.message?.includes('404')) {
                console.warn('[GitHubStorage] ⚠️ Index non trouvé, retour d\'un index vide');
                return { version: GITHUB_INDEX_VERSION, datasets: [] };
            }
            throw error;
        }
    }

    /**
     * Liste les datasets disponibles sur GitHub (métadonnées depuis l'index).
     * @returns {Promise<Object[]>} Tableau d'entrées de datasets
     */
    static async listDatasets() {
        const index = await GitHubStorage.fetchIndex();
        return index.datasets || [];
    }

    // =====================================
    // LECTURE — DATASET COMPLET
    // =====================================

    /**
     * Charge un dataset complet depuis GitHub.
     * @param {string} filename - Nom du fichier dans le dossier jeux_de_donnees/
     * @returns {Promise<Object>} Objet dataset complet (même format que DatasetService.exportDataset)
     * @throws {Error} Si le fichier est introuvable ou invalide
     */
    static async loadDataset(filename) {
        if (!filename) {
            throw new Error('[GitHubStorage] Nom de fichier requis');
        }

        const path = `${GITHUB_DATASETS_PATH}/${filename}`;
        console.log(`[GitHubStorage] 📥 Chargement du dataset « ${filename} »…`);

        const content = await GitHubStorage.#fetchFileContent(path);
        const dataset = JSON.parse(content);

        // Validation basique
        if (typeof DatasetService !== 'undefined') {
            const validation = DatasetService.validateDataset(dataset);
            if (!validation.valid) {
                throw new Error(`Dataset invalide : ${validation.errors.join(', ')}`);
            }
        }

        console.log(`[GitHubStorage] ✅ Dataset chargé : « ${dataset.metadata?.nom || filename} »`);
        return dataset;
    }

    // =====================================
    // ÉCRITURE — UPLOAD
    // =====================================

    /**
     * Publie un dataset sur GitHub et met à jour l'index.
     *
     * @param {Object} dataset - Objet dataset complet (format DatasetService)
     * @param {string} [filename] - Nom du fichier (généré si absent)
     * @returns {Promise<{ success: boolean, filename: string, url: string }>}
     * @throws {Error} Si pas de token ou si l'upload échoue
     */
    static async uploadDataset(dataset, filename) {
        if (!GitHubStorage.hasWriteToken()) {
            throw new Error('[GitHubStorage] Token GitHub requis pour l\'écriture');
        }

        if (!dataset || !dataset.metadata?.nom) {
            throw new Error('[GitHubStorage] Dataset invalide (métadonnées manquantes)');
        }

        // Générer le nom de fichier si nécessaire
        if (!filename) {
            filename = GitHubStorage.#generateFilename(dataset.metadata.nom);
        }

        const jsonString = JSON.stringify(dataset, null, 2);

        // Vérifier la taille
        if (jsonString.length > GITHUB_MAX_FILE_SIZE) {
            throw new Error(`[GitHubStorage] Fichier trop volumineux (${(jsonString.length / 1024 / 1024).toFixed(1)} Mo, max ${(GITHUB_MAX_FILE_SIZE / 1024 / 1024).toFixed(0)} Mo)`);
        }

        const path = `${GITHUB_DATASETS_PATH}/${filename}`;
        console.log(`[GitHubStorage] 📤 Upload de « ${dataset.metadata.nom} » → ${filename}…`);

        // 1. Uploader le fichier dataset
        const contentBase64 = GitHubStorage.#utf8ToBase64(jsonString);
        const commitMessage = `📦 Ajout dataset : ${dataset.metadata.nom}`;

        // Vérifier si le fichier existe déjà (pour obtenir le SHA)
        let existingSha = null;
        try {
            existingSha = await GitHubStorage.#getFileSha(path);
        } catch (e) {
            // Fichier inexistant, on crée
        }

        const putBody = {
            message: commitMessage,
            content: contentBase64
        };
        if (existingSha) {
            putBody.sha = existingSha;
        }

        const putResult = await GitHubStorage.#apiRequest('PUT', `/repos/{owner}/{repo}/contents/${path}`, putBody);

        // 2. Mettre à jour l'index
        await GitHubStorage.#updateIndex('add', {
            filename,
            nom:            dataset.metadata.nom,
            typeRecherche:  dataset.metadata.typeRecherche || 'inconnu',
            dateExtraction: dataset.metadata.dateExtraction || new Date().toISOString(),
            dateUpload:     new Date().toISOString(),
            appVersion:     dataset.appVersion || 'inconnue',
            stats:          dataset.metadata.stats || {}
        });

        const url = putResult?.content?.html_url || '';
        console.log(`[GitHubStorage] ✅ Dataset publié : ${filename}`);

        return { success: true, filename, url };
    }

    // =====================================
    // SUPPRESSION
    // =====================================

    /**
     * Supprime un dataset du dépôt GitHub et met à jour l'index.
     *
     * @param {string} filename - Nom du fichier à supprimer
     * @returns {Promise<{ success: boolean }>}
     * @throws {Error} Si pas de token ou si la suppression échoue
     */
    static async deleteDataset(filename) {
        if (!GitHubStorage.hasWriteToken()) {
            throw new Error('[GitHubStorage] Token GitHub requis pour la suppression');
        }

        if (!filename) {
            throw new Error('[GitHubStorage] Nom de fichier requis');
        }

        const path = `${GITHUB_DATASETS_PATH}/${filename}`;
        console.log(`[GitHubStorage] 🗑️ Suppression de « ${filename} »…`);

        // 1. Obtenir le SHA du fichier
        const sha = await GitHubStorage.#getFileSha(path);

        // 2. Supprimer le fichier
        await GitHubStorage.#apiRequest('DELETE', `/repos/{owner}/{repo}/contents/${path}`, {
            message: `🗑️ Suppression dataset : ${filename}`,
            sha
        });

        // 3. Mettre à jour l'index
        await GitHubStorage.#updateIndex('remove', { filename });

        console.log(`[GitHubStorage] ✅ Dataset supprimé : ${filename}`);
        return { success: true };
    }

    // =====================================
    // TEST DE CONNEXION
    // =====================================

    /**
     * Teste la connexion au dépôt GitHub (lecture).
     * @returns {Promise<{ ok: boolean, message: string, repoInfo?: Object }>}
     */
    static async testConnection() {
        try {
            const result = await GitHubStorage.#apiRequest('GET', '/repos/{owner}/{repo}');
            return {
                ok: true,
                message: `✅ Dépôt accessible : ${result.full_name}`,
                repoInfo: {
                    fullName:    result.full_name,
                    description: result.description,
                    isPrivate:   result.private,
                    defaultBranch: result.default_branch
                }
            };
        } catch (error) {
            return {
                ok: false,
                message: `❌ Impossible d'accéder au dépôt : ${error.message}`
            };
        }
    }

    /**
     * Teste les droits d'écriture en créant puis supprimant un fichier temporaire.
     * @returns {Promise<{ ok: boolean, message: string }>}
     */
    static async testWriteAccess() {
        if (!GitHubStorage.hasWriteToken()) {
            return { ok: false, message: '❌ Aucun token GitHub configuré' };
        }

        const testPath = `${GITHUB_DATASETS_PATH}/.write_test_${Date.now()}.tmp`;

        try {
            // Créer un fichier test
            const content = GitHubStorage.#utf8ToBase64(JSON.stringify({ test: true, date: new Date().toISOString() }));
            const createResult = await GitHubStorage.#apiRequest('PUT', `/repos/{owner}/{repo}/contents/${testPath}`, {
                message: '🧪 Test d\'écriture (sera supprimé)',
                content
            });

            // Supprimer immédiatement
            if (createResult?.content?.sha) {
                await GitHubStorage.#apiRequest('DELETE', `/repos/{owner}/{repo}/contents/${testPath}`, {
                    message: '🧪 Nettoyage test d\'écriture',
                    sha: createResult.content.sha
                });
            }

            return { ok: true, message: '✅ Droits d\'écriture confirmés' };

        } catch (error) {
            return {
                ok: false,
                message: `❌ Écriture impossible : ${error.message}`
            };
        }
    }

    // =====================================
    // MÉTHODES PRIVÉES — API GITHUB
    // =====================================

    /**
     * Effectue une requête à l'API GitHub.
     * @private
     * @param {string} method - GET, PUT, DELETE
     * @param {string} pathTemplate - Chemin avec placeholders {owner} et {repo}
     * @param {Object} [body] - Corps de la requête (pour PUT/DELETE)
     * @returns {Promise<Object>} Réponse JSON
     */
    static async #apiRequest(method, pathTemplate, body = null) {
        const config = GitHubStorage.getConfig();
        const path = pathTemplate
            .replace('{owner}', encodeURIComponent(config.owner))
            .replace('{repo}', encodeURIComponent(config.repo));

        const url = `${GITHUB_API_BASE}${path}`;
        const headers = {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };

        if (config.token) {
            headers['Authorization'] = `Bearer ${config.token}`;
        }

        const options = { method, headers };
        if (body) {
            headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        // Gérer les erreurs HTTP
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorBody = await response.json();
                errorMessage = errorBody.message || errorMessage;
            } catch (e) {
                // Pas de corps JSON
            }

            if (response.status === 401) {
                throw new Error(`Authentification échouée — vérifiez votre token GitHub`);
            }
            if (response.status === 403) {
                throw new Error(`Accès refusé — permissions insuffisantes (${errorMessage})`);
            }
            if (response.status === 404) {
                throw new Error(`404 — Ressource introuvable (${errorMessage})`);
            }
            if (response.status === 409) {
                throw new Error(`Conflit — ${errorMessage}`);
            }
            if (response.status === 422) {
                throw new Error(`Requête invalide — ${errorMessage}`);
            }

            throw new Error(errorMessage);
        }

        // 204 No Content (DELETE réussi)
        if (response.status === 204) {
            return {};
        }

        return await response.json();
    }

    /**
     * Récupère le contenu décodé d'un fichier depuis l'API Contents.
     * @private
     * @param {string} filePath - Chemin relatif dans le dépôt
     * @returns {Promise<string>} Contenu du fichier en texte
     */
    static async #fetchFileContent(filePath) {
        const result = await GitHubStorage.#apiRequest('GET', `/repos/{owner}/{repo}/contents/${filePath}`);

        if (!result.content) {
            throw new Error(`Pas de contenu pour ${filePath}`);
        }

        // L'API renvoie du base64 (possiblement sur plusieurs lignes)
        return GitHubStorage.#base64ToUtf8(result.content);
    }

    /**
     * Récupère le SHA d'un fichier (nécessaire pour la mise à jour / suppression).
     * @private
     * @param {string} filePath - Chemin relatif dans le dépôt
     * @returns {Promise<string>} SHA du fichier
     */
    static async #getFileSha(filePath) {
        const result = await GitHubStorage.#apiRequest('GET', `/repos/{owner}/{repo}/contents/${filePath}`);
        if (!result.sha) {
            throw new Error(`SHA introuvable pour ${filePath}`);
        }
        return result.sha;
    }

    // =====================================
    // MÉTHODES PRIVÉES — GESTION DE L'INDEX
    // =====================================

    /**
     * Met à jour l'index distant (ajout ou suppression d'une entrée).
     * @private
     * @param {'add'|'remove'} action
     * @param {Object} entry - Données de l'entrée
     * @param {string} entry.filename - Nom du fichier
     */
    static async #updateIndex(action, entry) {
        const indexPath = `${GITHUB_DATASETS_PATH}/${GITHUB_INDEX_FILENAME}`;

        // Récupérer l'index actuel et son SHA
        let currentIndex = { version: GITHUB_INDEX_VERSION, datasets: [] };
        let indexSha = null;

        try {
            const result = await GitHubStorage.#apiRequest('GET', `/repos/{owner}/{repo}/contents/${indexPath}`);
            indexSha = result.sha;
            const content = GitHubStorage.#base64ToUtf8(result.content);
            currentIndex = JSON.parse(content);
        } catch (e) {
            // Index inexistant, on part d'un index vide
            console.warn('[GitHubStorage] Index absent, création…');
        }

        // Modifier l'index
        if (action === 'add') {
            // Supprimer l'ancienne entrée si elle existe (même filename)
            currentIndex.datasets = currentIndex.datasets.filter(d => d.filename !== entry.filename);
            currentIndex.datasets.push(entry);
        } else if (action === 'remove') {
            currentIndex.datasets = currentIndex.datasets.filter(d => d.filename !== entry.filename);
        }

        // Tri par date d'upload décroissante
        currentIndex.datasets.sort((a, b) => {
            const da = a.dateUpload || a.dateExtraction || '';
            const db = b.dateUpload || b.dateExtraction || '';
            return db.localeCompare(da);
        });

        currentIndex.lastModified = new Date().toISOString();

        // Écrire l'index mis à jour
        const indexContent = GitHubStorage.#utf8ToBase64(JSON.stringify(currentIndex, null, 2));
        const putBody = {
            message: `📋 Mise à jour index (${action} : ${entry.filename})`,
            content: indexContent
        };
        if (indexSha) {
            putBody.sha = indexSha;
        }

        await GitHubStorage.#apiRequest('PUT', `/repos/{owner}/{repo}/contents/${indexPath}`, putBody);
        console.log(`[GitHubStorage] 📋 Index mis à jour (${action})`);
    }

    // =====================================
    // MÉTHODES PRIVÉES — ENCODAGE BASE64 UTF-8
    // =====================================

    /**
     * Encode une chaîne UTF-8 en base64 (compatible avec les caractères accentués).
     * Utilise TextEncoder + btoa via un tableau d'octets.
     * @private
     * @param {string} str - Chaîne UTF-8 à encoder
     * @returns {string} Chaîne base64
     */
    static #utf8ToBase64(str) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        // Convertir le Uint8Array en chaîne binaire pour btoa
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Décode une chaîne base64 en UTF-8 (compatible avec les caractères accentués).
     * L'API GitHub peut renvoyer du base64 sur plusieurs lignes.
     * @private
     * @param {string} base64 - Chaîne base64 (peut contenir des sauts de ligne)
     * @returns {string} Chaîne UTF-8
     */
    static #base64ToUtf8(base64) {
        // Nettoyer les sauts de ligne éventuels
        const cleaned = base64.replace(/[\r\n\s]/g, '');
        const binary = atob(cleaned);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    }

    // =====================================
    // UTILITAIRES
    // =====================================

    /**
     * Génère un nom de fichier sûr pour un dataset.
     * @private
     * @param {string} nom - Nom du dataset
     * @returns {string} Nom de fichier (ex: "rennes_metropole_2026-03-02.json")
     */
    static #generateFilename(nom) {
        const safe = (nom || 'dataset')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')  // Supprimer les diacritiques
            .replace(/[^a-zA-Z0-9_-]/g, '_')  // Caractères sûrs uniquement
            .replace(/_+/g, '_')               // Pas de doubles underscores
            .replace(/^_|_$/g, '')             // Pas d'underscores en début/fin
            .toLowerCase()
            .slice(0, 50);                     // Limiter la longueur

        const date = new Date().toISOString().slice(0, 10);
        return `${safe}_${date}.json`;
    }

    /**
     * Construit l'URL de visualisation d'un fichier sur GitHub.
     * @param {string} filename - Nom du fichier
     * @returns {string} URL GitHub
     */
    static getFileUrl(filename) {
        const config = GitHubStorage.getConfig();
        return `https://github.com/${config.owner}/${config.repo}/blob/main/${GITHUB_DATASETS_PATH}/${filename}`;
    }

    /**
     * Construit l'URL brute (raw) pour téléchargement direct.
     * @param {string} filename - Nom du fichier
     * @returns {string} URL brute
     */
    static getRawUrl(filename) {
        const config = GitHubStorage.getConfig();
        return `https://raw.githubusercontent.com/${config.owner}/${config.repo}/main/${GITHUB_DATASETS_PATH}/${filename}`;
    }
}

// ══════════════════════════════════════════════════════════
// EXPOSITION GLOBALE
// ══════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.GitHubStorage = GitHubStorage;

    // Constantes exportées pour les tests
    window.GITHUB_OWNER_KEY      = GITHUB_OWNER_KEY;
    window.GITHUB_REPO_KEY       = GITHUB_REPO_KEY;
    window.GITHUB_TOKEN_KEY      = GITHUB_TOKEN_KEY;
    window.GITHUB_DEFAULT_OWNER  = GITHUB_DEFAULT_OWNER;
    window.GITHUB_DEFAULT_REPO   = GITHUB_DEFAULT_REPO;
    window.GITHUB_DATASETS_PATH  = GITHUB_DATASETS_PATH;
    window.GITHUB_INDEX_FILENAME = GITHUB_INDEX_FILENAME;
    window.GITHUB_API_BASE       = GITHUB_API_BASE;
    window.GITHUB_INDEX_VERSION  = GITHUB_INDEX_VERSION;
}
