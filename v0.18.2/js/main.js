
/**
 * Client API Onisep pour extraction des données établissements
 * Utilisation : const api = new OnisepAPI(); await api.extractByGeoCriteria(type, value, callback);
 */

// ═════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES GLOBALES
// ═════════════════════════════════════════════════════════════

/**
 * Retourne la liste des communes d'une intercommunalité
 * Utilise l'API geo.api.gouv.fr pour récupération dynamique
 */
window.getCommunesIntercommunalite = async function(code) {
    console.log(`🔍 Récupération communes pour EPCI: ${code}`);
    
    // Cache en mémoire pour éviter les requêtes répétées
    if (!window.intercommunalitesCache) {
        window.intercommunalitesCache = {};
    }
    
    if (window.intercommunalitesCache[code]) {
        console.log(`✅ Cache hit: ${window.intercommunalitesCache[code].length} communes`);
        return window.intercommunalitesCache[code];
    }
    
    try {
        // Appeler l'API geo.api.gouv.fr
        console.log(`📡 Requête API geo.gouv.fr pour SIREN: ${code}`);
        const url = `https://geo.api.gouv.fr/epcis/${code}/communes?fields=nom`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new Error('Réponse API invalide');
        }
        
        const communes = data.map(c => c.nom);
        
        // Mettre en cache
        window.intercommunalitesCache[code] = communes;
        
        console.log(`✅ ${communes.length} communes récupérées pour ${code}`);
        return communes;
        
    } catch (error) {
        console.error(`❌ Erreur récupération communes pour ${code}:`, error);
        return [];
    }
};

/**
 * Retourne le nom d'un département à partir de son code
 */
window.getNomDepartement = function(code) {
    const departements = {
        '01': 'Ain', '02': 'Aisne', '03': 'Allier', '04': 'Alpes-de-Haute-Provence',
        '05': 'Hautes-Alpes', '06': 'Alpes-Maritimes', '07': 'Ardèche', '08': 'Ardennes',
        '09': 'Ariège', '10': 'Aube', '11': 'Aude', '12': 'Aveyron', '13': 'Bouches-du-Rhône',
        '14': 'Calvados', '15': 'Cantal', '16': 'Charente', '17': 'Charente-Maritime',
        '18': 'Cher', '19': 'Corrèze', '2A': 'Corse-du-Sud', '2B': 'Haute-Corse',
        '21': 'Côte-d\'Or', '22': 'Côtes-d\'Armor', '23': 'Creuse', '24': 'Dordogne',
        '25': 'Doubs', '26': 'Drôme', '27': 'Eure', '28': 'Eure-et-Loir',
        '29': 'Finistère', '30': 'Gard', '31': 'Haute-Garonne', '32': 'Gers',
        '33': 'Gironde', '34': 'Hérault', '35': 'Ille-et-Vilaine', '36': 'Indre',
        '37': 'Indre-et-Loire', '38': 'Isère', '39': 'Jura', '40': 'Landes',
        '41': 'Loir-et-Cher', '42': 'Loire', '43': 'Haute-Loire', '44': 'Loire-Atlantique',
        '45': 'Loiret', '46': 'Lot', '47': 'Lot-et-Garonne', '48': 'Lozère',
        '49': 'Maine-et-Loire', '50': 'Manche', '51': 'Marne', '52': 'Haute-Marne',
        '53': 'Mayenne', '54': 'Meurthe-et-Moselle', '55': 'Meuse', '56': 'Morbihan',
        '57': 'Moselle', '58': 'Nièvre', '59': 'Nord', '60': 'Oise',
        '61': 'Orne', '62': 'Pas-de-Calais', '63': 'Puy-de-Dôme', '64': 'Pyrénées-Atlantiques',
        '65': 'Hautes-Pyrénées', '66': 'Pyrénées-Orientales', '67': 'Bas-Rhin', '68': 'Haut-Rhin',
        '69': 'Rhône', '70': 'Haute-Saône', '71': 'Saône-et-Loire', '72': 'Sarthe',
        '73': 'Savoie', '74': 'Haute-Savoie', '75': 'Paris', '76': 'Seine-Maritime',
        '77': 'Seine-et-Marne', '78': 'Yvelines', '79': 'Deux-Sèvres', '80': 'Somme',
        '81': 'Tarn', '82': 'Tarn-et-Garonne', '83': 'Var', '84': 'Vaucluse',
        '85': 'Vendée', '86': 'Vienne', '87': 'Haute-Vienne', '88': 'Vosges',
        '89': 'Yonne', '90': 'Territoire de Belfort', '91': 'Essonne', '92': 'Hauts-de-Seine',
        '93': 'Seine-Saint-Denis', '94': 'Val-de-Marne', '95': 'Val-d\'Oise',
        '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane', '974': 'La Réunion',
        '976': 'Mayotte'
    };
    
    return departements[code] || code;
};

/**
 * Retourne le nom d'une académie à partir de son code
 */
window.getNomAcademie = function(code) {
    const academies = {
        '01': 'Paris',
        '02': 'Aix-Marseille',
        '03': 'Besançon',
        '04': 'Bordeaux',
        '05': 'Normandie',           // ✅ Caen → Normandie
        '06': 'Clermont-Ferrand',
        '07': 'Dijon',
        '08': 'Grenoble',
        '09': 'Lille',
        '10': 'Lyon',
        '11': 'Montpellier',
        '12': 'Nancy-Metz',
        '13': 'Poitiers',
        '14': 'Rennes',
        '15': 'Strasbourg',
        '16': 'Toulouse',
        '17': 'Nantes',
        '18': 'Orléans-Tours',
        '19': 'Reims',
        '20': 'Amiens',
        '21': 'Normandie',           // ✅ Rouen → Normandie (même académie que Caen)
        '22': 'Limoges',
        '23': 'Nice',
        '24': 'Créteil',
        '25': 'Versailles',
        '26': 'Corse',
        '27': 'Martinique',          // Pas dans liste API (probablement dans "Collectivités d'Outre Mer")
        '28': 'Guadeloupe',
        '29': 'Guyane',              // Pas dans liste API (probablement dans "Collectivités d'Outre Mer")
        '30': 'La Réunion',
        '31': 'Mayotte',
        '32': 'Normandie',           // ✅ Ajout explicite
        '33': 'Nouvelle-Aquitaine'   // Pas dans liste API
    };
    
    return academies[code] || code;
};

