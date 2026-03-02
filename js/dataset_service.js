/**
 * @file dataset_service.js
 * @description Service de gestion des jeux de données (datasets).
 *
 * Permet d'exporter l'intégralité des données éducatives de la base
 * sous forme d'un fichier JSON autonome contenant les données ET les
 * métadonnées de la recherche qui les a produites (type, paramètres, date, stats).
 *
 * Permet aussi d'importer un jeu de données pour l'explorer en mode déconnecté.
 *
 * Architecture :
 *   - Export : DatasetService → DatabaseService.getStorageSnapshot()
 *   - Import : DatasetService → DatabaseService.loadStorageSnapshot()
 *   - Index  : localStorage (clé DATASET_INDEX_KEY) pour retrouver les jeux connus
 *
 * @module DatasetService
 * @author Laurent COSTE / Claude
 * @version 0.62
 */

'use strict';

// ══════════════════════════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════════════════════════

/** @constant {string} Identifiant de format pour les fichiers de jeux de données */
const DATASET_FORMAT = 'parcours-avenir-dataset';

/** @constant {string} Version actuelle du format de dataset */
const DATASET_VERSION = '1.0';

/** @constant {string} Clé localStorage pour l'index des jeux de données connus */
const DATASET_INDEX_KEY = 'parcours_avenir_datasets_index';

/** @constant {number} Seuil d'avertissement de taille (5 Mo) */
const DATASET_MAX_SIZE_WARNING = 5 * 1024 * 1024;

/** @constant {string[]} Versions de format supportées pour l'import */
const DATASET_SUPPORTED_VERSIONS = ['1.0'];

// ══════════════════════════════════════════════════════════
// SERVICE
// ══════════════════════════════════════════════════════════

/**
 * Service statique de gestion des jeux de données.
 * Toutes les méthodes sont statiques (pas d'état interne, comme ExportService).
 */
class DatasetService {

    // =====================================
    // EXPORT
    // =====================================

    /**
     * Construit un objet dataset complet (données + métadonnées) à partir
     * de la base courante et des métadonnées fournies.
     *
     * Ne déclenche PAS le téléchargement — utiliser downloadDataset() pour cela.
     *
     * @param {Object} metadata - Métadonnées de la recherche
     * @param {string} metadata.nom - Nom donné par l'utilisateur au jeu de données
     * @param {string} metadata.typeRecherche - 'geo'|'diplomes'|'options'
     * @param {Object} metadata.params - Paramètres de la recherche (format favoris)
     * @param {string} [metadata.dateExtraction] - Date ISO de l'extraction (défaut : now)
     * @returns {Promise<Object>} Objet dataset complet prêt à être sérialisé
     * @throws {Error} Si databaseService n'est pas disponible
     */
    static async exportDataset(metadata) {
        if (!window.databaseService) {
            throw new Error('[DatasetService] DatabaseService non disponible');
        }
        if (!metadata || !metadata.nom) {
            throw new Error('[DatasetService] Le nom du jeu de données est obligatoire');
        }

        console.log(`[DatasetService] 📦 Export du jeu de données « ${metadata.nom} »…`);

        const data  = await window.databaseService.getStorageSnapshot();
        const stats = await window.databaseService.getStats();

        const dataset = {
            format:     DATASET_FORMAT,
            version:    DATASET_VERSION,
            appVersion: typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'inconnue',
            metadata: {
                nom:             metadata.nom,
                dateExtraction:  metadata.dateExtraction || new Date().toISOString(),
                dateExport:      new Date().toISOString(),
                typeRecherche:   metadata.typeRecherche || 'inconnu',
                params:          metadata.params || {},
                stats
            },
            data
        };

        console.log(`[DatasetService] ✅ Dataset construit : ${Object.keys(data.etablissements || {}).length} établissements`);
        return dataset;
    }

    // =====================================
    // VALIDATION
    // =====================================

