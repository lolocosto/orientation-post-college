/************************************************
 * Fichier : onisep_api.js
 * Description : Classe pour interagir avec l'API OpenData ONISEP
 * Auteur : Laurent COSTE
 * Date : 2026-02-03
 * Version : 2.0 (nettoyée - Phase 1)
 ************************************************/

/**
 * Classe pour gérer les requêtes vers l'API ONISEP
 * Documentation API : https://api.opendata.onisep.fr/
 */
class OnisepAPI {
    // =====================================
    // PROPRIÉTÉS PRIVÉES
    // =====================================
    
    // Authentification
    _email;
    _password;
    _token;
    _appId;
    
    // Configuration
    #baseURL = 'https://api.opendata.onisep.fr/api/1.0';
    
    #datasets = {
        structures: '5fa5816ac6a6e',                    // Structures d'enseignement secondaire
        formations: '5fa591127f501',                    // Formations initiales en France
        actions_lycee: '605340ddc19a9',                 // Actions de formation - Univers lycée
        actions_sup: '605344579a7d7',                   // Actions de formation - Univers sup
        dispositifs: '60867458bb600',                   // Dispositifs
        enseignements_optionnels_2nde: '60113c3d5fee0', // Options 2nde GT
        enseignements_specialite_1ere: '60113f395cce6'  // Spécialités 1ère G
    };
    
    // Compteur de requêtes
    _requestCount = 0;
    
    // =====================================
    // CONSTRUCTEUR
    // =====================================
    
    constructor(email = null, password = null, token = null, appId = null) {
        this._email = email;
        this._password = password;
        this._token = token;
        this._appId = appId;
        
        // Essayer de récupérer depuis localStorage si non fourni
        this._loadFromLocalStorage();
        
        console.log('[OnisepAPI] Instance créée');
    }
    
    // =====================================
    // GETTERS
    // =====================================
    
    get email() {
        return this._email;
    }
    
    get password() {
        return this._password;
    }
    
    get token() {
        return this._token;
    }
    
    get appId() {
        return this._appId;
    }
    
    get requestCount() {
        return this._requestCount;
    }
    
    get isConnected() {
        return !!this._token;
    }
    
    // =====================================
    // SETTERS
    // =====================================
    
    set email(value) {
        this._email = value;
    }
    
    set password(value) {
        this._password = value;
    }
    
    set appId(value) {
        this._appId = value;
    }
    
    // =====================================
    // AUTHENTIFICATION
    // =====================================
    
    /**
     * Se connecte à l'API ONISEP et récupère un token
     * @returns {Promise<void>}
     */
    async login() {
        // Vérifier que les credentials sont présents
        this._loadFromLocalStorage();
        
        if (!this._email || !this._password || !this._appId) {
            throw new Error('Email, mot de passe et Application-ID requis pour la connexion');
        }
        
        console.log('[OnisepAPI] Connexion en cours...');
        
        try {
            const response = await fetch(`${this.#baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `email=${encodeURIComponent(this._email)}&password=${encodeURIComponent(this._password)}`
            });
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this._token = data.token;
            
            // Sauvegarder le token
            try {
                localStorage.setItem('onisep_token', this._token);
            } catch (e) {
                console.warn('[OnisepAPI] Impossible de sauvegarder le token:', e);
            }
            
            console.log('[OnisepAPI] ✅ Connexion réussie');
            
        } catch (error) {
            console.error('[OnisepAPI] Erreur de connexion:', error);
            throw error;
        }
    }
    
    /**
     * Se déconnecte (efface le token)
     * @returns {void}
     */
    logout() {
        this._token = null;
        
        try {
            localStorage.removeItem('onisep_token');
        } catch (e) {
            console.warn('[OnisepAPI] Impossible de supprimer le token:', e);
        }
        
        console.log('[OnisepAPI] Déconnexion');
    }
    
    /**
     * Charge les credentials depuis localStorage
     * @private
     * @returns {void}
     */
    _loadFromLocalStorage() {
        try {
            if (!this._email) {
                this._email = localStorage.getItem('onisep-email');
            }
            if (!this._password) {
                this._password = localStorage.getItem('onisep-password');
            }
            if (!this._appId) {
                this._appId = localStorage.getItem('onisep-appid');
            }
            if (!this._token) {
                this._token = localStorage.getItem('onisep_token');
            }
        } catch (e) {
            console.warn('[OnisepAPI] Impossible de lire localStorage:', e);
        }
    }
    
    // =====================================
    // REQUÊTE GÉNÉRIQUE (MÉTHODE PRINCIPALE)
    // =====================================
    
    /**
     * Requête générique vers un dataset ONISEP
     * Gère automatiquement :
     * - La pagination (si total > size)
     * - Les retries en cas d'erreur 429 (rate limiting)
     * - Le groupement par lots si q est un tableau
     * 
     * @param {string} datasetName - Nom du dataset ('structures', 'formations', 'actions_lycee', etc.)
     * @param {Object} filters - Filtres de recherche
     * @param {string|string[]} filters.q - Recherche textuelle :
     *   - String : "Rennes" ou "Rennes||Bruz||..." (envoyé tel quel)
     *   - Array : ['Rennes', 'Bruz', 'Cesson'] (groupé automatiquement par lots)
     * @param {string} filters['facet.*'] - Filtres sur facettes
     * @param {number} filters.size - Nombre de résultats par page (max 100, défaut 100)
     * @param {number} batchSize - Taille des lots pour groupement si q est un tableau (défaut 10)
     * @returns {Promise<any[]>} Tableau de tous les résultats (paginés et/ou groupés)
     * 
     * @example
     * // Recherche simple par commune
     * const results = await onisepAPI.queryDataset('structures', {
     *     q: 'Rennes',
     *     size: 100
     * });
     * 
     * @example
     * // Recherche par tableau de communes (groupement automatique par lots de 10)
     * const communes = ['Rennes', 'Bruz', 'Cesson-Sévigné', ...]; // 43 communes
     * const results = await onisepAPI.queryDataset('structures', {
     *     q: communes, // Array → groupé automatiquement
     *     size: 100
     * }, 10); // Lots de 10 communes
     * // Résultat : 5 requêtes (43 communes / 10 par lot)
     * 
     * @example
     * // Recherche par département avec facette
     * const results = await onisepAPI.queryDataset('actions_lycee', {
     *     'facet.ens_departement': 'Ille-et-Vilaine',
     *     'facet.for_niveau_de_sortie': 'CAP ou équivalent',
     *     size: 1000
     * });
     */
    /**
     * Note: progressCallback sert UNIQUEMENT à ajouter des détails
     */
    async queryDataset(datasetName, filters = {}, batchSize = 10, progressCallback = null) {
        // Vérifier que le dataset existe
        const datasetId = this.#datasets[datasetName];
        if (!datasetId) {
            throw new Error(`Dataset inconnu : ${datasetName}. Datasets disponibles : ${Object.keys(this.#datasets).join(', ')}`);
        }

        // Gérer le cas où 'q' est un tableau → grouper par lots
        if (filters.q && Array.isArray(filters.q)) {
            console.log(`[OnisepAPI] 📦 Groupement par lots de ${batchSize} pour ${filters.q.length} éléments`);
            
            const allResults = [];
            const items = filters.q;
            const totalBatches = Math.ceil(items.length / batchSize);
            
            // Découper en lots
            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);
                const batchQuery = batch.join('||');
                const batchNum = Math.floor(i/batchSize) + 1;
                
                // Requête pour ce lot
                const batchFilters = {
                    ...filters,
                    q: batchQuery
                };
                
                const batchResults = await this.#queryDatasetSingle(datasetName, datasetId, batchFilters);
                allResults.push(...batchResults);
                
                // Ajout d'un détail sans modifier message principal/pourcentage
                if (progressCallback) {
                    progressCallback(`Batch #${batchNum}/${totalBatches} : ${batchResults.length} résultats`);
                }
                
                // Pause entre lots pour éviter rate limiting
                if (i + batchSize < items.length) {
                    await this._sleep(300);
                }
            }
            
            // Déduplication par code_uai (structures) ou id si présent
            // ATTENTION : Ne pas dédupliquer les actions_lycee, actions_sup, dispositifs
            // car ens_code_uai n'est pas un identifiant unique d'action !
            const uniqueResults = this.#deduplicateResults(allResults, datasetName);
            
            // Ajout d'un détail sans modifier message principal/pourcentage
            if (progressCallback) {
                progressCallback(`✅ ${uniqueResults.length} résultats uniques`);
            }
            
            console.log(`[OnisepAPI] ✅ Total après groupement : ${allResults.length} résultat(s) (${uniqueResults.length} uniques)`);
            return uniqueResults;
        }
        
        // Cas normal : q est une chaîne ou absent
        return await this.#queryDatasetSingle(datasetName, datasetId, filters);
    }
    
    /**
     * Requête un dataset avec pagination automatique (méthode interne)
     * @private
     */
    async #queryDatasetSingle(datasetName, datasetId, filters = {}) {
        // Récupération avec pagination automatique
        const allResults = [];
        let offset = 0;
        let total = Infinity;
        const pageSize = filters.size || 100;
        let requestNumber = 0;
        
        while (offset < total) {
            requestNumber++;
            
            // Construire l'URL avec offset
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            }
            params.set('size', pageSize);
            params.set('from', offset);
            
            const url = `${this.#baseURL}/dataset/${datasetId}/search?${params}`;
			console.log(`[OnisepAPI] Requête envoyée : `, url);
            

            // Configuration retry pour rate limiting
            const maxRetries = 5;
            let delay = 1000; // Délai initial 1s
            
            let pageResults = null;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`[OnisepAPI] Requête ${this._requestCount + 1} (tentative ${attempt}/${maxRetries}): ${datasetName} [offset=${offset}]`);
                    
                    // Attendre avant la requête (sauf première tentative)
                    if (attempt > 1) {
                        console.log(`[OnisepAPI] Attente ${delay}ms avant retry...`);
                        await this._sleep(delay);
                    }
                    
                    const response = await fetch(url, {
                        headers: this._getHeaders()
                    });
                    
                    // Gestion erreur 429 (rate limiting)
                    if (response.status === 429) {
                        const retryAfter = response.headers.get('Retry-After');
                        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay * 2;
                        
                        console.warn(`[OnisepAPI] ⚠️ Rate limit (429) - Retry ${attempt}/${maxRetries}`);
                        
                        if (attempt === maxRetries) {
                            throw new Error('Rate limit atteint après 5 tentatives');
                        }
                        
                        delay = waitTime;
                        continue; // Retry
                    }
                    
                    // Autres erreurs HTTP
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    // Parse la réponse
                    const data = await response.json();
                    this._requestCount++;
                    
                    pageResults = data.results || [];
                    const pageTotal = data.total || data.total_count || data.nhits || pageResults.length;
                    
                    // Mise à jour du total (première page)
                    if (total === Infinity) {
                        total = pageTotal;
                        if (total > pageSize) {
                            console.log(`[OnisepAPI] 📊 Pagination: ${total} résultats au total, récupération par pages de ${pageSize}`);
                        }
                    }
                    console.log(`[OnisepAPI] ✅ ${pageResults.length} résultat(s) récupéré(s) - Page ${Math.floor(offset/pageSize) + 1}/${Math.ceil(total/pageSize)}`);
                    break; // Succès, sortir de la boucle retry
                    
                } catch (error) {
                    // Si dernière tentative ou erreur non-429, on lance l'erreur
                    if (attempt === maxRetries || error.message.includes('HTTP')) {
                        console.error(`[OnisepAPI] ❌ Échec après ${attempt} tentative(s):`, error.message);
                        throw error;
                    }
                    
                    // Sinon on continue avec un délai exponentiel
                    console.warn(`[OnisepAPI] Erreur tentative ${attempt}, retry...`, error.message);
                    delay *= 2; // Backoff exponentiel
                }
            }
            
            // Ajouter les résultats de la page
            if (pageResults) {
                allResults.push(...pageResults);
            }
            
            // Passer à la page suivante
            offset += pageSize;
            
            // Sécurité : arrêter si pas de nouveaux résultats
            if (!pageResults || pageResults.length === 0) {
                break;
            }
        }
        
        console.log(`[OnisepAPI] ✅ Total récupéré: ${allResults.length} résultat(s)`);
        
        return allResults;
    }
    
    // =====================================
    // UTILITAIRES PRIVÉS
    // =====================================
    
    /**
     * Construit les headers HTTP pour les requêtes
     * @private
     * @returns {Object} Headers
     */
    _getHeaders() {
        const headers = {
            'Accept': 'application/json',
            'Application-ID': this._appId  // TOUJOURS inclure l'Application-ID
        };
        
        // Ajouter l'Application-ID si disponible
        if (this._appId) {
            headers['Application-ID'] = this._appId;
        }
        
        // Ajouter le token si connecté
        if (this._token) {
            headers['Authorization'] = `Bearer ${this._token}`;
        }
        
        return headers;
    }
    
    /**
     * Attend un délai (utilitaire)
     * @private
     * @param {number} ms - Délai en millisecondes
     * @returns {Promise<void>}
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // =====================================
    // MÉTHODES UTILITAIRES PUBLIQUES
    // =====================================
    
    /**
     * Vérifie si l'utilisateur est authentifié
     * @returns {boolean} True si authentifié
     */
    isAuthenticated() {
        return !!this._token;
    }
    
    /**
     * Récupère le token actuel
     * @returns {string|null} Token ou null
     */
    getToken() {
        return this._token;
    }
    
    /**
     * Déduplique les résultats par code_uai, id ou autre identifiant unique
     * @private
     */
    #deduplicateResults(results, datasetName = '') {
        if (!results || results.length === 0) return results;
        
        // NE PAS dédupliquer les actions/dispositifs/enseignements
        // car ens_code_uai n'est pas un identifiant unique d'action !
        const noDeduplicationDatasets = [
            'actions_lycee',
            'actions_sup',
            'dispositifs',
            'enseignements_optionnels_2nde',
            'enseignements_specialite_1ere'
        ];
        
        if (noDeduplicationDatasets.includes(datasetName)) {
            console.log(`[OnisepAPI] Pas de déduplication pour ${datasetName} (actions multiples par établissement)`);
            return results;
        }
        
        // Essayer de trouver un champ unique (pour structures principalement)
        const uniqueField = results[0].code_uai ? 'code_uai' :
                           results[0].id ? 'id' :
                           null;
        
        if (!uniqueField) {
            // Pas de champ unique identifié, retourner tel quel
            console.warn('[OnisepAPI] Aucun champ unique trouvé pour déduplication');
            return results;
        }
        
        // Déduplication avec Map
        const uniqueMap = new Map();
        for (const result of results) {
            const key = result[uniqueField];
            if (key && !uniqueMap.has(key)) {
                uniqueMap.set(key, result);
            }
        }
        
        return Array.from(uniqueMap.values());
    }
}

// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    window.OnisepAPI = OnisepAPI;
}