class OnisepAPI {
    constructor(token = null, appId = null) {
        this.baseURL = 'https://api.opendata.onisep.fr/api/1.0';
        this.datasets = {
            structures: '5fa5816ac6a6e',      // Structures d'enseignement secondaire
            formations: '5fa591127f501',      // Formations initiales en France
            actions_lycee: '605340ddc19a9',   // Actions de formation - Univers établissement (2nde, 1re, Term)
            actions_sup: '605344579a7d7',     // Actions de formation - Univers enseignement supérieur (Bac+1 et +)
            dispositifs: '60867458bb600'      // Idéo-Actions de dispositif
        };
        this.token = token;
        this.appId = appId || '69711beb357466e3a88b4572'; // Application-ID par défaut
        this.requestCount = 0;
        this.lastRequestTime = 0;
        // Charger le délai depuis localStorage ou utiliser 800ms par défaut
        const savedDelay = localStorage.getItem('api_request_delay');
        this.minRequestInterval = savedDelay ? parseInt(savedDelay) : 1200;
        console.log(`⏱️ Délai entre requêtes API: ${this.minRequestInterval}ms`);

    /**
     * Effectue une requête avec retry automatique en cas d'erreur 429
     * @param {Function} fetchFunc - Fonction qui effectue le fetch
     * @param {string} context - Contexte pour les logs (ex: "établissement 0123456A")
     * @param {number} maxRetries - Nombre max de tentatives (défaut: 3)
     * @returns {Promise} - Résultat de la requête
     */
    async _fetchWithRetry(fetchFunc, context, maxRetries = 3) {
        let lastError = null;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Rate limiting: attendre avant chaque requête
                await this._waitForRateLimit();
                
                const response = await fetchFunc();
                
                // Si erreur 429, attendre et réessayer
                if (response.status === 429) {
                    const waitTime = Math.min(1000 * Math.pow(2, attempt), 8000); // 1s, 2s, 4s, max 8s
                    console.warn(`⏳ HTTP 429 pour ${context} - Attente ${waitTime/1000}s (tentative ${attempt + 1}/${maxRetries})`);
                    
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue; // Réessayer
                }
                
                // Autres erreurs ou succès
                return response;
                
            } catch (error) {
                lastError = error;
                
                // Si c'est une erreur réseau, attendre avant de réessayer
                if (attempt < maxRetries - 1) {
                    const waitTime = 1000 * (attempt + 1);
                    console.warn(`⏳ Erreur ${context} - Attente ${waitTime/1000}s (tentative ${attempt + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                } else {
                    throw error;
                }
            }
        }
        
        // Si on arrive ici, toutes les tentatives ont échoué
        throw lastError || new Error(`Échec après ${maxRetries} tentatives`);
    }
    }
 
    /**
     * Attend le délai minimum entre deux requêtes (rate limiting)
     */
    async _waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLastRequest;
            console.log(`⏳ Rate limiting: attente ${waitTime}ms`);
            await this._sleep(waitTime);
        }
        
        this.lastRequestTime = Date.now();
    }
   
    /**
     * Génère un token d'authentification
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
            });
            
            if (!response.ok) {
                throw new Error(`Erreur d'authentification: ${response.status}`);
            }
            
            const data = await response.json();
            this.token = data.token;
            
            console.log('✔ Token généré avec succès');
            return data.token;
        } catch (error) {
            console.error('Erreur login:', error);
            throw new Error(`Impossible de se connecter: ${error.message}`);
        }
    }
    
    /**
     * Récupère les headers d'authentification
     */
    _getHeaders() {
        const headers = {
            'Accept': 'application/json',
            'Application-ID': this.appId  // TOUJOURS inclure l'Application-ID
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }
    
    /**
     * Recherche des établissements (établissements)
     */
    async searchStructures(params = {}) {
        const url = new URL(`${this.baseURL}/dataset/${this.datasets.structures}/search`);
        
        url.searchParams.append('size', params.size || 100);
        
        // Ajouter facette département si spécifiée
        if (params.facet_departement) {
            url.searchParams.append('facet.departement', params.facet_departement);
        }
        
        // Ajouter facette académie si spécifiée
        if (params.facet_academie) {
            url.searchParams.append('facet.academie', params.facet_academie);
        }
        
        // Utiliser recherche textuelle au lieu de facettes
        if (params.commune) {
            url.searchParams.append('q', params.commune);
        } else if (params.region) {
            url.searchParams.append('q', params.region);
        } else if (params.query) {
            url.searchParams.append('q', params.query);
        }
        
        console.log(`🌐 API Request URL: ${url.toString()}`);
        
        try {
            this.requestCount++;
            const response = await this._fetchWithRetry(
                () => fetch(url, { headers: this._getHeaders() }),
                'API request',
                3
            );
            
            console.log(`📡 API Response Status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ API Error Response:`, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            console.log(`📦 API Response Data:`, {
                total: data.results?.length || 0,
                first_result: data.results?.[0]
            });
            
            // Filtrer côté client si commune spécifiée
            let results = data.results || [];
            if (params.commune && results.length > 0) {
                const mode = params.communeMode || 'exact'; // Par défaut : exact
                const communeRecherchee = params.commune.toLowerCase();
                
                results = results.filter(r => {
                    const commune = (r.commune || '').toLowerCase();
                    
                    if (mode === 'exact') {
                        // Correspondance exacte
                        return commune === communeRecherchee;
                    } else {
                        // Contient
                        return commune.includes(communeRecherchee);
                    }
                });
                
                console.log(`🔍 Après filtre commune "${params.commune}" (mode: ${mode}): ${results.length} résultats`);
            }
            
            // Filtrer les établissements du supérieur SAUF CFA/UFA (v0.12)
            console.log(`🔍 AVANT filtre CFA: ${results.length} établissements`);
            
            const resultsAvantFiltre = results.length;
            results = results.filter(r => {
                const type = (r.type || '').toLowerCase();
                const nom = (r.nom || '').toLowerCase();
                
                // Mots-clés du supérieur STRICT (à exclure)
                const motsSuperieur = [
                    'université', 'universite', 'faculté', 'faculte',
                    'iut ', 'i.u.t', 'institut universitaire',
                    'ufr ', 'u.f.r'
                ];
                
                // Mots-clés CFA/Apprentissage (à INCLURE même si supérieur)
                const motsCFA = [
                    'cfa', 'c.f.a', 'centre de formation',
                    'ufa', 'u.f.a', 'apprentissage',
                    'alternance', 'cfai', 'cfaa', 'mfr', 'maison familiale'
                ];
                
                const isSuperieur = motsSuperieur.some(mot => type.includes(mot) || nom.includes(mot));
                const isCFA = motsCFA.some(mot => type.includes(mot) || nom.includes(mot));
                
                // Log des établissements CFA/MFR détectés
                if (isCFA) {
                    console.log(`✅ CFA/MFR détecté: ${nom} (type: ${type})`);
                }
                
                // Log des établissements exclus
                if (isSuperieur && !isCFA) {
                    console.log(`❌ Exclu (supérieur): ${nom} (type: ${type})`);
                }
                
                // Garder si c'est un CFA OU si ce n'est pas du supérieur
                return isCFA || !isSuperieur;
            });
            
            console.log(`🎓 Après filtre: ${results.length} résultats (${resultsAvantFiltre - results.length} exclus)`);
            console.log(`📋 Échantillon des établissements conservés:`, results.slice(0, 3).map(r => ({nom: r.nom, type: r.type})));
            
            return results;
        } catch (error) {
            console.error('❌ Erreur searchStructures:', error);
            throw error;
        }
    }
    
    /**
     * Récupère les actions de formation d'un établissement (établissement + sup)
     */
    async getActionsFormation(uai) {
        const actionsLycee = await this.getActionsLycee(uai);
        const actionsSup = await this.getActionsSup(uai);
        
        return [...actionsLycee, ...actionsSup];
    }
    
    /**
     * Récupère les actions de formation établissement (2nde, 1re, Term)
     */
    async getActionsLycee(uai) {
        const url = new URL(`${this.baseURL}/dataset/${this.datasets.actions_lycee}/search`);
        // Recherche textuelle avec q= (plus fiable que les facets)
        url.searchParams.append('q', uai);
        url.searchParams.append('size', 100);
        
        try {
            this.requestCount++;
            const response = await this._fetchWithRetry(
                () => fetch(url, { headers: this._getHeaders() }),
                `établissement ${uai}`,
                3
            );
            
            if (!response.ok) {
                console.warn(`Erreur HTTP ${response.status} pour établissement ${uai}`);
                return [];
            }
            
            const data = await response.json();
            
            // Filtrage strict : seul le champ ens_code_uai doit correspondre exactement
            const filtered = (data.results || []).filter(action => 
                action.ens_code_uai === uai
            );
            
            console.log(`Actions établissement ${uai}: ${filtered.length} trouvées`);
            
            return filtered;
        } catch (error) {
            console.error(`Erreur getActionsLycee pour ${uai}:`, error);
            return [];
        }
    }
    
    /**
     * Récupère les actions de formation supérieur (Bac+1 et +)
     */
    async getActionsSup(uai) {
        const url = new URL(`${this.baseURL}/dataset/${this.datasets.actions_sup}/search`);
        // Recherche textuelle avec q= (plus fiable que les facets)
        url.searchParams.append('q', uai);
        url.searchParams.append('size', 100);
        
        try {
            this.requestCount++;
            const response = await this._fetchWithRetry(
                () => fetch(url, { headers: this._getHeaders() }),
                `sup ${uai}`,
                3
            );
            
            if (!response.ok) {
                console.warn(`Erreur HTTP ${response.status} pour sup ${uai}`);
                return [];
            }
            
            const data = await response.json();
            
            // Filtrage strict : seul le champ ens_code_uai doit correspondre exactement
            const filtered = (data.results || []).filter(action => 
                action.ens_code_uai === uai
            );
            
            console.log(`Actions sup ${uai}: ${filtered.length} trouvées`);
            
            return filtered;
        } catch (error) {
            console.error(`Erreur getActionsSup pour ${uai}:`, error);
            return [];
        }
    }
    
    /**
     * Récupère les dispositifs pour un établissement
     */
    async getDispositifs(uai) {
        const url = new URL(`${this.baseURL}/dataset/${this.datasets.dispositifs}/search`);
        url.searchParams.append('q', uai);
        url.searchParams.append('size', 100);
        
        try {
            this.requestCount++;
            const response = await this._fetchWithRetry(
                () => fetch(url, { headers: this._getHeaders() }),
                `dispositifs ${uai}`,
                3
            );
            
            if (!response.ok) {
                console.warn(`Erreur HTTP ${response.status} pour dispositifs ${uai}`);
                return [];
            }
            
            const data = await response.json();
            
            // Filtrage strict : ens_code_uai doit correspondre exactement
            const filtered = (data.results || []).filter(dispositif => 
                dispositif.ens_code_uai === uai
            );
            
            console.log(`Dispositifs ${uai}: ${filtered.length} trouvés`);
            
            return filtered;
        } catch (error) {
            console.error(`Erreur getDispositifs pour ${uai}:`, error);
            return [];
        }
    }
    
    /**
     * Récupère les diplômes disponibles pour un périmètre géographique
     */
    async getDiplomesDisponibles(facetGeo = {}, niveauBac = true, niveauCap = true) {
        console.log('🔍 getDiplomesDisponibles - Paramètres reçus:', { facetGeo, niveauBac, niveauCap });
        
        const allDiplomes = [];
        
        try {
            // Requête 1 : bac ou équivalent (minuscules selon API Onisep)
            if (niveauBac) {
                console.log('🎓 Requête 1/2 : bac ou équivalent');
                const diplomesBac = await this._getDiplomesByNiveau(facetGeo, 'bac ou équivalent');
                allDiplomes.push(...diplomesBac);
                console.log(`   ✅ ${diplomesBac.length} diplômes Bac trouvés`);
                await this._sleep(200);
            }
            
            // Requête 2 : CAP ou équivalent (MAJUSCULES selon API Onisep)
            if (niveauCap) {
                console.log('🎓 Requête 2/2 : CAP ou équivalent');
                const diplomesCap = await this._getDiplomesByNiveau(facetGeo, 'CAP ou équivalent');
                console.log(`   📊 Résultats bruts CAP:`, diplomesCap);
                if (diplomesCap.length === 0) {
                    console.warn('   ⚠️ AUCUN CAP TROUVÉ ! Vérifier:');
                    console.warn('      - La facette géographique est correcte');
                    console.warn('      - Le libellé "CAP ou équivalent" est le bon');
                    console.warn('      - L\'API Onisep contient bien des CAP pour cette zone');
                }
                allDiplomes.push(...diplomesCap);
                console.log(`   ✅ ${diplomesCap.length} diplômes CAP trouvés`);
            }
            
            console.log(`✅ TOTAL: ${allDiplomes.length} diplômes trouvés (Bac: ${allDiplomes.filter(d => d.niveau?.toLowerCase().includes('bac')).length}, CAP: ${allDiplomes.filter(d => d.niveau?.toLowerCase().includes('cap')).length})`);
            
            return allDiplomes;
        } catch (error) {
            console.error('❌ Erreur getDiplomesDisponibles:', error);
            throw error;
        }
    }
    
    /**
     * Récupère la liste des académies disponibles dans l'API
     */
    async getAcademiesDisponibles() {
        const url = new URL(`${this.baseURL}/dataset/${this.datasets.actions_lycee}/search`);
        url.searchParams.append('size', 100);
        url.searchParams.append('facet.for_niveau_de_sortie', 'bac ou équivalent');
        
        const response = await fetch(url, { headers: this._getHeaders() });
        const data = await response.json();
        
        // Extraire les académies uniques
        const academies = [...new Set(data.results.map(r => r.ens_academie).filter(Boolean))];
        return academies.sort();
    }
    
    /**
     * Récupère les diplômes pour un niveau spécifique
     */
    async _getDiplomesByNiveau(facetGeo, niveau) {
        console.log(`   ═══ _getDiplomesByNiveau: ${niveau} ═══`);
        
        const url = new URL(`${this.baseURL}/dataset/${this.datasets.actions_lycee}/search`);
        
        // Appliquer la facette géographique
        if (facetGeo.facet_departement) {
            console.log(`   📍 Facette département: ${facetGeo.facet_departement}`);
            url.searchParams.append('facet.ens_departement', facetGeo.facet_departement);
        } else if (facetGeo.facet_academie) {
            console.log(`   📍 Facette académie: ${facetGeo.facet_academie}`);
            url.searchParams.append('facet.ens_academie', facetGeo.facet_academie);
        } else {
            console.warn('   ⚠️ Aucune facette géographique fournie');
        }
        
        // Facette niveau (avec la bonne casse)
        console.log(`   🎓 Niveau recherché: "${niveau}"`);
        url.searchParams.append('facet.for_niveau_de_sortie', niveau);
        url.searchParams.append('size', 1000);
        
        const urlString = url.toString();
        console.log(`   🌐 URL complète: ${urlString}`);
        console.log(`   📋 Pour tester: curl "${urlString}"`);
        
        this.requestCount++;
        const response = await this._fetchWithRetry(
            () => fetch(url, { headers: this._getHeaders() }),
            'API',
            3
        );
        
        console.log(`   📡 HTTP Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`   ❌ Error Response:`, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`   📦 Réponse brute:`, {
            nombre_results: data.results?.length || 0,
            premier_result: data.results?.[0] ? {
                for_lib_voe_ins: data.results[0].for_lib_voe_ins,
                formation_for_libelle: data.results[0].formation_for_libelle,
                for_niveau_de_sortie: data.results[0].for_niveau_de_sortie,
                ens_code_uai: data.results[0].ens_code_uai
            } : 'aucun'
        });
        
        // Vérifier les niveaux présents
        if (data.results && data.results.length > 0) {
            const niveauxTrouves = [...new Set(data.results.map(r => r.for_niveau_de_sortie))];
            console.log(`   📊 Niveaux trouvés dans les résultats:`, niveauxTrouves);
            console.log(`   📊 Valeurs EXACTES des niveaux:`, niveauxTrouves.map(n => `"${n}"`));
            
            const niveauAttendu = data.results.filter(r => r.for_niveau_de_sortie === niveau).length;
            console.log(`   ✔ Actions avec niveau "${niveau}": ${niveauAttendu}/${data.results.length}`);
            
            // Si 0 résultats avec le niveau attendu, afficher les valeurs exactes pour comparaison
            if (niveauAttendu === 0 && niveauxTrouves.length > 0) {
                console.error(`   ❌ PROBLÈME: Le niveau recherché "${niveau}" ne correspond à AUCUN résultat !`);
                console.error(`   💡 Valeurs disponibles dans l'API:`, niveauxTrouves);
                console.error(`   💡 Comparaison caractère par caractère du premier niveau trouvé:`);
                const premierNiveau = niveauxTrouves[0];
                console.error(`      Recherché: [${Array.from(niveau).map(c => c.charCodeAt(0)).join(', ')}]`);
                console.error(`      Trouvé   : [${Array.from(premierNiveau).map(c => c.charCodeAt(0)).join(', ')}]`);
            }
        } else {
            console.warn(`   ⚠️ Aucun résultat retourné par l'API - la facette ne matche rien`);
        }
        
        // VÉRIFICATION: Afficher les académies présentes dans les résultats
        if (data.results && data.results.length > 0) {
            const academies = [...new Set(data.results.map(r => r.ens_academie || r.academie).filter(Boolean))];
            console.log(`   🌍 Académies présentes dans les résultats (${academies.length}):`, academies);
            if (facetGeo.facet_academie && academies.length > 1) {
                console.warn(`   ⚠️ PROBLÈME: Facette académie="${facetGeo.facet_academie}" mais ${academies.length} académies différentes dans les résultats !`);
                console.warn(`   ⚠️ L'API ne filtre peut-être pas correctement. Académies trouvées:`, academies);
            }
        }
        
        // Grouper par diplôme (avec normalisation pour éviter les doublons)
        const diplomesMap = new Map();
        
        (data.results || []).forEach(action => {
            const diplome = action.for_lib_voe_ins || action.formation_for_libelle;
            const uai = action.ens_code_uai;
            const niveauAction = action.for_niveau_de_sortie;
            
            if (!diplome) {
                console.warn(`   ⚠️ Action sans diplôme:`, {
                    for_lib_voe_ins: action.for_lib_voe_ins,
                    formation_for_libelle: action.formation_for_libelle,
                    niveau: niveauAction
                });
                return;
            }
            
            // Normaliser le diplôme pour grouper les variantes
            const diplomeNormalise = diplome
                .trim()
                .replace(/\s+/g, ' ')  // Espaces multiples → simple
                .toLowerCase();
            
            if (!diplomesMap.has(diplomeNormalise)) {
                diplomesMap.set(diplomeNormalise, {
                    intitule: diplome.trim(),  // Garder l'original (premier rencontré)
                    niveau: niveau,  // On utilise le niveau demandé, pas celui de l'action
                    etablissements: new Set(),
                    actions: []
                });
            }
            
            const info = diplomesMap.get(diplomeNormalise);
            if (uai) info.etablissements.add(uai);
            info.actions.push(action);
        });
        
        console.log(`   📊 Groupement: ${diplomesMap.size} diplômes uniques`);
        
        // Convertir en tableau
        let diplomes = Array.from(diplomesMap.values()).map(d => ({
            intitule: d.intitule,
            niveau: d.niveau,
            nb_etablissements: d.etablissements.size,
            uais: Array.from(d.etablissements)
        }));
        
        // Filtrer les non-diplômes (classes, options, etc.)
        const motsClesAExclure = [
            'classe de',
            'section européenne',
            'section internationale',
            'option',
            'enseignement',
            'unité localisée',
            'dispositif',
            'module',
            'parcours',
            'préparation'
        ];
        
        diplomes = diplomes.filter(d => {
            const intituleLower = d.intitule.toLowerCase();
            // Exclure si contient un des mots-clés
            const aExclure = motsClesAExclure.some(mot => intituleLower.includes(mot));
            // Garder si c'est un vrai diplôme (contient CAP, Bac, BTS, etc.)
            const estDiplome = /\b(cap|bac|bts|dut|deust|licence|master|diplôme|titre)\b/i.test(intituleLower);
            return !aExclure && estDiplome;
        });
        
        console.log(`   🔍 Après filtrage: ${diplomes.length} diplômes (${diplomesMap.size - diplomes.length} éléments exclus)`);
        
        // Trier alphabétiquement par intitulé
        diplomes.sort((a, b) => a.intitule.localeCompare(b.intitule, 'fr', { sensitivity: 'base' }));
        
        console.log(`   ✅ ${diplomes.length} diplômes retournés (top 3):`, diplomes.slice(0, 3).map(d => ({
            intitule: d.intitule,
            nb_etab: d.nb_etablissements
        })));
        
        return diplomes;
    }
    
    /**
     * Filtre les établissements sans diplômes ni formations
     */
    _filterEtablissementsSansDiplomes(result) {
        const lyceesAvecDiplomes = result.lycees.filter(lycee => {
            const aDiplomes = result.diplomes_par_lycee.some(rel => rel.lycee_uai === lycee.code_uai);
            return aDiplomes;
        });
        
        // Créer un Set des UAI conservés pour filtrage rapide
        const uaisConserves = new Set(lyceesAvecDiplomes.map(l => l.code_uai));
        
        // Filtrer les dispositifs pour ne garder que ceux des établissements conservés
        const dispositifsFiltres = result.dispositifs_par_lycee.filter(rel => 
            uaisConserves.has(rel.lycee_uai)
        );
        
        // Filtrer aussi la liste des dispositifs pour ne garder que ceux qui sont utilisés
        const nomsDispositifsUtilises = new Set(dispositifsFiltres.map(rel => rel.dispositif_nom));
        const dispositifsFiltered = new Map();
        for (const [nom, dispositif] of result.dispositifs) {
            if (nomsDispositifsUtilises.has(nom)) {
                dispositifsFiltered.set(nom, dispositif);
            }
        }
        
        const nbSupprime = result.lycees.length - lyceesAvecDiplomes.length;
        const nbDispositifsSupprime = result.dispositifs_par_lycee.length - dispositifsFiltres.length;
        const nbDispositifsUniquesSupprimes = result.dispositifs.size - dispositifsFiltered.size;
        
        if (nbSupprime > 0) {
            console.log(`🗑️ Filtrage: ${nbSupprime} établissement(s) supprimé(s) (aucun diplôme/formation)`);
            if (nbDispositifsSupprime > 0) {
                console.log(`🗑️ Filtrage: ${nbDispositifsSupprime} relation(s) dispositif supprimée(s)`);
            }
            if (nbDispositifsUniquesSupprimes > 0) {
                console.log(`🗑️ Filtrage: ${nbDispositifsUniquesSupprimes} dispositif(s) unique(s) supprimé(s)`);
            }
        }
        
        return {
            lycees: lyceesAvecDiplomes,
            dispositifs: dispositifsFiltered,
            dispositifs_par_lycee: dispositifsFiltres,
            nbFiltres: nbSupprime
        };
    }
    
    /**
     * Extraction basée sur une liste de diplômes sélectionnés
     */
    async extractByDiplomes(diplomesSelectionnes, facetGeo, progressCallback) {
        progressCallback({
            step: 'init',
            message: 'Initialisation de l\'extraction par diplômes...',
            percent: 0
        });
        
        const result = {
            lycees: [],
            diplomes: new Map(),
            dispositifs: new Map(),
            langues: new Map(),
            diplomes_par_lycee: [],
            dispositifs_par_lycee: [],
            stats: {
                lyceesTotal: 0,
                actionsTotal: 0,
                requestCount: 0
            }
        };
        
        try {
            // Récupérer tous les UAI uniques des diplômes sélectionnés
            const uaisSet = new Set();
            diplomesSelectionnes.forEach(diplome => {
                diplome.uais.forEach(uai => uaisSet.add(uai));
            });
            
            const uaisUniques = Array.from(uaisSet);
            console.log(`🎓 ${diplomesSelectionnes.length} diplôme(s) → ${uaisUniques.length} établissement(s) unique(s)`);
            
            progressCallback({
                step: 'structures',
                message: `Récupération des ${uaisUniques.length} établissements...`,
                percent: 5
            });
            
            // Récupérer les infos des établissements via le dataset structures
            for (let i = 0; i < uaisUniques.length; i++) {
                const uai = uaisUniques[i];
                
                progressCallback({
                    step: 'structures',
                    message: `Récupération établissement ${i+1}/${uaisUniques.length}...`,
                    percent: 5 + (i / uaisUniques.length) * 10
                });
                
                try {
                    const structures = await this.searchStructures({ query: uai, size: 10 });
                    const structure = structures.find(s => s.code_uai === uai);
                    
                    if (structure) {
                        result.lycees.push(structure);
                    } else {
                        console.warn(`⚠️ Établissement ${uai} non trouvé dans le dataset structures`);
                    }
                    
                    await this._sleep(100);
                } catch (error) {
                    console.error(`Erreur pour ${uai}:`, error);
                }
            }
            
            console.log(`✅ ${result.lycees.length} établissements récupérés`);
            
            // Étape 2 : Pour chaque établissement, récupérer formations et dispositifs
            progressCallback({
                step: 'extract',
                message: 'Extraction des diplômes et formations...',
                percent: 15
            });
            
            for (let i = 0; i < result.lycees.length; i++) {
                const lycee = result.lycees[i];
                const uai = lycee.code_uai;
                const nom = lycee.nom || 'Établissement inconnu';
                
                progressCallback({
                    step: 'extract',
                    message: `Extraction: ${nom}`,
                    current: i + 1,
                    total: result.lycees.length,
                    percent: 15 + ((i + 1) / result.lycees.length) * 75
                });
                
                try {
                    // Récupérer les actions de formation
                    const actions = await this.getActionsFormation(uai);
                    for (const action of actions) {
                        this._extractFromAction(action, result, uai);
                    }
                    
                    // Récupérer les dispositifs
                    const dispositifs = await this.getDispositifs(uai);
                    for (const dispositif of dispositifs) {
                        this._extractDispositifFromAPI(dispositif, result, uai);
                    }
                    
                    await this._sleep(400);
                } catch (error) {
                    console.error(`Erreur extraction pour ${nom}:`, error);
                }
            }
            
            // Étape 3: Finalisation et filtrage
            progressCallback({
                step: 'finalize',
                message: 'Finalisation et filtrage...',
                percent: 95
            });
            
            // Filtrer les établissements sans diplômes
            const filtrage = this._filterEtablissementsSansDiplomes(result);
            
            result.stats.requestCount = this.requestCount;
            
            const finalResult = {
                lycees: filtrage.lycees,
                diplomes: Array.from(result.diplomes.values()),
                dispositifs: Array.from(filtrage.dispositifs.values()),
                langues: Array.from(result.langues.values()),
                diplomes_par_lycee: result.diplomes_par_lycee,
                dispositifs_par_lycee: filtrage.dispositifs_par_lycee || [],
                stats: {
                    ...result.stats,
                    lyceesTotal: filtrage.lycees.length,
                    lyceesFiltres: filtrage.nbFiltres
                }
            };
            
            progressCallback({
                step: 'done',
                message: 'Extraction terminée !',
                percent: 100
            });
            
            return finalResult;
            
        } catch (error) {
            console.error('Erreur extraction par diplômes:', error);
            throw error;
        }
    }
    
    /**
     * Extraction basée sur les critères géographiques
     */
    async extractByGeoCriteria(type, value, progressCallback) {
        let communes = [];
        
        // Déterminer les communes à extraire selon le critère
        if (type === 'commune') {
            // Vérifier s'il y a des données d'homonymes
            const homonymes = localStorage.getItem('geo_criteria_homonymes');
            if (homonymes) {
                const communesData = JSON.parse(homonymes);
                communes = communesData.map(c => c.commune);
                // Dédupliquer au cas où
                communes = [...new Set(communes)];
            } else {
                communes = [value];
            }
        } else if (type === 'intercommunalite') {
            communes = await window.getCommunesIntercommunalite(value) || [];
            if (communes.length === 0) {
                throw new Error(`Intercommunalité inconnue ou aucune commune trouvée : ${value}`);
            }
        } else if (type === 'departement') {
            // Pour un département, on fait une recherche globale avec filtre
            return await this.extractByDepartement(value, progressCallback);
        } else if (type === 'academie') {
            // Pour une académie, on fait une recherche globale avec filtre
            return await this.extractByAcademie(value, progressCallback);
        }
        
        // Extraction par communes
        const result = {
            lycees: [],
            diplomes: new Map(),
            dispositifs: new Map(),
            langues: new Map(),
            diplomes_par_lycee: [],
            dispositifs_par_lycee: [],
            stats: {
                lyceesTotal: 0,
                actionsTotal: 0,
                requestCount: 0
            }
        };
        
        progressCallback({ 
            step: 'search', 
            message: `Recherche dans ${communes.length} commune(s)...`,
            percent: 0
        });
        
        // Récupérer le mode de recherche si c'est une commune
        const communeMode = type === 'commune' ? (localStorage.getItem('geo_criteria_commune_mode') || 'exact') : 'exact';
        
        // Rechercher les établissements dans chaque commune
        for (let i = 0; i < communes.length; i++) {
            const commune = communes[i];
            
            // Vérifier si l'extraction doit être arrêtée
            if (window.extractionStopped) {
                progressCallback({
                    step: 'cancelled',
                    message: '🛑 Extraction annulée par l\'utilisateur',
                    percent: 0
                });
                throw new Error('Extraction annulée par l\'utilisateur');
            }
            
            try {
                const structures = await this.searchStructures({ 
                    commune, 
                    size: 200,
                    communeMode: communeMode 
                });
                
                const etablissements = structures.filter(s => {
                    const communeEtab = (s.commune || '').toLowerCase();
                    const communeRecherchee = commune.toLowerCase();
                    
                    // Pour le filtre final, utiliser aussi le mode
                    let deLaCommune;
                    if (communeMode === 'exact') {
                        deLaCommune = communeEtab === communeRecherchee;
                    } else {
                        deLaCommune = communeEtab.includes(communeRecherchee);
                    }
                    
                    return deLaCommune;
                });
                
                // Déduplication par UAI
                for (const etablissement of etablissements) {
                    if (!result.lycees.some(l => l.code_uai === etablissement.code_uai)) {
                        result.lycees.push(etablissement);
                    }
                }
                
                console.log(`${commune}: ${etablissements.length} établissements trouvés`);
                
                progressCallback({
                    step: 'search',
                    message: `${commune}: ${etablissements.length} établissements trouvés`,
                    percent: ((i + 1) / communes.length) * 20
                });
                
                // Délai pour respecter le rate limiting 
                // Délai augmenté progressivement pour grandes extractions
                let delay = 700; // Base 700ms
                if (communes.length > 30) {
                    delay = 1000; // 1s pour >30 communes
                }
                if (communes.length > 50) {
                    delay = 1500; // 1.5s pour >50 communes
                }
                await this._sleep(delay);
            } catch (error) {
                // Gestion spécifique erreur 429 (rate limiting)
                if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
                    console.warn(`⚠️ Rate limit atteint pour ${commune}, pause de 2s...`);
                    await this._sleep(2000);
                    // Réessayer
                    try {
                        const structures = await this.searchStructures({ 
                            commune, 
                            size: 200,
                            communeMode: communeMode 
                        });
                        const etablissements = structures.filter(s => {
                            const communeEtab = (s.commune || '').toLowerCase();
                            const communeRecherchee = commune.toLowerCase();
                            let deLaCommune;
                            if (communeMode === 'exact') {
                                deLaCommune = communeEtab === communeRecherchee;
                            } else {
                                deLaCommune = communeEtab.includes(communeRecherchee);
                            }
                            return deLaCommune;
                        });
                        for (const etablissement of etablissements) {
                            if (!result.lycees.some(l => l.code_uai === etablissement.code_uai)) {
                                result.lycees.push(etablissement);
                            }
                        }
                        console.log(`${commune}: ${etablissements.length} établissements trouvés (2e essai)`);
                    } catch (retryError) {
                        console.error(`Erreur pour ${commune} (2e essai):`, retryError);
                    }
                } else {
                    console.error(`Erreur pour ${commune}:`, error);
                }
            }
        }
        
        result.stats.lyceesTotal = result.lycees.length;
        
        // Étape 2: Pour chaque établissement, récupérer les actions de formation
        for (let i = 0; i < result.lycees.length; i++) {
            const lycee = result.lycees[i];
            const uai = lycee.code_uai;
            const nom = lycee.nom || 'Établissement inconnu';
            
            // Vérifier si l'extraction doit être arrêtée
            if (window.extractionStopped) {
                progressCallback({
                    step: 'cancelled',
                    message: '🛑 Extraction annulée par l\'utilisateur',
                    percent: 0
                });
                throw new Error('Extraction annulée par l\'utilisateur');
            }
            
            progressCallback({
                step: 'extract',
                message: `Extraction: ${nom}`,
                current: i + 1,
                total: result.lycees.length,
                percent: 20 + ((i + 1) / result.lycees.length) * 70
            });
            
            try {
                const actions = await this.getActionsFormation(uai);
                lycee.actions_formation = actions;
                result.stats.actionsTotal += actions.length;
                
                for (const action of actions) {
                    this._extractFromAction(action, result, uai);
                }
                
                // Récupérer les dispositifs
                const dispositifs = await this.getDispositifs(uai);
                for (const dispositif of dispositifs) {
                    this._extractDispositifFromAPI(dispositif, result, uai);
                }
                
                await this._sleep(400);
            } catch (error) {
                console.error(`Erreur extraction pour ${nom}:`, error);
            }
        }
        
        // Étape 3: Finalisation
        progressCallback({
            step: 'finalize',
            message: 'Finalisation et filtrage...',
            percent: 95
        });
        
        // Filtrer les établissements sans diplômes
        const filtrage = this._filterEtablissementsSansDiplomes(result);
        
        result.stats.requestCount = this.requestCount;
        
        const finalResult = {
            lycees: filtrage.lycees,
            diplomes: Array.from(result.diplomes.values()),
            dispositifs: Array.from(filtrage.dispositifs.values()),
            langues: Array.from(result.langues.values()),
            diplomes_par_lycee: result.diplomes_par_lycee,
            dispositifs_par_lycee: filtrage.dispositifs_par_lycee || [],
            stats: {
                ...result.stats,
                lyceesTotal: filtrage.lycees.length,
                lyceesFiltres: filtrage.nbFiltres
            }
        };
        
        progressCallback({
            step: 'done',
            message: 'Extraction terminée !',
            percent: 100
        });
        
        return finalResult;
    }
    
    /**
     * Extraction par département (à implémenter si besoin)
     */
    async extractByDepartement(departement, progressCallback) {
        progressCallback({ 
            step: 'search', 
            message: `Recherche dans le département ${departement}...`,
            percent: 0
        });
        
        const result = {
            lycees: [],
            diplomes: new Map(),
            dispositifs: new Map(),
            langues: new Map(),
            diplomes_par_lycee: [],
            dispositifs_par_lycee: [],
            stats: {
                lyceesTotal: 0,
                actionsTotal: 0,
                requestCount: 0
            }
        };
        
        try {
            // Stratégie : rechercher par code postal
            // Pour les départements métropole : codes postaux commencent par le numéro du département
            // Pour DOM-TOM : codes postaux à 3 chiffres (971, 972, etc.)
            
            let prefixesCP = [];
            
            if (departement === '20') {
                // Corse : codes postaux 20xxx
                prefixesCP = ['20'];
            } else if (['971', '972', '973', '974', '976'].includes(departement)) {
                // DOM-TOM : code postal exact
                prefixesCP = [departement];
            } else {
                // Métropole : département sur 2 chiffres
                prefixesCP = [departement];
            }
            
            console.log(`Recherche dans département ${departement} avec préfixes CP:`, prefixesCP);
            
            // Obtenir le nom du département pour la facette
            const nomDepartement = window.getNomDepartement ? window.getNomDepartement(departement) : null;
            
            if (!nomDepartement) {
                throw new Error(`Impossible de trouver le nom du département ${departement}. Veuillez recharger la page (Ctrl+F5).`);
            }
            
            console.log(`📍 Nom du département: ${nomDepartement}`);
            
            // Nouvelle stratégie : utiliser la facette département de l'API
            console.log(`🔍 API Call avec facette: facet.departement=${nomDepartement}`);
            const structures = await this.searchStructures({ 
                facet_departement: nomDepartement,
                size: 500 
            });
            
            console.log(`✅ API Response: ${structures.length} structures retournées`);
            console.log('📋 Échantillon des 5 premières structures:', structures.slice(0, 5).map(s => ({
                nom: s.nom,
                commune: s.commune,
                code_postal: s.code_postal,
                type: s.type_detablissement,
                departement: s.departement
            })));
            
            progressCallback({ 
                step: 'filter', 
                message: `Filtrage des établissements du département ${departement}...`,
                percent: 10
            });
            
            console.log(`Structures trouvées pour ${departement}:`, structures.length);
            
            // Les structures sont déjà filtrées par département ci-dessus
            const etablissements = structures;
            
            // Extraire les types uniques pour information
            const typesUniques = [...new Set(etablissements.map(s => s.type_detablissement || 'Non renseigné'))].sort();
            console.log(`🎯 Types d'établissements trouvés (${typesUniques.length}):`, typesUniques);
            console.log(`Département ${departement}: ${etablissements.length} établissements trouvés`);
            
            result.lycees = etablissements;
            result.stats.lyceesTotal = etablissements.length;
            
            progressCallback({
                step: 'filter',
                message: `${etablissements.length} établissements trouvés dans le département ${departement}`,
                percent: 20
            });
            
            // Étape 2: Pour chaque établissement, récupérer les actions de formation
            for (let i = 0; i < result.lycees.length; i++) {
                const lycee = result.lycees[i];
                const uai = lycee.code_uai;
                const nom = lycee.nom || 'Établissement inconnu';
                
                progressCallback({
                    step: 'extract',
                    message: `Extraction: ${nom}`,
                    current: i + 1,
                    total: result.lycees.length,
                    percent: 20 + ((i + 1) / result.lycees.length) * 70
                });
                
                try {
                    const actions = await this.getActionsFormation(uai);
                    lycee.actions_formation = actions;
                    result.stats.actionsTotal += actions.length;
                    
                    for (const action of actions) {
                        this._extractFromAction(action, result, uai);
                    }
                    
                    // Récupérer les dispositifs
                    const dispositifs = await this.getDispositifs(uai);
                    for (const dispositif of dispositifs) {
                        this._extractDispositifFromAPI(dispositif, result, uai);
                    }
                    
                    await this._sleep(400);
                } catch (error) {
                    console.error(`Erreur extraction pour ${nom}:`, error);
                }
            }
            
            // Finalisation
            progressCallback({
                step: 'finalize',
                message: 'Finalisation et filtrage...',
                percent: 95
            });
            
            result.stats.requestCount = this.requestCount;
            // Filtrer les établissements sans diplômes
            const filtrage = this._filterEtablissementsSansDiplomes(result);

            
            const finalResult = {
                lycees: filtrage.lycees,
                diplomes: Array.from(result.diplomes.values()),
                dispositifs: Array.from(filtrage.dispositifs.values()),
                langues: Array.from(result.langues.values()),
                diplomes_par_lycee: result.diplomes_par_lycee,
                stats: {
                    ...result.stats,
                    lyceesTotal: filtrage.lycees.length,
                    lyceesFiltres: filtrage.nbFiltres
                }
            };
            
            progressCallback({
                step: 'done',
                message: 'Extraction terminée !',
                percent: 100
            });
            
            return finalResult;
            
        } catch (error) {
            console.error('Erreur extraction département:', error);
            throw error;
        }
    }
    
    /**
     * Extraction par académie (à implémenter si besoin)
     */
    async extractByAcademie(academie, progressCallback) {
        const departements = window.getDepartementsAcademie(academie);
        
        if (departements.length === 0) {
            throw new Error(`Académie inconnue : ${academie}`);
        }
        
        progressCallback({ 
            step: 'search', 
            message: `Recherche dans l'académie ${window.getNomAcademie(academie)} (${departements.length} départements)...`,
            percent: 0
        });
        
        const result = {
            lycees: [],
            diplomes: new Map(),
            dispositifs: new Map(),
            langues: new Map(),
            diplomes_par_lycee: [],
            dispositifs_par_lycee: [],
            stats: {
                lyceesTotal: 0,
                actionsTotal: 0,
                requestCount: 0
            }
        };
        
        try {
            // Nouvelle stratégie : utiliser la facette académie directement
            const nomAcademie = window.getNomAcademie ? window.getNomAcademie(academie) : null;
            
            if (!nomAcademie) {
                throw new Error(`Impossible de trouver le nom de l'académie ${academie}. Veuillez recharger la page (Ctrl+F5).`);
            }
            
            progressCallback({
                step: 'search',
                message: `Recherche dans l'académie ${nomAcademie}...`,
                percent: 5
            });
            
            console.log(`🔍 Académie - Recherche avec facette: ${nomAcademie}`);
            
            // Une seule requête avec la facette académie
            const allStructures = await this.searchStructures({ 
                facet_academie: nomAcademie,
                size: 1000 
            });
            
            console.log(`✅ ${allStructures.length} structures trouvées pour l'académie ${nomAcademie}`);
            
            progressCallback({ 
                step: 'filter', 
                message: `Filtrage des établissements de l'académie...`,
                percent: 10
            });
            
            console.log(`Structures trouvées pour académie ${window.getNomAcademie(academie)}:`, allStructures.length);
            
            // Les structures sont déjà filtrées par l'académie via la facette
            const etablissements = allStructures;
            
            // Déduplication par UAI
            const etablissementsUniques = [];
            const uaisVus = new Set();
            for (const etablissement of etablissements) {
                if (!uaisVus.has(etablissement.code_uai)) {
                    etablissementsUniques.push(etablissement);
                    uaisVus.add(etablissement.code_uai);
                }
            }
            
            // Extraire les types uniques pour information
            const typesUniques = [...new Set(etablissementsUniques.map(s => s.type_detablissement || 'Non renseigné'))].sort();
            console.log(`🎯 Types d'établissements trouvés (${typesUniques.length}):`, typesUniques);
            console.log(`Académie ${window.getNomAcademie(academie)}: ${etablissementsUniques.length} établissements trouvés`);
            
            result.lycees = etablissementsUniques;
            result.stats.lyceesTotal = etablissementsUniques.length;
            
            progressCallback({
                step: 'filter',
                message: `${etablissementsUniques.length} établissements trouvés dans l'académie`,
                percent: 20
            });
            
            // Étape 2: Pour chaque établissement, récupérer les actions de formation
            for (let i = 0; i < result.lycees.length; i++) {
                const lycee = result.lycees[i];
                const uai = lycee.code_uai;
                const nom = lycee.nom || 'Établissement inconnu';
                
                progressCallback({
                    step: 'extract',
                    message: `Extraction: ${nom}`,
                    current: i + 1,
                    total: result.lycees.length,
                    percent: 20 + ((i + 1) / result.lycees.length) * 70
                });
                
                try {
                    const actions = await this.getActionsFormation(uai);
                    lycee.actions_formation = actions;
                    result.stats.actionsTotal += actions.length;
                    
                    for (const action of actions) {
                        this._extractFromAction(action, result, uai);
                    }
                    
                    // Récupérer les dispositifs
                    const dispositifs = await this.getDispositifs(uai);
                    for (const dispositif of dispositifs) {
                        this._extractDispositifFromAPI(dispositif, result, uai);
                    }
                    
                    await this._sleep(400);
                } catch (error) {
                    console.error(`Erreur extraction pour ${nom}:`, error);
                }
            }
            
            // Finalisation
            progressCallback({
                step: 'finalize',
                message: 'Finalisation et filtrage...',
                percent: 95
            });
            
            result.stats.requestCount = this.requestCount;
            // Filtrer les établissements sans diplômes
            const filtrage = this._filterEtablissementsSansDiplomes(result);

            
            const finalResult = {
                lycees: result.lycees,
                diplomes: Array.from(result.diplomes.values()),
                dispositifs: Array.from(filtrage.dispositifs.values()),
                langues: Array.from(result.langues.values()),
                diplomes_par_lycee: result.diplomes_par_lycee,
                stats: {
                    ...result.stats,
                    lyceesTotal: filtrage.lycees.length,
                    lyceesFiltres: filtrage.nbFiltres
                }
            };
            
            progressCallback({
                step: 'done',
                message: 'Extraction terminée !',
                percent: 100
            });
            
            return finalResult;
            
        } catch (error) {
            console.error('Erreur extraction académie:', error);
            throw error;
        }
    }
    
    /**
     * Extrait diplômes, formations, langues, dispositifs depuis une action
     */
    _extractFromAction(action, result, lycee_uai = null) {
        // Extraire le diplôme/formation
        const libelle = action.formation_for_libelle || action.for_lib_voe_ins || '';
        const type = action.for_type || '';
        
        if (!libelle) {
            return; // Pas de libellé, on ignore
        }
        
        // NOUVEAUTÉ v0.9 : On accepte TOUT, pas de filtrage
        // Considérer comme diplôme si le type contient des mots-clés diplômants
        const typeLower = type.toLowerCase();
        const libelleLower = libelle.toLowerCase();
        
        const motsClesDiplomes = [
            'baccalauréat', 'bac', 'bts', 'cap', 'but', 'licence', 'master',
            'mention complémentaire', 'brevet', 'diplôme', 'certificat'
        ];
        
        const isDiplome = motsClesDiplomes.some(mot => 
            typeLower.includes(mot) || libelleLower.includes(mot)
        );
        
        if (isDiplome) {
            // Utiliser l'intitulé complet comme identifiant unique
            if (!result.diplomes.has(libelle)) {
                result.diplomes.set(libelle, {
                    intitule: libelle,
                    niveau: this._detectNiveau(libelle + ' ' + type)
                });
            }
            
            // Enregistrer la relation établissement-diplôme
            if (lycee_uai && result.diplomes_par_lycee) {
                result.diplomes_par_lycee.push({
                    lycee_uai: lycee_uai,
                    diplome_intitule: libelle
                });
            }
        }
        
        // Extraire les dispositifs (sections spéciales, options, etc.)
        this._extractDispositifs(action, result, lycee_uai);
        
        // Langues - à extraire des champs si disponibles
        // TODO: Vérifier quels champs contiennent les langues dans ces datasets
    }
    
    /**
     * Extrait les dispositifs depuis une action
     */
    _extractDispositifs(action, result, lycee_uai = null) {
        const libelle = (action.formation_for_libelle || '').toLowerCase();
        const type = (action.for_type || '').toLowerCase();
        
        // Mots-clés pour identifier les dispositifs
        const dispositifsKeywords = {
            'Section linguistique': ['section européenne', 'section euro', 'section anglais', 'section allemand', 
                                     'section espagnol', 'section internationale', 'section bilingue'],
            'Hébergement': ['internat', 'demi-pension', 'externat'],
            'Handicap': ['ulis', 'segpa', 'upe2a', 'dispositif handicap'],
            'Section spécialisée': ['section sport', 'section arts', 'section théÃ¢tre', 'section cinéma', 
                                   'section musique', 'section danse', 'pôle espoir', 'sport-études'],
            'Dispositif pédagogique': ['accompagnement personnalisé', 'soutien scolaire', 'tutorat', 
                                       'aide aux devoirs', 'classe préparatoire intégrée']
        };
        
        let dispositifDetecte = null;
        let typeDispositif = null;
        
        // Chercher si le libellé correspond à un dispositif
        for (const [type, keywords] of Object.entries(dispositifsKeywords)) {
            for (const keyword of keywords) {
                if (libelle.includes(keyword)) {
                    dispositifDetecte = libelle;
                    typeDispositif = type;
                    break;
                }
            }
            if (dispositifDetecte) break;
        }
        
        // Si un dispositif est détecté
        if (dispositifDetecte && lycee_uai) {
            const nom = action.formation_for_libelle; // Garder le libellé original avec majuscules
            
            if (!result.dispositifs.has(nom)) {
                result.dispositifs.set(nom, {
                    nom: nom,
                    type: typeDispositif
                });
            }
            
            // Enregistrer la relation établissement-dispositif
            if (result.dispositifs_par_lycee) {
                result.dispositifs_par_lycee.push({
                    lycee_uai: lycee_uai,
                    dispositif_nom: nom,
                    dispositif_type: typeDispositif
                });
            }
        }
    }
    
    /**
     * Extrait un dispositif depuis l'API Idéo-Actions de dispositif
     */
    _extractDispositifFromAPI(dispositif, result, lycee_uai = null) {
        // LOG TEMPORAIRE : Afficher la structure du dispositif
        if (!window._dispositifLogShown) {
            console.log('🔍 Structure dispositif brut:', dispositif);
            console.log('🔍 Champs disponibles:', Object.keys(dispositif));
            window._dispositifLogShown = true;
        }
        
        // Nom du dispositif : utiliser le type de dispositif comme nom
        const nom = dispositif.type_de_dispositif_typdisp_libelle || 
                    dispositif.dis_libelle || 
                    dispositif.libelle || 
                    'Dispositif inconnu';
        
        // Type : catégoriser les dispositifs
        let type = 'Autre';
        const nomLower = nom.toLowerCase();
        
        if (nomLower.includes('section') && (nomLower.includes('européenne') || nomLower.includes('internationale') || nomLower.includes('bilingue'))) {
            type = 'Section linguistique';
        } else if (nomLower.includes('internat') || nomLower.includes('hébergement') || nomLower.includes('pension')) {
            type = 'Hébergement';
        } else if (nomLower.includes('ulis') || nomLower.includes('segpa') || nomLower.includes('handicap') || nomLower.includes('upe2a')) {
            type = 'Handicap';
        } else if (nomLower.includes('sport') || nomLower.includes('arts') || nomLower.includes('musique') || nomLower.includes('théÃ¢tre') || nomLower.includes('danse')) {
            type = 'Section spécialisée';
        } else if (nomLower.includes('accompagnement') || nomLower.includes('soutien') || nomLower.includes('aide')) {
            type = 'Dispositif pédagogique';
        } else if (nomLower.includes('option') || nomLower.includes('enseignement facultatif')) {
            type = 'Option';
        }
        
        // Utiliser aussi le champ dis_type s'il existe
        if (dispositif.dis_type) {
            type = dispositif.dis_type;
        } else if (dispositif.type) {
            type = dispositif.type;
        } else if (dispositif.famille) {
            type = dispositif.famille;
        }
        
        if (!result.dispositifs.has(nom)) {
            result.dispositifs.set(nom, {
                nom: nom,
                type: type
            });
        }
        
        // Enregistrer la relation établissement-dispositif
        if (lycee_uai && result.dispositifs_par_lycee) {
            result.dispositifs_par_lycee.push({
                lycee_uai: lycee_uai,
                dispositif_nom: nom,
                dispositif_type: type
            });
        }
    }
    
    /**
     * Extrait les langues depuis le champ "LV1 : ... / LV2 : ..."
     */
    _extractLangues(languesStr, languesMap) {
        // Format: "LV1 : Anglais / LV2 : Allemand, Espagnol"
        const parts = languesStr.split('/');
        
        for (const part of parts) {
            const match = part.match(/(LV\d+)\s*:\s*(.+)/);
            if (match) {
                const niveau = match[1]; // LV1, LV2, LV3
                const langues = match[2].split(',').map(l => l.trim());
                
                for (const langue of langues) {
                    if (langue && langue !== '') {
                        const code = this._generateCode(langue);
                        if (!languesMap.has(code)) {
                            languesMap.set(code, {
                                code: code,
                                nom: langue,
                                type: 'Langue vivante étrangère',
                                niveaux: new Set()
                            });
                        }
                        languesMap.get(code).niveaux.add(niveau);
                    }
                }
            }
        }
    }
    
    /**
     * Détecte le niveau d'un diplôme
     */
    _detectNiveau(libelle) {
        const text = libelle.toLowerCase();
        
        if (text.includes('cap') || text.includes('certificat')) return 'CAP';
        if (text.includes('bac pro') || text.includes('professionnel')) return 'Bac Pro';
        if (text.includes('bac techno') || text.includes('technologique')) return 'Bac Techno';
        if (text.includes('bac général') || text.includes('général')) return 'Bac Général';
        if (text.includes('bts')) return 'BTS (Bac+2)';
        if (text.includes('but')) return 'BUT (Bac+3)';
        if (text.includes('bma')) return 'BMA';
        if (text.includes('licence')) return 'Bac+3';
        if (text.includes('master')) return 'Bac+5';
        if (text.includes('bac')) return 'Bac';
        return 'Autre';
    }
    
    /**
     * Génère un code unique basé sur le libellé
     */
    _generateCode(libelle) {
        return libelle.toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '')
            .substring(0, 50);
    }
    