    /**
     * Valide la structure d'un objet dataset avant import.
     *
     * Vérifie le format, la version, les métadonnées minimales et la présence
     * d'au moins une table éducative non vide.
     *
     * @param {Object} json - Objet parsé depuis le fichier JSON
     * @returns {{ valid: boolean, errors: string[] }} Résultat de la validation
     */
    static validateDataset(json) {
        const errors = [];

        if (!json || typeof json !== 'object') {
            return { valid: false, errors: ['Le fichier ne contient pas un objet JSON valide.'] };
        }

        // Champ format
        if (!json.format) {
            errors.push('Champ « format » manquant.');
        } else if (json.format !== DATASET_FORMAT) {
            errors.push(`Format inconnu : « ${json.format} » (attendu : « ${DATASET_FORMAT} »).`);
        }

        // Champ version
        if (!json.version) {
            errors.push('Champ « version » manquant.');
        } else if (!DATASET_SUPPORTED_VERSIONS.includes(json.version)) {
            errors.push(`Version non supportée : « ${json.version} » (supportées : ${DATASET_SUPPORTED_VERSIONS.join(', ')}).`);
        }

        // Métadonnées
        if (!json.metadata || typeof json.metadata !== 'object') {
            errors.push('Bloc « metadata » manquant ou invalide.');
        } else {
            if (!json.metadata.nom) {
                errors.push('Métadonnée « nom » manquante.');
            }
            if (!json.metadata.typeRecherche) {
                errors.push('Métadonnée « typeRecherche » manquante.');
            }
        }

        // Données
        if (!json.data || typeof json.data !== 'object') {
            errors.push('Bloc « data » manquant ou invalide.');
        } else {
            // Vérifier qu'au moins une table éducative contient des données
            const tableNames = typeof DatabaseService !== 'undefined'
                ? DatabaseService.getEducationalTableNames()
                : ['etablissements', 'diplomes', 'diplomes_par_etablissement'];

            const hasAnyData = tableNames.some(
                table => json.data[table] && Object.keys(json.data[table]).length > 0
            );
            if (!hasAnyData) {
                errors.push('Aucune table éducative ne contient de données.');
            }
        }

        return { valid: errors.length === 0, errors };
    }

    // =====================================
    // IMPORT
    // =====================================

    /**
     * Importe un jeu de données dans la base après validation.
     *
     * Remplace toutes les données éducatives existantes. Les référentiels
     * géographiques et les préférences sont préservés.
     *
     * @param {Object} json - Objet dataset complet (format parcours-avenir-dataset)
     * @returns {Promise<{ success: boolean, stats: Object|null, errors: string[] }>}
     */
    static async importDataset(json) {
        // 1. Validation
        const validation = DatasetService.validateDataset(json);
        if (!validation.valid) {
            console.warn('[DatasetService] ❌ Validation échouée:', validation.errors);
            return { success: false, stats: null, errors: validation.errors };
        }

        if (!window.databaseService) {
            return { success: false, stats: null, errors: ['DatabaseService non disponible.'] };
        }

        try {
            console.log(`[DatasetService] 📥 Import du jeu « ${json.metadata.nom} »…`);

            // 2. Charger le snapshot
            await window.databaseService.loadStorageSnapshot(json.data);

            // 3. Sauvegarder les métadonnées d'extraction
            window.databaseService.setLastExtractionMetadata({
                typeRecherche: json.metadata.typeRecherche,
                params:        json.metadata.params,
                date:          json.metadata.dateExtraction,
                stats:         json.metadata.stats || null,
                importedFrom:  json.metadata.nom
            });

            // 4. Recalculer les stats post-import
            const stats = await window.databaseService.getStats();

            console.log(`[DatasetService] ✅ Import réussi : ${stats.etablissements} établissements`);
            return { success: true, stats, errors: [] };

        } catch (error) {
            console.error('[DatasetService] ❌ Erreur lors de l\'import:', error);
            return { success: false, stats: null, errors: [error.message] };
        }
    }

    // =====================================
    // INFO (aperçu sans import)
    // =====================================

