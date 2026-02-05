/**
 * Client API Onisep avec gestion des erreurs 429 (rate limiting)
 * Version 0.17 - Orientation Post-Collège
 */

class OnisepAPI {
    constructor() {
        this.baseUrl = 'https://api.opendata.onisep.fr/api/1.0';
        this.token = null;
        this.maxRetries = 3;
        this.baseDelay = 2000; // 2 secondes
        this.requestQueue = [];
        this.isProcessing = false;
        this.minDelayBetweenRequests = 500; // 500ms entre chaque requête
        this.lastRequestTime = 0;
    }

    /**
     * Générer un token d'authentification
     */
    async generateToken(email) {
        const url = `${this.baseUrl}/login`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        if (!response.ok) {
            throw new Error(`Erreur authentification: ${response.status}`);
        }
        
        const data = await response.json();
        this.token = data.token;
        console.log('✓ Token généré avec succès');
        return this.token;
    }

    /**
     * Attendre avant la prochaine requête (rate limiting)
     */
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minDelayBetweenRequests) {
            const waitTime = this.minDelayBetweenRequests - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }

    /**
     * Faire une requête avec retry en cas d'erreur 429
     */
    async fetchWithRetry(url, options = {}, retryCount = 0) {
        // Attendre le rate limit
        await this.waitForRateLimit();
        
        console.log(`🌐 API Request URL: ${url}`);
        
        try {
            const response = await fetch(url, options);
            console.log(`📡 API Response Status: ${response.status} ${response.statusText}`);
            
            // Erreur 429 - Too Many Requests
            if (response.status === 429) {
                if (retryCount < this.maxRetries) {
                    // Backoff exponentiel: 2s, 4s, 8s
                    const delay = this.baseDelay * Math.pow(2, retryCount);
                    console.warn(`⚠️ Erreur 429 (tentative ${retryCount + 1}/${this.maxRetries}), attente de ${delay}ms...`);
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return this.fetchWithRetry(url, options, retryCount + 1);
                } else {
                    throw new Error('Trop de requêtes (429) - limite API atteinte. Réessayez dans quelques minutes.');
                }
            }
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📦 API Response Data:', { total: data.total, first_result: data.first_result });
            
            return data;
            
        } catch (error) {
            // Erreur réseau - retry si pas encore au max
            if (retryCount < this.maxRetries && error.name === 'TypeError') {
                const delay = this.baseDelay * Math.pow(2, retryCount);
                console.warn(`⚠️ Erreur réseau (tentative ${retryCount + 1}/${this.maxRetries}), attente de ${delay}ms...`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithRetry(url, options, retryCount + 1);
            }
            
            throw error;
        }
    }

    /**
     * Rechercher des établissements par commune
     */
    async searchByCommune(communeName, filterMode = 'exact') {
        if (!this.token) {
            throw new Error('Token non généré. Appelez generateToken() d\'abord.');
        }

        const url = `${this.baseUrl}/dataset/5fa5816ac6a6e/search?size=200&q=${encodeURIComponent(communeName)}`;
        
        const data = await this.fetchWithRetry(url, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });

        let results = data.results || [];
        
        // Filtrer par commune si mode exact
        if (filterMode === 'exact' && results.length > 0) {
            const normalizedSearch = communeName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            results = results.filter(etab => {
                const commune = (etab.commune || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                return commune === normalizedSearch;
            });
            console.log(`🔍 Après filtre commune "${communeName}" (mode: ${filterMode}): ${results.length} résultats`);
        }

        return { total: results.length, results };
    }

    /**
     * Rechercher par UAI
     */
    async searchByUAI(uai) {
        if (!this.token) {
            throw new Error('Token non généré');
        }

        const url = `${this.baseUrl}/dataset/5fa5816ac6a6e/search?size=10&q=${uai}`;
        return await this.fetchWithRetry(url, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        });
    }

    /**
     * Extraire établissements par critères géographiques avec gestion de file d'attente
     */
    async extractByGeoCriteria(type, value, progressCallback) {
        if (!this.token) {
            throw new Error('Token non généré');
        }

        let communes = [];
        
        if (type === 'commune') {
            communes = [{ nom: value }];
        } else if (type === 'intercommunalite') {
            // Récupérer les communes de l'EPCI
            communes = await this.getCommunesByEPCI(value);
        } else if (type === 'departement') {
            communes = await this.getCommunesByDepartement(value);
        }

        const totalCommunes = communes.length;
        let processed = 0;
        let allEtablissements = [];
        let errors = [];

        // Traiter les communes par batch pour éviter trop de requêtes simultanées
        const batchSize = 5;
        
        for (let i = 0; i < communes.length; i += batchSize) {
            const batch = communes.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (commune) => {
                try {
                    const data = await this.searchByCommune(commune.nom, 'exact');
                    processed++;
                    
                    if (progressCallback) {
                        progressCallback({
                            current: processed,
                            total: totalCommunes,
                            commune: commune.nom,
                            count: data.results.length
                        });
                    }
                    
                    return data.results;
                } catch (error) {
                    errors.push({ commune: commune.nom, error: error.message });
                    console.error(`❌ Erreur ${commune.nom}:`, error.message);
                    return [];
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            allEtablissements.push(...batchResults.flat());
        }

        return {
            etablissements: allEtablissements,
            errors,
            stats: {
                total: allEtablissements.length,
                communes: totalCommunes,
                errors: errors.length
            }
        };
    }

    /**
     * Récupérer les communes d'un EPCI
     */
    async getCommunesByEPCI(siren) {
        console.log('🔍 Récupération communes pour EPCI:', siren);
        
        const url = `https://geo.api.gouv.fr/epcis/${siren}/communes`;
        console.log('📡 Requête API geo.gouv.fr pour SIREN:', siren);
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Erreur API geo.gouv.fr: ${response.status}`);
            }
            
            const communes = await response.json();
            console.log(`✅ ${communes.length} communes récupérées pour ${siren}`);
            
            return communes.map(c => ({
                nom: c.nom,
                code: c.code,
                population: c.population
            }));
        } catch (error) {
            console.error('❌ Erreur getCommunesByEPCI:', error);
            throw error;
        }
    }

    /**
     * Récupérer les communes d'un département
     */
    async getCommunesByDepartement(codeDept) {
        const url = `https://geo.api.gouv.fr/departements/${codeDept}/communes`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Erreur ${response.status}`);
            
            const communes = await response.json();
            return communes.map(c => ({
                nom: c.nom,
                code: c.code,
                population: c.population
            }));
        } catch (error) {
            console.error('❌ Erreur getCommunesByDepartement:', error);
            throw error;
        }
    }

    /**
     * Annuler les requêtes en cours
     */
    cancelAllRequests() {
        this.requestQueue = [];
        console.log('🛑 Requêtes annulées');
    }
}

// Export pour utilisation dans d'autres modules
window.OnisepAPI = OnisepAPI;