    /**
     * Pause pour respecter le rate limiting
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Rendre disponible globalement
if (typeof window !== 'undefined') {
    window.OnisepAPI = OnisepAPI;
}

let db = null;
let SQL = null;
let onisepAPI = null;
let onisepToken = null;
let currentView = 'lycees'; // Vue actuelle : lycees, diplomes, formations, langues


/**
 * Charge la liste de tous les EPCI depuis geo.api.gouv.fr
 */
async function loadAllEPCI() {
    try {
        console.log('🔄 Chargement liste EPCI...');
        const response = await fetch('https://geo.api.gouv.fr/epcis?fields=nom,code');
        const epcis = await response.json();
        
        // Stocker en global
        window.allEPCI = epcis;
        
        // Remplir le datalist (si présent dans le panneau latéral)
        const datalist = document.getElementById('intercommunalites-list');
        if (datalist) {
            datalist.innerHTML = epcis
                .sort((a, b) => a.nom.localeCompare(b.nom))
                .map(epci => `<option value="${epci.code}">${epci.nom}</option>`)
                .join('');
        }
        
        console.log(`✅ ${epcis.length} EPCI chargés et disponibles`);
    } catch (error) {
        console.error('❌ Erreur chargement EPCI:', error);
    }
}

function loadSavedCredentials() {
    onisepToken = localStorage.getItem('onisep_token');
    if (onisepToken) {
        onisepAPI = new OnisepAPI(onisepToken, '69711beb357466e3a88b4572');
        updateAuthUI(true);
    }
    
    // Charger les paramètres sauvegardés
    loadSettings();
    
    // Auto-connexion si activée
    const autoConnect = localStorage.getItem('settings_auto_connect') === 'true';
    if (autoConnect && !onisepToken) {
        const email = localStorage.getItem('settings_email');
        const password = localStorage.getItem('settings_password');
        const appId = localStorage.getItem('settings_app_id');
        if (email && password && appId) {
            setTimeout(() => autoConnectOnisep(email, password, appId), 1000);
        }
    }
}

// ===== FONCTIONS PANNEAU DE PARAMÃˆTRES =====

// ========================================
// NAVIGATION ONGLETS v0.13
// ========================================

function switchTab(tabName) {
    console.log('📑 Basculement vers onglet:', tabName);
    
    // Désactiver tous les boutons et contenus
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Activer le bouton et contenu sélectionné
    const btn = document.querySelector(`[data-tab="${tabName}"]`);
    const content = document.getElementById(`tab-${tabName}`);
    
    if (btn && content) {
        btn.classList.add('active');
        content.classList.add('active');
        
        // Actions spécifiques par onglet
        if (tabName === 'resultats') {
            // Recharger les données si nécessaire
            loadView();
        }
    } else {
        console.error('❌ Onglet non trouvé:', tabName);
    }
}

// Basculer automatiquement vers Résultats après extraction
function switchToResults() {
    switchTab('resultats');
}

// ========================================
// INTERFACE RECHERCHE DANS ONGLET v0.13
// ========================================

// Basculer entre les modes d'extraction dans l'onglet
function switchTabExtractionMode() {
    const mode = document.querySelector('input[name="tab-extraction-mode"]:checked').value;
    
    if (mode === 'geo') {
        document.getElementById('tab-panel-mode-geo').style.display = 'block';
        document.getElementById('tab-panel-mode-diplomes').style.display = 'none';
    } else {
        document.getElementById('tab-panel-mode-geo').style.display = 'none';
        document.getElementById('tab-panel-mode-diplomes').style.display = 'block';
    }
}

// Variables globales pour l'onglet
let tabSearchTimeout;
let tabSelectedCommune = null;
let tabSelectedScope = null;

// Gérer la recherche de commune dans l'onglet
function handleTabSmartSearch() {
    clearTimeout(tabSearchTimeout);
    const query = document.getElementById('tab-smart-search-commune').value.trim();
    
    if (query.length < 3) {
        document.getElementById('tab-smart-search-results').style.display = 'none';
        document.getElementById('tab-smart-search-help').textContent = '💡 Entrez au moins 3 caractères pour rechercher';
        return;
    }
    
    document.getElementById('tab-smart-search-help').textContent = '🔄 Recherche en cours...';
    
    tabSearchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux,codeDepartement,codeRegion,population&limit=100`);
            const communes = await response.json();
            
            displayTabSearchResults(communes);
            
            if (communes.length >= 100) {
                document.getElementById('tab-smart-search-help').innerHTML = 
                    `<span style="color: var(--warning);">⚠️ Plus de 100 résultats (limite atteinte, affinez votre recherche...)</span>`;
            } else {
                document.getElementById('tab-smart-search-help').textContent = 
                    `✅ ${communes.length} commune(s) trouvée(s)`;
            }
        } catch (error) {
            console.error('Erreur recherche communes:', error);
            document.getElementById('tab-smart-search-help').textContent = '❌ Erreur de recherche';
        }
    }, 300);
}

// Afficher les résultats de recherche dans l'onglet
function displayTabSearchResults(communes) {
    const resultsDiv = document.getElementById('tab-smart-search-results-list');
    
    if (communes.length === 0) {
        resultsDiv.innerHTML = '<div style="padding: 15px; text-align: center; color: var(--text-light);">Aucune commune trouvée</div>';
    } else {
        const html = communes.map(c => `
            <div class="search-result-item" onclick="selectTabCommune('${c.code}')" 
                 style="padding: 12px 15px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s;"
                 onmouseover="this.style.background='var(--bg-light)'" 
                 onmouseout="this.style.background='white'">
                <div style="font-weight: 500;">${c.nom}</div>
                <div style="font-size: 12px; color: var(--text-light);">
                    ${c.codeDepartement} â€¢ ${c.population ? c.population.toLocaleString() + ' hab.' : 'Population inconnue'}
                </div>
            </div>
        `).join('');
        
        resultsDiv.innerHTML = html;
    }
    
    document.getElementById('tab-smart-search-results').style.display = 'block';
}

// Sélectionner une commune dans l'onglet
async function selectTabCommune(codeCommune) {
    try {
        // Récupérer les détails de la commune + EPCI
        const response = await fetch(`https://geo.api.gouv.fr/communes/${codeCommune}?fields=nom,code,codesPostaux,population,codeDepartement,codeEpci,epci`);
        const commune = await response.json();
        
        tabSelectedCommune = commune;
        
        // Masquer résultats
        document.getElementById('tab-smart-search-results').style.display = 'none';
        
        // Afficher la sélection
        displayTabSelection(commune);
        
    } catch (error) {
        console.error('Erreur sélection commune:', error);
        alert('Erreur lors de la sélection de la commune');
    }
}

// Afficher la sélection dans l'onglet
function displayTabSelection(commune) {
    const hasEPCI = commune.epci && commune.epci.code;
    
    let detailsHTML = `
        <div style="margin-top: 10px;">
            <div style="font-size: 13px; color: var(--text-light); margin-bottom: 10px;">
                📊 ${commune.population ? commune.population.toLocaleString() + ' habitants' : 'Population inconnue'}
            </div>
    `;
    
    if (hasEPCI) {
        detailsHTML += `
            <div style="font-size: 13px; color: var(--text-light); margin-bottom: 15px;">
                ðŸ™ï¸ Fait partie de : <strong>${commune.epci.nom}</strong>
            </div>
            <div style="display: flex; gap: 10px;">
                <label style="flex: 1; padding: 12px; border: 2px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s; background: white;">
                    <input type="radio" name="tab-scope" value="commune" checked onchange="tabSelectedScope='commune'; updateTabExtractButton()">
                    <span style="margin-left: 8px;">📍 <strong>Commune seule</strong> (${commune.nom})</span>
                </label>
                <label style="flex: 1; padding: 12px; border: 2px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s; background: white;">
                    <input type="radio" name="tab-scope" value="epci" onchange="tabSelectedScope='epci'; updateTabExtractButton()">
                    <span style="margin-left: 8px;">ðŸ™ï¸ <strong>Toute l'intercommunalité</strong></span>
                </label>
            </div>
        `;
        
        tabSelectedScope = 'commune';
    } else {
        detailsHTML += '<div style="font-size: 13px; color: var(--text-light);">Cette commune n\'appartient à aucune intercommunalité</div>';
        tabSelectedScope = 'commune';
    }
    
    detailsHTML += '</div>';
    
    document.getElementById('tab-selection-name').textContent = commune.nom;
    document.getElementById('tab-selection-details').innerHTML = detailsHTML;
    document.getElementById('tab-smart-selection-display').style.display = 'block';
    
    // Activer le bouton d'extraction
    updateTabExtractButton();
}

// Mettre à jour les boutons d'extraction
function updateTabExtractButton() {
    const btnExtract = document.getElementById('tab-btn-extract-smart');
    const btnClear = document.getElementById('tab-btn-clear-geo');
    btnExtract.disabled = false;
    btnExtract.style.opacity = '1';
    btnClear.disabled = false;
    btnClear.style.opacity = '1';
}

// Effacer la sélection
function clearTabSmartSelection() {
    tabSelectedCommune = null;
    tabSelectedScope = null;
    document.getElementById('tab-smart-selection-display').style.display = 'none';
    document.getElementById('tab-smart-search-commune').value = '';
    document.getElementById('tab-smart-search-results').style.display = 'none';
    document.getElementById('tab-smart-search-help').textContent = '💡 Entrez au moins 3 caractères pour rechercher';
    document.getElementById('tab-btn-extract-smart').disabled = true;
    document.getElementById('tab-btn-clear-geo').disabled = true;
}

// Lancer l'extraction depuis l'onglet
async function lancerTabExtractionSmartGeo() {
    console.log('🚀 lancerTabExtractionSmartGeo appelée');
    console.log('   tabSelectedCommune:', tabSelectedCommune);
    console.log('   tabSelectedScope:', tabSelectedScope);
    
    if (!tabSelectedCommune) {
        alert('Veuillez sélectionner une commune');
        return;
    }
    
    if (!tabSelectedScope) {
        alert('Veuillez choisir la portée (commune ou EPCI)');
        return;
    }
    
    console.log('✅ Lancement extraction...');
    
    // Enregistrer directement dans localStorage (comme le panneau latéral)
    if (tabSelectedScope === 'commune') {
        // Extraction d'une seule commune
        localStorage.setItem('geo_criteria_type', 'commune');
        localStorage.setItem('geo_criteria_value', tabSelectedCommune.nom);
        localStorage.setItem('geo_criteria_commune_mode', 'exact');
        console.log('   → Critères sauvegardés: commune =', tabSelectedCommune.nom);
    } else if (tabSelectedScope === 'epci' && tabSelectedCommune.epci) {
        // Extraction de tout l'EPCI
        localStorage.setItem('geo_criteria_type', 'intercommunalite');
        localStorage.setItem('geo_criteria_value', tabSelectedCommune.epci.code);
        console.log('   → Critères sauvegardés: EPCI =', tabSelectedCommune.epci.code, tabSelectedCommune.epci.nom);
    } else {
        alert('Configuration invalide');
        return;
    }
    
    // Gérer la sauvegarde comme favori si demandé
    const saveAsFavorite = document.getElementById('save-as-favorite-geo').checked;
    if (saveAsFavorite) {
        const favoriteName = document.getElementById('favorite-name-geo').value.trim();
        if (!favoriteName) {
            showAlert('⚠️ Veuillez donner un nom au favori', 'error');
            return;
        }
        
        const params = {
            type: tabSelectedScope === 'commune' ? 'commune' : 'intercommunalite',
            value: tabSelectedScope === 'commune' ? tabSelectedCommune.nom : tabSelectedCommune.epci.code,
            displayName: tabSelectedScope === 'commune' ? tabSelectedCommune.nom : tabSelectedCommune.epci.nom
        };
        
        const success = ajouterFavori(favoriteName, 'geo', params);
        if (success) {
            // Recharger la liste des favoris
            afficherListeFavoris();
            // Décocher et vider le champ
            document.getElementById('save-as-favorite-geo').checked = false;
            document.getElementById('favorite-name-geo').value = '';
            document.getElementById('favorite-name-container-geo').style.display = 'none';
        }
    }
    
    // Lancer l'extraction directement
    console.log('   → Appel refreshFromOnisep()');
    await refreshFromOnisep();
}


// ========================================
// EXTRACTION PAR DIPLÔMES - ONGLET v0.13
// ========================================

function updateTabDiplomesGeoFields() {
    const type = document.getElementById('tab-diplomes-geo-type').value;
    document.getElementById('tab-diplomes-departement-field').style.display = 
        type === 'departement' ? 'block' : 'none';
    document.getElementById('tab-diplomes-academie-field').style.display = 
        type === 'academie' ? 'block' : 'none';
}