    /**
     * Extrait les métadonnées d'un dataset sans l'importer.
     * Utile pour afficher un aperçu dans la modale de choix.
     *
     * @param {Object} json - Objet dataset parsé
     * @returns {Object|null} Métadonnées enrichies, ou null si invalide
     */
    static getDatasetInfo(json) {
        if (!json || !json.metadata) return null;

        const info = { ...json.metadata };

        // Calculer les stats si elles sont absentes
        if (!info.stats && json.data) {
            info.stats = {};
            const tables = ['etablissements', 'diplomes', 'dispositifs',
                'diplomes_apprentissage', 'options_2nde_gt', 'specialites_1ereG'];
            for (const table of tables) {
                if (json.data[table]) {
                    info.stats[table] = Object.keys(json.data[table]).length;
                }
            }
        }

        // Ajouter la version du format et de l'app
        info.formatVersion = json.version || 'inconnue';
        info.appVersion    = json.appVersion || 'inconnue';

        return info;
    }

    // =====================================
    // TÉLÉCHARGEMENT
    // =====================================

    /**
     * Déclenche le téléchargement d'un dataset sous forme de fichier JSON.
     *
     * @param {Object} dataset - Objet dataset complet
     * @param {string} [filename] - Nom du fichier (défaut : généré depuis le nom du dataset)
     */
    static downloadDataset(dataset, filename) {
        if (!dataset) {
            console.warn('[DatasetService] ⚠️ Aucun dataset à télécharger');
            return;
        }

        const jsonString = JSON.stringify(dataset, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });

        // Avertissement si le fichier est volumineux
        if (blob.size > DATASET_MAX_SIZE_WARNING) {
            console.warn(`[DatasetService] ⚠️ Fichier volumineux : ${(blob.size / 1024 / 1024).toFixed(1)} Mo`);
        }

