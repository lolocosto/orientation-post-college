// Copyright (c) 2026 Laurent COSTE — Licensed under EUPL v1.2 — See LICENSE
/************************************************
 * Fichier : geo_api.js
 * Description : Classe pour interagir avec l'API Géo (geo.api.gouv.fr)
 * Auteur : Laurent COSTE
 * Date : 2026-02-03
 ************************************************/

/**
 * Classe pour gérer les requêtes vers l'API Géo
 * Documentation API : https://geo.api.gouv.fr/decoupage-administratif
 */
class GeoAPI {
    // =====================================
    // CONFIGURATION
    // =====================================
    
    #baseURL = 'https://geo.api.gouv.fr';
    #http;
    
    // =====================================
    // CONSTRUCTEUR
    // =====================================
    
    constructor() {
        this.#http = new HttpClient({ label: 'GeoAPI', maxRetries: 3 });
        console.log('[GeoAPI] Instance créée');
    }
    
    get _requestCount() { return this.#http.requestCount; }
    
    // =====================================
    // GETTERS
    // =====================================
    
    /**
     * Vérifie si l'API est accessible (pas d'authentification pour API Géo)
     * @returns {boolean} Toujours true (API publique)
     */
    isConnected() {
        return true; // API publique, pas d'authentification
    }
    
    // =====================================
    // MÉTHODES PUBLIQUES : COMMUNES
    // =====================================
    
    /**
     * Recherche des communes par nom
     * @param {string} nom - Nom de la commune (peut être partiel)
     * @param {Object} options - Options de recherche
     * @param {number} options.limit - Nombre max de résultats (défaut: 10)
     * @param {string} options.codeDepartement - Filtrer par département
     * @param {string} options.codeRegion - Filtrer par région
     * @returns {Promise<Array>} Liste de communes
     */
    async searchCommunes(nom, options = {}) {
        const { limit = 10, codeDepartement = null, codeRegion = null } = options;
        
        const params = new URLSearchParams({
            nom: nom,
            limit: limit
        });
        
        if (codeDepartement) {
            params.append('codeDepartement', codeDepartement);
        }
        
        if (codeRegion) {
            params.append('codeRegion', codeRegion);
        }
        
        const url = `${this.#baseURL}/communes?${params.toString()}`;
        
        console.log(`[GeoAPI] Recherche communes: ${nom}`);
        
        try {
            const response = await this._request(url);
            console.log(`[GeoAPI] ${response.length} commune(s) trouvée(s) : `, response);
            return response;
        } catch (error) {
            console.error('[GeoAPI] Erreur recherche communes:', error);
            throw error;
        }
    }
    
    /**
     * Récupère une commune par son code INSEE
     * @param {string} codeCommune - Code INSEE de la commune (5 caractères)
     * @returns {Promise<Object>} Commune
     */
    async getCommuneByCode(codeCommune) {
        const url = `${this.#baseURL}/communes/${codeCommune}`;
        
        console.log(`[GeoAPI] Récupération commune: ${codeCommune}`);
        
        try {
            const response = await this._request(url);
            return response;
        } catch (error) {
            console.error('[GeoAPI] Erreur récupération commune:', error);
            throw error;
        }
    }
    
    /**
     * Récupère les communes d'un département
     * @param {string} codeDepartement - Code du département (2 ou 3 caractères)
     * @returns {Promise<Array>} Liste de communes
     */
    async getCommunesByDepartement(codeDepartement) {
        const url = `${this.#baseURL}/departements/${codeDepartement}/communes`;
        
        console.log(`[GeoAPI] Récupération communes département: ${codeDepartement}`);
        
        try {
            const response = await this._request(url);
            console.log(`[GeoAPI] ${response.length} commune(s) trouvée(s)`);
            return response;
        } catch (error) {
            console.error('[GeoAPI] Erreur communes département:', error);
            throw error;
        }
    }
    
    /**
     * Récupère les communes d'une région
     * @param {string} codeRegion - Code de la région (2 caractères)
     * @returns {Promise<Array>} Liste de communes
     */
    async getCommunesByRegion(codeRegion) {
        const url = `${this.#baseURL}/regions/${codeRegion}/communes`;
        
        console.log(`[GeoAPI] Récupération communes région: ${codeRegion}`);
        
        try {
            const response = await this._request(url);
            console.log(`[GeoAPI] ${response.length} commune(s) trouvée(s)`);
            return response;
        } catch (error) {
            console.error('[GeoAPI] Erreur communes région:', error);
            throw error;
        }
    }
    
    /**
     * Récupère les communes d'un EPCI
     * @param {string} codeEpci - Code SIREN de l'EPCI (9 caractères)
     * @returns {Promise<Array>} Liste de communes
     */
    async getCommunesByEPCI(codeEpci) {
        const url = `${this.#baseURL}/epcis/${codeEpci}/communes`;
        
        console.log(`[GeoAPI] Récupération communes EPCI: ${codeEpci}`);
        
        try {
            const response = await this._request(url);
            console.log(`[GeoAPI] ${response.length} commune(s) trouvée(s) : `, response);
            return response;
        } catch (error) {
            console.error('[GeoAPI] Erreur communes EPCI:', error);
            throw error;
        }
    }
    
    // =====================================
    // MÉTHODES PUBLIQUES : DÉPARTEMENTS
    // =====================================
    
    /**
     * Recherche des départements par nom
     * @param {string} nom - Nom du département
     * @returns {Promise<Array>} Liste de départements
     */
    async searchDepartements(nom) {
        const params = new URLSearchParams({ nom });
        const url = `${this.#baseURL}/departements?${params.toString()}`;
        
        console.log(`[GeoAPI] Recherche départements: ${nom}`);
        
        try {
            const response = await this._request(url);
            console.log(`[GeoAPI] ${response.length} département(s) trouvé(s)`);
            return response;
        } catch (error) {
            console.error('[GeoAPI] Erreur recherche départements:', error);
            throw error;
        }
    }
    
    /**
     * Récupère un département par son code
     * @param {string} codeDepartement - Code du département (2 ou 3 caractères)
     * @returns {Promise<Object>} Département
     */
    async getDepartementByCode(codeDepartement) {
        const url = `${this.#baseURL}/departements/${codeDepartement}`;
        
        console.log(`[GeoAPI] Récupération département: ${codeDepartement}`);
        
        try {
            const response = await this._request(url);
            return response;
        } catch (error) {
            console.error('[GeoAPI] Erreur récupération département:', error);
            throw error;
        }
    }
    
    /**
     * Récupère tous les départements
     * @returns {Promise<Array>} Liste de tous les départements
     */
    async getAllDepartements() {
        const url = `${this.#baseURL}/departements`;
        
        console.log(`[GeoAPI] Récupération tous départements`);
        
        try {
            const response = await this._request(url);
            console.log(`[GeoAPI] ${response.length} département(s) trouvé(s)`);
            return response;
        } catch (error) {
            console.error('[GeoAPI] Erreur récupération départements:', error);
            throw error;
        }
    }
    
    // =====================================
    // MÉTHODES PUBLIQUES : RÉGIONS
    // =====================================
    
    /**
     * Recherche des régions par nom
     * @param {string} nom - Nom de la région
     * @returns {Promise<Array>} Liste de régions
     */
    async searchRegions(nom) {
        const params = new URLSearchParams({ nom });
        const url = `${this.#baseURL}/regions?${params.toString()}`;
        
        console.log(`[GeoAPI] Recherche régions: ${nom}`);
        
        try {
            const response = await this._request(url);
            console.log(`[GeoAPI] ${response.length} région(s) trouvée(s)`);
            return response;
        } catch (error) {
            console.error('[GeoAPI] Erreur recherche régions:', error);
            throw error;
        }
    }
    
    /**
     * Récupère une région par son code
     * @param {string} codeRegion - Code de la région (2 caractères)
     * @returns {Promise<Object>} Région
     */
    async getRegionByCode(codeRegion) {
        const url = `${this.#baseURL}/regions/${codeRegion}`;
        
        console.log(`[GeoAPI] Récupération région: ${codeRegion}`);
        
        try {
            const response = await this._request(url);
            return response;
        } catch (error) {
            console.error('[GeoAPI] Erreur récupération région:', error);
            throw error;
        }
    }
    
    /**
     * Récupère toutes les régions
     * @returns {Promise<Array>} Liste de toutes les régions
     */
    async getAllRegions() {
        const url = `${this.#baseURL}/regions`;
        
        console.log(`[GeoAPI] Récupération toutes régions`);
        
        try {
            const response = await this._request(url);
            console.log(`[GeoAPI] ${response.length} région(s) trouvée(s)`);
            return response;
        } catch (error) {
            console.error('[GeoAPI] Erreur récupération régions:', error);
            throw error;
        }
    }
    
    /**
     * Récupère les départements d'une région
     * @param {string} codeRegion - Code de la région (2 caractères)
     * @returns {Promise<Array>} Liste de départements
     */
    async getDepartementsByRegion(codeRegion) {
        const url = `${this.#baseURL}/regions/${codeRegion}/departements`;
        
        console.log(`[GeoAPI] Récupération départements région: ${codeRegion}`);
        
        try {
            const response = await this._request(url);
            console.log(`[GeoAPI] ${response.length} département(s) trouvé(s)`);
            return response;
        } catch (error) {
            console.error('[GeoAPI] Erreur départements région:', error);
            throw error;
        }
    }
    
    // =====================================
    // MÉTHODES PUBLIQUES : EPCI
    // =====================================
    
    /**
     * Recherche des EPCI par nom
     * @param {string} nom - Nom de l'EPCI
     * @returns {Promise<Array>} Liste d'EPCI
     */
    async searchEPCI(nom) {
        const params = new URLSearchParams({ nom });
        const url = `${this.#baseURL}/epcis?${params.toString()}`;
        
        console.log(`[GeoAPI] Recherche EPCI: ${nom}`);
        
        try {
            const response = await this._request(url);
            console.log(`[GeoAPI] ${response.length} EPCI trouvé(s)`);
            return response;
        } catch (error) {
            console.error('[GeoAPI] Erreur recherche EPCI:', error);
            throw error;
        }
    }
    
    /**
     * Récupère un EPCI par son code SIREN
     * @param {string} codeEpci - Code SIREN de l'EPCI (9 caractères)
     * @returns {Promise<Object>} EPCI
     */
    async getEPCIByCode(codeEpci) {
        const url = `${this.#baseURL}/epcis/${codeEpci}`;
        
        console.log(`[GeoAPI] Récupération EPCI: ${codeEpci}`);
        
        try {
            const response = await this._request(url);
            return response;
        } catch (error) {
            console.error('[GeoAPI] Erreur récupération EPCI:', error);
            throw error;
        }
    }
    
    /**
     * Récupère tous les EPCI disponibles
     * @returns {Promise<Array>} Liste des EPCI 
     */
    async searchEPCIs() {
        const url = `${this.#baseURL}/epcis`;
        
        console.log(`[GeoAPI] Récupération de tous les EPCI`);
        
        try {
            const response = await this._request(url);
            return response;
        } catch (error) {
            console.error('[GeoAPI] Erreur récupération EPCI:', error);
            throw error;
        }
    }
    
    // =====================================
    // MÉTHODES PRIVÉES : REQUÊTES
    // =====================================
    
    /**
     * Effectue une requête HTTP vers l'API Géo avec retry automatique
     * @private
     * @param {string} url - URL complète
     * @param {number} maxRetries - Nombre max de tentatives (défaut: 3)
     * @param {number} initialDelay - Délai initial en ms (défaut: 1000)
     * @returns {Promise<any>} Réponse JSON
     */
    async _request(url) {
        return this.#http.getJSON(url);
    }

    _sleep(ms) { return this.#http.sleep(ms); }
}

// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    window.GeoAPI = GeoAPI;
}