// MODE DIPLÔMES - Charger diplômes disponibles (Étape 1 → 2)
async function chargerTabDiplomesDisponibles() {
    console.log('🎓 chargerTabDiplomesDisponibles appelée');
    
    const type = document.getElementById('tab-diplomes-geo-type').value;
    const value = type === 'departement' ?
        document.getElementById('tab-diplomes-departement').value :
        document.getElementById('tab-diplomes-academie').value;
    
    console.log('   Type:', type, 'Value:', value);
    
    if (!value) {
        showAlert('⚠️ Veuillez sélectionner un périmètre', 'warning');
        return;
    }
    
    if (!onisepAPI) {
        showAlert('⚠️ Veuillez vous connecter à Onisep d\'abord', 'error');
        openLoginModal();
        return;
    }
    
    const btn = document.getElementById('tab-btn-charger-diplomes');
    btn.disabled = true;
    btn.textContent = '⏳ Chargement...';
    
    try {
        // Construire facette
        let facetGeo = {};
        if (type === 'departement') {
            facetGeo = { facet_departement: window.getNomDepartement(value) };
        } else {
            facetGeo = { facet_academie: window.getNomAcademie(value) };
        }
        
        // Charger diplômes
        const niveauBac = document.getElementById('tab-filter-niveau-bac').checked;
        const niveauCap = document.getElementById('tab-filter-niveau-cap').checked;
        
        const diplomes = await onisepAPI.getDiplomesDisponibles(facetGeo, niveauBac, niveauCap);
        
        if (diplomes.length === 0) {
            showAlert('❌ Aucun diplôme trouvé pour ce périmètre', 'error');
            return;
        }
        
        // Sauvegarder contexte
        window.tabContexteDiplomes = {
            type: type,
            value: value,
            displayName: type === 'departement' ?
                `${value} - ${window.getNomDepartement(value)}` :
                window.getNomAcademie(value),
            diplomes: diplomes,
            facetGeo: facetGeo
        };
        
        // Afficher étape 2
        afficherTabListeDiplomes(diplomes);
        document.getElementById('tab-diplomes-perimetre-info').textContent = window.tabContexteDiplomes.displayName;
        document.getElementById('tab-diplomes-etape-1').style.display = 'none';
        document.getElementById('tab-diplomes-etape-2').style.display = 'block';
        
        showAlert(`✅ ${diplomes.length} diplôme(s) disponible(s)`, 'success');
        
    } catch (error) {
        console.error('Erreur chargement diplômes:', error);
        showAlert(`❌ Erreur: ${error.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '➡ï¸ Charger les diplômes disponibles';
    }
}

// MODE DIPLÔMES - Afficher la liste des diplômes
function afficherTabListeDiplomes(diplomes) {
    const container = document.getElementById('tab-diplomes-list');
    
    // Grouper par niveau
    const parNiveau = {};
    diplomes.forEach(d => {
        const niveau = d.niveau || 'Autre';
        if (!parNiveau[niveau]) parNiveau[niveau] = [];
        parNiveau[niveau].push(d);
    });
    
    let html = '';
    for (const [niveau, liste] of Object.entries(parNiveau)) {
        html += `<div class="niveau-group" data-niveau="${niveau}">
            <div class="niveau-header">
                ${niveau} <span>(${liste.length})</span>
            </div>`;
        
        liste.forEach((d, idx) => {
            html += `<label>
                <input type="checkbox" class="diplome-checkbox" 
                       data-diplome-index="${diplomes.indexOf(d)}" 
                       onchange="updateTabSelectionInfo()" checked>
                <div class="diplome-info">
                    <div class="diplome-intitule">${d.intitule}</div>
                </div>
            </label>`;
        });
        
        html += `</div>`;
    }
    
    container.innerHTML = html;
    
    // Sauvegarder référence globale aux diplômes
    window.tabDiplomesDisponibles = diplomes;
    
    updateTabSelectionInfo();
}

// MODE DIPLÔMES - Filtrage par niveau
function filtrerTabDiplomesParNiveau() {
    const niveauBac = document.getElementById('tab-filter-niveau-bac').checked;
    const niveauCap = document.getElementById('tab-filter-niveau-cap').checked;
    
    document.querySelectorAll('.niveau-group').forEach(group => {
        const niveau = group.dataset.niveau?.toLowerCase();
        const isBac = niveau?.includes('bac');
        const isCap = niveau?.includes('cap');
        
        let visible = true;
        if (isBac) visible = niveauBac;
        else if (isCap) visible = niveauCap;
        
        group.style.display = visible ? 'block' : 'none';
    });
    
    updateTabSelectionInfo();
}

// MODE DIPLÔMES - Filtrage par recherche
function filtrerTabDiplomesParRecherche() {
    const search = document.getElementById('tab-search-diplome').value.toLowerCase();
    
    document.querySelectorAll('.diplomes-list label').forEach(label => {
        const visible = label.textContent.toLowerCase().includes(search);
        label.style.display = visible ? 'flex' : 'none';
    });
    
    updateTabSelectionInfo();
}

// MODE DIPLÔMES - Toggle tous les diplômes
function toggleTousTabDiplomes(checked) {
    document.querySelectorAll('.diplome-checkbox').forEach(cb => {
        if (cb.closest('label').style.display !== 'none') {
            cb.checked = checked;
        }
    });
    updateTabSelectionInfo();
}

// MODE DIPLÔMES - Mettre à jour info sélection
function updateTabSelectionInfo() {
    const count = document.querySelectorAll('.diplome-checkbox:checked').length;
    const total = document.querySelectorAll('.diplome-checkbox').length;
    
    document.getElementById('tab-selection-count').textContent = count;
    
    const info = document.getElementById('tab-selection-info');
    if (count === 0) {
        info.className = 'selection-info warning';
        info.innerHTML = `⚠️ <span id="tab-selection-count">0</span> diplôme(s) sélectionné(s)`;
    } else {
        info.className = 'tab-selection-info';
        info.innerHTML = `✅ <span id="tab-selection-count">${count}</span> diplôme(s) sélectionné(s) sur ${total}`;
    }
}

// MODE DIPLÔMES - Récupérer diplômes sélectionnés
function getTabDiplomesSelectionnes() {
    const checkboxes = document.querySelectorAll('.diplome-checkbox:checked');
    return Array.from(checkboxes).map(cb => {
        const index = parseInt(cb.dataset.diplomeIndex);
        return window.tabDiplomesDisponibles[index];
    });
}

// MODE DIPLÔMES - Lancer extraction
async function lancerTabExtractionDiplomes() {
    const diplomesSelectionnes = getTabDiplomesSelectionnes();
    
    if (diplomesSelectionnes.length === 0) {
        showAlert('⚠️ Veuillez sélectionner au moins un diplôme', 'error');
        return;
    }
    
    const { facetGeo, type, value, displayName } = window.tabContexteDiplomes;
    
    // Gérer la sauvegarde comme favori si demandé
    const saveAsFavorite = document.getElementById('save-as-favorite-diplomes').checked;
    if (saveAsFavorite) {
        const favoriteName = document.getElementById('favorite-name-diplomes').value.trim();
        if (!favoriteName) {
            showAlert('⚠️ Veuillez donner un nom au favori', 'error');
            return;
        }
        
        const params = {
            type: type,
            value: value,
            displayName: displayName,
            diplomes: diplomesSelectionnes.map(d => ({
                intitule: d.intitule,
                niveau: d.niveau
            }))
        };
        
        const success = ajouterFavori(favoriteName, 'diplomes', params);
        if (success) {
            // Recharger la liste des favoris
            afficherListeFavoris();
            // Décocher et vider le champ
            document.getElementById('save-as-favorite-diplomes').checked = false;
            document.getElementById('favorite-name-diplomes').value = '';
            document.getElementById('favorite-name-container-diplomes').style.display = 'none';
        }
    }
    
    // Lancer extraction
    const modal = document.getElementById('onisep-modal');
    modal.classList.add('active');
    
    // Réinitialiser et afficher le bouton Stop
    const btnStop = document.getElementById('btn-stop-extraction');
    btnStop.style.display = 'inline-block';
    btnStop.disabled = false;
    btnStop.textContent = '🛑 Arrêter l\'extraction';
    window.extractionStopped = false;
    
    try {
        const data = await onisepAPI.extractByDiplomes(
            diplomesSelectionnes,
            facetGeo,
            progress => {
                const fill = document.getElementById('progress-fill');
                const message = document.getElementById('progress-message');
                const details = document.getElementById('progress-details');
                
                const percent = Math.round(progress.percent || 0);
                fill.style.width = `${percent}%`;
                fill.textContent = `${percent}%`;
                message.textContent = progress.message || '';
                
                if (progress.current && progress.total) {
                    details.textContent = `${progress.current} / ${progress.total}`;
                }
            }
        );
        
        await updateDatabase(data);
        
        // Enrichir automatiquement avec les langues
        console.log('🌍 Lancement enrichissement automatique des langues...');
        try {
            await enrichirAvecLangues(true); // true = mode silencieux
        } catch (error) {
            console.error('❌ Erreur enrichissement langues:', error);
            // Ne pas bloquer l'extraction si l'enrichissement échoue
        }
        
        // Afficher résumé extraction
        loadStats();
        loadView();
        
        // Cacher le bouton Stop (extraction terminée)
        document.getElementById('btn-stop-extraction').style.display = 'none';
        
        // Basculer vers longlet Résultats (v0.13)
        switchTab('resultats');
        
        const diplomesUniques = data.diplomes.length;
        const diplomesTotal = data.diplomes_par_lycee.length;
        showAlert(`✅ ${data.lycees.length} établissements et ${diplomesTotal} diplômes (dont ${diplomesUniques} uniques) extraits !`, 'success');
        
        // Mettre à jour date extraction
        localStorage.setItem('last_extraction_date', new Date().toISOString());
        updateLastExtractionDate();
        
    } catch (error) {
        document.getElementById('btn-stop-extraction').style.display = 'none';
        console.error('Erreur extraction:', error);
        showAlert(`❌ Erreur: ${error.message}`, 'error');
    } finally {
        modal.classList.remove('active');
    }
}

// MODE DIPLÔMES - Retour à l'étape 1
function retourTabEtape1() {
    document.getElementById('tab-diplomes-etape-2').style.display = 'none';
    document.getElementById('tab-diplomes-etape-1').style.display = 'block';
}

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    const overlay = document.getElementById('settings-overlay');
    const hamburger = document.getElementById('hamburger-btn');
    
    panel.classList.toggle('active');
    overlay.classList.toggle('active');
    hamburger.classList.toggle('active');
    
    // Charger les paramètres actuels
    if (panel.classList.contains('active')) {
        loadSettings();
    }
}

function toggleSection(header) {
    const content = header.nextElementSibling;
    const isActive = content.classList.contains('active');
    
    // Fermer toutes les sections
    document.querySelectorAll('.settings-section-content').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelectorAll('.settings-section-header').forEach(el => {
        el.classList.remove('active');
    });
    
    // Ouvrir la section cliquée si elle était fermée
    if (!isActive) {
        content.classList.add('active');
        header.classList.add('active');
    }
}

function loadSettings() {
    try {
        // Charger les identifiants Onisep
        document.getElementById('settings-email').value = localStorage.getItem('settings_email') || '';
        document.getElementById('settings-password').value = localStorage.getItem('settings_password') || '';
        document.getElementById('settings-app-id').value = localStorage.getItem('settings_app_id') || '';
        document.getElementById('settings-auto-connect').checked = localStorage.getItem('settings_auto_connect') === 'true';
        
        // Charger les critères géographiques (désactivé avec nouvelle interface)
        try {
            loadGeoCriteria();
        } catch (e) {
            console.log('loadGeoCriteria désactivée:', e);
        }
        
        // Mettre à jour le statut de connexion
        updateConnectionStatus();
        
        // Afficher la date de dernière extraction
        updateLastExtractionDate();
    } catch (error) {
        console.error('Erreur loadSettings:', error);
    }
}

function updateLastExtractionDate() {
    const lastExtraction = localStorage.getItem('last_extraction_date');
    const dateEl = document.getElementById('last-extraction-date');
    
    if (lastExtraction && dateEl) {
        const date = new Date(lastExtraction);
        const formattedDate = date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        dateEl.innerHTML = `ðŸ“… Dernière extraction : ${formattedDate}`;
    } else if (dateEl) {
        dateEl.innerHTML = 'ðŸ“… Aucune extraction effectuée';
    }
}

function updateGeoFields() {
    // Vérifier si les éléments existent (mode Diplômes uniquement)
    const typeElement = document.getElementById('geo-type');
    if (!typeElement) {
        console.log('updateGeoFields: éléments non présents (normale en mode géographique)');
        return;
    }
    
    const type = typeElement.value;
    const communeField = document.getElementById('geo-commune-field');
    const intercoField = document.getElementById('geo-interco-field');
    
    if (communeField) {
        communeField.style.display = type === 'commune' ? 'block' : 'none';
    }
    if (intercoField) {
        intercoField.style.display = type === 'intercommunalite' ? 'block' : 'none';
    }
    
    if (type === 'intercommunalite') {
        updateIntercommunaliteInfo();
    }
}

async function updateIntercommunaliteInfo() {
    const inputElement = document.getElementById('geo-intercommunalite');
    if (!inputElement) {
        console.log('updateIntercommunaliteInfo: élément non présent');
        return;
    }
    
    const code = inputElement.value.trim();
    const infoEl = document.getElementById('intercommunalite-info');
    
    if (!infoEl) return;
    
    if (!code) {
        infoEl.innerHTML = '💡 Commencez à taper pour rechercher';
        infoEl.style.color = 'var(--text-light)';
        return;
    }
    
    // Trouver le nom de l'EPCI
    let epciNom = code;
    if (window.allEPCI) {
        const epci = window.allEPCI.find(e => e.code === code);
        if (epci) {
            epciNom = epci.nom;
        }
    }
    
    // Afficher un loader
    infoEl.innerHTML = `🔄 Chargement des communes de ${epciNom}...`;
    infoEl.style.color = 'var(--text-light)';
    
    try {
        const communes = await window.getCommunesIntercommunalite(code);
        if (communes && communes.length > 0) {
            infoEl.innerHTML = `📍 ${communes.length} communes : ${communes.slice(0, 5).join(', ')}${communes.length > 5 ? '...' : ''}`;
            infoEl.style.color = 'var(--primary)';
        } else {
            infoEl.innerHTML = '⚠️ Aucune commune trouvée';
            infoEl.style.color = 'var(--error)';
        }
    } catch (error) {
        console.error('Erreur updateIntercommunaliteInfo:', error);
        infoEl.innerHTML = '❌ Erreur de chargement';
        infoEl.style.color = 'var(--error)';
    }
}

async function saveGeoCriteria() {
    const type = document.getElementById('geo-type').value;
    let value = '';
    let displayName = '';
    
    if (type === 'commune') {
        value = document.getElementById('geo-commune').value.trim();
        const mode = document.getElementById('geo-commune-mode').value;
        
        if (!value) {
            showAlert('⚠️ Veuillez saisir un nom de commune', 'warning');
            return;
        }
        
        // Sauvegarder le mode
        localStorage.setItem('geo_criteria_commune_mode', mode);
        
        if (mode === 'exact') {
            // Mode exact : vérifier les homonymes
            showAlert('🔍 Vérification de la commune...', 'info');
            const homonymes = await checkCommuneHomonymes(value);
            
            console.log('🔍 Homonymes trouvés:', homonymes.length, homonymes);
            
            if (homonymes.length > 1) {
                // Il y a des homonymes, demander à l'utilisateur
                const choix = await showHomonymesModal(homonymes);
                
                if (choix === null) {
                    return; // Annulé
                } else if (choix === 'all') {
                    // Prendre toutes les communes homonymes
                    displayName = `${value} (${homonymes.length} villes) [Exact]`;
                    localStorage.setItem('geo_criteria_homonymes', JSON.stringify(homonymes));
                } else {
                    // Prendre une seule commune
                    displayName = `${homonymes[choix].commune} (${homonymes[choix].codePostal}) [Exact]`;
                    localStorage.setItem('geo_criteria_homonymes', JSON.stringify([homonymes[choix]]));
                }
            } else {
                displayName = `${value} [Exact]`;
                localStorage.removeItem('geo_criteria_homonymes');
            }
        } else {
            // Mode "contient" : pas de vérification d'homonymes
            displayName = `${value} [Contient]`;
            localStorage.removeItem('geo_criteria_homonymes');
        }
        
    } else if (type === 'intercommunalite') {
        value = document.getElementById('geo-intercommunalite').value;
        displayName = document.getElementById('geo-intercommunalite').selectedOptions[0]?.text || '';
    } else if (type === 'departement') {
        value = document.getElementById('geo-departement').value;
        displayName = document.getElementById('geo-departement').selectedOptions[0]?.text || '';
    } else if (type === 'academie') {
        value = document.getElementById('geo-academie').value;
        displayName = document.getElementById('geo-academie').selectedOptions[0]?.text || '';
    }
    
    if (!value) {
        showAlert('⚠️ Veuillez sélectionner un critère géographique', 'warning');
        return;
    }
    
    localStorage.setItem('geo_criteria_type', type);
    localStorage.setItem('geo_criteria_value', value);
    localStorage.setItem('geo_criteria_display', displayName);
    
    showAlert(`✅ Critères enregistrés : ${displayName}`, 'success');
}

/**
 * Affiche un modal pour choisir parmi les communes homonymes
 */
function showHomonymesModal(homonymes) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.style.zIndex = '10000';
        
        let optionsHTML = '';
        homonymes.forEach((h, index) => {
            optionsHTML += `
                <div class="homonyme-option" onclick="selectHomonyme(${index})" style="
                    padding: 15px;
                    margin: 10px 0;
                    border: 2px solid var(--border);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                " onmouseover="this.style.borderColor='var(--primary)'; this.style.background='var(--background)'" 
                   onmouseout="this.style.borderColor='var(--border)'; this.style.background='white'">
                    <strong>${h.commune}</strong> (${h.codePostal})<br>
                    <small style="color: var(--text-light)">Département ${h.departement} â€¢ ${h.count} établissement(s)</small>
                </div>
            `;
        });
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header" style="background: var(--warning); color: white;">
                    <h3>⚠️ Plusieurs villes trouvées</h3>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 20px;">
                        <strong>Plusieurs villes portent ce nom dans différents départements.</strong><br>
                        Choisissez celle qui vous intéresse :
                    </p>
                    ${optionsHTML}
                    <div style="margin-top: 20px; padding: 15px; background: var(--info-bg); border-left: 4px solid var(--info); border-radius: 4px;">
                        <strong>💡 Astuce :</strong> Vous pouvez aussi extraire toutes ces villes en même temps
                    </div>
                </div>
                <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn-secondary" onclick="closeHomonymesModal(null)">Annuler</button>
                    <button class="btn-primary" onclick="closeHomonymesModal('all')" style="background: var(--success);">
                        ✅ Toutes les prendre
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        window.selectHomonyme = (index) => {
            document.body.removeChild(modal);
            delete window.selectHomonyme;
            delete window.closeHomonymesModal;
            resolve(index);
        };
        
        window.closeHomonymesModal = (choice) => {
            document.body.removeChild(modal);
            delete window.selectHomonyme;
            delete window.closeHomonymesModal;
            resolve(choice);
        };
    });
}

function loadGeoCriteria() {
    // Cette fonction n'est plus nécessaire avec la nouvelle interface de recherche intelligente
    // Les critères géographiques sont maintenant gérés directement dans la recherche de commune
    // On garde la fonction vide pour éviter les erreurs mais on ne fait rien
    console.log('📍 loadGeoCriteria: fonction désactivée (nouvelle interface de recherche)');
}

/**
 * Charge les diplômes disponibles pour le périmètre géographique sélectionné
 */
async function chargerDiplomesDisponibles() {
    const typeElement = document.getElementById('geo-type');
    if (!typeElement) {
        console.error('chargerDiplomesDisponibles: élément geo-type non trouvé');
        return;
    }
    
    const type = typeElement.value;
    let value = '';
    
    if (type === 'commune') {
        const el = document.getElementById('geo-commune');
        value = el ? el.value : '';
    } else if (type === 'intercommunalite') {
        const el = document.getElementById('geo-intercommunalite');
        value = el ? el.value : '';
    } else if (type === 'departement') {
        const el = document.getElementById('geo-departement');
        value = el ? el.value : '';
    } else {
        const el = document.getElementById('geo-academie');
        value = el ? el.value : '';
    }
    
    console.log('🔍 chargerDiplomesDisponibles - Début');
    console.log('   Type géographique:', type);
    console.log('   Valeur:', value);
    
    if (!value) {
        showAlert('⚠️ Veuillez d\'abord sélectionner un critère géographique', 'warning');
        return;
    }
    
    const btn = document.getElementById('btn-charger-diplomes');
    btn.disabled = true;
    btn.textContent = '⏳ Chargement...';
    
    try {
        // Déterminer la facette géographique
        let facetParam = {};
        if (type === 'departement') {
            const nomDept = window.getNomDepartement(value);
            console.log(`   Département ${value} → Nom: ${nomDept}`);
            facetParam = { facet_departement: nomDept };
        } else if (type === 'academie') {
            const nomAcad = window.getNomAcademie(value);
            console.log(`   Académie ${value} → Nom: ${nomAcad}`);
            facetParam = { facet_academie: nomAcad };
        } else {
            console.warn(`   ⚠️ Type ${type} non supporté pour le chargement de diplômes`);
            showAlert('⚠️ Le chargement de diplômes n\'est disponible que pour département ou académie', 'warning');
            return;
        }
        
        console.log('   Facette construite:', facetParam);
        
        // Récupérer les diplômes avec facettes niveau
        const niveauBac = document.getElementById('filter-niveau-bac').checked;
        const niveauCap = document.getElementById('filter-niveau-cap').checked;
        
        console.log('   Niveaux sélectionnés: Bac =', niveauBac, ', CAP =', niveauCap);
        
        if (!niveauBac && !niveauCap) {
            showAlert('⚠️ Veuillez sélectionner au moins un niveau (Bac ou CAP)', 'warning');
            return;
        }
        
        console.log('   Appel API getDiplomesDisponibles...');
        const diplomes = await onisepAPI.getDiplomesDisponibles(facetParam, niveauBac, niveauCap);
        console.log(`   ✅ ${diplomes.length} diplômes reçus`);
        
        afficherListeDiplomes(diplomes);
        document.getElementById('diplomes-filter-container').style.display = 'block';
        
        showAlert(`✅ ${diplomes.length} diplôme(s) trouvé(s)`, 'success');
    } catch (error) {
        console.error('❌ Erreur chargement diplômes:', error);
        showAlert(`❌ Erreur: ${error.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '🔍 Charger les diplômes disponibles';
    }
}

/**
 * Affiche la liste des diplômes avec checkboxes
 */
function afficherListeDiplomes(diplomes) {
    // Stocker les diplômes globalement pour éviter les problèmes de parsing JSON
    window.diplomesDisponibles = diplomes;
    
    const container = document.getElementById('diplomes-list');
    
    if (diplomes.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 20px;">Aucun diplôme trouvé</p>';
        return;
    }
    
    // Grouper par niveau
    const parNiveau = {};
    diplomes.forEach((d, index) => {
        const niveau = d.niveau || 'Autre';
        if (!parNiveau[niveau]) parNiveau[niveau] = [];
        parNiveau[niveau].push({ ...d, index }); // Ajouter l'index
    });
    
    let html = '';
    for (const [niveau, liste] of Object.entries(parNiveau)) {
        html += `<div style="margin-bottom: 15px;">
            <div style="font-weight: 600; color: var(--primary); margin-bottom: 8px; padding: 8px; background: var(--background); border-radius: 4px;">
                ${niveau} (${liste.length})
            </div>`;
        
        liste.forEach(d => {
            // Échapper les caractères spéciaux pour l'affichage
            const intituleSafe = (d.intitule || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            
            html += `<label style="display: flex; align-items: start; gap: 8px; padding: 6px 8px; cursor: pointer; border-radius: 4px; transition: background 0.2s;"
                onmouseover="this.style.background='var(--background)'" 
                onmouseout="this.style.background='transparent'">
                <input type="checkbox" class="diplome-checkbox" data-diplome-index="${d.index}" checked>
                <span style="flex: 1;">${intituleSafe} <span style="color: var(--text-light); font-size: 0.9em;">(${d.nb_etablissements} étab.)</span></span>
            </label>`;
        });
        
        html += `</div>`;
    }
    
    container.innerHTML = html;
    
    // Ajouter event listeners
    document.querySelectorAll('.diplome-checkbox').forEach(cb => {
        cb.addEventListener('change', updateSelectionInfo);
    });
    
    updateSelectionInfo();
}

/**
 * Met à jour l'info de sélection
 */
function updateSelectionInfo() {
    const checkboxes = document.querySelectorAll('.diplome-checkbox:checked');
    const info = document.getElementById('diplomes-selection-info');
    
    if (checkboxes.length === 0) {
        info.innerHTML = '<strong>⚠️ Aucun diplôme sélectionné</strong> - L\'extraction se fera sans filtre';
        info.style.background = 'var(--warning-bg)';
        info.style.borderColor = 'var(--warning)';
    } else {
        info.innerHTML = `<strong>✅ ${checkboxes.length} diplôme(s) sélectionné(s)</strong>`;
        info.style.background = 'var(--success-bg)';
        info.style.borderColor = 'var(--success)';
    }
}

/**
 * Toggle tous les diplômes
 */
function toggleTousDiplomes(checked) {
    document.querySelectorAll('.diplome-checkbox').forEach(cb => {
        cb.checked = checked;
    });
    updateSelectionInfo();
}

/**
 * Reset le filtre diplômes
 */
function resetFiltreDiplomes() {
    document.getElementById('diplomes-filter-container').style.display = 'none';
    document.getElementById('diplomes-list').innerHTML = '';
}

/**
 * Récupère les diplômes sélectionnés
 */
function getDiplomesSelectionnes() {
    const checkboxes = document.querySelectorAll('.diplome-checkbox:checked');
    return Array.from(checkboxes).map(cb => {
        const index = parseInt(cb.dataset.diplomeIndex);
        return window.diplomesDisponibles[index];
    });
}

/**
 * Vérifie si une commune existe dans plusieurs départements
 * Retourne un tableau d'objets {commune, codePostal, departement}
 */
async function checkCommuneHomonymes(commune) {
    if (!onisepAPI) return [];
    
    try {
        // Toujours utiliser le mode exact pour la vérification des homonymes
        const structures = await onisepAPI.searchStructures({ 
            commune, 
            size: 1000,
            communeMode: 'exact'
        });
        
        // Extraire les codes postaux uniques
        const codesPostaux = new Set();
        const communesInfo = new Map();
        
        for (const structure of structures) {
            const cp = structure.code_postal;
            const communeNom = structure.commune;
            const dept = window.getDepartementFromCodePostal(cp);
            
            if (cp && communeNom && dept) {
                const key = `${communeNom}-${cp}`;
                if (!communesInfo.has(key)) {
                    communesInfo.set(key, {
                        commune: communeNom,
                        codePostal: cp,
                        departement: dept,
                        count: 1
                    });
                } else {
                    communesInfo.get(key).count++;
                }
            }
        }
        
        // Retourner les résultats groupés par code postal
        const results = Array.from(communesInfo.values());
        
        // Si plusieurs codes postaux différents (même commune, départements différents)
        const departementsUniques = new Set(results.map(r => r.departement));
        
        return departementsUniques.size > 1 ? results : [];
    } catch (error) {
        console.error('Erreur checkCommuneHomonymes:', error);
        return [];
    }
}

function confirmResetDatabase() {
    document.getElementById('reset-confirm-modal').classList.add('active');
}

function closeResetConfirmModal() {
    document.getElementById('reset-confirm-modal').classList.remove('active');
}

function executeResetDatabase() {
    closeResetConfirmModal();
    resetDatabase();
}

function saveOnisepCredentials() {
    const email = document.getElementById('settings-email').value;
    const password = document.getElementById('settings-password').value;
    const appId = document.getElementById('settings-app-id').value;
    const autoConnect = document.getElementById('settings-auto-connect').checked;
    
    if (email) {
        localStorage.setItem('settings_email', email);
    } else {
        localStorage.removeItem('settings_email');
    }
    
    if (password) {
        localStorage.setItem('settings_password', password);
    } else {
        localStorage.removeItem('settings_password');
    }
    
    if (appId) {
        localStorage.setItem('settings_app_id', appId);
    } else {
        localStorage.removeItem('settings_app_id');
    }
    
    localStorage.setItem('settings_auto_connect', autoConnect);
    
    showAlert('✅ Identifiants enregistrés avec succès', 'success');
    
    // Proposer de se connecter immédiatement
    if (email && password && appId && !onisepToken) {
        if (confirm('Voulez-vous vous connecter maintenant ?')) {
            autoConnectOnisep(email, password, appId);
        }
    }
}

function saveApiDelay() {
    const delay = document.getElementById('settings-api-delay').value;
    const delayMs = parseInt(delay);
    
    if (delayMs < 200 || delayMs > 5000) {
        alert('⚠️ Le délai doit être entre 200ms et 5000ms');
        return;
    }
    
    localStorage.setItem('api_request_delay', delayMs);
    
    // Mettre à jour l'instance API si elle existe
    if (window.onisepAPI) {
        window.onisepAPI.minRequestInterval = delayMs;
    }
    
    alert(`✅ Délai API mis à jour: ${delayMs}ms`);
    console.log(`✅ Nouveau délai API: ${delayMs}ms`);
}

function loadApiDelay() {
    const saved = localStorage.getItem('api_request_delay');
    if (saved) {
        document.getElementById('settings-api-delay').value = saved;
    }
}


function updateConnectionStatus() {
    const statusEl = document.getElementById('connection-status');
    const btnConnect = document.getElementById('btn-connect-settings');
    const btnDisconnect = document.getElementById('btn-disconnect-settings');
    
    if (onisepToken) {
        statusEl.className = 'connection-status connected';
        statusEl.innerHTML = '<span class="dot"></span><span>Connecté à Onisep</span>';
        
        if (btnConnect) btnConnect.style.display = 'none';
        if (btnDisconnect) btnDisconnect.style.display = 'block';
    } else {
        statusEl.className = 'connection-status disconnected';
        statusEl.innerHTML = '<span class="dot"></span><span>Non connecté</span>';
        
        if (btnConnect) btnConnect.style.display = 'block';
        if (btnDisconnect) btnDisconnect.style.display = 'none';
    }
}

async function connectFromSettings() {
    const email = document.getElementById('settings-email').value;
    const password = document.getElementById('settings-password').value;
    const appId = document.getElementById('settings-app-id').value;
    
    if (!email || !password) {
        showAlert('⚠️ Veuillez entrer votre email et mot de passe', 'error');
        return;
    }
    
    if (!appId) {
        showAlert('⚠️ Veuillez entrer votre Application ID', 'error');
        return;
    }
    
    try {
        showAlert('🔄 Connexion en cours...', 'info');
        const api = new OnisepAPI(null, appId);
        const token = await api.login(email, password);
        
        onisepToken = token;
        onisepAPI = api;
        localStorage.setItem('onisep_token', token);
        
        updateAuthUI(true);
        updateConnectionStatus();
        showAlert('✅ Connexion réussie !', 'success');
    } catch (error) {
        console.error('Erreur connexion:', error);
        showAlert('❌ Échec de la connexion : ' + error.message, 'error');
    }
}

async function autoConnectOnisep(email, password, appId) {
    try {
        console.log('🔄 Connexion automatique en cours...');
        const api = new OnisepAPI(null, appId);
        const token = await api.login(email, password);
        
        onisepToken = token;
        onisepAPI = api;
        localStorage.setItem('onisep_token', token);
        
        updateAuthUI(true);
        updateConnectionStatus();
        showAlert('✅ Connexion automatique réussie', 'success');
    } catch (error) {
        console.error('Erreur connexion auto:', error);
        showAlert('❌ Échec de la connexion automatique', 'error');
    }
}

// ═════════════════════════════════════════════════════════════
// ENRICHISSEMENT LANGUES depuis data.education.gouv.fr
// ═════════════════════════════════════════════════════════════

async function enrichirAvecLangues(silent = false) {
    try {
        // Vérifier qu'il y a des établissements en base
        const countResult = db.exec('SELECT COUNT(*) FROM lycees');
        const nbLycees = countResult[0]?.values[0][0] || 0;
        
        if (nbLycees === 0) {
            if (!silent) {
                showAlert('⚠️ Aucun établissement en base. Lancez d\'abord une extraction depuis Onisep.', 'warning');
            }
            return;
        }
        
        // Demander confirmation seulement si pas en mode silencieux
        if (!silent && !confirm(`Enrichir les ${nbLycees} établissements avec les langues depuis data.education.gouv.fr ?\n\nCela peut prendre quelques minutes.`)) {
            return;
        }
        
        // Récupérer tous les établissements
        const lyceesResult = db.exec('SELECT uai, nom FROM lycees ORDER BY nom');
        if (!lyceesResult[0]?.values) {
            if (!silent) {
                showAlert('❌ Erreur lors de la récupération des établissements', 'error');
            }
            return;
        }
        
        const lycees = lyceesResult[0].values;
        
        // Afficher la progression seulement si pas en mode silencieux
        let statusDiv = null;
        if (!silent) {
            statusDiv = document.getElementById('langues-enrichment-status');
            if (statusDiv) {
                statusDiv.textContent = `🔄 Enrichissement en cours... 0/${lycees.length}`;
            }
        } else {
            console.log(`🌍 Enrichissement automatique: ${lycees.length} établissements`);
        }
        
        // Supprimer les langues existantes
        db.run('DELETE FROM langues_par_lycee');
        
        let nbLanguesTotal = 0;
        let nbLyceesAvecLangues = 0;
        let errors = [];
        
        // Traiter établissement par établissement
        for (let i = 0; i < lycees.length; i++) {
            const [uai, nom] = lycees[i];
            
            try {
                // Essayer plusieurs datasets dans l'ordre
                // 1. fr-en-offre-langues-2d (collèges + lycées GT)
                // 2. fr-en-annuaire-education (tous établissements, champs langue_vivante_X)
                
                console.log(`🔍 Enrichissement ${nom} (${uai})`);
                
                let nbLanguesEtab = 0;
                let found = false;
                
                // TENTATIVE 1: Dataset offre-langues-2d (GT + collèges)
                try {
                    const url1 = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-offre-langues-2d/records?where=uai='${uai}'&limit=100`;
                    console.log(`   📍 Tentative 1: fr-en-offre-langues-2d`);
                    console.log(`   URL: ${url1}`);
                    
                    const response1 = await fetch(url1);
                    console.log(`   ðŸ“¡ HTTP Status: ${response1.status}`);
                    
                    if (response1.ok) {
                        const data1 = await response1.json();
                        console.log(`   📊 Résultats: ${data1.results?.length || 0}`);
                        
                        if (data1.results && data1.results.length > 0) {
                            found = true;
                            console.log(`   ✅ Trouvé dans fr-en-offre-langues-2d`);
                            
                            // Insérer les langues
                            for (const record of data1.results) {
                                const langue = record.langues || record.langue;
                                const niveau = record.enseignements || record.niveau || 'LV';
                                
                                if (langue) {
                                    db.run(`INSERT INTO langues_par_lycee (lycee_uai, langue, niveau) VALUES (?,?,?)`,
                                        [uai, langue, niveau]);
                                    nbLanguesEtab++;
                                }
                            }
                        }
                    }
                } catch (e1) {
                    console.log(`   ⚠️ Erreur dataset 1:`, e1.message);
                }
                
                // TENTATIVE 2: Annuaire éducation (champs langue_vivante_X)
                if (!found) {
                    try {
                        const url2 = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records?where=identifiant_de_l_etablissement='${uai}'&limit=1`;
                        console.log(`   📍 Tentative 2: fr-en-annuaire-education`);
                        console.log(`   URL: ${url2}`);
                        
                        const response2 = await fetch(url2);
                        console.log(`   ðŸ“¡ HTTP Status: ${response2.status}`);
                        
                        if (response2.ok) {
                            const data2 = await response2.json();
                            
                            if (data2.results && data2.results.length > 0) {
                                const etab = data2.results[0];
                                console.log(`   📋 Établissement trouvé`);
                                
                                // Extraire les langues des champs LV1/LV2/LV3
                                const languesLV1 = etab.langue_vivante_1 || '';
                                const languesLV2 = etab.langue_vivante_2 || '';
                                const languesLV3 = etab.langue_vivante_3 || '';
                                
                                console.log(`   🌍 LV1: "${languesLV1}"`);
                                console.log(`   🌍 LV2: "${languesLV2}"`);
                                console.log(`   🌍 LV3: "${languesLV3}"`);
                                
                                // Traiter LV1
                                if (languesLV1 && languesLV1.trim()) {
                                    found = true;
                                    const langues = languesLV1.split(';').map(l => l.trim()).filter(l => l);
                                    for (const langue of langues) {
                                        db.run(`INSERT INTO langues_par_lycee (lycee_uai, langue, niveau) VALUES (?,?,?)`,
                                            [uai, langue, 'LV1']);
                                        nbLanguesEtab++;
                                    }
                                }
                                
                                // Traiter LV2
                                if (languesLV2 && languesLV2.trim()) {
                                    found = true;
                                    const langues = languesLV2.split(';').map(l => l.trim()).filter(l => l);
                                    for (const langue of langues) {
                                        db.run(`INSERT INTO langues_par_lycee (lycee_uai, langue, niveau) VALUES (?,?,?)`,
                                            [uai, langue, 'LV2']);
                                        nbLanguesEtab++;
                                    }
                                }
                                
                                // Traiter LV3
                                if (languesLV3 && languesLV3.trim()) {
                                    found = true;
                                    const langues = languesLV3.split(';').map(l => l.trim()).filter(l => l);
                                    for (const langue of langues) {
                                        db.run(`INSERT INTO langues_par_lycee (lycee_uai, langue, niveau) VALUES (?,?,?)`,
                                            [uai, langue, 'LV3']);
                                        nbLanguesEtab++;
                                    }
                                }
                                
                                if (found) {
                                    console.log(`   ✅ Trouvé dans annuaire (champs LV1/2/3)`);
                                }
                            }
                        }
                    } catch (e2) {
                        console.log(`   ⚠️ Erreur dataset 2:`, e2.message);
                    }
                }
                
                // Résultat final
                if (nbLanguesEtab > 0) {
                    nbLyceesAvecLangues++;
                    nbLanguesTotal += nbLanguesEtab;
                    console.log(`   ✅ ${nbLanguesEtab} langue(s) ajoutée(s)`);
                } else {
                    console.log(`   ⚠️ Aucune langue trouvée (ni dataset 1, ni dataset 2)`);
                }
                
                // Mise à jour du statut
                if (statusDiv && ((i + 1) % 5 === 0 || (i + 1) === lycees.length)) {
                    statusDiv.textContent = `🔄 Enrichissement en cours... ${i + 1}/${lycees.length}`;
                }
                
                // Petit délai pour respecter les rate limits
                if ((i + 1) % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
            } catch (error) {
                errors.push(`${nom} (${uai}): ${error.message}`);
                console.error(`Erreur enrichissement ${uai}:`, error);
            }
        }
        
        // Sauvegarder la base
        const dbData = db.export();
        const buffer = new Uint8Array(dbData);
        localStorage.setItem('lycees_database', btoa(String.fromCharCode(...buffer)));
        
        // Recharger les stats
        loadStats();
        loadView();
        
        // Afficher le résultat selon le mode
        console.log(`✅ Enrichissement terminé: ${nbLyceesAvecLangues}/${lycees.length} établissements, ${nbLanguesTotal} langues`);
        
        if (!silent) {
            const message = `✅ Enrichissement terminé !\n\n` +
                `📊 ${nbLyceesAvecLangues}/${lycees.length} établissements avec langues\n` +
                `🌍 ${nbLanguesTotal} langues ajoutées\n` +
                (errors.length > 0 ? `\n⚠️ ${errors.length} erreurs` : '');
            
            const statusDiv = document.getElementById('langues-enrichment-status');
            if (statusDiv) {
                statusDiv.textContent = `✅ Dernière mise à jour : ${new Date().toLocaleString('fr-FR')}`;
            }
            showAlert(message, 'success');
        }
        
        if (errors.length > 0 && errors.length < 10) {
            console.warn('Erreurs enrichissement:', errors);
        }
        
    } catch (error) {
        console.error('Erreur enrichissement langues:', error);
        if (!silent) {
            showAlert(`❌ Erreur : ${error.message}`, 'error');
            const statusDiv = document.getElementById('langues-enrichment-status');
            if (statusDiv) {
                statusDiv.textContent = '❌ Échec';
            }
        }
    }
}

async function exportDatabaseWithDialog() {
    try {
        const data = db.export();
        const blob = new Blob([data], { type: 'application/x-sqlite3' });
        const filename = `lycees_rennes_${new Date().toISOString().slice(0,10)}.db`;
        
        // Vérifier si l'API File System Access est disponible (Chrome, Edge)
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'Base de données SQLite',
                        accept: { 'application/x-sqlite3': ['.db'] }
                    }]
                });
                
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                
                showAlert('✅ Base de données exportée avec succès', 'success');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    throw err;
                }
                // L'utilisateur a annulé
            }
        } else {
            // Fallback : téléchargement classique
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            showAlert('✅ Base de données exportée (téléchargements)', 'success');
        }
    } catch (error) {
        showAlert('❌ Erreur export : ' + error.message, 'error');
    }
}