        // Générer un nom de fichier par défaut
        if (!filename) {
            const nom  = (dataset.metadata?.nom || 'dataset').replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç_-]/g, '_');
            const date = new Date().toISOString().slice(0, 10);
            filename = `parcours_avenir_${nom}_${date}.json`;
        }

        DatasetService.#triggerDownload(blob, filename);

        console.log(`[DatasetService] 💾 Téléchargement lancé : ${filename} (${(blob.size / 1024).toFixed(0)} Ko)`);
    }

    /**
     * Déclenche le téléchargement d'un Blob via un lien dynamique.
     * @private
     * @param {Blob} blob
     * @param {string} filename
     */
    static #triggerDownload(blob, filename) {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        // Nettoyage différé
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 200);
    }

    // =====================================
    // INDEX DES JEUX DE DONNÉES
    // =====================================

    /**
     * Récupère l'index des jeux de données connus (métadonnées uniquement).
     * @returns {Object[]} Liste des entrées d'index
     */
    static getIndex() {
        try {
            return JSON.parse(localStorage.getItem(DATASET_INDEX_KEY) || '[]');
        } catch (error) {
            console.warn('[DatasetService] ⚠️ Index corrompu, réinitialisation');
            localStorage.removeItem(DATASET_INDEX_KEY);
            return [];
        }
    }

    /**
     * Ajoute une entrée à l'index des jeux de données.
     * @param {Object} metadata - Métadonnées du jeu de données
     * @param {string} metadata.nom - Nom du jeu
     * @param {string} metadata.typeRecherche - Type de recherche
     * @param {string} [metadata.dateExtraction] - Date d'extraction
     * @param {Object} [metadata.stats] - Statistiques
     * @returns {string} ID de l'entrée créée
     */
    static addToIndex(metadata) {
        const index = DatasetService.getIndex();

        const entry = {
            id:              `ds_${Date.now()}`,
            nom:             metadata.nom || 'Sans nom',
            typeRecherche:   metadata.typeRecherche || 'inconnu',
            dateExtraction:  metadata.dateExtraction || new Date().toISOString(),
            dateAjout:       new Date().toISOString(),
            stats:           metadata.stats || {}
        };

        index.push(entry);
        DatasetService.#saveIndex(index);

        console.log(`[DatasetService] 📋 Ajouté à l'index : « ${entry.nom} » (${entry.id})`);
        return entry.id;
    }

    /**
     * Supprime une entrée de l'index par son ID.
     * @param {string} id - Identifiant de l'entrée à supprimer
     * @returns {boolean} true si l'entrée a été trouvée et supprimée
     */
    static removeFromIndex(id) {
        const index = DatasetService.getIndex();
        const before = index.length;
        const filtered = index.filter(entry => entry.id !== id);

        if (filtered.length === before) {
            console.warn(`[DatasetService] ⚠️ Entrée ${id} non trouvée dans l'index`);
            return false;
        }

        DatasetService.#saveIndex(filtered);
        console.log(`[DatasetService] 🗑️ Entrée ${id} retirée de l'index`);
        return true;
    }

    /**
     * Persiste l'index dans localStorage.
     * @private
     * @param {Object[]} index
     */
    static #saveIndex(index) {
        try {
            localStorage.setItem(DATASET_INDEX_KEY, JSON.stringify(index));
        } catch (error) {
            console.warn('[DatasetService] ⚠️ Impossible de sauver l\'index:', error);
        }
    }

    // =====================================
    // UTILITAIRES
    // =====================================

    /**
     * Génère un libellé lisible pour un type de recherche.
     * @param {string} typeRecherche - 'geo'|'diplomes'|'options'
     * @returns {string} Libellé en français
     */
    static getTypeRechercheLabel(typeRecherche) {
        const labels = {
            geo:      'Recherche géographique',
            diplomes: 'Recherche par diplôme',
            options:  'Recherche par option'
        };
        return labels[typeRecherche] || `Recherche (${typeRecherche || 'type inconnu'})`;
    }

    /**
     * Génère un résumé lisible des paramètres d'une recherche.
     * @param {string} typeRecherche - Type de recherche
     * @param {Object} params - Paramètres de la recherche
     * @returns {string} Description textuelle
     */
    static formatParamsDescription(typeRecherche, params) {
        if (!params) return 'Paramètres non disponibles';

        switch (typeRecherche) {
            case 'geo': {
                const lieu = params.scope === 'intercommunalite'
                    ? (params.epci?.nom || 'Intercommunalité inconnue')
                    : (params.commune?.nom || 'Commune inconnue');
                const voies = (params.voies || []).join(' + ') || 'toutes voies';
                return `${lieu} — ${voies}`;
            }
            case 'diplomes': {
                const items = params.items || [];
                const count = items.length;
                const geo   = params.geoValue || 'France entière';
                return `${count} diplôme${count > 1 ? 's' : ''} — ${geo}`;
            }
            case 'options': {
                const items = params.items || [];
                const count = items.length;
                const geo   = params.geoValue || 'France entière';
                return `${count} option${count > 1 ? 's' : ''} — ${geo}`;
            }
            default:
                return JSON.stringify(params).slice(0, 80);
        }
    }

    /**
     * Génère un résumé statistique lisible.
     * @param {Object} stats - Objet de statistiques (issue de getStats)
     * @returns {string} Description textuelle (ex: "87 établissements, 234 diplômes")
     */
    static formatStatsDescription(stats) {
        if (!stats) return 'Statistiques non disponibles';

        const parts = [];
        if (stats.etablissements)        parts.push(`${stats.etablissements} établissement${stats.etablissements > 1 ? 's' : ''}`);
        if (stats.diplomes)              parts.push(`${stats.diplomes} diplôme${stats.diplomes > 1 ? 's' : ''}`);
        if (stats.dispositifs)           parts.push(`${stats.dispositifs} dispositif${stats.dispositifs > 1 ? 's' : ''}`);
        if (stats.diplomes_apprentissage) parts.push(`${stats.diplomes_apprentissage} diplôme${stats.diplomes_apprentissage > 1 ? 's' : ''} apprentissage`);
        if (stats.options_2nde_gt)       parts.push(`${stats.options_2nde_gt} option${stats.options_2nde_gt > 1 ? 's' : ''} 2nde GT`);

        return parts.length > 0 ? parts.join(', ') : 'Base vide';
    }
}

// ══════════════════════════════════════════════════════════
// EXPOSITION GLOBALE
// ══════════════════════════════════════════════════════════

if (typeof window !== 'undefined') {
    window.DatasetService = DatasetService;

    // Constantes exportées pour les tests
    window.DATASET_FORMAT    = DATASET_FORMAT;
    window.DATASET_VERSION   = DATASET_VERSION;
    window.DATASET_INDEX_KEY = DATASET_INDEX_KEY;
}
