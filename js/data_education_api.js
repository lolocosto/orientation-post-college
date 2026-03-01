/************************************************
 * Fichier : data_education_api.js
 * Description : Classe pour interagir avec l'API Data.Education.gouv.fr
 * Auteur : Laurent COSTE
 * Date : 2026-02-03
 * Version : 1.1 - Utilise HttpClient
 ************************************************/

/**
 * Classe pour gérer les requêtes vers l'API Data.Education.gouv.fr
 * Documentation API : https://data.education.gouv.fr/api/explore/v2.1/
 */
class DataEducationAPI {
    // =====================================
    // CONFIGURATION
    // =====================================
    
    #baseURL = 'https://data.education.gouv.fr/api/explore/v2.1';
    #http;
    
    #datasets = {
        langues: 'fr-en-offre-langues-2d',  // ✅ Confirmé fonctionnel
        sections_sportives: 'sections-sportives-scolaires',  // ✅ Nom confirmé
        effectifs_lycees_gt: 'fr-en-lycee_gt-effectifs-niveau-sexe-lv',  // ✅ Nom confirmé
        effectifs_lycees_pro: 'fr-en-lycee_pro-effectifs-niveau-sexe-lv'  // ✅ LV (comme GT)
    };
    
    // =====================================
    // CONSTRUCTEUR
    // =====================================
    
    constructor() {
        this.#http = new HttpClient({ label: 'DataEducationAPI' });
        console.log('[DataEducationAPI] Instance créée');
    }
    
    // =====================================
    // GETTERS
    // =====================================
    
    get requestCount() { return this.#http.requestCount; }
    get _requestCount() { return this.#http.requestCount; }
    
    /**
     * Vérifie si l'API est accessible (pas d'authentification)
     * @returns {boolean} Toujours true (API publique)
     */
    isConnected() {
        return true; // API publique, pas d'authentification
    }
    
    // =====================================
    // MÉTHODES PUBLIQUES : REQUÊTES
    // =====================================
    
    /**
     * Récupère les sections sportives d'établissements
     * @param {Object} filters - Filtres de recherche
     * @param {string} filters.uai - UAI de l'établissement
     * @param {string} filters.nom_commune - Nom de la commune
     * @param {string} filters.libelle_departement - Nom du département
     * @param {string} filters.libelle_region - Nom de la région
     * @param {number} filters.limit - Nombre max de résultats (défaut: 100)
     * @returns {Promise<Array>} Liste des sections sportives
     */
    async getSectionsSportives(filters = {}) {
        const dataset = this.#datasets.sections_sportives;
        
        console.log('[DataEducationAPI] Récupération sections sportives');
        
        try {
            const results = await this._queryDataset(dataset, filters);
            console.log(`[DataEducationAPI] ${results.length} section(s) sportive(s) trouvée(s)`);
            return results;
        } catch (error) {
            console.error('[DataEducationAPI] Erreur sections sportives:', error);
            throw error;
        }
    }
    
    /**
     * Récupère les sections sportives par UAI
     * @param {string} uai - UAI de l'établissement
     * @returns {Promise<Array>} Sections sportives de l'établissement
     */
    async getSectionsSportivesByUAI(uai) {
        return this.getSectionsSportives({ uai });
    }
    
    /**
     * Récupère les sections sportives par liste d'UAI (batch)
     * @param {Array<string>} uais - Liste des UAI
     * @returns {Promise<Array>} Sections sportives des établissements
     */
    async getSectionsSportivesByUAIs(uais) {
        const uaiFilter = uais.map(u => `uai:"${u}"`).join(' OR ');
        
        return this._queryDataset(this.#datasets.sections_sportives, {
            where: uaiFilter,
            limit: 100
        });
    }
    
    /**
     * Récupère l'offre de langues d'établissements
     * @param {Object} filters - Filtres de recherche
     * @param {string} filters.uai - UAI de l'établissement
     * @param {string} filters.commune - Nom de la commune
     * @param {string} filters.departement - Nom du département
     * @param {string} filters.region - Nom de la région
     * @param {string} filters.enseignements - Type d'enseignement (LV1, LV2, LV3, etc.)
     * @param {string} filters.langues - Langue (Allemand, Anglais, Espagnol, etc.)
     * @param {number} filters.limit - Nombre max de résultats (défaut: 100)
     * @returns {Promise<Array>} Liste des offres de langues
     */
    async getLangues(filters = {}) {
        const dataset = this.#datasets.langues;
        
        console.log('[DataEducationAPI] Récupération offre de langues');
        
        try {
            const results = await this._queryDataset(dataset, filters);
            console.log(`[DataEducationAPI] ${results.length} offre(s) de langue(s) trouvée(s)`);
            return results;
        } catch (error) {
            console.error('[DataEducationAPI] Erreur langues:', error);
            throw error;
        }
    }
    
    /**
     * Récupère l'offre de langues par UAI
     * @param {string} uai - UAI de l'établissement
     * @returns {Promise<Array>} Offres de langues de l'établissement
     */
    async getLanguesByUAI(uai) {
        return this.getLangues({ uai });
    }
    
    /**
     * Récupère l'offre de langues par liste d'UAI (batch)
     * @param {Array<string>} uais - Liste des UAI
     * @returns {Promise<Array>} Offres de langues des établissements
     */
    async getLanguesByUAIs(uais) {
        const uaiFilter = uais.map(u => `uai:"${u}"`).join(' OR ');
        
        return this._queryDataset(this.#datasets.langues, {
            where: uaiFilter,
            limit: 100
        });
    }
    
    /**
     * Récupère les effectifs des lycées GT (général et technologique)
     * @param {Object} filters - Filtres de recherche
     * @param {string} filters.numero_lycee - UAI de l'établissement
     * @param {string} filters.commune - Nom de la commune
     * @param {string} filters.departement - Nom du département
     * @param {string} filters.academie - Nom de l'académie
     * @param {string} filters.rentree_scolaire - Année de rentrée (ex: "2024")
     * @param {number} filters.limit - Nombre max de résultats (défaut: 100)
     * @returns {Promise<Array>} Liste des effectifs
     */
    async getEffectifsLyceesGT(filters = {}) {
        const dataset = this.#datasets.effectifs_lycees_gt;
        
        // Forcer l'année 2024 si non spécifiée
        if (!filters.rentree_scolaire) {
            filters.rentree_scolaire = '2024';
        }
        
        console.log('[DataEducationAPI] Récupération effectifs lycées GT');
        
        try {
            const results = await this._queryDataset(dataset, filters);
            console.log(`[DataEducationAPI] ${results.length} effectif(s) lycée(s) GT trouvé(s)`);
            return results;
        } catch (error) {
            console.error('[DataEducationAPI] Erreur effectifs GT:', error);
            throw error;
        }
    }
    
    /**
     * Récupère les effectifs d'un lycée GT par UAI
     * @param {string} uai - UAI de l'établissement
     * @param {string} rentree - Année de rentrée (défaut: "2024")
     * @returns {Promise<Object|null>} Effectif du lycée ou null
     */
    async getEffectifsLyceeGTByUAI(uai, rentree = '2024') {
        const results = await this.getEffectifsLyceesGT({
            numero_lycee: uai,
            rentree_scolaire: rentree,
            limit: 1
        });
        
        return results.length > 0 ? results[0] : null;
    }
    
    /**
     * Récupère les effectifs de lycées GT par liste d'UAI (batch)
     * @param {Array<string>} uais - Liste des UAI
     * @param {string} rentree - Année de rentrée (défaut: "2024")
     * @returns {Promise<Array>} Effectifs des lycées
     */
    async getEffectifsLyceesGTByUAIs(uais, rentree = '2024') {
        const uaiFilter = uais.map(u => `numero_lycee:"${u}"`).join(' OR ');
        
        return this._queryDataset(this.#datasets.effectifs_lycees_gt, {
            where: `(${uaiFilter}) AND rentree_scolaire:"${rentree}"`,
            limit: 100
        });
    }
    
    /**
     * Récupère les effectifs des lycées Pro (professionnels)
     * @param {Object} filters - Filtres de recherche
     * @param {string} filters.numero_lycee - UAI de l'établissement
     * @param {string} filters.commune - Nom de la commune
     * @param {string} filters.departement - Nom du département
     * @param {string} filters.academie - Nom de l'académie
     * @param {string} filters.rentree_scolaire - Année de rentrée (ex: "2024")
     * @param {number} filters.limit - Nombre max de résultats (défaut: 100)
     * @returns {Promise<Array>} Liste des effectifs
     */
    async getEffectifsLyceesPro(filters = {}) {
        const dataset = this.#datasets.effectifs_lycees_pro;
        
        // Forcer l'année 2024 si non spécifiée
        if (!filters.rentree_scolaire) {
            filters.rentree_scolaire = '2024';
        }
        
        console.log('[DataEducationAPI] Récupération effectifs lycées Pro');
        
        try {
            const results = await this._queryDataset(dataset, filters);
            console.log(`[DataEducationAPI] ${results.length} effectif(s) lycée(s) Pro trouvé(s)`);
            return results;
        } catch (error) {
            console.error('[DataEducationAPI] Erreur effectifs Pro:', error);
            throw error;
        }
    }
    
    /**
     * Récupère les effectifs d'un lycée Pro par UAI
     * @param {string} uai - UAI de l'établissement
     * @param {string} rentree - Année de rentrée (défaut: "2024")
     * @returns {Promise<Object|null>} Effectif du lycée ou null
     */
    async getEffectifsLyceeProByUAI(uai, rentree = '2024') {
        const results = await this.getEffectifsLyceesPro({
            numero_lycee: uai,
            rentree_scolaire: rentree,
            limit: 1
        });
        
        return results.length > 0 ? results[0] : null;
    }
    
    /**
     * Récupère les effectifs de lycées Pro par liste d'UAI (batch)
     * @param {Array<string>} uais - Liste des UAI
     * @param {string} rentree - Année de rentrée (défaut: "2024")
     * @returns {Promise<Array>} Effectifs des lycées
     */
    async getEffectifsLyceesProByUAIs(uais, rentree = '2024') {
        const uaiFilter = uais.map(u => `numero_lycee:"${u}"`).join(' OR ');
        
        return this._queryDataset(this.#datasets.effectifs_lycees_pro, {
            where: `(${uaiFilter}) AND rentree_scolaire:"${rentree}"`,
            limit: 100
        });
    }
    
    /**
     * Récupère les effectifs totaux (GT + Pro) par UAI
     * @param {string} uai - UAI de l'établissement
     * @param {string} rentree - Année de rentrée (défaut: "2024")
     * @returns {Promise<Object>} { effectifsGT: number|null, effectifsPro: number|null, total: number }
     */
    async getEffectifsTotauxByUAI(uai, rentree = '2024') {
        const [effectifsGT, effectifsPro] = await Promise.all([
            this.getEffectifsLyceeGTByUAI(uai, rentree),
            this.getEffectifsLyceeProByUAI(uai, rentree)
        ]);
        
        const nbGT = effectifsGT ? effectifsGT.nombre_d_eleves || 0 : 0;
        const nbPro = effectifsPro ? effectifsPro.nombre_d_eleves || 0 : 0;
        
        return {
            effectifsGT: effectifsGT ? nbGT : null,
            effectifsPro: effectifsPro ? nbPro : null,
            total: nbGT + nbPro
        };
    }
    
    // =====================================
    // MÉTHODES PRIVÉES : REQUÊTES
    // =====================================
    
    /**
     * Effectue une requête vers un dataset avec retry automatique
     * @private
     * @param {string} dataset - Nom du dataset
     * @param {Object} filters - Filtres de recherche
     * @param {number} maxRetries - Nombre max de tentatives (défaut: 5)
     * @param {number} initialDelay - Délai initial en ms (défaut: 1000)
     * @returns {Promise<Array>} Résultats
     */
    async _queryDataset(dataset, filters = {}, maxRetries = 5, initialDelay = 1000) {
        const { limit = 100, where = null, ...otherFilters } = filters;
        
        // Construire l'URL
        const url = `${this.#baseURL}/catalog/datasets/${dataset}/records`;
        
        // Construire les paramètres
        const params = new URLSearchParams({
            limit: limit.toString()
        });
        
        // Ajouter clause WHERE si présente
        if (where) {
            params.append('where', where);
        }
        
        // Ajouter les autres filtres
        for (const [key, value] of Object.entries(otherFilters)) {
            if (value !== null && value !== undefined) {
                // Gestion spéciale pour rentree_scolaire (facette de type date)
                if (key === 'rentree_scolaire') {
                    // Utiliser refine pour les facettes (format "YYYY")
                    params.append('refine', `${key}:"${value}"`);
                } else {
                    // Autres champs : utiliser where
                    const clause = `${key}:"${value}"`;
                    if (params.has('where')) {
                        params.set('where', `${params.get('where')} AND ${clause}`);
                    } else {
                        params.append('where', clause);
                    }
                }
            }
        }
        
        const fullUrl = `${url}?${params.toString()}`;
        
        const data = await this.#http.getJSON(fullUrl);
        // L'API retourne { total_count, results }
        return data.results || [];
    }
    
    _sleep(ms) { return this.#http.sleep(ms); }
}

// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    window.DataEducationAPI = DataEducationAPI;
}
