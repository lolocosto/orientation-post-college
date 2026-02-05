/**
 * Client API Onisep pour extraction des données lycées
 * Utilisation : const api = new OnisepAPI(); await api.extractRennesMetropole(callback);
 */
class OnisepAPI {
    constructor(token = null, appId = null) {
        this.baseURL = 'https://api.opendata.onisep.fr/api/1.0';
        this.datasets = {
            structures: '5fa5816ac6a6e',      // Lycées
            actions: '66263935522cd',         // Actions de formation + langues
            formations: '5fa591127f501'       // Formations initiales
        };
        this.token = token;
        this.appId = appId || '69711beb357466e3a88b4572'; // Application-ID par défaut
        this.requestCount = 0;
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
            
            console.log('✓ Token généré avec succès');
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
     * Recherche des établissements (lycées)
     */
    async searchStructures(params = {}) {
        const url = new URL(`${this.baseURL}/dataset/${this.datasets.structures}/search`);
        
        url.searchParams.append('size', params.size || 100);
        
        // Utiliser recherche textuelle au lieu de facettes
        if (params.commune) {
            url.searchParams.append('q', params.commune);
        } else if (params.region) {
            url.searchParams.append('q', params.region);
        } else if (params.query) {
            url.searchParams.append('q', params.query);
        }
        
        try {
            this.requestCount++;
            const response = await fetch(url, {
                headers: this._getHeaders()
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            
            // Filtrer côté client si commune spécifiée
            let results = data.results || [];
            if (params.commune && results.length > 0) {
                results = results.filter(r => {
                    const commune = (r.commune || '').toLowerCase();
                    return commune.includes(params.commune.toLowerCase());
                });
            }
            
            return results;
        } catch (error) {
            console.error('Erreur searchStructures:', error);
            throw error;
        }
    }
    
    /**
     * Récupère les actions de formation d'un établissement
     */
    async getActionsFormation(uai) {
        const url = new URL(`${this.baseURL}/dataset/${this.datasets.actions}/search`);
        url.searchParams.append('facet.uai_lieu_de_cours', uai);
        url.searchParams.append('size', 300);
        
        try {
            this.requestCount++;
            const response = await fetch(url, {
                headers: this._getHeaders()
            });
            
            if (!response.ok) {
                console.warn(`Erreur HTTP ${response.status} pour ${uai}`);
                return [];
            }
            
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error(`Erreur getActionsFormation pour ${uai}:`, error);
            return [];
        }
    }
    
    /**
     * Extrait toutes les données pour les lycées de Rennes Métropole
     */
    async extractRennesMetropole(progressCallback) {
        const communes = ['Rennes', 'Cesson-Sévigné', 'Bruz', 'Le Rheu', 'Saint-Grégoire'];
        
        const result = {
            lycees: [],
            diplomes: new Map(),      // code -> diplome
            formations: new Map(),     // code -> formation
            dispositifs: new Map(),    // nom -> dispositif
            langues: new Map(),        // nom -> langue
            diplomes_par_lycee: [],   // {lycee_uai, diplome_code, diplome_intitule}
            stats: {
                lyceesTotal: 0,
                actionsTotal: 0,
                requestCount: 0
            }
        };
        
        // Étape 1: Récupérer tous les lycées
        progressCallback({ 
            step: 'search', 
            message: 'Recherche des lycées...',
            percent: 0
        });
        
        for (let i = 0; i < communes.length; i++) {
            const commune = communes[i];
            
            // Recherche avec taille plus grande pour être sûr d'avoir tous les résultats
            const structures = await this.searchStructures({ commune, size: 200 });
            
            // Filtrer STRICTEMENT les lycées de la commune
            const lycees = structures.filter(s => {
                const type = (s.type_detablissement || '').toLowerCase();
                const communeEtab = (s.commune || '').toLowerCase();
                const communeRecherchee = commune.toLowerCase();
                
                // Doit être un lycée ET de la commune exacte
                const estLycee = type.includes('lycée') || type.includes('lycee');
                const deLaCommune = communeEtab === communeRecherchee || 
                                   communeEtab.includes(communeRecherchee);
                
                return estLycee && deLaCommune;
            });
            
            console.log(`${commune}: ${lycees.length} lycées trouvés sur ${structures.length} établissements`);
            
            result.lycees.push(...lycees);
            
            progressCallback({
                step: 'search',
                message: `${commune}: ${lycees.length} lycées trouvés`,
                percent: ((i + 1) / communes.length) * 20
            });
            
            await this._sleep(300);
        }
        
        result.stats.lyceesTotal = result.lycees.length;
        
        // Étape 2: Pour chaque lycée, récupérer les actions de formation
        for (let i = 0; i < result.lycees.length; i++) {
            const lycee = result.lycees[i];
            const uai = lycee.code_uai;
            const nom = lycee.nom || 'Sans nom';
            
            progressCallback({
                step: 'extract',
                message: `Extraction: ${nom}`,
                current: i + 1,
                total: result.lycees.length,
                percent: 20 + ((i + 1) / result.lycees.length) * 70
            });
            
            const actions = await this.getActionsFormation(uai);
            lycee.actions_formation = actions;
            result.stats.actionsTotal += actions.length;
            
            // Extraire les données des actions avec le lycée associé
            for (const action of actions) {
                this._extractFromAction(action, result, uai);
            }
            
            await this._sleep(400);
        }
        
        // Étape 3: Finalisation
        progressCallback({
            step: 'finalize',
            message: 'Finalisation...',
            percent: 95
        });
        
        result.stats.requestCount = this.requestCount;
        
        // Convertir Maps en Arrays
        const finalResult = {
            lycees: result.lycees,
            diplomes: Array.from(result.diplomes.values()),
            formations: Array.from(result.formations.values()),
            dispositifs: Array.from(result.dispositifs.values()),
            langues: Array.from(result.langues.values()),
            diplomes_par_lycee: result.diplomes_par_lycee,
            stats: result.stats
        };
        
        progressCallback({
            step: 'done',
            message: 'Extraction terminée !',
            percent: 100
        });
        
        return finalResult;
    }
    
    /**
     * Extrait diplômes, formations, langues, dispositifs depuis une action
     */
    _extractFromAction(action, result, lycee_uai = null) {
        // Formations et diplômes
        const libelle = action.libelle_formation_principal || '';
        
        if (libelle) {
            // Déterminer si c'est un diplôme ou une formation
            const isDiplome = libelle.includes('BTS') || 
                            libelle.includes('CAP') || 
                            libelle.includes('Bac ') ||
                            libelle.includes('BUT') ||
                            libelle.includes('DN') ||
                            libelle.includes('BMA');
            
            if (isDiplome) {
                const code = this._generateCode(libelle);
                if (!result.diplomes.has(code)) {
                    result.diplomes.set(code, {
                        code: code,
                        intitule: libelle,
                        niveau: this._detectNiveau(libelle)
                    });
                }
                
                // Enregistrer la relation lycée-diplôme
                if (lycee_uai && result.diplomes_par_lycee) {
                    result.diplomes_par_lycee.push({
                        lycee_uai: lycee_uai,
                        diplome_code: code,
                        diplome_intitule: libelle
                    });
                }
            } else if (libelle.includes('CPGE') || libelle.includes('2de') || libelle.includes('1re')) {
                const code = this._generateCode(libelle);
                if (!result.formations.has(code)) {
                    result.formations.set(code, {
                        code: code,
                        intitule: libelle
                    });
                }
            }
        }
        
        // Langues (LV1, LV2, LV3)
        const langues_lv = action.langues_vivantes_1_et_2 || '';
        if (langues_lv) {
            this._extractLangues(langues_lv, result.langues);
        }
        
        // Langues anciennes / régionales (à implémenter si disponible)
        // TODO: Chercher dans d'autres champs
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
        if (libelle.includes('CAP')) return 'CAP';
        if (libelle.includes('Bac pro') || libelle.includes('Bac techno')) return 'Bac';
        if (libelle.includes('Bac général')) return 'Bac';
        if (libelle.includes('BTS') || libelle.includes('BUT') || libelle.includes('BMA')) return 'Bac+2';
        if (libelle.includes('Licence')) return 'Bac+3';
        if (libelle.includes('Master')) return 'Bac+5';
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