function exportDatabase() {
    // Alias pour compatibilité avec l'ancien code
    exportDatabaseWithDialog();
}

function importDatabase() {
    document.getElementById('import-file-input').click();
}

async function handleImport(input) {
    const file = input.files[0];
    if (!file) return;
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Charger la nouvelle base
        db = new SQL.Database(uint8Array);
        
        // Sauvegarder dans localStorage
        const buffer = new Uint8Array(db.export());
        localStorage.setItem('lycees_database', btoa(String.fromCharCode(...buffer)));
        
        // Recharger l'interface
        loadStats();
        loadView();
        
        showAlert('✅ Base de données importée avec succès', 'success');
    } catch (error) {
        showAlert('❌ Erreur import : ' + error.message, 'error');
    }
}

// ===== FIN FONCTIONS PARAMÃˆTRES =====

function openLoginModal() {
    if (!onisepToken) {
        document.getElementById('login-modal').classList.add('active');
    }
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.remove('active');
}

function openHelpModal() {
    document.getElementById('help-modal').classList.add('active');
}

function closeHelpModal() {
    document.getElementById('help-modal').classList.remove('active');
}

async function loginOnisep() {
    const email = document.getElementById('onisep-email').value;
    const password = document.getElementById('onisep-password').value;
    const appId = document.getElementById('onisep-appid').value;
    
    if (!email || !password) {
        showAlert('⚠️ Veuillez entrer votre email et mot de passe', 'error');
        return;
    }
    
    if (!appId) {
        showAlert('⚠️ Veuillez entrer votre Application ID', 'error');
        return;
    }
    
    try {
        showAlert('🔄 Connexion en cours...', 'info');
        const api = new OnisepAPI(null, appId);
        const token = await api.login(email, password);
        onisepToken = token;
        onisepAPI = new OnisepAPI(token, appId);
        localStorage.setItem('onisep_token', token);
        localStorage.setItem('onisep_appid', appId);
        updateAuthUI(true);
        closeLoginModal();
        showAlert('✅ Connecté à l\'API Onisep !', 'success');
    } catch (error) {
        showAlert('❌ Erreur de connexion : ' + error.message, 'error');
    }
}

function logoutOnisep() {
    if (!onisepToken) return;
    if (confirm('ÃŠtes-vous sÃ»r de vouloir vous déconnecter ?')) {
        onisepToken = null;
        onisepAPI = null;
        localStorage.removeItem('onisep_token');
        updateAuthUI(false);
        showAlert('✅ Déconnecté', 'info');
    }
}

function updateAuthUI(connected) {
    const btnRefresh = document.getElementById('btn-refresh');
    
    if (connected) {
        if (btnRefresh) btnRefresh.disabled = false;
    } else {
        if (btnRefresh) btnRefresh.disabled = true;
    }
    
    // Mettre à jour le statut dans le panneau de paramètres
    updateConnectionStatus();
}

async function initDatabase() {
    const saved = localStorage.getItem('lycees_database');
    if (saved) {
        const buffer = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
        createTables();
    }
}

function createTables() {
    db.run(`CREATE TABLE IF NOT EXISTS lycees (
        uai TEXT PRIMARY KEY,
        nom TEXT, type TEXT, statut TEXT,
        adresse TEXT, code_postal TEXT, commune TEXT,
        telephone TEXT, longitude_x REAL, latitude_y REAL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS diplomes (
        intitule TEXT PRIMARY KEY,
        niveau TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS langues_par_lycee (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lycee_uai TEXT,
        langue TEXT,
        niveau TEXT,
        FOREIGN KEY (lycee_uai) REFERENCES lycees(uai)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS diplomes_par_lycee (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lycee_uai TEXT,
        diplome_intitule TEXT,
        FOREIGN KEY (lycee_uai) REFERENCES lycees(uai),
        FOREIGN KEY (diplome_intitule) REFERENCES diplomes(intitule)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS dispositifs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT UNIQUE,
        type TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS dispositifs_par_lycee (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lycee_uai TEXT,
        dispositif_nom TEXT,
        dispositif_type TEXT,
        FOREIGN KEY (lycee_uai) REFERENCES lycees(uai)
    )`);
}

function loadStats() {
    try {
        const stats = {
            lycees: db.exec('SELECT COUNT(*) FROM lycees')[0]?.values[0][0] || 0,
            diplomes: db.exec('SELECT COUNT(*) FROM diplomes')[0]?.values[0][0] || 0,
            dispositifs: db.exec('SELECT COUNT(*) FROM dispositifs')[0]?.values[0][0] || 0,
            langues: db.exec('SELECT COUNT(DISTINCT langue) FROM langues_par_lycee')[0]?.values[0][0] || 0
        };
        console.log('📊 Stats chargées:', stats);
        document.getElementById('stat-lycees').textContent = stats.lycees;
        document.getElementById('stat-diplomes').textContent = stats.diplomes;
        document.getElementById('stat-dispositifs').textContent = stats.dispositifs;
        document.getElementById('stat-langues').textContent = stats.langues;
    } catch (e) {
        console.error('❌ Erreur loadStats:', e);
        console.error('Stack:', e.stack);
    }
}

function loadLycees() {
    try {
        const result = db.exec('SELECT uai, nom, type, statut, commune FROM lycees ORDER BY nom');
        const container = document.getElementById('content-container');
        
        if (!result.length || !result[0].values.length) {
            container.innerHTML = '<div class="loading"><p>Aucun établissement. Connectez-vous puis cliquez sur "Rafraîchir depuis Onisep"</p></div>';
            return;
        }
        
        // Stocker les données pour le tri et filtrage
        window.lyceesData = result[0].values.map(([uai, nom, type, statut, commune]) => {
            const diplomesResult = db.exec('SELECT diplome_intitule FROM diplomes_par_lycee WHERE lycee_uai = ?', [uai]);
            const diplomes = diplomesResult.length > 0 ? diplomesResult[0].values.map(d => d[0]) : [];
            return { uai, nom, type, statut, commune, diplomes, diplomesCount: diplomes.length };
        });
        
        // Remplir le select des communes
        const communes = [...new Set(window.lyceesData.map(l => l.commune))].sort();
        const communeSelect = document.getElementById('filter-commune');
        if (communeSelect) {
            communeSelect.innerHTML = '<option value="">📍 Toutes les communes</option>' + 
                communes.map(c => `<option value="${c}">${c}</option>`).join('');
        }
        
        // Remplir le select des types
        const types = [...new Set(window.lyceesData.map(l => l.type || 'Non renseigné'))].sort();
        const typeSelect = document.getElementById('filter-type');
        if (typeSelect) {
            typeSelect.innerHTML = '<option value="">🏫 Tous les types</option>' + 
                types.map(t => `<option value="${t}">${t}</option>`).join('');
        }
        
        renderLyceesTable(window.lyceesData);
        setupFilters();
    } catch (e) {
        console.error('Erreur loadLycees:', e);
    }
}

