/**
 * Client API Onisep pour extraction des données lycées
 * Utilisation : const api = new OnisepAPI(); await api.extractRennesMetropole(callback);
 */
class OnisepAPI {
    constructor(token = null, appId = null) {
        this.baseURL = 'https://api.opendata.onisep.fr/api/1.0';
        this.datasets = {
            structures: '5fa5816ac6a6e',      // Structures d'enseignement secondaire
            formations: '5fa591127f501',      // Formations initiales en France
            actions_lycee: '605340ddc19a9',   // Actions de formation - Univers lycée (2nde, 1re, Term)
            actions_sup: '605344579a7d7',     // Actions de formation - Univers enseignement supérieur (Bac+1 et +)
            
            // Datasets Bretagne (Idéo)
            bretagne_actions: '5fa42cb0d2ca5',     // Idéo-Actions de formation-Bretagne
            bretagne_dispositifs: '5fa52beb23790'  // Idéo-Actions de dispositif-Bretagne
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
     * Récupère les actions de formation d'un établissement (lycée + sup)
     */
    async getActionsFormation(uai) {
        const actionsLycee = await this.getActionsLycee(uai);
        const actionsSup = await this.getActionsSup(uai);
        
        return [...actionsLycee, ...actionsSup];
    }
    
    /**
     * Récupère les actions de formation lycée (2nde, 1re, Term)
     */
    async getActionsLycee(uai) {
        const url = new URL(`${this.baseURL}/dataset/${this.datasets.actions_lycee}/search`);
        // Recherche textuelle avec q= (plus fiable que les facets)
        url.searchParams.append('q', uai);
        url.searchParams.append('size', 100);
        
        try {
            this.requestCount++;
            const response = await fetch(url, {
                headers: this._getHeaders()
            });
            
            if (!response.ok) {
                console.warn(`Erreur HTTP ${response.status} pour lycée ${uai}`);
                return [];
            }
            
            const data = await response.json();
            
            // Filtrage strict : seul le champ ens_code_uai doit correspondre exactement
            const filtered = (data.results || []).filter(action => 
                action.ens_code_uai === uai
            );
            
            console.log(`Actions lycée ${uai}: ${filtered.length} trouvées`);
            
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
            const response = await fetch(url, {
                headers: this._getHeaders()
            });
            
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
            formations_par_lycee: [], // {lycee_uai, formation_code, formation_intitule, diplome_associe}
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
            
            // Ajouter les lycées en évitant les doublons (même UAI)
            for (const lycee of lycees) {
                const uai = lycee.code_uai;
                // Vérifier si ce lycée n'est pas déjà dans la liste
                if (!result.lycees.some(l => l.code_uai === uai)) {
                    result.lycees.push(lycee);
                }
            }
            
            progressCallback({
                step: 'search',
                message: `${commune}: ${lycees.length} lycées trouvés (${result.lycees.length} uniques)`,
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
        // Utiliser for_type pour identifier les diplômes
        const type = action.for_type || '';
        const libelle = action.formation_for_libelle || '';
        const id_onisep = action.identifiant || action.for_code || action.formation_for_code || this._generateCode(libelle);
        
        if (!libelle) {
            return; // Pas de libellé, on ignore
        }
        
        // Liste des types qui sont des diplômes
        const typesDiplomes = [
            'baccalauréat général',
            'baccalauréat technologique',
            'baccalauréat professionnel',
            'bts',
            'cap',
            'but',
            'mention complémentaire',
            'brevet professionnel',
            'brevet des métiers d\'art',
            'diplôme national',
            'certificat d\'aptitude professionnelle'
        ];
        
        // Liste des types qui sont des formations (non-diplômantes)
        const typesFormations = [
            'classe de 2de',
            'classe de 1re',
            'classe de terminale',
            'prépa',
            'cpge',
            'classe préparatoire'
        ];
        
        const typeLower = type.toLowerCase();
        
        // Vérifier si c'est un diplôme
        const isDiplome = typesDiplomes.some(t => typeLower.includes(t));
        
        // Vérifier si c'est une formation
        const isFormation = typesFormations.some(t => typeLower.includes(t)) || 
                           libelle.toLowerCase().includes('classe') ||
                           libelle.toLowerCase().includes('préparatoire');
        
        if (isDiplome) {
            if (!result.diplomes.has(id_onisep)) {
                result.diplomes.set(id_onisep, {
                    id_onisep: id_onisep,
                    intitule: libelle,
                    niveau: this._detectNiveau(type)
                });
            }
            
            // Enregistrer la relation lycée-diplôme
            if (lycee_uai && result.diplomes_par_lycee) {
                result.diplomes_par_lycee.push({
                    lycee_uai: lycee_uai,
                    diplome_id_onisep: id_onisep,
                    diplome_intitule: libelle
                });
            }
        } else if (isFormation) {
            const code = this._generateCode(libelle);
            
            // Détecter le diplôme associé à la formation
            let diplomeAssocie = null;
            const libelleLower = libelle.toLowerCase();
            
            // CPGE → Pas de diplôme direct (prépare aux concours)
            if (libelleLower.includes('préparatoire') || libelleLower.includes('cpge')) {
                diplomeAssocie = null; // Les CPGE ne délivrent pas de diplôme directement
            }
            // Classe de 2de → Prépare au bac (on ne peut pas déterminer lequel précisément)
            else if (libelleLower.includes('2de') || libelleLower.includes('seconde')) {
                // Détecter le type de 2de
                if (libelleLower.includes('professionnel')) {
                    diplomeAssocie = 'bac professionnel';
                } else if (libelleLower.includes('stmg') || libelleLower.includes('st2s') || 
                          libelleLower.includes('sti2d') || libelleLower.includes('std2a') ||
                          libelleLower.includes('stl') || libelleLower.includes('sthr') ||
                          libelleLower.includes('s2tmd') || libelleLower.includes('stav')) {
                    diplomeAssocie = 'bac technologique';
                } else {
                    diplomeAssocie = 'bac général';
                }
            }
            // Classe de 1re → Prépare au bac (détecter le type)
            else if (libelleLower.includes('1re') || libelleLower.includes('première')) {
                if (libelleLower.includes('professionnel')) {
                    diplomeAssocie = 'bac professionnel';
                } else if (libelleLower.includes('stmg') || libelleLower.includes('st2s') || 
                          libelleLower.includes('sti2d') || libelleLower.includes('std2a') ||
                          libelleLower.includes('stl') || libelleLower.includes('sthr') ||
                          libelleLower.includes('s2tmd') || libelleLower.includes('stav')) {
                    // Extraire la série pour être plus précis
                    if (libelleLower.includes('stmg')) diplomeAssocie = 'bac technologique STMG';
                    else if (libelleLower.includes('st2s')) diplomeAssocie = 'bac technologique ST2S';
                    else if (libelleLower.includes('sti2d')) diplomeAssocie = 'bac technologique STI2D';
                    else if (libelleLower.includes('std2a')) diplomeAssocie = 'bac technologique STD2A';
                    else if (libelleLower.includes('stl')) diplomeAssocie = 'bac technologique STL';
                    else if (libelleLower.includes('sthr')) diplomeAssocie = 'bac technologique STHR';
                    else if (libelleLower.includes('s2tmd')) diplomeAssocie = 'bac technologique S2TMD';
                    else if (libelleLower.includes('stav')) diplomeAssocie = 'bac technologique STAV';
                    else diplomeAssocie = 'bac technologique';
                } else {
                    diplomeAssocie = 'bac général';
                }
            }
            // Classe de terminale → Prépare au bac
            else if (libelleLower.includes('terminale')) {
                if (libelleLower.includes('professionnel')) {
                    diplomeAssocie = 'bac professionnel';
                } else if (libelleLower.includes('stmg') || libelleLower.includes('st2s') || 
                          libelleLower.includes('sti2d') || libelleLower.includes('std2a') ||
                          libelleLower.includes('stl') || libelleLower.includes('sthr') ||
                          libelleLower.includes('s2tmd') || libelleLower.includes('stav')) {
                    // Extraire la série
                    if (libelleLower.includes('stmg')) diplomeAssocie = 'bac technologique STMG';
                    else if (libelleLower.includes('st2s')) diplomeAssocie = 'bac technologique ST2S';
                    else if (libelleLower.includes('sti2d')) diplomeAssocie = 'bac technologique STI2D';
                    else if (libelleLower.includes('std2a')) diplomeAssocie = 'bac technologique STD2A';
                    else if (libelleLower.includes('stl')) diplomeAssocie = 'bac technologique STL';
                    else if (libelleLower.includes('sthr')) diplomeAssocie = 'bac technologique STHR';
                    else if (libelleLower.includes('s2tmd')) diplomeAssocie = 'bac technologique S2TMD';
                    else if (libelleLower.includes('stav')) diplomeAssocie = 'bac technologique STAV';
                    else diplomeAssocie = 'bac technologique';
                } else {
                    diplomeAssocie = 'bac général';
                }
            }
            
            if (!result.formations.has(id_onisep)) {
                result.formations.set(id_onisep, {
                    id_onisep: id_onisep,
                    intitule: libelle,
                    diplome_associe: diplomeAssocie
                });
            }
            
            // Enregistrer la relation lycée-formation
            if (lycee_uai && result.formations_par_lycee) {
                result.formations_par_lycee.push({
                    lycee_uai: lycee_uai,
                    formation_id_onisep: id_onisep,
                    formation_intitule: libelle,
                    diplome_associe: diplomeAssocie
                });
            }
        }
        
        // Langues - à extraire des champs si disponibles
        // TODO: Vérifier quels champs contiennent les langues dans ces datasets
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