function renderLyceesTable(data) {
    const container = document.getElementById('content-container');
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th style="width: 30%; cursor: pointer;" onclick="sortTable('nom')">
                        Nom <span class="sort-indicator">⇅</span>
                    </th>
                    <th style="width: 20%; cursor: pointer;" onclick="sortTable('type')">
                        Type <span class="sort-indicator">⇅</span>
                    </th>
                    <th style="width: 15%; cursor: pointer;" onclick="sortTable('statut')">
                        Statut <span class="sort-indicator">⇅</span>
                    </th>
                    <th style="width: 20%; cursor: pointer;" onclick="sortTable('commune')">
                        Commune <span class="sort-indicator">⇅</span>
                    </th>
                    <th style="width: 15%; text-align: center; cursor: pointer;" onclick="sortTable('diplomesCount')">
                        Diplômes <span class="sort-indicator">⇅</span>
                    </th>
                </tr>
            </thead>
            <tbody>
    `;
    
    for (const lycee of data) {
        html += `
            <tr data-uai="${lycee.uai}" class="lycee-row" style="cursor: pointer;">
                <td><strong>${lycee.nom || 'Sans nom'}</strong></td>
                <td>${lycee.type || '-'}</td>
                <td><span class="badge ${lycee.statut === 'public' ? 'badge-primary' : 'badge-success'}">${lycee.statut || '-'}</span></td>
                <td>${lycee.commune || '-'}</td>
                <td style="text-align: center;"><strong>${lycee.diplomesCount || 0}</strong></td>
            </tr>
        `;
    }
    
    html += '</tbody></table>';
    html += `<p style="margin-top: 15px; color: var(--text-light); font-size: 13px;">
        💡 <strong>${data.length}</strong> établissement(s) affiché(s)
    </p>`;
    
    container.innerHTML = html;
    
    console.log('✅ Tableau rendu avec', data.length, 'établissements');
}

// Event delegation GLOBAL sur le container (défini une seule fois)
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('content-container');
    if (container) {
        console.log('ðŸ”§ Installation du listener global sur content-container');
        
        container.addEventListener('click', function(e) {
            console.log('ðŸ‘† Clic détecté sur:', e.target);
            
            const row = e.target.closest('tr.lycee-row');
            if (row) {
                const uai = row.dataset.uai;
                console.log('✅ Ligne établissement cliquée, UAI:', uai);
                
                if (uai) {
                    showLyceeDetails(uai);
                } else {
                    console.error('❌ Pas d\'UAI sur cette ligne');
                }
            } else {
                console.log('â„¹ï¸  Clic hors ligne établissement');
            }
        });
    } else {
        console.error('❌ Container content-container non trouvé');
    }
});

let currentSort = { column: 'nom', direction: 'asc' };

function sortTable(column) {
    // Changer la direction si on clique sur la même colonne
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    // Trier les données
    const sorted = [...window.lyceesData].sort((a, b) => {
        let valA = a[column] || '';
        let valB = b[column] || '';
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Appliquer les filtres avant de rendre
    applyFilters();
}

function setupFilters() {
    const searchInput = document.getElementById('filter-search');
    const typeSelect = document.getElementById('filter-type');
    const communeSelect = document.getElementById('filter-commune');
    const statutSelect = document.getElementById('filter-statut');
    
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (typeSelect) typeSelect.addEventListener('change', applyFilters);
    if (communeSelect) communeSelect.addEventListener('change', applyFilters);
    if (statutSelect) statutSelect.addEventListener('change', applyFilters);
}

function applyFilters() {
    const searchTerm = document.getElementById('filter-search')?.value.toLowerCase() || '';
    const type = document.getElementById('filter-type')?.value || '';
    const commune = document.getElementById('filter-commune')?.value || '';
    const statut = document.getElementById('filter-statut')?.value || '';
    
    let filtered = [...window.lyceesData];
    
    // Appliquer le tri actuel
    filtered.sort((a, b) => {
        const column = currentSort.column;
        let valA = column === 'diplomes' ? a.diplomesCount : (a[column] || '');
        let valB = column === 'diplomes' ? b.diplomesCount : (b[column] || '');
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Filtrer par recherche
    if (searchTerm) {
        filtered = filtered.filter(lycee => 
            (lycee.nom || '').toLowerCase().includes(searchTerm) ||
            (lycee.type || '').toLowerCase().includes(searchTerm) ||
            (lycee.commune || '').toLowerCase().includes(searchTerm)
        );
    }
    
    // Filtrer par type
    if (type) {
        filtered = filtered.filter(lycee => (lycee.type || 'Non renseigné') === type);
    }
    
    // Filtrer par commune
    if (commune) {
        filtered = filtered.filter(lycee => lycee.commune === commune);
    }
    
    // Filtrer par statut
    if (statut) {
        filtered = filtered.filter(lycee => lycee.statut === statut);
    }
    
    renderLyceesTable(filtered);
}

function resetFilters() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-commune').value = '';
    document.getElementById('filter-statut').value = '';
    currentSort = { column: 'nom', direction: 'asc' };
    applyFilters();
}

function showLyceeDetails(uai) {
    console.log('🔍 showLyceeDetails appelée avec UAI:', uai);
    
    try {
        const lyceeResult = db.exec('SELECT nom, type, statut, commune, adresse, telephone FROM lycees WHERE uai = ?', [uai]);
        console.log('📊 Résultat SQL établissement:', lyceeResult);
        
        if (!lyceeResult.length) {
            console.error('❌ Aucun établissement trouvé pour UAI:', uai);
            return;
        }
        
        const [nom, type, statut, commune, adresse, telephone] = lyceeResult[0].values[0];
        console.log('✅ Établissement trouvé:', nom);
        
        // Récupérer les diplômes
        const diplomesResult = db.exec('SELECT diplome_intitule FROM diplomes_par_lycee WHERE lycee_uai = ?', [uai]);
        const diplomes = diplomesResult.length > 0 ? diplomesResult[0].values.map(d => d[0]) : [];
        console.log('ðŸ“œ Diplômes trouvés:', diplomes.length);
        
        // Organiser les diplômes par catégories
        const categories = {
            'CAP': [],
            'Bac Général et Technologique': [],
            'Bac Professionnel': [],
            'Bac+2': [],
            'Autre': []
        };
        
        diplomes.forEach(d => {
            const dLower = d.toLowerCase();
            if (dLower.includes('cap ') || dLower.startsWith('cap')) {
                categories['CAP'].push(d);
            } else if (dLower.includes('bac pro') || dLower.includes('bac+2')) {
                categories['Bac Professionnel'].push(d);
            } else if (dLower.includes('bts') || dLower.includes('dut') || dLower.includes('deust')) {
                categories['Bac+2'].push(d);
            } else if (dLower.includes('bac') || dLower.includes('baccalauréat')) {
                categories['Bac Général et Technologique'].push(d);
            } else {
                categories['Autre'].push(d);
            }
        });
        
        // Trier alphabétiquement dans chaque catégorie
        Object.keys(categories).forEach(cat => {
            categories[cat].sort();
        });
        
        // Générer HTML diplômes
        let diplomesHtml = '';
        if (diplomes.length > 0) {
            Object.keys(categories).forEach(cat => {
                if (categories[cat].length > 0) {
                    diplomesHtml += `
                        <div style="margin-bottom: 20px;">
                            <h4 style="color: var(--primary); margin-bottom: 10px; font-size: 15px; border-bottom: 2px solid var(--primary); padding-bottom: 5px;">
                                ${cat} (${categories[cat].length})
                            </h4>
                            <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                                ${categories[cat].map(d => `<li>${d}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }
            });
        } else {
            diplomesHtml = '<p style="color: var(--text-light); font-style: italic;">Aucun diplôme trouvé</p>';
        }
        
        // Récupérer les langues
        const languesResult = db.exec(`
            SELECT langue, niveau 
            FROM langues_par_lycee 
            WHERE lycee_uai = ? 
            ORDER BY niveau, langue
        `, [uai]);
        const langues = languesResult.length > 0 ? languesResult[0].values : [];
        console.log('🌍 Langues trouvées:', langues.length);
        
        // Générer HTML langues
        let languesHtml = '';
        if (langues.length > 0) {
            // Grouper par niveau
            const languesParNiveau = {};
            langues.forEach(([langue, niveau]) => {
                if (!languesParNiveau[niveau]) {
                    languesParNiveau[niveau] = [];
                }
                languesParNiveau[niveau].push(langue);
            });
            
            // Afficher par niveau
            Object.keys(languesParNiveau).sort().forEach(niveau => {
                languesHtml += `
                    <div style="margin-bottom: 15px;">
                        <h4 style="color: var(--primary); font-size: 14px; margin-bottom: 8px;">
                            ${niveau}
                        </h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${languesParNiveau[niveau].map(langue => `
                                <span style="padding: 6px 12px; background: var(--bg-light); border-radius: 6px; font-size: 13px; border: 1px solid var(--border);">
                                    ðŸŒ ${langue}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
        } else {
            languesHtml = '<p style="color: var(--text-light); font-style: italic;">â„¹ï¸ Aucune information de langues disponible pour cet établissement</p>';
        }
        
        // Afficher dans la modal
        document.getElementById('lycee-details-header').textContent = nom;
        document.getElementById('lycee-details-body').innerHTML = `
            <div style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid var(--border);">
                <p><strong>Type :</strong> ${type || '-'}</p>
                <p><strong>Statut :</strong> <span class="badge ${statut === 'public' ? 'badge-primary' : 'badge-success'}">${statut || '-'}</span></p>
                <p><strong>Commune :</strong> ${commune || '-'}</p>
                ${adresse ? `<p><strong>Adresse :</strong> ${adresse}</p>` : ''}
                ${telephone ? `<p><strong>Téléphone :</strong> â˜Ž ${telephone}</p>` : ''}
                <p><strong>Code UAI :</strong> ${uai}</p>
            </div>
            
            <div style="margin-bottom: 25px;">
                <h3 style="color: var(--primary); margin-bottom: 15px; font-size: 18px;">
                    ðŸ“œ Diplômes proposés (${diplomes.length})
                </h3>
                ${diplomesHtml}
            </div>
            
            <div>
                <h3 style="color: var(--primary); margin-bottom: 15px; font-size: 18px;">
                    🌍 Langues enseignées (${langues.length})
                </h3>
                ${languesHtml}
            </div>
        `;
        
        document.getElementById('lycee-details-modal').classList.add('active');
    } catch (error) {
        console.error('❌ Erreur dans showLyceeDetails:', error);
        showAlert('❌ Erreur lors de l\'affichage des détails : ' + error.message, 'error');
    }
}

function closeLyceeDetailsModal() {
    document.getElementById('lycee-details-modal').classList.remove('active');
}

// Alias pour compatibilité avec la carte
function showLyceeFiche(uai) {
    showLyceeDetails(uai);
}

async function refreshFromOnisep() {
    if (!onisepAPI) {
        showAlert('⚠️ Veuillez vous connecter d\'abord', 'error');
        openLoginModal();
        return;
    }
    
    // Réinitialiser le flag d'arrêt
    window.extractionStopped = false;
    
    // Récupérer les critères géographiques
    const geoType = localStorage.getItem('geo_criteria_type') || 'intercommunalite';
    const geoValue = localStorage.getItem('geo_criteria_value') || 'rennes_metropole';
    const geoDisplay = localStorage.getItem('geo_criteria_display') || 'Rennes Métropole';
    
    // VÉRIFICATION OBLIGATOIRE : Pour département/académie, filtrage par diplômes requis
    if (geoType === 'departement' || geoType === 'academie') {
        const diplomesSelectionnes = getDiplomesSelectionnes();
        
        if (diplomesSelectionnes.length === 0) {
            showAlert('⚠️ Le filtrage par diplômes est obligatoire pour les extractions par département ou académie.\n\nCliquez sur "🔍 Charger les diplômes disponibles" puis sélectionnez au moins un diplôme.', 'error');
            
            // Scroll vers la section diplômes
            document.getElementById('btn-charger-diplomes').scrollIntoView({ behavior: 'smooth', block: 'center' });
            document.getElementById('btn-charger-diplomes').style.animation = 'pulse 1s ease-in-out 3';
            
            return;
        }
        
        console.log(`🎓 ${diplomesSelectionnes.length} diplôme(s) sélectionné(s) pour le filtrage`);
    }
    
    console.log(`🌍 Extraction avec critères : ${geoType} = ${geoValue}`);
    
    const modal = document.getElementById('onisep-modal');
    modal.classList.add('active');
    
    // Réinitialiser et afficher le bouton Stop
    const btnStop = document.getElementById('btn-stop-extraction');
    btnStop.style.display = 'inline-block';  // Changé de 'block' à 'inline-block' pour le centrage
    btnStop.disabled = false;
    btnStop.textContent = '🛑 Arrêter l\'extraction';
    window.extractionStopped = false;  // Réinitialiser le flag
    
    try {
        let data;
        
        // Si département ou académie avec diplômes sélectionnés, utiliser extractByDiplomes
        if ((geoType === 'departement' || geoType === 'academie') && getDiplomesSelectionnes().length > 0) {
            const diplomesSelectionnes = getDiplomesSelectionnes();
            
            // Préparer la facette géographique
            let facetGeo = {};
            if (geoType === 'departement') {
                const nomDept = window.getNomDepartement(geoValue);
                facetGeo = { facet_departement: nomDept };
            } else if (geoType === 'academie') {
                const nomAcad = window.getNomAcademie(geoValue);
                facetGeo = { facet_academie: nomAcad };
            }
            
            data = await onisepAPI.extractByDiplomes(diplomesSelectionnes, facetGeo, progress => {
                const fill = document.getElementById('progress-fill');
                const message = document.getElementById('progress-message');
                const details = document.getElementById('progress-details');
                
                const percent = Math.round(progress.percent || 0);
                fill.style.width = `${percent}%`;
                fill.textContent = `${percent}%`;
                message.textContent = progress.message || '';
                
                if (progress.current && progress.total) {
                    details.textContent = `${progress.current} / ${progress.total}`;
                }
            });
        } else {
            // Extraction géographique normale
            data = await onisepAPI.extractByGeoCriteria(geoType, geoValue, progress => {
                const fill = document.getElementById('progress-fill');
                const message = document.getElementById('progress-message');
                const details = document.getElementById('progress-details');
                
                const percent = Math.round(progress.percent || 0);
                fill.style.width = `${percent}%`;
                fill.textContent = `${percent}%`;
                message.textContent = progress.message || '';
                
                if (progress.current && progress.total) {
                    details.textContent = `${progress.current} / ${progress.total}`;
                }
            });
        }
        
        await updateDatabase(data);
        
        // Enrichir automatiquement avec les langues
        console.log('🌍 Lancement enrichissement automatique des langues...');
        try {
            await enrichirAvecLangues(true); // true = mode silencieux
        } catch (error) {
            console.error('❌ Erreur enrichissement langues:', error);
            // Ne pas bloquer l'extraction si l'enrichissement échoue
        }
        
        document.getElementById('extraction-summary').innerHTML = `
            <div class="alert alert-success">
                <strong>✅ Extraction terminée avec succès !</strong>
                <p style="margin: 10px 0;"><strong>Zone :</strong> ${geoDisplay}</p>
                <ul style="margin: 10px 0 0 20px;">
                    <li>${data.lycees.length} établissements extraits</li>
                    <li>${data.diplomes_par_lycee.length} diplômes proposés (dont ${data.diplomes.length} uniques)</li>
                    <li>${data.stats.requestCount} requêtes API effectuées</li>
                </ul>
            </div>
            <button class="btn-primary" onclick="closeExtractionModal()" style="width:100%; margin-top:20px;">Fermer</button>
        `;
        document.getElementById('extraction-summary').style.display = 'block';
        
        // Cacher le bouton Stop (extraction terminée)
        document.getElementById('btn-stop-extraction').style.display = 'none';
        
        // Sauvegarder la date d'extraction
        localStorage.setItem('last_extraction_date', new Date().toISOString());
        updateLastExtractionDate();
        
        loadStats();
        loadView(); // Recharger la vue active au lieu de loadLycees()
        
        // Basculer automatiquement vers l'onglet Résultats (v0.13)
        switchToResults();
        
        const diplomesUniques = data.diplomes.length;
        const diplomesTotal = data.diplomes_par_lycee.length;
        showAlert(`✅ ${data.lycees.length} établissements et ${diplomesTotal} diplômes (dont ${diplomesUniques} uniques) extraits de ${geoDisplay} !`, 'success');
        
    } catch (error) {
        console.error('Erreur extraction:', error);
        console.error('Stack:', error.stack);
        
        // Gestion spécifique de l'annulation
        if (error.message.includes('annulée')) {
            document.getElementById('btn-stop-extraction').style.display = 'none';
            showAlert('⚠️ Extraction annulée', 'warning');
            document.getElementById('extraction-summary').innerHTML = `
                <div class="alert" style="background: #fff3cd; color: #856404; border-left: 4px solid #ffc107;">
                    <strong>⚠️ Extraction annulée</strong>
                    <p style="margin: 10px 0;">L'extraction a été interrompue par l'utilisateur.</p>
                </div>
                <button class="btn-primary" onclick="closeExtractionModal()" style="width:100%; margin-top:20px;">Fermer</button>
            `;
            document.getElementById('extraction-summary').style.display = 'block';
        } else {
            // Cacher le bouton Stop en cas d'erreur
            document.getElementById('btn-stop-extraction').style.display = 'none';
            
            // Log plus détaillé pour identifier le problème
            if (error.message.includes('undefined')) {
                console.error('⚠️ Problème avec des valeurs undefined');
                console.error('Vérifiez les logs ci-dessus pour voir quelle donnée pose problème');
            }
            
            showAlert('❌ Erreur lors de l\'extraction : ' + error.message + '\n\nConsultez la console (F12) pour plus de détails.', 'error');
            modal.classList.remove('active');
        }
    }
}

// Variable globale pour contrôler l'arrêt de l'extraction
window.extractionStopped = false;

function stopExtraction() {
    window.extractionStopped = true;
    document.getElementById('progress-message').textContent = '🛑 Arrêt en cours...';
    document.getElementById('btn-stop-extraction').disabled = true;
    document.getElementById('btn-stop-extraction').textContent = '⏳ Arrêt...';
    showAlert('⚠️ Extraction en cours d\'arrêt...', 'warning');
}

function closeExtractionModal() {
    document.getElementById('onisep-modal').classList.remove('active');
    document.getElementById('extraction-summary').style.display = 'none';
    document.getElementById('btn-stop-extraction').style.display = 'none';
    window.extractionStopped = false;
}

async function updateDatabase(data) {
    try {
        // S'assurer qu'il n'y a pas de transaction en cours
        try {
            db.run('COMMIT');
        } catch(e) {
            // Pas de transaction en cours, c'est OK
        }
        
        db.run('BEGIN');
        db.run('DELETE FROM lycees');
        db.run('DELETE FROM diplomes');
        db.run('DELETE FROM langues_par_lycee');
        db.run('DELETE FROM diplomes_par_lycee');
        db.run('DELETE FROM dispositifs');
        db.run('DELETE FROM dispositifs_par_lycee');
        
        console.log('📊 Insertion des données dans la base...');
        console.log(`- ${data.lycees.length} établissements`);
        console.log(`- ${data.diplomes.length} diplômes`);
        
        // Insérer établissements avec UAI comme clé primaire (ignorer les doublons)
        for (const l of data.lycees) {
            try {
                db.run(`INSERT OR IGNORE INTO lycees VALUES (?,?,?,?,?,?,?,?,?,?)`,
                    [
                        l.code_uai || null,
                        l.nom || null,
                        l.type_detablissement || null,
                        l.statut || null,
                        l.adresse || null,
                        l.cp || null,
                        l.commune || null,
                        l.telephone || null,
                        l.longitude_x || null,
                        l.latitude_y || null
                    ]);
            } catch (e) {
                console.error('Erreur insertion établissement:', l, e);
            }
        }
        
        // Insérer diplômes avec intitulé comme clé primaire (ignorer les doublons)
        for (const d of data.diplomes) {
            try {
                db.run(`INSERT OR IGNORE INTO diplomes VALUES (?,?)`, 
                    [
                        d.intitule || null,
                        d.niveau || null
                    ]);
            } catch (e) {
                console.error('Erreur insertion diplôme:', d, e);
            }
        }
    
    
    // Insérer relations diplomes_par_lycee (ignorer les doublons)
    if (data.diplomes_par_lycee) {
        for (const rel of data.diplomes_par_lycee) {
            try {
                db.run(`INSERT OR IGNORE INTO diplomes_par_lycee (lycee_uai, diplome_intitule) VALUES (?,?)`,
                    [
                        rel.lycee_uai || null,
                        rel.diplome_intitule || null
                    ]);
            } catch (e) {
                console.error('Erreur insertion relation diplôme-établissement:', rel, e);
            }
        }
    }
    
    // Insérer dispositifs
    if (data.dispositifs) {
        for (const dispositif of data.dispositifs) {
            try {
                db.run(`INSERT OR IGNORE INTO dispositifs (nom, type) VALUES (?,?)`,
                    [dispositif.nom || null, dispositif.type || null]);
            } catch (e) {
                console.error('Erreur insertion dispositif:', dispositif, e);
            }
        }
    }
    
    // Insérer relations dispositifs_par_lycee
    if (data.dispositifs_par_lycee) {
        for (const rel of data.dispositifs_par_lycee) {
            try {
                db.run(`INSERT OR IGNORE INTO dispositifs_par_lycee (lycee_uai, dispositif_nom, dispositif_type) VALUES (?,?,?)`,
                    [rel.lycee_uai || null, rel.dispositif_nom || null, rel.dispositif_type || null]);
            } catch (e) {
                console.error('Erreur insertion relation dispositif-établissement:', rel, e);
            }
        }
    }
    
        db.run('COMMIT');
        
        console.log('✅ Toutes les données insérées');
        
        const dbData = db.export();
        const buffer = new Uint8Array(dbData);
        localStorage.setItem('lycees_database', btoa(String.fromCharCode(...buffer)));
    } catch (error) {
        // En cas d'erreur, rollback
        try {
            db.run('ROLLBACK');
        } catch(e) {
            // Ignore si ROLLBACK échoue
        }
        throw error;
    }
}

function exportDatabase() {
    const data = db.export();
    const blob = new Blob([data], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lycees_rennes_v0.7_${new Date().toISOString().split('T')[0]}.db`;
    a.click();
    URL.revokeObjectURL(url);
    showAlert('✅ Base de données téléchargée', 'success');
}

function resetDatabase() {
    console.log('ðŸ—‘ï¸ Suppression de la base de données...');
    localStorage.removeItem('lycees_database');
    localStorage.removeItem('last_extraction_date');
    
    // Recréer une nouvelle base vide
    db = new SQL.Database();
    createTables();
    
    loadStats();
    loadView();
    updateLastExtractionDate();
    
    showAlert('✅ Base de données vidée. Vous pouvez maintenant extraire depuis Onisep ou importer un fichier.', 'success');
}

function switchView(view) {
    currentView = view;
    console.log('📊 Changement de vue :', view);
    
    // Mettre à jour les stats cards
    document.querySelectorAll('.stat-card').forEach(card => card.classList.remove('active'));
    document.querySelector(`.stat-card[onclick*="${view}"]`)?.classList.add('active');
    
    // Charger la vue
    loadView();
}

function loadView() {
    switch (currentView) {
        case 'lycees':
            loadLyceesView();
            break;
        case 'diplomes':
            loadDiplomesView();
            break;
        
        case 'dispositifs':
            loadDispositifsView();
            break;
        case 'langues':
            loadLanguesView();
            break;
    }
}

function loadLyceesView() {
    document.getElementById('view-title').textContent = '📚 Liste des Établissements';
    document.getElementById('view-subtitle').textContent = '💡 Cliquez sur un établissement pour voir ses diplômes et formations';
    document.getElementById('filters-container').style.display = 'flex';
    
    loadLycees();
}

function loadDiplomesView() {
    document.getElementById('view-title').textContent = '🎓 Liste des Diplômes';
    document.getElementById('view-subtitle').textContent = '💡 Cliquez sur un diplôme pour voir quels établissements le proposent';
    
    // Afficher les filtres pour les diplômes
    const filtersContainer = document.getElementById('filters-container');
    filtersContainer.style.display = 'flex';
    filtersContainer.innerHTML = `
        <input type="text" id="filter-search-diplomes" placeholder="🔍 Rechercher un diplôme..." 
            style="flex: 1; min-width: 250px; padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;">
        
        <select id="filter-niveau" style="padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;">
            <option value="">📊 Tous les niveaux</option>
        </select>
        
        <button class="btn-secondary" onclick="resetFiltersDiplomes()" style="padding: 10px 20px;">
            🔄 Réinitialiser
        </button>
    `;
    
    const container = document.getElementById('content-container');
    
    try {
        const result = db.exec('SELECT intitule, niveau FROM diplomes ORDER BY niveau, intitule');
        
        if (!result.length || !result[0].values.length) {
            container.innerHTML = '<div class="loading"><p>Aucun diplôme extrait. Lancez une extraction depuis Onisep.</p></div>';
            return;
        }
        
        // Stocker les données pour le tri et filtrage
        window.diplomesData = result[0].values.map(([intitule, niveau]) => {
            // Compter combien de établissements proposent ce diplôme
            const lyceesResult = db.exec(`
                SELECT DISTINCT l.nom, l.uai 
                FROM lycees l 
                JOIN diplomes_par_lycee dpl ON l.uai = dpl.lycee_uai 
                WHERE dpl.diplome_intitule = ?
            `, [intitule]);
            
            const lycees = lyceesResult.length > 0 ? lyceesResult[0].values.map(v => ({ nom: v[0], uai: v[1] })) : [];
            
            return { intitule, niveau, lycees, lyceesCount: lycees.length };
        });
        
        // Remplir le select des niveaux
        const niveaux = [...new Set(window.diplomesData.map(d => d.niveau))].sort();
        const niveauSelect = document.getElementById('filter-niveau');
        if (niveauSelect) {
            niveauSelect.innerHTML = '<option value="">📊 Tous les niveaux</option>' + 
                niveaux.map(n => `<option value="${n}">${n}</option>`).join('');
        }
        
        renderDiplomesTable(window.diplomesData);
        setupFiltersDiplomes();
    } catch (e) {
        console.error('Erreur loadDiplomesView:', e);
        container.innerHTML = '<div class="loading"><p>Erreur lors du chargement des diplômes</p></div>';
    }
}

function renderDiplomesTable(data) {
    const container = document.getElementById('content-container');
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th style="width: 50%; cursor: pointer;" onclick="sortTableDiplomes('intitule')">
                        Diplôme <span class="sort-indicator">⇅</span>
                    </th>
                    <th style="width: 25%; cursor: pointer;" onclick="sortTableDiplomes('niveau')">
                        Niveau <span class="sort-indicator">⇅</span>
                    </th>
                    <th style="width: 25%; text-align: center; cursor: pointer;" onclick="sortTableDiplomes('lyceesCount')">
                        Établissements <span class="sort-indicator">⇅</span>
                    </th>
                </tr>
            </thead>
            <tbody>
    `;
    
    for (const diplome of data) {
        html += `
            <tr onclick="showDiplomeDetails('${diplome.intitule.replace(/'/g, "\\'")}', ${diplome.lyceesCount})" style="cursor: pointer;">
                <td><strong>${diplome.intitule}</strong></td>
                <td><span class="badge badge-primary">${diplome.niveau}</span></td>
                <td style="text-align: center;"><strong>${diplome.lyceesCount}</strong></td>
            </tr>
        `;
    }
    
    html += '</tbody></table>';
    html += `<p style="margin-top: 15px; color: var(--text-light); font-size: 13px;">
        💡 <strong>${data.length}</strong> diplôme(s) affiché(s)
    </p>`;
    
    container.innerHTML = html;
}

let currentSortDiplomes = { column: 'intitule', direction: 'asc' };

function sortTableDiplomes(column) {
    if (currentSortDiplomes.column === column) {
        currentSortDiplomes.direction = currentSortDiplomes.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortDiplomes.column = column;
        currentSortDiplomes.direction = 'asc';
    }
    
    const sorted = [...window.diplomesData].sort((a, b) => {
        let valA = a[column] || '';
        let valB = b[column] || '';
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return currentSortDiplomes.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortDiplomes.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    applyFiltersDiplomes();
}

function setupFiltersDiplomes() {
    const searchInput = document.getElementById('filter-search-diplomes');
    const niveauSelect = document.getElementById('filter-niveau');
    
    if (searchInput) searchInput.addEventListener('input', applyFiltersDiplomes);
    if (niveauSelect) niveauSelect.addEventListener('change', applyFiltersDiplomes);
}

function applyFiltersDiplomes() {
    const searchTerm = document.getElementById('filter-search-diplomes')?.value.toLowerCase() || '';
    const niveau = document.getElementById('filter-niveau')?.value || '';
    
    let filtered = [...window.diplomesData];
    
    // Appliquer le tri actuel
    filtered.sort((a, b) => {
        const column = currentSortDiplomes.column;
        let valA = column === 'lycees' ? a.lyceesCount : (a[column] || '');
        let valB = column === 'lycees' ? b.lyceesCount : (b[column] || '');
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return currentSortDiplomes.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortDiplomes.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Filtrer par recherche
    if (searchTerm) {
        filtered = filtered.filter(diplome => 
            (diplome.intitule || '').toLowerCase().includes(searchTerm)
        );
    }
    
    // Filtrer par niveau
    if (niveau) {
        filtered = filtered.filter(diplome => diplome.niveau === niveau);
    }
    
    renderDiplomesTable(filtered);
}

function resetFiltersDiplomes() {
    document.getElementById('filter-search-diplomes').value = '';
    document.getElementById('filter-niveau').value = '';
    currentSortDiplomes = { column: 'intitule', direction: 'asc' };
    applyFiltersDiplomes();
}

function showDiplomeDetails(intitule, lyceesCount) {
    console.log('🎓 showDiplomeDetails appelée pour:', intitule);
    
    try {
        const lyceesResult = db.exec(`
            SELECT DISTINCT l.nom, l.commune, l.statut, l.uai
            FROM lycees l 
            JOIN diplomes_par_lycee dpl ON l.uai = dpl.lycee_uai 
            WHERE dpl.diplome_intitule = ?
            ORDER BY l.nom
        `, [intitule]);
        
        const lycees = lyceesResult.length > 0 ? lyceesResult[0].values : [];
        
        const lyceesHtml = lycees.length > 0
            ? `<ul style="margin: 10px 0; padding-left: 20px;">
                ${lycees.map(([nom, commune, statut, uai]) => 
                    `<li><strong>${nom}</strong> - ${commune} 
                    <span class="badge ${statut === 'public' ? 'badge-primary' : 'badge-success'}">${statut}</span>
                    </li>`
                ).join('')}
               </ul>`
            : '<p style="color: #999;">Aucun établissement ne propose ce diplôme</p>';
        
        document.getElementById('lycee-details-header').textContent = intitule;
        document.getElementById('lycee-details-body').innerHTML = `
            <div>
                <h3 style="color: var(--primary); margin-bottom: 10px;">🏫 Établissements proposant ce diplôme (${lyceesCount})</h3>
                ${lyceesHtml}
            </div>
        `;
        
        document.getElementById('lycee-details-modal').classList.add('active');
    } catch (error) {
        console.error('❌ Erreur dans showDiplomeDetails:', error);
        showAlert('❌ Erreur lors de l\'affichage des détails : ' + error.message, 'error');
    }
}

function showFormationDetails(intitule, diplome_associe, lyceesCount) {
    console.log('🎯 showFormationDetails appelée pour:', intitule);
    
    try {
        const lyceesResult = db.exec(`
            SELECT DISTINCT l.nom, l.commune, l.statut, l.uai
            FROM lycees l 
            JOIN formations_par_lycee fpl ON l.uai = fpl.lycee_uai 
            WHERE fpl.formation_intitule = ?
            ORDER BY l.nom
        `, [intitule]);
        
        const lycees = lyceesResult.length > 0 ? lyceesResult[0].values : [];
        
        const lyceesHtml = lycees.length > 0
            ? `<ul style="margin: 10px 0; padding-left: 20px;">
                ${lycees.map(([nom, commune, statut, uai]) => 
                    `<li><strong>${nom}</strong> - ${commune} 
                    <span class="badge ${statut === 'public' ? 'badge-primary' : 'badge-success'}">${statut}</span>
                    </li>`
                ).join('')}
               </ul>`
            : '<p style="color: #999;">Aucun établissement ne propose cette formation</p>';
        
        const diplomeHtml = diplome_associe && diplome_associe !== '-'
            ? `<div style="margin-bottom: 20px;">
                <h3 style="color: var(--primary); margin-bottom: 10px;">🎓 Diplôme préparé</h3>
                <p><span class="badge badge-success">${diplome_associe}</span></p>
               </div>`
            : `<div style="margin-bottom: 20px;">
                <h3 style="color: var(--primary); margin-bottom: 10px;">🎓 Diplôme préparé</h3>
                <p style="color: #999;"><em>Cette formation ne prépare pas directement à un diplôme (ex: CPGE prépare aux concours)</em></p>
               </div>`;
        
        document.getElementById('lycee-details-header').textContent = intitule;
        document.getElementById('lycee-details-body').innerHTML = `
            ${diplomeHtml}
            <div>
                <h3 style="color: var(--primary); margin-bottom: 10px;">🏫 Établissements proposant cette formation (${lyceesCount})</h3>
                ${lyceesHtml}
            </div>
        `;
        
        document.getElementById('lycee-details-modal').classList.add('active');
    } catch (error) {
        console.error('❌ Erreur dans showFormationDetails:', error);
        showAlert('❌ Erreur lors de l\'affichage des détails : ' + error.message, 'error');
    }
}

function loadFormationsView() {
    document.getElementById('view-title').textContent = '🎯 Liste des Formations';
    document.getElementById('view-subtitle').textContent = '💡 Cliquez sur une formation pour voir les détails';
    
    // Afficher les filtres pour les formations
    const filtersContainer = document.getElementById('filters-container');
    filtersContainer.style.display = 'flex';
    filtersContainer.innerHTML = `
        <input type="text" id="filter-search-formations" placeholder="🔍 Rechercher une formation..." 
            style="flex: 1; min-width: 250px; padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;">
        
        <select id="filter-type-formation" style="padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;">
            <option value="">🎓 Tous les types</option>
            <option value="classe">Classes (2de, 1re, Term)</option>
            <option value="cpge">CPGE</option>
            <option value="autre">Autres</option>
        </select>
        
        <button class="btn-secondary" onclick="resetFiltersFormations()" style="padding: 10px 20px;">
            🔄 Réinitialiser
        </button>
    `;
    
    const container = document.getElementById('content-container');
    
    try {
        const result = db.exec('SELECT id_onisep, intitule, diplome_associe FROM formations ORDER BY intitule');
        
        if (!result.length || !result[0].values.length) {
            container.innerHTML = '<div class="loading"><p>Aucune formation extraite. Lancez une extraction depuis Onisep.</p></div>';
            return;
        }
        
        // Stocker les données pour le tri et filtrage
        window.formationsData = result[0].values.map(([id_onisep, intitule, diplome_associe]) => {
            // Déterminer le type
            let type = 'autre';
            const intituleLower = intitule.toLowerCase();
            if (intituleLower.includes('classe de') || intituleLower.includes('2de') || 
                intituleLower.includes('1re') || intituleLower.includes('terminale')) {
                type = 'classe';
            } else if (intituleLower.includes('préparatoire') || intituleLower.includes('cpge')) {
                type = 'cpge';
            }
            
            // Compter les établissements
            const lyceesResult = db.exec(`
                SELECT DISTINCT l.nom, l.commune, l.statut, l.uai
                FROM lycees l 
                JOIN formations_par_lycee fpl ON l.uai = fpl.lycee_uai 
                WHERE fpl.formation_intitule = ?
                ORDER BY l.nom
            `, [intitule]);
            
            const lycees = lyceesResult.length > 0 ? lyceesResult[0].values.map(v => ({
                nom: v[0], commune: v[1], statut: v[2], uai: v[3]
            })) : [];
            
            return { id_onisep, intitule, diplome_associe, type, lycees, lyceesCount: lycees.length };
        });
        
        renderFormationsTable(window.formationsData);
        setupFiltersFormations();
    } catch (e) {
        console.error('Erreur loadFormationsView:', e);
        container.innerHTML = '<div class="loading"><p>Erreur lors du chargement des formations</p></div>';
    }
}

let currentSortFormations = { column: 'intitule', direction: 'asc' };

function sortTableFormations(column) {
    if (currentSortFormations.column === column) {
        currentSortFormations.direction = currentSortFormations.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortFormations.column = column;
        currentSortFormations.direction = 'asc';
    }
    
    const sorted = [...window.formationsData].sort((a, b) => {
        let valA, valB;
        
        if (column === 'lycees') {
            valA = a.lyceesCount;
            valB = b.lyceesCount;
        } else {
            valA = a[column] || '';
            valB = b[column] || '';
        }
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return currentSortFormations.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortFormations.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    document.querySelectorAll('#formations-table th span').forEach(span => span.textContent = '↕ï¸');
    const sortIndicator = document.getElementById(`sort-form-${column}`);
    if (sortIndicator) {
        sortIndicator.textContent = currentSortFormations.direction === 'asc' ? '▲' : '▼';
    }
    
    applyFiltersFormations();
}

function setupFiltersFormations() {
    const searchInput = document.getElementById('filter-search-formations');
    const typeSelect = document.getElementById('filter-type-formation');
    
    if (searchInput) searchInput.addEventListener('input', applyFiltersFormations);
    if (typeSelect) typeSelect.addEventListener('change', applyFiltersFormations);
}

function applyFiltersFormations() {
    const searchTerm = document.getElementById('filter-search-formations')?.value.toLowerCase() || '';
    const type = document.getElementById('filter-type-formation')?.value || '';
    
    let filtered = [...window.formationsData];
    
    // Appliquer le tri actuel
    filtered.sort((a, b) => {
        const column = currentSortFormations.column;
        let valA = a[column] || '';
        let valB = b[column] || '';
        
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return currentSortFormations.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortFormations.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Filtrer par recherche
    if (searchTerm) {
        filtered = filtered.filter(formation => 
            (formation.intitule || '').toLowerCase().includes(searchTerm)
        );
    }
    
    // Filtrer par type
    if (type) {
        filtered = filtered.filter(formation => formation.type === type);
    }
    
    renderFormationsTable(filtered);
}

function resetFiltersFormations() {
    document.getElementById('filter-search-formations').value = '';
    document.getElementById('filter-type-formation').value = '';
    currentSortFormations = { column: 'intitule', direction: 'asc' };
    applyFiltersFormations();
}

function loadDispositifsView() {
    document.getElementById('view-title').textContent = '🎯 Liste des Dispositifs';
    document.getElementById('view-subtitle').textContent = '💡 Sections linguistiques, internats, ULIS, etc.';
    
    // Afficher les filtres pour les dispositifs
    const filtersContainer = document.getElementById('filters-container');
    filtersContainer.style.display = 'flex';
    filtersContainer.innerHTML = `
        <input type="text" id="filter-search-dispositifs" placeholder="🔍 Rechercher un dispositif..." 
            style="flex: 1; min-width: 250px; padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;">
        
        <select id="filter-type-dispositif" style="padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;">
            <option value="">🎯 Tous les types</option>
        </select>
        
        <button class="btn-secondary" onclick="resetFiltersDispositifs()" style="padding: 10px 20px;">
            🔄 Réinitialiser
        </button>
    `;
    
    const container = document.getElementById('content-container');
    
    try {
        const result = db.exec(`
            SELECT d.nom, d.type, COUNT(DISTINCT dpl.lycee_uai) as nb_lycees
            FROM dispositifs d
            LEFT JOIN dispositifs_par_lycee dpl ON d.nom = dpl.dispositif_nom
            GROUP BY d.nom, d.type
            ORDER BY d.type, d.nom
        `);
        
        if (!result.length || !result[0].values.length) {
            container.innerHTML = '<div class="loading"><p>Aucun dispositif extrait. Lancez une extraction depuis Onisep.</p></div>';
            return;
        }
        
        // Stocker les données pour le tri et filtrage
        window.dispositifsData = result[0].values.map(([nom, type, nb_lycees]) => {
            return { nom, type: type || 'Non classé', nb_lycees: nb_lycees || 0 };
        });
        
        // Remplir le select des types
        const types = [...new Set(window.dispositifsData.map(d => d.type))].sort();
        const typeSelect = document.getElementById('filter-type-dispositif');
        if (typeSelect) {
            typeSelect.innerHTML = '<option value="">🎯 Tous les types</option>' + 
                types.map(t => `<option value="${t}">${t}</option>`).join('');
        }
        
        renderDispositifsTable(window.dispositifsData);
        setupFiltersDispositifs();
    } catch (e) {
        console.error('Erreur loadDispositifsView:', e);
        container.innerHTML = '<div class="loading"><p>Erreur lors du chargement des dispositifs</p></div>';
    }
}

function renderDispositifsTable(data) {
    const container = document.getElementById('content-container');
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th style="width: 50%; cursor: pointer;" onclick="sortDispositifsTable('nom')">
                        Nom du dispositif <span class="sort-indicator">⇅</span>
                    </th>
                    <th style="width: 30%; cursor: pointer;" onclick="sortDispositifsTable('type')">
                        Type <span class="sort-indicator">⇅</span>
                    </th>
                    <th style="width: 20%; text-align: center; cursor: pointer;" onclick="sortDispositifsTable('nb_lycees')">
                        Établissements <span class="sort-indicator">⇅</span>
                    </th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach(dispositif => {
        html += `
            <tr onclick="showDispositifDetails('${dispositif.nom.replace(/'/g, "\\'")}')">
                <td><strong>${dispositif.nom}</strong></td>
                <td><span class="badge badge-primary">${dispositif.type}</span></td>
                <td style="text-align: center;"><strong>${dispositif.nb_lycees}</strong></td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    html += `<p style="margin-top: 15px; color: var(--text-light); font-size: 13px;">
        💡 <strong>${data.length}</strong> dispositif(s) affiché(s)
    </p>`;
    
    container.innerHTML = html;
    
    console.log(`✅ Tableau dispositifs rendu avec ${data.length} lignes`);
}

let dispositifsSortColumn = null;
let dispositifsSortDirection = 'asc';

function sortDispositifsTable(column) {
    if (dispositifsSortColumn === column) {
        dispositifsSortDirection = dispositifsSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        dispositifsSortColumn = column;
        dispositifsSortDirection = 'asc';
    }
    
    const sorted = [...window.dispositifsData].sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }
        
        if (valA < valB) return dispositifsSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return dispositifsSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    renderDispositifsTable(sorted);
}

function showDispositifDetails(nom) {
    try {
        const result = db.exec(`
            SELECT l.nom, l.commune, l.uai
            FROM lycees l
            JOIN dispositifs_par_lycee dpl ON l.uai = dpl.lycee_uai
            WHERE dpl.dispositif_nom = ?
            ORDER BY l.nom
        `, [nom]);
        
        if (!result.length || !result[0].values.length) {
            alert('Aucun établissement trouvé pour ce dispositif');
            return;
        }
        
        const lycees = result[0].values.map(([lyceeNom, commune, uai]) => 
            `<li><strong>${lyceeNom}</strong> (${commune}) - ${uai}</li>`
        ).join('');
        
        const modal = document.getElementById('lycee-details-modal');
        document.getElementById('lycee-details-header').textContent = `🎯 ${nom}`;
        document.getElementById('lycee-details-body').innerHTML = `
            <p style="margin-bottom: 15px;"><strong>${result[0].values.length} établissement(s) proposent ce dispositif :</strong></p>
            <ul style="line-height: 2;">${lycees}</ul>
        `;
        modal.classList.add('active');
    } catch (e) {
        console.error('Erreur showDispositifDetails:', e);
        alert('Erreur lors du chargement des détails');
    }
}

function setupFiltersDispositifs() {
    const searchInput = document.getElementById('filter-search-dispositifs');
    const typeSelect = document.getElementById('filter-type-dispositif');
    
    const applyFilters = () => {
        const search = searchInput.value.toLowerCase();
        const type = typeSelect.value;
        
        const filtered = window.dispositifsData.filter(d => {
            const matchSearch = d.nom.toLowerCase().includes(search);
            const matchType = !type || d.type === type;
            return matchSearch && matchType;
        });
        
        renderDispositifsTable(filtered);
    };
    
    searchInput.addEventListener('input', applyFilters);
    typeSelect.addEventListener('change', applyFilters);
}

function resetFiltersDispositifs() {
    document.getElementById('filter-search-dispositifs').value = '';
    document.getElementById('filter-type-dispositif').value = '';
    renderDispositifsTable(window.dispositifsData);
}

function loadLanguesView() {
    document.getElementById('view-title').textContent = '🌍 Langues Enseignées';
    document.getElementById('view-subtitle').textContent = '💡 Cliquez sur une langue pour voir les établissements';
    
    // Afficher les filtres
    const filtersContainer = document.getElementById('filters-container');
    filtersContainer.style.display = 'flex';
    filtersContainer.innerHTML = `
        <input type="text" id="filter-search-langues" placeholder="🔍 Rechercher une langue..." 
            style="flex: 1; min-width: 250px; padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;">
        
        <select id="filter-niveau-langue" style="padding: 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;">
            <option value="">📚 Tous les niveaux</option>
        </select>
        
        <button class="btn-secondary" onclick="resetFiltersLangues()" style="padding: 10px 20px;">
            🔄 Réinitialiser
        </button>
    `;
    
    const container = document.getElementById('content-container');
    
    // Vérifier si les langues sont en base
    try {
        const countResult = db.exec('SELECT COUNT(*) FROM langues_par_lycee');
        const nbLangues = countResult[0]?.values[0][0] || 0;
        
        if (nbLangues === 0) {
            // Message informatif
            container.innerHTML = `
                <div class="loading" style="text-align: center; padding: 40px;">
                    <p style="font-size: 18px; margin-bottom: 20px;">📚 Aucune langue chargée</p>
                    <p style="margin-bottom: 15px; color: var(--text-light);">
                        Les langues sont chargées automatiquement lors de l'extraction des établissements depuis Onisep.
                    </p>
                    <p style="color: var(--text-light);">
                        💡 Lancez une extraction géographique ou par diplômes pour obtenir les données.
                    </p>
                </div>`;
            return;
        }
        
        // Récupérer les langues avec comptage
        const result = db.exec(`
            SELECT lpl.langue, lpl.niveau, COUNT(DISTINCT lpl.lycee_uai) as nb_etablissements
            FROM langues_par_lycee lpl
            GROUP BY lpl.langue, lpl.niveau
            ORDER BY lpl.langue, lpl.niveau
        `);
        
        if (!result.length || !result[0].values.length) {
            container.innerHTML = '<div class="loading"><p>Erreur lors du chargement des langues</p></div>';
            return;
        }
        
        // Stocker les données pour le tri et filtrage
        window.languesData = result[0].values.map(([langue, niveau, nb_etablissements]) => {
            return { langue, niveau: niveau || 'Non spécifié', nb_etablissements: nb_etablissements || 0 };
        });
        
        // Remplir le select des niveaux
        const niveaux = [...new Set(window.languesData.map(l => l.niveau))].sort();
        const niveauSelect = document.getElementById('filter-niveau-langue');
        if (niveauSelect) {
            niveauSelect.innerHTML = '<option value="">📚 Tous les niveaux</option>' + 
                niveaux.map(n => `<option value="${n}">${n}</option>`).join('');
        }
        
        // Récupérer les établissements sans langues
        const lyceesResult = db.exec('SELECT uai, nom FROM lycees ORDER BY nom');
        const allLycees = lyceesResult[0]?.values || [];
        
        const lyceesWithLangues = db.exec('SELECT DISTINCT lycee_uai FROM langues_par_lycee');
        const uaisWithLangues = new Set((lyceesWithLangues[0]?.values || []).map(v => v[0]));
        
        window.lyceesSansLangues = allLycees.filter(([uai, nom]) => !uaisWithLangues.has(uai));
        
        renderLanguesTable(window.languesData);
        setupFiltersLangues();
        
    } catch (e) {
        console.error('Erreur loadLanguesView:', e);
        container.innerHTML = '<div class="loading"><p>Erreur lors du chargement des langues</p></div>';
    }
}

function renderLanguesTable(data) {
    const container = document.getElementById('content-container');
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th style="width: 40%; cursor: pointer;" onclick="sortLanguesTable('langue')">
                        Langue <span class="sort-indicator">⇅</span>
                    </th>
                    <th style="width: 30%; cursor: pointer;" onclick="sortLanguesTable('niveau')">
                        Niveau <span class="sort-indicator">⇅</span>
                    </th>
                    <th style="width: 30%; text-align: center; cursor: pointer;" onclick="sortLanguesTable('nb_etablissements')">
                        Établissements <span class="sort-indicator">⇅</span>
                    </th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach(langue => {
        html += `
            <tr onclick="showLangueDetails('${langue.langue.replace(/'/g, "\\'")}', '${langue.niveau.replace(/'/g, "\\'")}')">
                <td><strong>ðŸŒ ${langue.langue}</strong></td>
                <td><span class="badge badge-primary">${langue.niveau}</span></td>
                <td style="text-align: center;"><strong>${langue.nb_etablissements}</strong></td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    
    // Ajouter la liste des établissements sans langues
    if (window.lyceesSansLangues && window.lyceesSansLangues.length > 0) {
        html += `
            <div style="margin-top: 30px; padding: 20px; background: var(--bg-light); border-radius: 8px; border-left: 4px solid var(--warning);">
                <h3 style="margin-bottom: 15px; color: var(--text); font-size: 16px;">
                    ⚠️ Établissements sans information de langues
                    <span style="font-weight: normal; font-size: 14px; color: var(--text-light);">
                        (${window.lyceesSansLangues.length})
                    </span>
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 10px;">
                    ${window.lyceesSansLangues.map(([uai, nom]) => `
                        <div style="padding: 10px; background: white; border-radius: 6px; font-size: 14px;">
                            <strong>${nom}</strong>
                            <div style="font-size: 12px; color: var(--text-light); margin-top: 4px;">${uai}</div>
                        </div>
                    `).join('')}
                </div>
                <p style="margin-top: 15px; font-size: 13px; color: var(--text-light);">
                    💡 Ces établissements n'ont pas de données linguistiques disponibles dans les datasets publics.
                </p>
            </div>
        `;
    }
    
    html += `<p style="margin-top: 15px; color: var(--text-light); font-size: 13px;">
        💡 <strong>${data.length}</strong> combinaison(s) langue/niveau affichée(s)
    </p>`;
    
    container.innerHTML = html;
    
    console.log(`✅ Tableau langues rendu avec ${data.length} lignes`);
}

function setupFiltersLangues() {
    const searchInput = document.getElementById('filter-search-langues');
    const niveauSelect = document.getElementById('filter-niveau-langue');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterLangues);
    }
    if (niveauSelect) {
        niveauSelect.addEventListener('change', filterLangues);
    }
}

function filterLangues() {
    const searchTerm = document.getElementById('filter-search-langues')?.value.toLowerCase() || '';
    const niveauFilter = document.getElementById('filter-niveau-langue')?.value || '';
    
    let filtered = window.languesData.filter(langue => {
        const matchSearch = langue.langue.toLowerCase().includes(searchTerm);
        const matchNiveau = !niveauFilter || langue.niveau === niveauFilter;
        return matchSearch && matchNiveau;
    });
    
    renderLanguesTable(filtered);
}

function resetFiltersLangues() {
    document.getElementById('filter-search-langues').value = '';
    document.getElementById('filter-niveau-langue').value = '';
    renderLanguesTable(window.languesData);
}

let languesSortColumn = null;
let languesSortDirection = 'asc';

function sortLanguesTable(column) {
    if (languesSortColumn === column) {
        languesSortDirection = languesSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        languesSortColumn = column;
        languesSortDirection = 'asc';
    }
    
    const sorted = [...window.languesData].sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }
        
        if (valA < valB) return languesSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return languesSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    renderLanguesTable(sorted);
}

function showLangueDetails(langue, niveau) {
    try {
        const result = db.exec(`
            SELECT l.nom, l.commune, l.uai
            FROM langues_par_lycee lpl
            JOIN lycees l ON lpl.lycee_uai = l.uai
            WHERE lpl.langue = ? AND lpl.niveau = ?
            ORDER BY l.commune, l.nom
        `, [langue, niveau]);
        
        if (!result.length || !result[0].values.length) {
            showAlert('⚠️ Aucun établissement trouvé pour cette langue', 'warning');
            return;
        }
        
        const etablissements = result[0].values.map(([nom, commune, uai]) => 
            `<div style="padding: 10px; border-bottom: 1px solid var(--border);">
                <strong>${nom}</strong>
                <div style="font-size: 13px; color: var(--text-light); margin-top: 4px;">
                    ${commune} â€¢ ${uai}
                </div>
            </div>`
        ).join('');
        
        const modal = document.getElementById('lycee-details-modal');
        document.getElementById('lycee-details-header').textContent = `ðŸŒ ${langue} - ${niveau}`;
        document.getElementById('lycee-details-body').innerHTML = `
            <p style="margin-bottom: 15px; font-size: 15px;">
                <strong>${result[0].values.length} établissement(s)</strong> proposent cette langue :
            </p>
            <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border); border-radius: 8px;">
                ${etablissements}
            </div>
        `;
        modal.classList.add('active');
    } catch (e) {
        console.error('Erreur showLangueDetails:', e);
        showAlert('❌ Erreur lors du chargement des détails', 'error');
    }
}

// ========================================
// FONCTION DE TEST POUR LES ACADÉMIES
// ========================================
window.testAcademies = async function() {
    console.log('🔍 Test des académies disponibles dans l\'API Onisep...\n');
    
    try {
        const academies = await onisepAPI.getAcademiesDisponibles();
        console.log(`✅ ${academies.length} académies trouvées:\n`);
        academies.forEach((acad, i) => {
            console.log(`  ${i+1}. "${acad}"`);
        });
        
        console.log('\n📋 Mapping actuel dans getNomAcademie:');
        console.log('  Code 05 → "Caen"');
        console.log('  Code 14 → "Rennes"');
        console.log('  Code 21 → "Rouen"');
        
        console.log('\n💡 Pour tester une académie spécifique, utilisez:');
        console.log('  testAcademieSpecifique("Normandie")');
        
        return academies;
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
};

window.testAcademieSpecifique = async function(nomAcademie) {
    console.log(`🔍 Test de l'académie "${nomAcademie}"...\n`);
    
    const url = `https://api.opendata.onisep.fr/api/1.0/dataset/605340ddc19a9/search?size=10&facet.ens_academie=${encodeURIComponent(nomAcademie)}&facet.for_niveau_de_sortie=CAP+ou+équivalent`;
    
    console.log(`ðŸ“¡ URL: ${url}\n`);
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        console.log(`✅ Total: ${data.total || 0} résultats`);
        
        if (data.results && data.results.length > 0) {
            const academies = [...new Set(data.results.map(r => r.ens_academie))].filter(Boolean);
            const departements = [...new Set(data.results.map(r => r.ens_departement))].filter(Boolean);
            
            console.log(`\n🌍 Académies dans les résultats (${academies.length}):`);
            academies.forEach(a => console.log(`  - ${a}`));
            
            console.log(`\n📍 Départements dans les résultats (${departements.length}):`);
            departements.slice(0, 5).forEach(d => console.log(`  - ${d}`));
            if (departements.length > 5) console.log(`  ... et ${departements.length - 5} autres`);
            
            console.log(`\n📋 Premier établissement:`);
            console.log(`  Nom: ${data.results[0].ens_nom || 'N/A'}`);
            console.log(`  UAI: ${data.results[0].ens_code_uai}`);
            console.log(`  Académie: ${data.results[0].ens_academie}`);
            console.log(`  Département: ${data.results[0].ens_departement}`);
        } else {
            console.log('⚠️ Aucun résultat');
        }
        
        return data;
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
};

console.log('💡 Fonctions de test disponibles:');
console.log('  - testAcademies() : Liste toutes les académies');
console.log('  - testAcademieSpecifique("Normandie") : Teste une académie');

// ========================================
// FIN FONCTIONS DE TEST
// ========================================

// ========================================
// SYSTÃˆME DE FAVORIS v0.14
// ========================================

/**
 * Structure d'un favori :
 * {
 *   id: string (timestamp),
 *   nom: string,
 *   type: 'geo' | 'diplomes',
 *   date: string (ISO),
 *   params: {
 *     // Pour geo:
 *     commune: {nom, code, ...},
 *     epci: {...} | null,
 *     scope: 'commune' | 'epci'
 *     
 *     // Pour diplomes:
 *     geoType: 'departement' | 'academie',
 *     geoValue: string,
 *     geoDisplay: string,
 *     diplomes: [{intitule, niveau, uais, ...}]
 *   }
 * }
 */

const MAX_FAVORIS = 10;

// Charger les favoris depuis localStorage
function loadFavoris() {
    const stored = localStorage.getItem('favoris');
    return stored ? JSON.parse(stored) : [];
}

// Sauvegarder les favoris dans localStorage
function saveFavoris(favoris) {
    localStorage.setItem('favoris', JSON.stringify(favoris));
}

// Ajouter un favori
function ajouterFavori(nom, type, params) {
    const favoris = loadFavoris();
    
    // Vérifier limite
    if (favoris.length >= MAX_FAVORIS) {
        showAlert(`❌ Limite de ${MAX_FAVORIS} favoris atteinte. Supprimez-en un avant d'en ajouter.`, 'error');
        return false;
    }
    
    // Vérifier nom unique
    if (favoris.some(f => f.nom === nom)) {
        showAlert('❌ Un favori avec ce nom existe déjà', 'error');
        return false;
    }
    
    const favori = {
        id: Date.now().toString(),
        nom: nom,
        type: type,
        date: new Date().toISOString(),
        params: params
    };
    
    favoris.push(favori);
    saveFavoris(favoris);
    
    console.log('✅ Favori ajouté:', favori);
    showAlert(`✅ Favori "${nom}" sauvegardé !`, 'success');
    
    return true;
}

// Supprimer un favori
function supprimerFavori(id) {
    const favoris = loadFavoris();
    const favori = favoris.find(f => f.id === id);
    
    if (!favori) {
        showAlert('❌ Favori introuvable', 'error');
        return;
    }
    
    // Confirmation
    if (!confirm(`⚠️ Supprimer le favori "${favori.nom}" ?\n\nAttention, vous devrez utiliser l'onglet de recherche pour refaire cette extraction. ÃŠtes-vous sÃ»r ?`)) {
        return;
    }
    
    const nouveauxFavoris = favoris.filter(f => f.id !== id);
    saveFavoris(nouveauxFavoris);
    
    showAlert(`✅ Favori "${favori.nom}" supprimé`, 'success');
    afficherListeFavoris();
}

// Re-extraire depuis un favori
async function reextraireFavori(id) {
    const favoris = loadFavoris();
    const favori = favoris.find(f => f.id === id);
    
    if (!favori) {
        showAlert('❌ Favori introuvable', 'error');
        return;
    }
    
    // Confirmation
    if (!confirm(`🔄 Re-extraire "${favori.nom}" ?\n\n⚠️ Attention : ceci va écraser les données actuelles. ÃŠtes-vous sÃ»r ?`)) {
        return;
    }
    
    console.log('🔄 Re-extraction favori:', favori);
    
    // Fermer le panneau
    toggleSettings();
    
    try {
        if (favori.type === 'geo') {
            // Restaurer les paramètres géo
            window.selectedCommuneData = favori.params.commune;
            
            // Sauvegarder dans localStorage
            localStorage.setItem('geo_criteria_type', favori.params.scope === 'commune' ? 'commune' : 'intercommunalite');
            localStorage.setItem('geo_criteria_value', 
                favori.params.scope === 'commune' ? favori.params.commune.nom : favori.params.epci.code
            );
            localStorage.setItem('geo_criteria_display', 
                favori.params.scope === 'commune' ? favori.params.commune.nom : favori.params.epci.nom
            );
            
            if (favori.params.scope === 'commune') {
                localStorage.setItem('geo_criteria_commune_mode', 'exact');
            }
            
            // Lancer extraction
            await refreshFromOnisep();
            
        } else if (favori.type === 'diplomes') {
            // Restaurer le contexte diplômes
            window.tabContexteDiplomes = {
                type: favori.params.geoType,
                value: favori.params.geoValue,
                displayName: favori.params.geoDisplay,
                diplomes: favori.params.diplomes,
                facetGeo: favori.params.geoType === 'departement' 
                    ? { facet_departement: window.getNomDepartement(favori.params.geoValue) }
                    : { facet_academie: window.getNomAcademie(favori.params.geoValue) }
            };
            
            // Lancer extraction
            const modal = document.getElementById('onisep-modal');
            modal.classList.add('active');
            
            const data = await onisepAPI.extractByDiplomes(
                favori.params.diplomes,
                window.tabContexteDiplomes.facetGeo,
                progress => {
                    const fill = document.getElementById('progress-fill');
                    const message = document.getElementById('progress-message');
                    const details = document.getElementById('progress-details');
                    
                    const percent = Math.round(progress.percent || 0);
                    fill.style.width = `${percent}%`;
                    fill.textContent = `${percent}%`;
                    message.textContent = progress.message || '';
                    
                    if (progress.current && progress.total) {
                        details.textContent = `${progress.current} / ${progress.total}`;
                    }
                }
            );
            
            await updateDatabase(data);
            
            // Enrichir avec langues
            try {
                await enrichirAvecLangues(true);
            } catch (error) {
                console.error('❌ Erreur enrichissement langues:', error);
            }
            
            modal.classList.remove('active');
            
            // Afficher résumé
            loadStats();
            loadView();
            switchTab('resultats');
            
            showAlert(`✅ Re-extraction "${favori.nom}" terminée !`, 'success');
        }
    } catch (error) {
        console.error('❌ Erreur re-extraction:', error);
        showAlert(`❌ Erreur: ${error.message}`, 'error');
    }
}

// Afficher la liste des favoris dans le panneau
function afficherListeFavoris() {
    const favoris = loadFavoris();
    const container = document.getElementById('favoris-list');
    
    if (!container) return;
    
    if (favoris.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--text-light);">
                <div style="font-size: 48px; margin-bottom: 10px;">⭐</div>
                <p>Aucun favori enregistré</p>
                <p style="font-size: 13px; margin-top: 10px;">
                    Cochez "ðŸ’¾ Sauvegarder comme favori" dans l'onglet Recherche pour en créer un.
                </p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="margin-bottom: 15px; padding: 10px; background: var(--bg-light); border-radius: 6px;">
            <strong>${favoris.length}</strong> / ${MAX_FAVORIS} favori(s)
        </div>
    `;
    
    favoris.forEach(favori => {
        const date = new Date(favori.date);
        const typeIcon = favori.type === 'geo' ? '📍' : '🎓';
        const typeLabel = favori.type === 'geo' ? 'Géographique' : 'Par diplômes';
        
        html += `
            <div class="favori-item" style="margin-bottom: 10px; padding: 15px; background: white; border: 1px solid var(--border); border-radius: 8px;">
                <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 15px; margin-bottom: 5px;">
                            ${typeIcon} ${favori.nom}
                        </div>
                        <div style="font-size: 12px; color: var(--text-light);">
                            ${typeLabel} â€¢ ${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="setting-button" onclick="reextraireFavori('${favori.id}')" style="flex: 1; padding: 8px; font-size: 13px;">
                        🔄 Re-extraire
                    </button>
                    <button class="setting-button secondary" onclick="supprimerFavori('${favori.id}')" style="padding: 8px; font-size: 13px;">
                        ðŸ—‘ï¸
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Initialiser l'affichage des favoris au chargement du panneau
document.addEventListener('DOMContentLoaded', () => {
    // Afficher les favoris quand le panneau s'ouvre
    const originalToggle = window.toggleSettings;
    window.toggleSettings = function() {
        originalToggle();
        setTimeout(() => {
            if (document.getElementById('settings-panel').classList.contains('active')) {
                afficherListeFavoris();
            }
        }, 100);
    };
});


// ========================================
// IMPORT/EXPORT AMÉLIORÉ v0.14
// ========================================

// Exporter la base de données
async function exporterDonnees() {
    const nom = prompt('📁 Nom de l\'export (sans extension) :', 'export_' + new Date().toISOString().slice(0,10));
    
    if (!nom) return;
    
    try {
        const data = db.export();
        const blob = new Blob([data], { type: 'application/x-sqlite3' });
        
        // Générer nom de fichier avec timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `${nom}_${timestamp}.db`;
        
        // Créer lien de téléchargement
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAlert(`✅ Export réussi : ${filename}\n\nðŸ“‚ Le fichier est téléchargé dans votre dossier Téléchargements.\nDéplacez-le dans le même répertoire que l'application pour pouvoir l'importer.`, 'success');
        
    } catch (error) {
        console.error('Erreur export:', error);
        showAlert(`❌ Erreur lors de l'export : ${error.message}`, 'error');
    }
}

// Scanner les fichiers .db dans le répertoire courant
async function scannerFichiersImport() {
    const container = document.getElementById('import-files-list');
    
    container.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-light);">
            â„¹ï¸ Fonctionnalité en cours de développement
            <p style="font-size: 13px; margin-top: 10px;">
                Pour importer, utilisez le bouton "Importer un fichier" ci-dessous.
            </p>
        </div>
    `;
}

// Importer un fichier
async function importerFichier() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.db';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Confirmation
        if (!confirm(`⚠️ Importer "${file.name}" ?\n\nCeci va ÉCRASER toutes les données actuelles. ÃŠtes-vous sÃ»r ?`)) {
            return;
        }
        
        try {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                try {
                    const data = new Uint8Array(event.target.result);
                    db = new SQL.Database(data);
                    
                    // Recharger les stats et la vue
                    loadStats();
                    loadView();
                    
                    showAlert(`✅ Import réussi : ${file.name}`, 'success');
                } catch (error) {
                    console.error('Erreur import:', error);
                    showAlert(`❌ Erreur lors de l'import : ${error.message}`, 'error');
                }
            };
            
            reader.readAsArrayBuffer(file);
            
        } catch (error) {
            console.error('Erreur lecture fichier:', error);
            showAlert(`❌ Erreur lors de la lecture du fichier : ${error.message}`, 'error');
        }
    };
    
    input.click();
}


function showAlert(message, type) {
    const alerts = document.getElementById('alerts');
    const className = type === 'success' ? 'alert-success' : type === 'error' ? 'alert-error' : 'alert-info';
    const alert = document.createElement('div');
    alert.className = `alert ${className}`;
    alert.innerHTML = message;
    alerts.appendChild(alert);
    setTimeout(() => alert.remove(), type === 'info' ? 10000 : 5000);
}

// ═══════════════════════════════════════════════════
// v0.9 - FONCTIONS POUR LES 2 MODES D'EXTRACTION
// ═══════════════════════════════════════════════════

// Switch entre les modes
function switchExtractionMode() {
    const mode = document.querySelector('input[name="extraction-mode"]:checked').value;
    
    // Afficher/masquer les panneaux
    document.getElementById('panel-mode-geo').classList.toggle('active', mode === 'geo');
    document.getElementById('panel-mode-diplomes').classList.toggle('active', mode === 'diplomes');
    
    // Réinitialiser l'étape 2 si on quitte le mode diplômes
    if (mode === 'geo') {
        document.getElementById('diplomes-etape-2').style.display = 'none';
        document.getElementById('diplomes-etape-1').style.display = 'block';
    }
}

// ═════════════════════════════════════════════════════════════
// RECHERCHE INTELLIGENTE DE COMMUNE
// ═════════════════════════════════════════════════════════════

let smartSearchTimeout = null;
let currentSmartSelection = null;

/**
 * Gère la recherche intelligente de commune
 */
async function handleSmartSearch() {
    const input = document.getElementById('smart-search-commune');
    const query = input.value.trim();
    const helpDiv = document.getElementById('smart-search-help');
    const resultsDiv = document.getElementById('smart-search-results');
    
    // Réinitialiser le timeout
    if (smartSearchTimeout) {
        clearTimeout(smartSearchTimeout);
    }
    
    // Moins de 3 caractères : masquer les résultats
    if (query.length < 3) {
        resultsDiv.style.display = 'none';
        helpDiv.innerHTML = '💡 Entrez au moins 3 caractères pour rechercher';
        helpDiv.style.color = 'var(--text-light)';
        return;
    }
    
    // Afficher un loader
    helpDiv.innerHTML = '🔄 Recherche en cours...';
    helpDiv.style.color = 'var(--text-light)';
    
    // Débounce de 300ms
    smartSearchTimeout = setTimeout(async () => {
        await searchCommunes(query);
    }, 300);
}

/**
 * Recherche les communes via l'API geo.gouv.fr
 */
async function searchCommunes(query) {
    const helpDiv = document.getElementById('smart-search-help');
    const resultsDiv = document.getElementById('smart-search-results');
    const resultsList = document.getElementById('smart-search-results-list');
    
    try {
        // Appel API geo.gouv.fr pour rechercher les communes
        const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codeDepartement,codesPostaux,population&limit=100`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const communes = await response.json();
        
        if (communes.length === 0) {
            helpDiv.innerHTML = '❌ Aucune commune trouvée';
            helpDiv.style.color = 'var(--error)';
            resultsDiv.style.display = 'none';
            return;
        }
        
        // Afficher les résultats avec indication si limite atteinte
        let message = `✅ ${communes.length} commune${communes.length > 1 ? 's' : ''} trouvée${communes.length > 1 ? 's' : ''}`;
        if (communes.length >= 100) {
            message += ' (limite atteinte, affinez votre recherche en tapant plus de caractères)';
            helpDiv.style.color = 'var(--warning)';
        } else {
            helpDiv.style.color = 'var(--success)';
        }
        helpDiv.innerHTML = message;
        
        resultsList.innerHTML = communes.map(commune => `
            <div class="commune-result-item" 
                 onclick="selectCommune('${commune.code}')"
                 style="padding: 12px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s;"
                 onmouseover="this.style.background='var(--bg-light)'" 
                 onmouseout="this.style.background='white'">
                <div style="font-weight: 600; margin-bottom: 3px;">
                    📍 ${commune.nom}
                </div>
                <div style="font-size: 13px; color: var(--text-light);">
                    ${commune.codeDepartement} Â· ${commune.codesPostaux ? commune.codesPostaux[0] : ''} Â· 
                    ${commune.population ? commune.population.toLocaleString() + ' hab.' : ''}
                </div>
            </div>
        `).join('');
        
        resultsDiv.style.display = 'block';
        
    } catch (error) {
        console.error('Erreur recherche communes:', error);
        helpDiv.innerHTML = '❌ Erreur lors de la recherche';
        helpDiv.style.color = 'var(--error)';
        resultsDiv.style.display = 'none';
    }
}

/**
 * Sélectionne une commune et vérifie son EPCI
 */
async function selectCommune(codeCommune) {
    const helpDiv = document.getElementById('smart-search-help');
    const resultsDiv = document.getElementById('smart-search-results');
    
    // Masquer les résultats
    resultsDiv.style.display = 'none';
    
    // Afficher un loader
    helpDiv.innerHTML = '🔄 Vérification EPCI...';
    helpDiv.style.color = 'var(--text-light)';
    
    try {
        // Récupérer les infos de la commune + EPCI
        const url = `https://geo.api.gouv.fr/communes/${codeCommune}?fields=nom,code,codeDepartement,codesPostaux,population,codeEpci,epci`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const commune = await response.json();
        
        // Stocker la sélection
        currentSmartSelection = {
            type: 'commune',
            commune: commune,
            epci: commune.epci || null
        };
        
        // Afficher la sélection
        displaySmartSelection();
        
    } catch (error) {
        console.error('Erreur sélection commune:', error);
        helpDiv.innerHTML = '❌ Erreur lors de la sélection';
        helpDiv.style.color = 'var(--error)';
    }
}

/**
 * Affiche la sélection active avec proposition EPCI si applicable
 */
function displaySmartSelection() {
    const selectionDisplay = document.getElementById('smart-selection-display');
    const nameSpan = document.getElementById('selection-name');
    const detailsDiv = document.getElementById('selection-details');
    const extractBtn = document.getElementById('btn-extract-smart');
    const helpDiv = document.getElementById('smart-search-help');
    
    if (!currentSmartSelection) {
        selectionDisplay.style.display = 'none';
        extractBtn.disabled = true;
        return;
    }
    
    const { commune, epci } = currentSmartSelection;
    
    // Afficher la commune sélectionnée
    nameSpan.textContent = commune.nom;
    
    // Si la commune fait partie d'un EPCI, proposer le choix
    if (epci) {
        detailsDiv.innerHTML = `
            <div style="margin-top: 8px; padding: 10px; background: white; border-radius: 5px; border: 1px solid var(--border);">
                <div style="font-weight: 500; margin-bottom: 8px; color: var(--primary);">
                    ðŸ™ï¸ Cette commune fait partie de : <strong>${epci.nom}</strong>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="chooseExtractionScope('commune')" 
                            class="scope-choice-btn ${currentSmartSelection.type === 'commune' ? 'active' : ''}"
                            style="flex: 1; padding: 8px; border: 2px solid var(--border); border-radius: 5px; background: white; cursor: pointer; transition: all 0.2s;">
                        📍 Commune uniquement
                    </button>
                    <button onclick="chooseExtractionScope('epci')" 
                            class="scope-choice-btn ${currentSmartSelection.type === 'epci' ? 'active' : ''}"
                            style="flex: 1; padding: 8px; border: 2px solid var(--primary); border-radius: 5px; background: var(--bg-light); cursor: pointer; transition: all 0.2s;">
                        ðŸ™ï¸ Toute l'intercommunalité
                    </button>
                </div>
                <div style="font-size: 12px; color: var(--text-light); margin-top: 8px;" id="scope-info">
                    💡 Toute l'intercommunalité recommandé
                </div>
            </div>
        `;
    } else {
        detailsDiv.innerHTML = `
            <div style="margin-top: 5px; font-size: 13px; color: var(--text-light);">
                📍 Commune isolée (pas d'intercommunalité)
            </div>
        `;
    }
    
    selectionDisplay.style.display = 'block';
    extractBtn.disabled = false;
    helpDiv.innerHTML = '✅ Sélection active';
    helpDiv.style.color = 'var(--success)';
    
    // Ajouter le style pour les boutons actifs
    addScopeButtonStyles();
}

/**
 * Ajoute les styles CSS pour les boutons de choix
 */
function addScopeButtonStyles() {
    if (!document.getElementById('scope-btn-styles')) {
        const style = document.createElement('style');
        style.id = 'scope-btn-styles';
        style.textContent = `
            .scope-choice-btn.active {
                border-color: var(--primary) !important;
                background: var(--primary) !important;
                color: white !important;
                font-weight: 600;
            }
            .scope-choice-btn:hover {
                border-color: var(--primary);
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Choisit la portée de l'extraction (commune ou EPCI)
 */
async function chooseExtractionScope(scope) {
    if (!currentSmartSelection) return;
    
    currentSmartSelection.type = scope;
    
    // Mettre à jour l'affichage
    const buttons = document.querySelectorAll('.scope-choice-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if ((scope === 'commune' && btn.textContent.includes('Commune')) ||
            (scope === 'epci' && btn.textContent.includes('intercommunalité'))) {
            btn.classList.add('active');
        }
    });
    
    // Mettre à jour le texte d'info
    const scopeInfo = document.getElementById('scope-info');
    if (scope === 'commune') {
        scopeInfo.innerHTML = '📍 Extraction limitée à ' + currentSmartSelection.commune.nom;
        
        // Charger le nombre de communes de l'EPCI pour comparaison
        if (currentSmartSelection.epci) {
            try {
                const communes = await window.getCommunesIntercommunalite(currentSmartSelection.epci.code);
                scopeInfo.innerHTML += ` (vs ${communes.length} communes dans l'EPCI)`;
            } catch (e) {
                console.error('Erreur chargement communes EPCI:', e);
            }
        }
    } else {
        scopeInfo.innerHTML = 'ðŸ™ï¸ Extraction de toute l\'intercommunalité';
        
        // Charger le nombre de communes
        if (currentSmartSelection.epci) {
            try {
                const communes = await window.getCommunesIntercommunalite(currentSmartSelection.epci.code);
                scopeInfo.innerHTML += ` (${communes.length} communes)`;
            } catch (e) {
                console.error('Erreur chargement communes EPCI:', e);
            }
        }
    }
}

/**
 * Efface la sélection active
 */
function clearSmartSelection() {
    currentSmartSelection = null;
    document.getElementById('smart-selection-display').style.display = 'none';
    document.getElementById('smart-search-commune').value = '';
    document.getElementById('smart-search-results').style.display = 'none';
    document.getElementById('smart-search-help').innerHTML = '💡 Entrez au moins 3 caractères pour rechercher';
    document.getElementById('btn-extract-smart').disabled = true;
}

/**
 * Lance l'extraction avec la sélection intelligente
 */
async function lancerExtractionSmartGeo() {
    if (!currentSmartSelection) {
        showAlert('⚠️ Veuillez d\'abord sélectionner une commune', 'warning');
        return;
    }
    
    const { type, commune, epci } = currentSmartSelection;
    
    if (type === 'commune') {
        // Extraction d'une seule commune
        localStorage.setItem('geo_criteria_type', 'commune');
        localStorage.setItem('geo_criteria_value', commune.nom);
        localStorage.setItem('geo_criteria_commune_mode', 'exact');
    } else if (type === 'epci' && epci) {
        // Extraction de tout l'EPCI
        localStorage.setItem('geo_criteria_type', 'intercommunalite');
        localStorage.setItem('geo_criteria_value', epci.code);
    }
    
    // Lancer l'extraction
    await refreshFromOnisep();
}

// MODE GÉOGRAPHIQUE - Lancer extraction
async function lancerExtractionGeographique() {
    // Sauvegarder les critères géographiques AVANT l'extraction
    await saveGeoCriteria();
    
    // Puis lancer l'extraction
    await refreshFromOnisep();
}

// MODE DIPLÔMES - Mise à jour des champs géo
function updateDiplomesGeoFields() {
    const type = document.getElementById('diplomes-geo-type').value;
    document.getElementById('diplomes-departement-field').style.display = 
        type === 'departement' ? 'block' : 'none';
    document.getElementById('diplomes-academie-field').style.display = 
        type === 'academie' ? 'block' : 'none';
}

// MODE DIPLÔMES - Charger diplômes disponibles (Étape 1 → 2)
async function chargerDiplomesDisponibles() {
    const type = document.getElementById('diplomes-geo-type').value;
    const value = type === 'departement' ?
        document.getElementById('diplomes-departement').value :
        document.getElementById('diplomes-academie').value;
    
    if (!value) {
        showAlert('⚠️ Veuillez sélectionner un périmètre', 'warning');
        return;
    }
    
    const btn = document.getElementById('btn-charger-diplomes');
    btn.disabled = true;
    btn.textContent = '⏳ Chargement...';
    
    try {
        // Construire facette
        let facetGeo = {};
        if (type === 'departement') {
            facetGeo = { facet_departement: window.getNomDepartement(value) };
        } else {
            facetGeo = { facet_academie: window.getNomAcademie(value) };
        }
        
        // Charger diplômes
        const niveauBac = document.getElementById('filter-niveau-bac').checked;
        const niveauCap = document.getElementById('filter-niveau-cap').checked;
        
        const diplomes = await onisepAPI.getDiplomesDisponibles(facetGeo, niveauBac, niveauCap);
        
        if (diplomes.length === 0) {
            showAlert('❌ Aucun diplôme trouvé pour ce périmètre', 'error');
            return;
        }
        
        // Sauvegarder contexte
        window.contexteDiplomes = {
            type: type,
            value: value,
            displayName: type === 'departement' ?
                `${value} - ${window.getNomDepartement(value)}` :
                window.getNomAcademie(value),
            diplomes: diplomes,
            facetGeo: facetGeo
        };
        
        // Afficher étape 2
        afficherListeDiplomes(diplomes);
        document.getElementById('diplomes-perimetre-info').textContent = window.contexteDiplomes.displayName;
        document.getElementById('diplomes-etape-1').style.display = 'none';
        document.getElementById('diplomes-etape-2').style.display = 'block';
        
        showAlert(`✅ ${diplomes.length} diplôme(s) disponible(s)`, 'success');
        
    } catch (error) {
        console.error('Erreur chargement diplômes:', error);
        showAlert(`❌ Erreur: ${error.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '➡ï¸ Charger les diplômes disponibles';
    }
}

// MODE DIPLÔMES - Afficher la liste des diplômes
function afficherListeDiplomes(diplomes) {
    const container = document.getElementById('diplomes-list');
    
    // Grouper par niveau
    const parNiveau = {};
    diplomes.forEach(d => {
        const niveau = d.niveau || 'Autre';
        if (!parNiveau[niveau]) parNiveau[niveau] = [];
        parNiveau[niveau].push(d);
    });
    
    let html = '';
    for (const [niveau, liste] of Object.entries(parNiveau)) {
        html += `<div class="niveau-group" data-niveau="${niveau}">
            <div class="niveau-header">
                ${niveau} <span>(${liste.length})</span>
            </div>`;
        
        liste.forEach((d, idx) => {
            html += `<label>
                <input type="checkbox" class="diplome-checkbox" 
                       data-diplome-index="${diplomes.indexOf(d)}" 
                       onchange="updateSelectionInfo()" checked>
                <div class="diplome-info">
                    <div class="diplome-intitule">${d.intitule}</div>
                </div>
            </label>`;
        });
        
        html += `</div>`;
    }
    
    container.innerHTML = html;
    
    // Sauvegarder référence globale aux diplômes
    window.diplomesDisponibles = diplomes;
    
    updateSelectionInfo();
}

// MODE DIPLÔMES - Filtrage par niveau
function filtrerDiplomesParNiveau() {
    const niveauBac = document.getElementById('filter-niveau-bac').checked;
    const niveauCap = document.getElementById('filter-niveau-cap').checked;
    
    document.querySelectorAll('.niveau-group').forEach(group => {
        const niveau = group.dataset.niveau?.toLowerCase();
        const isBac = niveau?.includes('bac');
        const isCap = niveau?.includes('cap');
        
        let visible = true;
        if (isBac) visible = niveauBac;
        else if (isCap) visible = niveauCap;
        
        group.style.display = visible ? 'block' : 'none';
    });
    
    updateSelectionInfo();
}

// MODE DIPLÔMES - Filtrage par recherche
function filtrerDiplomesParRecherche() {
    const search = document.getElementById('search-diplome').value.toLowerCase();
    
    document.querySelectorAll('.diplomes-list label').forEach(label => {
        const visible = label.textContent.toLowerCase().includes(search);
        label.style.display = visible ? 'flex' : 'none';
    });
    
    updateSelectionInfo();
}

// MODE DIPLÔMES - Toggle tous les diplômes
function toggleTousDiplomes(checked) {
    document.querySelectorAll('.diplome-checkbox').forEach(cb => {
        if (cb.closest('label').style.display !== 'none') {
            cb.checked = checked;
        }
    });
    updateSelectionInfo();
}

// MODE DIPLÔMES - Mettre à jour info sélection
function updateSelectionInfo() {
    const count = document.querySelectorAll('.diplome-checkbox:checked').length;
    const total = document.querySelectorAll('.diplome-checkbox').length;
    
    document.getElementById('selection-count').textContent = count;
    
    const info = document.getElementById('selection-info');
    if (count === 0) {
        info.className = 'selection-info warning';
        info.innerHTML = `⚠️ <span id="selection-count">0</span> diplôme(s) sélectionné(s)`;
    } else {
        info.className = 'selection-info';
        info.innerHTML = `✅ <span id="selection-count">${count}</span> diplôme(s) sélectionné(s) sur ${total}`;
    }
}

// MODE DIPLÔMES - Récupérer diplômes sélectionnés
function getDiplomesSelectionnes() {
    const checkboxes = document.querySelectorAll('.diplome-checkbox:checked');
    return Array.from(checkboxes).map(cb => {
        const index = parseInt(cb.dataset.diplomeIndex);
        return window.diplomesDisponibles[index];
    });
}

// MODE DIPLÔMES - Lancer extraction
async function lancerExtractionDiplomes() {
    const diplomesSelectionnes = getDiplomesSelectionnes();
    
    if (diplomesSelectionnes.length === 0) {
        showAlert('⚠️ Veuillez sélectionner au moins un diplôme', 'error');
        return;
    }
    
    const { facetGeo } = window.contexteDiplomes;
    
    // Lancer extraction
    const modal = document.getElementById('onisep-modal');
    modal.classList.add('active');
    
    try {
        const data = await onisepAPI.extractByDiplomes(
            diplomesSelectionnes,
            facetGeo,
            progress => {
                const fill = document.getElementById('progress-fill');
                const message = document.getElementById('progress-message');
                const details = document.getElementById('progress-details');
                
                const percent = Math.round(progress.percent || 0);
                fill.style.width = `${percent}%`;
                fill.textContent = `${percent}%`;
                message.textContent = progress.message || '';
                
                if (progress.current && progress.total) {
                    details.textContent = `${progress.current} / ${progress.total}`;
                }
            }
        );
        
        await updateDatabase(data);
        
        // Enrichir automatiquement avec les langues
        console.log('🌍 Lancement enrichissement automatique des langues...');
        try {
            await enrichirAvecLangues(true); // true = mode silencieux
        } catch (error) {
            console.error('❌ Erreur enrichissement langues:', error);
            // Ne pas bloquer l'extraction si l'enrichissement échoue
        }
        
        // Afficher résumé extraction
        loadStats();
        loadView();
        
        const diplomesUniques = data.diplomes.length;
        const diplomesTotal = data.diplomes_par_lycee.length;
        showAlert(`✅ ${data.lycees.length} établissements et ${diplomesTotal} diplômes (dont ${diplomesUniques} uniques) extraits !`, 'success');
        
        // Mettre à jour date extraction
        localStorage.setItem('last_extraction_date', new Date().toISOString());
        updateLastExtractionDate();
        
    } catch (error) {
        console.error('Erreur extraction:', error);
        showAlert(`❌ Erreur: ${error.message}`, 'error');
    } finally {
        modal.classList.remove('active');
    }
}

// MODE DIPLÔMES - Retour à l'étape 1
function retourEtape1() {
    document.getElementById('diplomes-etape-2').style.display = 'none';
    document.getElementById('diplomes-etape-1').style.display = 'block';
}

window.addEventListener('DOMContentLoaded', async () => {
    loadApiDelay();
    try {
        SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        await initDatabase();
        loadSavedCredentials();
        loadStats();
        switchView('lycees'); // Charger la vue établissements par défaut
        
        // Charger la liste des EPCI
        loadAllEPCI();
        
        // Charger les favoris dans le panneau latéral
        afficherListeFavoris();
    } catch (error) {
        console.error('Erreur init:', error);
        showAlert('Erreur initialisation: ' + error.message, 'error');
    }
});


// ========================================
// PRÉFÉRENCES UTILISATEUR
// ========================================

async function fetchOnisepEstablishment() {
    const uai = document.getElementById('pref-user-uai').value.trim().toUpperCase();
    
    if (!uai) {
        showAlert('⚠️ Veuillez saisir un UAI', 'error');
        return;
    }
    
    // Validation format UAI
    if (!/^[0-9]{7}[A-Z]$/.test(uai)) {
        showAlert('⚠️ Format UAI invalide (ex: 0350056C)', 'error');
        return;
    }
    
    if (!onisepAPI) {
        showAlert('⚠️ Veuillez vous connecter à Onisep d\'abord', 'error');
        openLoginModal();
        return;
    }
    
    try {
        showAlert('🔍 Recherche sur Onisep...', 'info');
        
        // Recherche par UAI en utilisant searchStructures
        const results = await onisepAPI.searchStructures({
            query: uai,
            size: 10
        });
        
        if (!results || results.length === 0) {
            showAlert('❌ Établissement non trouvé sur Onisep', 'error');
            return;
        }
        
        // Filtrer pour trouver l'UAI exact (la recherche peut retourner plusieurs résultats)
        const etablissement = results.find(r => r.code_uai === uai) || results[0];
        
        if (!etablissement) {
            showAlert('❌ Établissement non trouvé sur Onisep', 'error');
            return;
        }
        
        // Log pour debug
        console.log('🏫 Établissement trouvé:', etablissement);
        console.log('📍 Champs GPS disponibles:', {
            latitude: etablissement.latitude,
            longitude: etablissement.longitude,
            latitude_y: etablissement.latitude_y,
            longitude_x: etablissement.longitude_x,
            coordonnees: etablissement.coordonnees,
            position: etablissement.position
        });
        
        // Remplir les champs - essayer différents noms de champs
        document.getElementById('pref-user-nom').value = etablissement.nom || '';
        document.getElementById('pref-user-lat').value = etablissement.latitude_y || etablissement.latitude || '';
        document.getElementById('pref-user-lon').value = etablissement.longitude_x || etablissement.longitude || '';
        
        showAlert('✅ Informations récupérées depuis Onisep', 'success');
        
    } catch (error) {
        console.error('Erreur recherche Onisep:', error);
        showAlert('❌ Erreur lors de la recherche : ' + error.message, 'error');
    }
}

function saveUserEstablishment() {
    console.log('ðŸ’¾ saveUserEstablishment appelée');
    
    const uai = document.getElementById('pref-user-uai').value.trim().toUpperCase();
    const nom = document.getElementById('pref-user-nom').value.trim();
    const lat = parseFloat(document.getElementById('pref-user-lat').value);
    const lon = parseFloat(document.getElementById('pref-user-lon').value);
    
    console.log('ðŸ“ Valeurs récupérées:', { uai, nom, lat, lon });
    
    // Validation : au minimum nom + coordonnées GPS
    if (!nom || isNaN(lat) || isNaN(lon)) {
        console.error('❌ Validation échouée: nom ou coordonnées manquants');
        showAlert('⚠️ Veuillez renseigner au minimum le nom et les coordonnées GPS', 'error');
        return;
    }
    
    // Validation GPS
    if (lat < -90 || lat > 90) {
        console.error('❌ Latitude invalide:', lat);
        showAlert('⚠️ Latitude invalide (doit être entre -90 et 90)', 'error');
        return;
    }
    if (lon < -180 || lon > 180) {
        console.error('❌ Longitude invalide:', lon);
        showAlert('⚠️ Longitude invalide (doit être entre -180 et 180)', 'error');
        return;
    }
    
    // Validation UAI si renseigné
    if (uai && !/^[0-9]{7}[A-Z]$/.test(uai)) {
        console.error('❌ Format UAI invalide:', uai);
        showAlert('⚠️ Format UAI invalide (ex: 0350056C)', 'error');
        return;
    }
    
    // Sauvegarder dans localStorage
    const userEtablissement = {
        uai: uai || null,
        nom: nom,
        latitude: lat,
        longitude: lon
    };
    
    console.log('ðŸ’¾ Objet à sauvegarder:', userEtablissement);
    
    localStorage.setItem('pref_user_etablissement', JSON.stringify(userEtablissement));
    
    console.log('✅ Sauvegardé dans localStorage');
    
    // Conserver aussi UAI pour compatibilité
    if (uai) {
        localStorage.setItem('pref_user_uai', uai);
    } else {
        localStorage.removeItem('pref_user_uai');
    }
    
    showAlert(`✅ Établissement "${nom}" sauvegardé`, 'success');
    
    // Recharger carte si ouverte
    const currentTabValue = typeof currentTab !== 'undefined' ? currentTab : 'unknown';
    console.log('🔍 Vérification carte ouverte:', { currentTab: currentTabValue, mapExists: !!map });
    
    if (typeof currentTab !== 'undefined' && currentTab === 'carte' && map) {
        console.log('ðŸ—ºï¸ Rechargement marqueur sur carte...');
        loadUserMarker();
    } else {
        console.log('â„¹ï¸ Carte pas ouverte, marqueur sera chargé au prochain affichage carte');
    }
}

function loadUserPreferences() {
    // Charger depuis nouvel objet si disponible
    const stored = localStorage.getItem('pref_user_etablissement');
    if (stored) {
        try {
            const etab = JSON.parse(stored);
            if (etab.uai) document.getElementById('pref-user-uai').value = etab.uai;
            if (etab.nom) document.getElementById('pref-user-nom').value = etab.nom;
            if (etab.latitude) document.getElementById('pref-user-lat').value = etab.latitude;
            if (etab.longitude) document.getElementById('pref-user-lon').value = etab.longitude;
        } catch (e) {
            console.warn('Erreur chargement préférences:', e);
        }
    } else {
        // Fallback ancien format (UAI seul)
        const uai = localStorage.getItem('pref_user_uai');
        if (uai) {
            document.getElementById('pref-user-uai').value = uai;
        }
    }
}

// Charger au démarrage
document.addEventListener('DOMContentLoaded', loadUserPreferences);


