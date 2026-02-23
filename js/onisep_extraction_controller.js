/************************************************
 * Fichier : onisep_extraction_controller.js
 * Description : Contrôleur d'extraction des données ONISEP
 * Auteur : Laurent COSTE
 * Date : 2026-02-16
 * Version : v0.28.10 - Fix stockage dispositifs avec logs
 ************************************************/

/**
 * Contrôleur d'extraction des données ONISEP
 * Orchestre : requêtes API → parsing → filtrage → enrichissement → stockage
 */
class OnisepExtractionController {
    
    // =====================================
    // PROPRIÉTÉS PRIVÉES
    // =====================================
    
    #onisepAPI;
    #databaseService;
    #geoController;
    // #progressModal supprimé - créé à la demande dans chaque méthode d'extraction
    #currentProgressModal = null; // Instance temporaire pendant une extraction
    #isStopped = false;
    
    /**
     * Constructeur - Instancie les APIs et parsers en interne
     */
    constructor() {
        console.log('[OnisepExtractionController] 🏗️ Initialisation...');
        
        // Instancier les dépendances en privé
        this.#onisepAPI = new OnisepAPI();
        // DatabaseService est global (window.databaseService)
        this.#databaseService = null; // Sera assigné plus tard
        this.#geoController = null; // Sera assigné plus tard
        
        // ProgressModal n'est plus créé ici - sera créé à la demande
        
        console.log('[OnisepExtractionController] ✅ Initialisé');
    }
    
    /**
     * Initialise le controller avec DatabaseService global
     * Appelé après la création de window.databaseService
     */
    init() {
        this.#databaseService = window.databaseService;
        console.log('[OnisepExtractionController] 🔗 DatabaseService connecté');
    }
    
    /**
     * Connecte le GeoExtractionController pour les extractions géographiques
     * @param {GeoExtractionController} geoController 
     */
    setGeoController(geoController) {
        this.#geoController = geoController;
        console.log('[OnisepExtractionController] 🔗 GeoController connecté');
    }

    // =====================================
    // AUTHENTIFICATION
    // =====================================
    
    /**
     * Connecte l'API ONISEP interne
     * @param {string} email
     * @param {string} password
     * @param {string} appId
     * @returns {Promise<string>} Token
     */
    async login(email, password, appId) {
        this.#onisepAPI.email = email;
        this.#onisepAPI.password = password;
        this.#onisepAPI.appId = appId;
        return await this.#onisepAPI.login();
    }
    
    /**
     * Vérifie si l'API est authentifiée
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.#onisepAPI.isAuthenticated();
    }
    
    /**
     * Getter public pour accéder à l'API Onisep
     * @returns {OnisepAPI}
     */
    getOnisepAPI() {
        return this.#onisepAPI;
    }
    
    // =====================================
    // PATTERN BOILERPLATE : #runExtraction
    // Factorise ouverture/fermeture ProgressModal + catch pour toutes les méthodes publiques
    // =====================================

    /**
     * Exécute une fonction d'extraction async dans le contexte ProgressModal standard.
     * @private
     * @param {Function} extractFn - async () => { result, statsMessage }
     *   extractFn reçoit this.#currentProgressModal dans le contexte partagé.
     * @returns {Promise<Object>}
     */
    async #runExtraction(extractFn) {
        this.#currentProgressModal = new ProgressModal(null, null, false, '🏫 Extraction voie scolaire en cours…');

        try {
            this.#currentProgressModal.show();
            this.#currentProgressModal.update('Démarrage de l\'extraction...', 0, 100);

            const result = await extractFn();

            if (result.cancelled) {
                this.#currentProgressModal.update('⚠️ Extraction annulée', 100, 100);
                this.#addProgressDetail('L\'extraction a été interrompue par l\'utilisateur');
                return { success: false, cancelled: true, message: 'Extraction annulée' };
            }

            const successMsg = this.#formatStatsMessage(result.stats);
            this.#currentProgressModal.update(successMsg, 100, 100);
            this.#addProgressDetail('✅ Extraction terminée avec succès !');
            this.#currentProgressModal.hideWithSuccess(2000);

            return result;

        } catch (error) {
            console.error('[OnisepExtractionController] ❌ Erreur:', error);
            if (this.#currentProgressModal) {
                this.#currentProgressModal.update('❌ Erreur lors de l\'extraction', 100, 100);
                this.#addProgressDetail(error.message || 'Erreur inconnue');
            }
            throw error;
        } finally {
            this.#currentProgressModal = null;
        }
    }

    // =====================================
    // MÉTHODE PRINCIPALE D'EXTRACTION GÉO
    // =====================================
    
    /**
     * Extraction géographique (commune ou EPCI)
     * @param {Object} params - Paramètres d'extraction
     * @param {string} params.type - 'commune' | 'intercommunalite'
     * @param {string} params.value - Valeur (nom commune ou code EPCI)
     * @param {Object} params.displayInfo - Infos affichage
     * @param {string[]} params.voies - Voies à extraire ['scolaire', 'apprentissage']
     * @returns {Promise<Object>} { success, stats, extractionInfo }
     */
    async extractByGeo(params) {
        console.log('[OnisepExtractionController] 🚀 Extraction géographique:', params);

        return await this.#runExtraction(async () => {
            await this.reset();

            const voies = params.voies || ['scolaire'];
            let result = { stats: { etablissements: 0, diplomes: 0 }, cancelled: false };

            // ── Voie scolaire (Onisep) ──────────────────────────────────────────
            if (voies.includes('scolaire')) {
                let onisepResult;
                if (params.type === 'commune') {
                    onisepResult = await this.extractByCommune(params.value);
                } else if (params.type === 'intercommunalite') {
                    onisepResult = await this.extractByEPCI(params.value);
                } else {
                    throw new Error(`Type d'extraction inconnu: ${params.type}`);
                }
                if (onisepResult.cancelled) return { cancelled: true };
                result.stats = onisepResult.stats || result.stats;
            }

            return {
                success: true,
                stats: result.stats,
                extractionInfo: {
                    type: params.type,
                    zone: params.displayInfo?.nom || params.value,
                    voies,
                    date: new Date().toISOString()
                }
            };
        });
    }
    
    // =====================================
    // CONTRÔLE
    // =====================================
    
    /**
     * Arrête l'extraction en cours
     */
    stop() {
        this.#isStopped = true;
        console.log('[ExtractionController] ⏸️ Arrêt demandé');
    }
    
    /**
     * Réinitialise l'état d'arrêt
     */
    /**
     * Réinitialise l'état de l'extraction
     * Vide la base de données avant chaque nouvelle extraction
     * @returns {Promise<void>}
     */
    async reset() {
        this.#isStopped = false;
        
        // Vider la base de données avant chaque extraction
        if (this.#databaseService) {
            console.log('[ExtractionController] 🗑️ Vidage de la base de données...');
            try {
                await this.#databaseService.clearOnisepData();
                console.log('[ExtractionController] ✅ Base de données vidée');
            } catch (error) {
                console.error('[ExtractionController] ⚠️ Erreur vidage base:', error);
                // Continuer même si erreur (base peut-être déjà vide)
            }
        }
    }
    
    /**
     * Vérifie si l'extraction doit s'arrêter
     * @private
     * @returns {boolean}
     */
    #checkStopped() {
        return this.#isStopped;
    }
    
    /**
     * Ajoute un détail de progression SANS modifier le message principal ni le pourcentage
     * Utilisé par les callbacks pour API et parser
     * @private
     * @param {string} detail - Détail à ajouter
     */
    #addProgressDetail(detail, type = 'info') {
        console.log(`[ExtractionController] 📝 addProgressDetail appelé: "${detail}" (currentProgressModal: ${this.#currentProgressModal ? 'OK' : 'NULL'})`);
        if (detail && detail !== 'null' && this.#currentProgressModal) {
            this.#currentProgressModal.addDetail(detail, type);
        } else if (!this.#currentProgressModal) {
            console.warn(`[ExtractionController] ⚠️ IMPOSSIBLE d'ajouter détail: currentProgressModal est NULL !`);
        }
    }
    
    // =====================================
    // EXTRACTION PAR COMMUNE
    // =====================================
    
    /**
     * Extrait les établissements et leurs formations pour une commune
     * @param {string} codeCommune - code INSEE de la commune
     * @returns {Promise<Object>} Résultats de l'extraction
     */
    async extractByCommune(codeCommune) {
        console.log(`[ExtractionController] 🚀 Extraction commune: ${codeCommune}`);
        
        try {
            return await this.#extractCommunes([codeCommune]);
        } catch (error) {
            console.error(`[ExtractionController] ❌ Erreur extraction commune:`, error);
            throw error;
        }
    }
    
    
    // =====================================
    // EXTRACTION PAR INTERCOMMUNALITÉ
    // =====================================
    
    /**
     * Extrait toutes les données pour une intercommunalité (EPCI)
     * @param {string} codeEpci - Code SIREN de l'EPCI
     * @returns {Promise<Object>} Résultats de l'extraction
     */
    async extractByEPCI(codeEpci) {
        console.log(`[ExtractionController] 🚀 Extraction EPCI: ${codeEpci}`);
        
        try {
            // ÉTAPE 1 : Récupérer les communes de l'EPCI
            this.#currentProgressModal.update('Récupération communes EPCI...', 0, 100);
            
            if (!this.#geoController) {
                throw new Error('GeoController non disponible pour récupérer les communes');
            }
            const communes = await this.#geoController.getCommunesByEPCI(codeEpci);
            console.log(`[ExtractionController] ${communes.length} communes dans l'EPCI`);
            
            // ÉTAPE 2 : Préparer liste des codes INSEE des communes (Array pour groupement automatique)
            const codesCommunes = communes.map(c => c.code);

            // ETAPE 3 : extraire les données et les renvoyer
            return await this.#extractCommunes(codesCommunes);

        } catch (error) {
            console.error('[ExtractionController] ❌ Erreur extraction EPCI:', error);
            throw error;
        }
    }            
    
    // =====================================
    // EXTRACTION PAR DIPLÔMES
    // =====================================
    /**
     * Extrait les établissements proposant certains diplômes
     * @param {Object} params - Paramètres d'extraction
     * @param {Array<string>} params.libelles - Libellés des diplômes
     * @param {string} params.type - 'departement' | 'academie'
     * @param {string} params.value - Valeur (code département ou code académie)
     * @param {Object} params.displayInfo - Infos affichage
     * @param {string[]} params.voies - Voies à extraire ['scolaire', 'apprentissage']
     * @returns {Promise<Object>} { success, stats, extractionInfo }
     */
    async extractByDiplomes(params = {}) {
        console.log(`[ExtractionController] 🚀 Extraction de ${params.libelles.length} diplômes`);

        return await this.#runExtraction(async () => {
            await this.reset();

            const voies = params.voies || ['scolaire'];

            // ÉTAPE 1 : Requêtes sur le dataset actionsLycee par libellés 
            this.#currentProgressModal.update('Recherche des formations...', 3, 100);
            this.#addProgressDetail(`🔍 Recherche de ${params.libelles.length} diplôme(s)...`);
            
            let queryFilters = {'q': params.libelles, size: 100};
            if (params.type == 'departement') {
                queryFilters['facet.ens_departement'] = window.getNomDepartement(params.value);
                this.#addProgressDetail(`📍 Zone : département ${window.getNomDepartement(params.value)}`);
            } else if (params.type == 'academie') {
                queryFilters['facet.ens_academie'] = window.getNomAcademie(params.value);
                this.#addProgressDetail(`📍 Zone : académie ${window.getNomAcademie(params.value)}`);
            } else {
                throw new Error(`Type de filtre géographique inconnu: ${params.type}`);
            }

            const actionsLycee = await this.#onisepAPI.queryDataset(
                'actions_lycee', 
                queryFilters,
                1,
                (detail) => this.#currentProgressModal.addDetail(detail)
            );
            if (this.#checkStopped()) return { cancelled: true };
            this.#addProgressDetail(`✅ ${actionsLycee.length} formations récupérées`);

            // ÉTAPE 2 : Parser les formations récupérées
            this.#currentProgressModal.update('Analyse des formations...', 6, 100);
            const parsedActions = OnisepParser.parseActionsLycee(actionsLycee);
            
            // ÉTAPE 3 : Construire la liste des UAI
            this.#currentProgressModal.update('Identification des établissements...', 9, 100);
            const uais = [...new Set(parsedActions.diplomes_par_etablissement.map(r => r.uai))];
            this.#addProgressDetail(`🏫 ${uais.length} établissement(s) identifié(s)`);
            
            if (uais.length === 0) {
                this.#addProgressDetail('⚠️ Aucun établissement trouvé');
                return { success: true, stats: { etablissements: 0, diplomes: 0 } };
            }

            // ÉTAPE 4 : Requête structures
            this.#currentProgressModal.update('Recherche des établissements...', 12, 100);
            const structures = await this.#onisepAPI.queryDataset('structures', {
                q: uais,
                size: 100
            }, 10, (detail) => this.#addProgressDetail(detail));
            if (this.#checkStopped()) return { cancelled: true };

            // ÉTAPE 5 : Parser les structures
            this.#currentProgressModal.update('Analyse des structures...', 15, 100);
            const parsedStructures = OnisepParser.parseStructures(structures);

            // ÉTAPE 6 : Extraire toutes les données pour la liste des UAI (20-80%)
            this.#addProgressDetail(`🔄 Extraction des données pour ${uais.length} établissement(s)...`);
            const allData = await this.#extractByUAIs(uais);
            if (this.#checkStopped()) return { cancelled: true };

            // ÉTAPE 7 : Assembler rawData
            this.#currentProgressModal.update('Préparation des données...', 80, 100);
            const rawData = {
                etablissements: [...parsedStructures.etablissements],
                diplomes: [...allData.actionsLycee.diplomes, ...allData.actionsSup.diplomes],
                relationsDiplomesEtablissements: [
                    ...allData.actionsLycee.diplomes_par_etablissement,
                    ...allData.actionsSup.diplomes_par_etablissement
                ],
                dispositifs: allData.dispositifs || [],
                options2ndeGT: allData.options2ndeGT || [],
                specialites1ereG: allData.specialites1ereG || []
            };

            // ÉTAPE 8 : Traitement centralisé
            this.#currentProgressModal.update('Traitement et stockage...', 90, 100);
            this.#addProgressDetail('💾 Déduplication et stockage en base...');
            const stats = await this.#processAndStoreAllData(rawData);
            if (this.#checkStopped()) return { cancelled: true };

            return {
                success: true,
                stats,
                extractionInfo: {
                    type: params.type,
                    zone: params.displayInfo?.nom || params.value,
                    voies,
                    date: stats.timestamp
                }
            };
        });
    }
    
    // =====================================
    // EXTRACTION LISTE DIPLÔMES DISPONIBLES PAR ZONE
    // =====================================
    
    /**
     * Extrait la liste des diplômes disponibles dans une zone géographique,
     * SANS stocker en base (utilisé pour peupler le formulaire de recherche par diplômes)
     * @param {Object} filters - Filtres géographiques (facettes Onisep)
     * @param {string} filters['facet.ens_departement'] - Nom du département (ex: "Ille-et-Vilaine")
     * @param {string} filters['facet.ens_academie']    - Nom de l'académie  (ex: "Rennes")
     * @returns {Promise<Object>} { success, items[], stats }
     * 
     * @example
     * const res = await controller.extractDiplomesDisponiblesByZone({
     *     'facet.ens_departement': 'Ille-et-Vilaine'
     * });
     */
    async extractDiplomesDisponiblesByZone(filters = {}) {
        console.log('[ExtractionController] 🚀 Extraction liste diplômes disponibles par zone : ', filters);
        
        // Créer modale AVEC bascule auto (simple liste, pas vraiment une extraction)
        this.#currentProgressModal = new ProgressModal(null, null, true, '🔍 Recherche des diplômes disponibles…');
        
        try {
            const allDiplomes = [];
            
            // Ouvrir et initialiser la modale
            this.#currentProgressModal.show();
            
            // ÉTAPE 1 : Extraire et parser les CAP ou équivalent
            this.#currentProgressModal.update('Extraction diplômes CAP...', 0, 100);
            
            const filtersCAP = {
                ...filters,
                'facet.for_niveau_de_sortie': 'CAP ou équivalent',
                size: 100
            };
            
            const actionsCAP = await this.#onisepAPI.queryDataset(
                'actions_lycee', 
                filtersCAP, 
                10, 
                (detail) => this.#currentProgressModal.addDetail(detail) // Passer le callback à l'API
            ); 
            
            if (this.#checkStopped()) return { cancelled: true };
            
            console.log(`[ExtractionController] ${actionsCAP.length} actions CAP récupérées`);
            
            // Parser CAP
            const parsedCAP = OnisepParser.parseActionsLycee(actionsCAP, false); // Pas de validation pour performance
            allDiplomes.push(...parsedCAP.diplomes);
            
            // ÉTAPE 2 : Requête Bac ou équivalent
            this.#currentProgressModal.update('Extraction diplômes Bac...', 50, 100);
            
            const filtersBac = {
                ...filters,
                'facet.for_niveau_de_sortie': 'bac ou équivalent',
                size: 100
            };
            
            const actionsBac = await this.#onisepAPI.queryDataset(
                'actions_lycee', 
                filtersBac, 
                10, 
                (detail) => this.#currentProgressModal.addDetail(detail)
            );
            
            if (this.#checkStopped()) return { cancelled: true };
            
            console.log(`[ExtractionController] ${actionsBac.length} actions Bac récupérées`, actionsBac);
            
            // Parser Bac
            const parsedBac = OnisepParser.parseActionsLycee(actionsBac, false);
            allDiplomes.push(...parsedBac.diplomes);
            console.log(`[ExtractionController] diplômes récupérés`, allDiplomes);
            
            // ÉTAPE 3 : Dédupliquer et compter établissements par diplôme
            this.#currentProgressModal.update('Traitement des diplômes...', 80, 100);
            
            const diplomesMap = new Map();
            
            // Fusionner tous les diplômes
            for (const diplome of allDiplomes) {
                if (!diplome.libelle) continue;
                
                if (!diplomesMap.has(diplome.libelle)) {
                    diplomesMap.set(diplome.libelle, {
                        libelle: diplome.libelle,
                        libelle: diplome.libelle,
                        type: diplome.type,
                        niveauSortie: diplome.niveauSortie,
                        urlOnisep: diplome.urlOnisep,
                        nbEtablissements: 0,
                        etablissements: new Set()
                    });
                }
            }
            
            // Compter établissements par diplôme
            const toutesRelations = [
                ...parsedCAP.diplomes_par_etablissement,
                ...parsedBac.diplomes_par_etablissement
            ];
            
            for (const relation of toutesRelations) {
                if (diplomesMap.has(relation.libelle)) {
                    diplomesMap.get(relation.libelle).etablissements.add(relation.uai);
                }
            }
            
            // Calculer nb établissements
            const diplomesAvecStats = Array.from(diplomesMap.values()).map(d => ({
                libelle: d.libelle,
                libelle: d.libelle,
                type: d.type,
                niveauSortie: d.niveauSortie,
                urlOnisep: d.urlOnisep,
                nbEtablissements: d.etablissements.size
            }));
            
            // Trier par nombre d'établissements décroissant
            diplomesAvecStats.sort((a, b) => b.nbEtablissements - a.nbEtablissements);
            
            const successMsg = `✅ ${diplomesAvecStats.length} diplômes trouvés`;
            this.#currentProgressModal.update(successMsg, 100, 100);
            this.#addProgressDetail(`Recherche terminée avec succès !`);
            
            console.log(`[ExtractionController] ${diplomesAvecStats.length} diplômes uniques trouvés`);
            
            // Fermer SANS bascule auto (c'est juste un chargement, pas une extraction)
            this.#currentProgressModal.hide(2000);
            
            return {
                success: true,
                items: diplomesAvecStats,
                stats: {
                    total: diplomesAvecStats.length,
                    cap: diplomesAvecStats.filter(d => d.niveauSortie === 'CAP ou équivalent').length,
                    bac: diplomesAvecStats.filter(d => d.niveauSortie === 'Bac ou équivalent').length
                }
            };
            
        } catch (error) {
            console.error('[ExtractionController] ❌ Erreur extraction diplômes:', error);
            
            // Afficher erreur dans la modale (si elle existe encore — elle peut avoir été
            // détruite par un appel concurrent ou un timeout de la ModalStack)
            if (this.#currentProgressModal) {
                this.#currentProgressModal.update('❌ Erreur lors de la recherche', 100, 100);
                this.#addProgressDetail(error.message || 'Erreur inconnue');
            }
            
            throw error;
        } finally {
            // Libérer la référence
            this.#currentProgressModal = null;
        }
    }

    // =====================================
    // EXTRACTION LISTE OPTIONS 2NDE GT DISPONIBLES PAR ZONE
    // =====================================

    /**
     * Extrait la liste des options 2nde GT disponibles dans une zone géographique,
     * SANS stocker en base (utilisé pour peupler le formulaire de recherche par options)
     * Symétrique de extractDiplomesDisponiblesByZone(), mais sur le dataset
     * 'enseignements_optionnels_2nde' dont les facettes ont des noms différents :
     *   - 'facet.departement_lieu_de_cours'  (≠ 'facet.ens_departement' pour les diplômes)
     *   - 'facet.academie_lieu_de_cours'     (≠ 'facet.ens_academie'    pour les diplômes)
     * @param {Object} filters - Filtres géographiques (facettes Onisep)
     * @param {string} filters['facet.departement_lieu_de_cours'] - Nom du département
     * @param {string} filters['facet.academie_lieu_de_cours']    - Nom de l'académie
     * @returns {Promise<Object>} { success, items[], stats }
     *
     * @example
     * const res = await controller.extractOptions2ndeGTDisponiblesByZone({
     *     'facet.departement_lieu_de_cours': 'Ille-et-Vilaine'
     * });
     */
    async extractOptions2ndeGTDisponiblesByZone(filters = {}) {
        console.log('[ExtractionController] 🚀 Extraction liste options 2nde GT disponibles par zone :', filters);

        // Modale AVEC bascule auto (simple liste de chargement, pas une extraction)
        this.#currentProgressModal = new ProgressModal(null, null, true, '🔍 Recherche des options 2nde GT…');

        try {
            this.#currentProgressModal.show();
            this.#currentProgressModal.update('Extraction des options 2nde GT...', 0, 100);

            // Une seule requête sur le dataset optionnels (pas de niveau de sortie à filtrer)
            const queryFilters = {
                ...filters,
                size: 100  
            };

            const rawData = await this.#onisepAPI.queryDataset(
                'enseignements_optionnels_2nde',
                queryFilters,
                1,
                (detail) => this.#currentProgressModal.addDetail(detail)
            );

            if (this.#checkStopped()) return { cancelled: true };
            console.log(`[ExtractionController] ${rawData.length} enregistrements récupérés`);

            // ÉTAPE 2 : Parser et dédupliquer les options
            this.#currentProgressModal.update('Traitement des options...', 80, 100);

            // Utiliser OnisepParser pour extraire les libellés d'options
            const parsed = OnisepParser.parseEnseignementsOptionnels2ndeGT(rawData, false);

            // Dédupliquer par libellé et compter les établissements
            const optionsMap = new Map(); // libelle → Set(uais)
            for (const rel of parsed.options2ndeGT_par_etablissement) {
                if (!rel.libelle) continue;
                if (!optionsMap.has(rel.libelle)) {
                    optionsMap.set(rel.libelle, new Set());
                }
                optionsMap.get(rel.libelle).add(rel.uai);
            }

            // Construire le tableau de résultat trié alphabétiquement
            const optionsAvecStats = Array.from(optionsMap.entries())
                .map(([libelle, uaisSet]) => ({
                    libelle,
                    nbEtablissements: uaisSet.size
                }))
                .sort((a, b) => a.libelle.localeCompare(b.libelle));

            const successMsg = `✅ ${optionsAvecStats.length} options trouvées`;
            this.#currentProgressModal.update(successMsg, 100, 100);
            this.#addProgressDetail('Recherche terminée avec succès !');
            console.log(`[ExtractionController] ${optionsAvecStats.length} options uniques trouvées`);

            // Fermer sans bascule (c'est juste un chargement)
            this.#currentProgressModal.hide(2000);

            return {
                success: true,
                items: optionsAvecStats,
                stats: {
                    total: optionsAvecStats.length
                }
            };

        } catch (error) {
            console.error('[ExtractionController] ❌ Erreur extraction options disponibles:', error);
            this.#currentProgressModal.update('❌ Erreur lors de la recherche', 100, 100);
            this.#addProgressDetail(error.message || 'Erreur inconnue');
            throw error;
        } finally {
            this.#currentProgressModal = null;
        }
    }
    
    // =====================================
    // MÉTHODES PRIVÉES - EXTRACTION
    // =====================================
    
    /**
     * Extrait toutes les données pour une liste d'UAI
     * Messages de progression et détails envoyés via callback entre 30 et 70%
     * @private
     * @param {Array<string>} uais - Liste des UAI
     * @returns {Promise<Object>} Toutes les données extraites
     */
    async #extractByUAIs(uais) {
        // Déduplication des UAI
        const uaisUniques = [...new Set(uais)];
        console.log(`[ExtractionController] ${uais.length} UAI dont ${uaisUniques.length} uniques`);
        
        const data = {
            actionsLycee: { diplomes: [], diplomes_par_etablissement: [] },
            actionsSup: { diplomes: [], diplomes_par_etablissement: [] },
            dispositifs: { dispositifs: [], dispositifs_par_etablissement: [] },
            options2ndeGT: { options2ndeGT: [], options2ndeGT_par_etablissement: [] },
            specialites1ereG: { specialites1ereG: [], specialites1ereG_par_etablissement: [] }
        };
        
        // Actions lycée
        this.#currentProgressModal.update('📚 Extraction des actions de formation (lycée)...', 30, 100);
        try {
            const actionsLycee = await this.#onisepAPI.queryDataset('actions_lycee', {
                q: uaisUniques, // ✅ Array → groupé automatiquement
                size: 1000
            }, 10, (detail) => this.#addProgressDetail(detail)); // Passer le callback à l'API
            data.actionsLycee = OnisepParser.parseActionsLycee(actionsLycee);
            console.log(`[ExtractionController] ${actionsLycee.length} actions lycée`);
        } catch (error) {
            console.error('[ExtractionController] Erreur actionsLycee:', error);
        }
        
        if (this.#checkStopped()) return data;
        
        // Actions sup
        this.#currentProgressModal.update('🎓 Extraction des actions de formation (supérieur)...', 40, 100);
        try {
            const actionsSup = await this.#onisepAPI.queryDataset('actions_sup', {
                q: uaisUniques, // ✅ Array → groupé automatiquement
                size: 1000
            }, 10, (detail) => this.#addProgressDetail(detail));
            data.actionsSup = OnisepParser.parseActionsSup(actionsSup);
            console.log(`[ExtractionController] ${actionsSup.length} actions sup`);
        } catch (error) {
            console.error('[ExtractionController] Erreur actionsSup:', error);
        }
        
        if (this.#checkStopped()) return data;
        
        // Dispositifs
        this.#currentProgressModal.update('🎯 Extraction des actions de dispositif...', 50, 100);
        try {
            const dispositifs = await this.#onisepAPI.queryDataset('dispositifs', {
                q: uaisUniques, // ✅ Array → groupé automatiquement
                size: 1000
            }, 10, (detail) => this.#addProgressDetail(detail));
            data.dispositifs = OnisepParser.parseActionsDispositifs(dispositifs);
        } catch (error) {
            console.error('[ExtractionController] Erreur dispositifs:', error);
        }
        
        if (this.#checkStopped()) return data;
        
        // Options 2nde GT
        this.#currentProgressModal.update('📖 Extraction des options de 2nde GT...', 60, 100);
        try {
            const options2ndeGT = await this.#onisepAPI.queryDataset('enseignements_optionnels_2nde', {
                q: uaisUniques, // ✅ Array → groupé automatiquement
                size: 1000
            }, 10, (detail) => this.#addProgressDetail(detail));
            data.options2ndeGT = OnisepParser.parseEnseignementsOptionnels2ndeGT(options2ndeGT);
            console.log(`[ExtractionController] ${options2ndeGT.length} options 2nde GT`);
        } catch (error) {
            console.error('[ExtractionController] Erreur options 2nde GT:', error);
        }
        
        if (this.#checkStopped()) return data;
        
        // Spécialités 1ère G
        this.#currentProgressModal.update('🔬 Extraction des spécialités de 1ère générale...', 70, 100);
        try {
            const specialites1ereG = await this.#onisepAPI.queryDataset('enseignements_specialite_1ere', {
                q: uaisUniques, // ✅ Array → groupé automatiquement
                size: 1000
            }, 10, (detail) => this.#addProgressDetail(detail));
            data.specialites1ereG = OnisepParser.parseEnseignementsSpecialites1ereG(specialites1ereG);
            console.log(`[ExtractionController] ${specialites1ereG.length} spécialités 1ère générale`);
        } catch (error) {
            console.error('[ExtractionController] Erreur spécialités 1ère générale:', error);
        }
        
        return data;
    }
        
    /**
     * Extrait toutes les données pour un tableau de codes INSEE
     * L'info se trouve dans le champ commune_cog de la structure etablissement
     * Notifications de progression envoyées via callback jusqu'à 20% avant extraction des données par UAI
     * et au-delà de 80% après extraction des données par UAI
     * @param {string} codesCommunes - Tableau des codes INSEE des communes
     * @returns {Promise<Object>} Résultats de l'extraction
     */
    async #extractCommunes(codesCommunes) {
        try {

            // ÉTAPE 1 : Requête structures (groupement automatique par lots de 10)
            this.#currentProgressModal.update('Recherche des établissements...', 5, 100);
            const structures = await this.#onisepAPI.queryDataset('structures', {
                q: codesCommunes, // ✅ Array → groupé automatiquement
                size: 100
            }, 10, (detail) => this.#addProgressDetail(detail)); // Passer le callback
            if (this.#checkStopped()) return { cancelled: true };
            
            // ÉTAPE 2 : Parser structures
            this.#currentProgressModal.update('Analyse des structures...', 10, 100);
            const parsedStructures = OnisepParser.parseStructures(structures);
            console.log(`[ExtractionController] ${structures.length} structures parsées : `, parsedStructures);
            
            // ÉTAPE 3 : Filtrer par code INSEE
            this.#currentProgressModal.update('Filtrage par code INSEE...', 15, 100);
            console.log(`[ExtractionController] Filtrage sur les code INSEE : `, codesCommunes);
            const communesCodesSet = new Set(codesCommunes);
            const filteredStructures = parsedStructures.etablissements.filter(etab => {
                return communesCodesSet.has(etab.codeCommuneCOG);
            });
            console.log(`[ExtractionController] ${filteredStructures.length} structures après filtrage code INSEE`);
            if (filteredStructures.length === 0) {
                console.warn('[ExtractionController] Aucune structure trouvée');
                return { success: true, etablissements: 0 };
            }
            
            // ÉTAPE 4 : Construire liste UAI et extraire toutes les données
            const uais = filteredStructures.map(e => e.uai);            
            const allData = await this.#extractByUAIs(uais);
            console.log(`[ExtractionController] Données extraites : `, allData);
            if (this.#checkStopped()) return { cancelled: true };
            
            // ÉTAPE 5 : Préparer données brutes pour traitement centralisé
            this.#currentProgressModal.update('Préparation des données...', 80, 100);
            const rawData = {
                // Etablissements
                etablissements: [
                    ...filteredStructures,
                ],
				// Diplômes 
				diplomes: [
					...allData.actionsLycee.diplomes,
					...allData.actionsSup.diplomes
				],
                // Relations diplômes - établissements
				relationsDiplomesEtablissements: [
					...allData.actionsLycee.diplomes_par_etablissement,
					...allData.actionsSup.diplomes_par_etablissement
				],
                // Dispositifs
                dispositifs: allData.dispositifs || [],
                // Options de 2nde GT
                options2ndeGT: allData.options2ndeGT || [],
                // Spécialités de 1ère G
                specialites1ereG: allData.specialites1ereG || []
            };
            
            // ÉTAPE 6 : Traitement centralisé (déduplication, filtrage, cascade, stockage)
            this.#currentProgressModal.update('Traitement et stockage...', 90, 100);
            
            const stats = await this.#processAndStoreAllData(rawData);
            
            if (this.#checkStopped()) return { cancelled: true };
            
            // Message final formaté
            const finalMessage = this.#formatStatsMessage(stats);
            this.#currentProgressModal.update(finalMessage, 100, 100);
            
            return {
                success: true,
                communes: codesCommunes.length,
                stats: stats,
            };            
        } catch (error) {
            console.error('[ExtractionController] ❌ Erreur extraction communes:', error);
            throw error;
        }
    }
        
    // =====================================
    // MÉTHODES PRIVÉES - TRAITEMENT
    // =====================================

    // =====================================
    // REFACTORING V0.20 - TRAITEMENT CENTRALISÉ
    // =====================================
    
    /**
     * Traite et stocke toutes les données extraites (FONCTION CENTRALE v0.20)
     * @param {Object} rawData - Données brutes non filtrées
            const rawData = {
                etablissements: [],
				diplomes: [];
				relationsDiplomesEtablissements: [];
                dispositifs: [],
                options2ndeGT: [],
                specialites1ereG: []
            };
	 
     * @returns {Promise<Object>} Statistiques détaillées
     */
    async #processAndStoreAllData(rawData) {
        const stats = {
            // Données entrantes
            input: {
                etablissements: rawData.etablissements?.length || 0,
                diplomes: rawData.diplomes?.length || 0,
				relationsDiplomesEtablissements: rawData.relationsDiplomesEtablissements?.length || 0,
                dispositifs: rawData.dispositifs.dispositifs?.length || 0,
				relationsDispositifsEtablissements: rawData.dispositifs.dispositifs_par_etablissement?.length || 0,
                options2ndeGT: rawData.options2ndeGT.options2ndeGT?.length || 0,
				relationsOptions2ndeGTEtablissements: rawData.options2ndeGT.options2ndeGT_par_etablissement?.length || 0,
                specialites1ereG: rawData.specialites1ereG.specialites1ereG?.length || 0,
				relationsSpecialites1ereGEtablissements: rawData.specialites1ereG.specialites1ereG_par_etablissement?.length || 0
            },
            
            // Stockées (après traitement)
            stored: {
                etablissements: 0,
                diplomes:  0,
				relationsDiplomesEtablissements:  0,
                dispositifs:  0,
				relationsDispositifsEtablissements:  0,
                options2ndeGT:  0,
				relationsOptions2ndeGTEtablissements: 0,
                specialites1ereG: 0,
				relationsSpecialites1ereGEtablissements: 0
            },
            
            // Suppressions en cascade
            cascade: {
                etablissements: 0,
                diplomes:  0,
                dispositifs:  0,
                options2ndeGT:  0,
                specialites1ereG: 0,
            },
            
            // Temps
            duree: 0,
            timestamp: new Date().toISOString()
        };
        
        const startTime = Date.now();
        console.log("[processAndStoreAllData] Raw data:", rawData);
        try {
            // ÉTAPE 1 : Construire un array des diplômes valides,
            // puis la map des diplômes uniques,
            // puis les stocker dans la base
            const diplomesValidesArray = await this.#buildDiplomesValidesArray(rawData);
            const diplomesUniquesMap = await this.#buildDiplomesUniquesMap(diplomesValidesArray);
            await this.#storeDiplomes(diplomesUniquesMap);
            stats.stored.diplomes = diplomesUniquesMap.size;
            stats.cascade.diplomes = stats.input.diplomes - stats.stored.diplomes;
            this.#addProgressDetail(`${stats.input.diplomes} diplômes → ${stats.stored.diplomes} stockés`);
            this.#databaseService.flush(); // 💾 1 save au lieu de N

            // ÉTAPE 2 : Construire la map des relations etablissement-diplômes valides,
            // puis les stocker dans la base
            const diplomesParEtablissementMap = await this.#buildDiplomesParEtablissementMap(rawData, diplomesUniquesMap);
            await this.#storeDiplomesParEtablissement(diplomesParEtablissementMap);
            stats.stored.relationsDiplomesEtablissements = diplomesParEtablissementMap.size;
            stats.cascade.relationsDiplomesEtablissements = stats.input.relationsDiplomesEtablissements - stats.stored.relationsDiplomesEtablissements;
            this.#addProgressDetail(`${stats.input.relationsDiplomesEtablissements} relations diplômes-établissements → ${stats.stored.relationsDiplomesEtablissements} stockées`);
            this.#databaseService.flush(); // 💾 1 save au lieu de N

            // ÉTAPE 3 : Construire la map des établissements uniques,
            // puis les stocker dans la base
            const etablissementsUniquesMap = await this.#buildEtablissementsUniquesMap(rawData, diplomesParEtablissementMap);
            const { count: nbEtabStockes, uaiToId } = await this.#storeEtablissements(etablissementsUniquesMap);
            stats.stored.etablissements = nbEtabStockes;
            stats.cascade.etablissements = stats.input.etablissements - stats.stored.etablissements;
            this.#addProgressDetail(`${stats.input.etablissements} établissements → ${stats.stored.etablissements} stockés`);
            // Enrichir les relations avec etabId (_id interne) maintenant que les étabs sont en base
            await this.#enrichirRelationsAvecEtabId(uaiToId);
            this.#databaseService.flush(); // 💾 1 save après étabs + enrichissement

            // ÉTAPE 3bis : Enrichir les établissements avec ens_hebergement, ens_site_web, ens_accessibilite
            // Collectés dans enrichissements_etab lors du parsing actionsLycee/actionsSup
            await this.#enrichirEtablissementsDepuisActions(rawData, uaiToId);

            // ÉTAPE 4 : Construire la map des relation dispositifs-etablissements valides,
            // puis les stocker dans la base
            const dispositifsParEtablissementMap = await this.#buildDispositifsParEtablissementMap(rawData, etablissementsUniquesMap);
            await this.#storeDispositifsParEtablissement(dispositifsParEtablissementMap);
            stats.stored.relationsDispositifsEtablissements = dispositifsParEtablissementMap.size;
            stats.cascade.relationsDispositifsEtablissements = stats.input.relationsDispositifsEtablissements - stats.stored.relationsDispositifsEtablissements;
            this.#addProgressDetail(`${stats.input.relationsDispositifsEtablissements} relations dispositifs-établissements → ${stats.stored.relationsDispositifsEtablissements} stockées`);
            this.#databaseService.flush(); // 💾 1 save au lieu de N

            // ÉTAPE 5 : Construire la map des dispositifs uniques,
            // puis les stocker dans la base
            const dispositifsUniquesMap = await this.#buildDispositifsUniquesMap(rawData, dispositifsParEtablissementMap);
            await this.#storeDispositifs(dispositifsUniquesMap);
            stats.stored.dispositifs = dispositifsUniquesMap.size;
            stats.cascade.dispositifs = stats.input.dispositifs - stats.stored.dispositifs;
            this.#addProgressDetail(`${stats.input.dispositifs} dispositifs → ${stats.stored.dispositifs} stockés`);
            this.#databaseService.flush(); // 💾 1 save au lieu de N

            // ÉTAPE 6 : Construire la map des relations options 2nde GT - établissements valides,
            // puis les stocker dans la base
            const options2ndeGTParEtablissementMap = await this.#buildOptions2ndeGTParEtablissementMap(rawData, etablissementsUniquesMap);
            await this.#storeOptions2ndeGTParEtablissement(options2ndeGTParEtablissementMap);
            stats.stored.relationsOptions2ndeGTEtablissements = options2ndeGTParEtablissementMap.size;
            stats.cascade.relationsOptions2ndeGTEtablissements = stats.input.relationsOptions2ndeGTEtablissements - stats.stored.relationsOptions2ndeGTEtablissements;
            this.#addProgressDetail(`${stats.input.relationsOptions2ndeGTEtablissements} relations options 2nde GT-établissements → ${stats.stored.relationsOptions2ndeGTEtablissements} stockées`);
            this.#databaseService.flush(); // 💾 1 save au lieu de N

            // ÉTAPE 7 : Construire la map des options 2nde GT uniques,
            // puis les stocker dans la base
            const options2ndeGTUniquesMap = await this.#buildOptions2ndeGTUniquesMap(rawData, options2ndeGTParEtablissementMap);
            await this.#storeOptions2ndeGT(options2ndeGTUniquesMap);
            stats.stored.options2ndeGT = options2ndeGTUniquesMap.size;
            stats.cascade.options2ndeGT = stats.input.options2ndeGT - stats.stored.options2ndeGT;
            this.#addProgressDetail(`${stats.input.options2ndeGT} options 2nde GT → ${stats.stored.options2ndeGT} stockées`);
            this.#databaseService.flush(); // 💾 1 save au lieu de N

            // ÉTAPE 8 : Construire la map des relations spécialités 1ère G - établissements valides,
            // puis les stocker dans la base
            const specialites1ereGParEtablissementMap = await this.#buildSpecialites1ereGParEtablissementMap(rawData, etablissementsUniquesMap);
            await this.#storeSpecialites1ereGParEtablissement(specialites1ereGParEtablissementMap);
            stats.stored.relationsSpecialites1ereGEtablissements = specialites1ereGParEtablissementMap.size;
            stats.cascade.relationsSpecialites1ereGEtablissements = stats.input.relationsSpecialites1ereGEtablissements - stats.stored.relationsSpecialites1ereGEtablissements;
            this.#addProgressDetail(`${stats.input.relationsSpecialites1ereGEtablissements} relations spécialités 1ère G-établissements → ${stats.stored.relationsSpecialites1ereGEtablissements} stockées`);
            this.#databaseService.flush(); // 💾 1 save au lieu de N

            // ÉTAPE 9 : Construire la map des spécialités 1ère G uniques,
            // puis les stocker dans la base
            const specialites1ereGUniquesMap = await this.#buildSpecialites1ereGUniquesMap(rawData, specialites1ereGParEtablissementMap);
            await this.#storeSpecialites1ereG(specialites1ereGUniquesMap);
            stats.stored.specialites1ereG = specialites1ereGUniquesMap.size;
            stats.cascade.specialites1ereG = stats.input.specialites1ereG - stats.stored.specialites1ereG;
            this.#addProgressDetail(`${stats.input.specialites1ereG} spécialités 1ère G → ${stats.stored.specialites1ereG} stockées`);
            this.#databaseService.flush(); // 💾 save final
            
            // Calcul durée
            stats.duree = Date.now() - startTime;
            
            this.#currentProgressModal.update('✅ Traitement terminé', 100, 100);
            
            return stats;
            
        } catch (error) {
            console.error('[processAndStoreAllData] Erreur:', error);
            throw error;
        }
    }
    
    /**
     * Enrichit les établissements stockés avec hebergement, siteWeb, accessibilite
     * extraits des actions lycée/sup (ens_... fields).
     * Stratégie : première valeur rencontrée par UAI, ne pas écraser si déjà renseigné.
     * @param {Object} rawData
     * @param {Map<string,string>} uaiToId  - UAI → _id interne (construit à l'étape 3)
     * @private
     */
    async #enrichirEtablissementsDepuisActions(rawData, uaiToId) {
        // Collecter les enrichissements de actionsLycee ET actionsSup
        const enrichRaw = [
            ...(rawData.actionsLycee?.enrichissements_etab || []),
            ...(rawData.actionsSup?.enrichissements_etab   || []),
            ...(rawData.dispositifs?.enrichissements_etab  || [])
        ];

        if (enrichRaw.length === 0) return;

        // Dédupliquer par UAI — première valeur rencontrée
        const byUai = new Map();
        for (const e of enrichRaw) {
            if (!byUai.has(e.uai)) byUai.set(e.uai, e);
            else {
                // Fusionner sans écraser les champs déjà présents
                const existing = byUai.get(e.uai);
                if (!existing.hebergement   && e.hebergement)   existing.hebergement   = e.hebergement;
                if (!existing.siteWeb       && e.siteWeb)       existing.siteWeb       = e.siteWeb;
                if (!existing.accessibilite && e.accessibilite) existing.accessibilite = e.accessibilite;
            }
        }

        let nbEnrichis = 0;
        for (const [uai, enrich] of byUai) {
            const id = uaiToId?.get(uai);
            if (!id) continue;
            const existing = await this.#databaseService.getEtablissement(id);
            if (!existing) continue;

            const updates = {};
            if (!existing.hebergement   && enrich.hebergement)   updates.hebergement   = enrich.hebergement;
            if (!existing.siteWeb       && enrich.siteWeb)       updates.siteWeb       = enrich.siteWeb;
            if (!existing.accessibilite && enrich.accessibilite) updates.accessibilite = enrich.accessibilite;

            if (Object.keys(updates).length > 0) {
                await this.#databaseService.updateEtablissement(id, updates);
                nbEnrichis++;
            }
        }

        if (nbEnrichis > 0) this.#databaseService.flush();
        console.log(`[OnisepExtractionController] ✅ ${nbEnrichis} étab(s) enrichis (hébergement/siteWeb/accessibilité)`);
    }

    /**
     * Construit un array des diplômes valides : GARDE uniquement CAP et Bac ou équivalent
     */
    async #buildDiplomesValidesArray(rawData) {
        
        // Filtrer les diplômes en vérifiant le niveau de sortie
        return rawData.diplomes.filter(diplome => {
            const niveau = diplome.niveauSortie.toLowerCase();
            
            // GARDER uniquement ces deux niveaux
            if (niveau === 'cap ou équivalent') return true;
            if (niveau === 'bac ou équivalent') return true;
            
            // Tout le reste est exclu
            return false;
        });
    }
    
    /**
     * Construit une map des diplômes par libellé
     */
    async #buildDiplomesUniquesMap(diplomesArray) {
        const diplomesMap = new Map();
        diplomesArray.forEach(d => { 
            if (d.libelle && !diplomesMap.has(d.libelle)) {
                diplomesMap.set(d.libelle, d);
            }
        });
        return diplomesMap;
    }

    /* Construit une map des relations établissement<->diplôme valides */
    async #buildDiplomesParEtablissementMap(rawData, diplomesMap) {
        const relationsMap = new Map();
       
        // Filtrer les relations
        for (const relation of rawData.relationsDiplomesEtablissements) {
            if (diplomesMap.has(relation.libelle)) {
                relationsMap.set(relation.id, relation);
            }
        }
        return relationsMap;
    }

    /**
     * Construit une map des établissements valides en se basant sur les relations établissement<->diplôme valides
     */
    async #buildEtablissementsUniquesMap(rawData, diplomesParEtablissementMap) {
        const etablissementsMap = new Map();
        const uaisValidesSet = new Set(diplomesParEtablissementMap.values().map(r => r.uai));

        if (rawData.etablissements) {
            for (const etab of rawData.etablissements) {
                if (etab.uai && !etablissementsMap.has(etab.uai) && uaisValidesSet.has(etab.uai)) {
                    etablissementsMap.set(etab.uai, etab);
                }
            }
        }
        
        return etablissementsMap;
    }
    
    /** Construit une map des relations dispositifs par établissement */
    async #buildDispositifsParEtablissementMap(rawData, etablissementsUniquesMap) {
        const dispositifsParEtablissementMap = new Map();
        
        if (!rawData.dispositifs || !rawData.dispositifs.dispositifs_par_etablissement) return dispositifsParEtablissementMap;
        
        // On dédoublonne les relations et on filtre sur les uai
        for (const relation of rawData.dispositifs.dispositifs_par_etablissement) {
            if (!dispositifsParEtablissementMap.has(relation.id) && etablissementsUniquesMap.has(relation.uai)) {
                dispositifsParEtablissementMap.set(relation.id, relation);
            }
        }
        
        return dispositifsParEtablissementMap;
    }

    /** Construit une map des dispositifs uniques */
    async #buildDispositifsUniquesMap(rawData, dispositifsParEtablissementMap) {
        const dispositifsMap = new Map();
        const dispositifLibellesValidesSet = new Set(dispositifsParEtablissementMap.values().map(r => r.libelle));

        if (rawData.dispositifs && rawData.dispositifs.dispositifs) {
            for (const dispositif of rawData.dispositifs.dispositifs) {
                if (dispositif.libelle && !dispositifsMap.has(dispositif.libelle) && dispositifLibellesValidesSet.has(dispositif.libelle)) {
                    dispositifsMap.set(dispositif.libelle, dispositif);
                }
            }
        }
        
        return dispositifsMap;
    }
    
    /** Construit une map des relations options 2nde GT par établissement */
    async #buildOptions2ndeGTParEtablissementMap(rawData, etablissementsUniquesMap) {
        const options2ndeGTParEtablissementMap = new Map();
        
        if (!rawData.options2ndeGT || !rawData.options2ndeGT.options2ndeGT_par_etablissement) return options2ndeGTParEtablissementMap;
        
        for (const relation of rawData.options2ndeGT.options2ndeGT_par_etablissement) {
            if (etablissementsUniquesMap.has(relation.uai)) {
                options2ndeGTParEtablissementMap.set(relation.id, relation);
            }
        }
        
        return options2ndeGTParEtablissementMap;
    }

    /** Construit une map des options 2nde GT uniques */
    async #buildOptions2ndeGTUniquesMap(rawData, options2ndeGTParEtablissementMap) {
        const options2ndeGTMap = new Map();
        const option2ndeGTLibellesValidesSet = new Set(options2ndeGTParEtablissementMap.values().map(r => r.libelle));

        if (rawData.options2ndeGT && rawData.options2ndeGT.options2ndeGT) {
            for (const option of rawData.options2ndeGT.options2ndeGT) {
                if (option.libelle && !options2ndeGTMap.has(option.libelle) && option2ndeGTLibellesValidesSet.has(option.libelle)) {
                    options2ndeGTMap.set(option.libelle, option);
                }
            }
        }
        
        return options2ndeGTMap;
    }

    /** Construit une map des spécialités 1ère G par établissement */
    async #buildSpecialites1ereGParEtablissementMap(rawData, etablissementsUniquesMap) {
        const specialites1ereGParEtablissementMap = new Map();
        
        if (!rawData.specialites1ereG || !rawData.specialites1ereG.specialites1ereG_par_etablissement) {
            console.warn('[buildSpecialites1ereGParEtablissementMap] Aucune relation spécialités 1ère G - établissements trouvée dans les données brutes');
            return specialites1ereGParEtablissementMap;
        }
        
        for (const relation of rawData.specialites1ereG.specialites1ereG_par_etablissement) {
            if (etablissementsUniquesMap.has(relation.uai)) {
                specialites1ereGParEtablissementMap.set(relation.id, relation);
            }
        }
        
        return specialites1ereGParEtablissementMap;
    }

    /** Construit une map des spécialités 1ère G uniques */
     async #buildSpecialites1ereGUniquesMap(rawData, specialites1ereGParEtablissementMap) {
        const specialites1ereGMap = new Map();
        const specialites1ereGLibellesValidesSet = new Set(specialites1ereGParEtablissementMap.values().map(r => r.libelle));

        if (rawData.specialites1ereG && rawData.specialites1ereG.specialites1ereG) {
            for (const specialite of rawData.specialites1ereG.specialites1ereG) {
                if (specialite.libelle && !specialites1ereGMap.has(specialite.libelle) && specialites1ereGLibellesValidesSet.has(specialite.libelle)) {
                    specialites1ereGMap.set(specialite.libelle, specialite);
                }
            }
        } else {
            console.warn('[buildSpecialites1ereGUniquesMap] Aucune spécialité de 1ère G trouvée dans les données brutes');
        }
        
        return specialites1ereGMap;
    }

    /**
     * Stocke les établissements en base.
     * Retourne un objet { count, uaiToId } où uaiToId est une Map UAI→_id interne.
     */
    async #storeEtablissements(etablissementsMap) {
        let count = 0;
        const uaiToId = new Map();
    
        console.log(`[storeEtablissements] 📦 Stockage de ${etablissementsMap.size} établissements`);
        for (const etab of etablissementsMap.values()) {
            const insertKey = await this.#databaseService.insertEtablissement(etab);
            if (!insertKey) {
                const motif = (!etab.uai && !etab.siret)
                    ? 'UAI et SIRET tous deux absents'
                    : 'erreur inconnue';
                console.warn(`[storeEtablissements] ❌ Établissement refusé: "${etab.nom}" — ${motif}`);
                this.#addProgressDetail(`⚠️ Établissement refusé (${motif}): ${etab.nom || '?'}`, 'warning');
            } else {
                count++;
                if (etab.uai) uaiToId.set(etab.uai, insertKey);
            }
        };
        console.log(`[storeEtablissements] ${count} établissements stockés`);
        return { count, uaiToId };
    }

    /**
     * Enrichit les relations déjà stockées avec le etabId (_id interne)
     * à partir de la Map UAI→_id retournée par storeEtablissements.
     */
    async #enrichirRelationsAvecEtabId(uaiToId) {
        if (!uaiToId || uaiToId.size === 0) return;

        const tables = [
            { getAll: () => this.#databaseService.getAllDiplomesParEtablissement(),       insert: r => this.#databaseService.insertDiplomeParEtablissement(r) },
            { getAll: () => this.#databaseService.getAllDispositifsParEtablissement(),     insert: r => this.#databaseService.insertDispositifParEtablissement(r) },
            { getAll: () => this.#databaseService.getAllOptions2ndeGTParEtablissement(),   insert: r => this.#databaseService.insertOption2ndeGTParEtablissement(r) },
            { getAll: () => this.#databaseService.getAllSpecialites1ereGParEtablissement ? this.#databaseService.getAllSpecialites1ereGParEtablissement() : Promise.resolve([]), insert: r => this.#databaseService.insertSpecialite1ereGParEtablissement(r) },
        ];

        for (const table of tables) {
            const rels = await table.getAll();
            for (const rel of rels) {
                if (!rel.etabId && rel.uai && uaiToId.has(rel.uai)) {
                    rel.etabId = uaiToId.get(rel.uai);
                    await table.insert(rel);
                }
            }
        }
        console.log('[enrichirRelationsAvecEtabId] ✅ Relations enrichies avec etabId');
    }
    
    /**
     * Stocke les diplômes en base
     */
    async #storeDiplomes(diplomesMap) {
        let count = 0;
        
        console.log(`[storeDiplomes] 📦 Stockage de ${diplomesMap.size} diplômes`);
        for (const d of diplomesMap.values()) {
            const insertKey = await this.#databaseService.insertDiplome(d);
            if (!insertKey) {
                console.warn(`[storeDiplomes] ❌ Échec du stockage du diplôme: "${d.libelle}"`);
            } else {
                console.log(`[storeDiplomes] ✅ Diplôme stocké avec clé: ${insertKey}`);
                count++;
            }
        };
        console.log(`[storeDiplomes] ${count} diplômes stockés`);
        return count;
    }

    
    /**
     * Stocke les relations diplômes-établissements en base
     */
    async #storeDiplomesParEtablissement(relationsMap) {
        let count = 0;
        
        console.log(`[storeDiplomesParEtablissement] 📦 Stockage de ${relationsMap.size} relations diplôme-établissement`);
        for (const relation of relationsMap.values()) {
            const insertKey = await this.#databaseService.insertDiplomeParEtablissement(relation);
            if (!insertKey) {
                console.warn(`[storeDiplomesParEtablissement] ❌ Échec du stockage de la relation diplôme-établissement: "${relation.libelle}" - UAI: ${relation.uai}`);
            } else {
                console.log(`[storeDiplomesParEtablissement] ✅ Relation diplôme-établissement stockée avec clé: ${insertKey}`);
                count++;
            }
        };
        console.log(`[storeDiplomesParEtablissement] ${count} relations diplôme-établissement stockées`);        
        return count;
    }
    
    /**
     * Stocke les dispositifs en base
     */
    async #storeDispositifs(dispositifsMap) {
        let count = 0;
        
        console.log(`[storeDispositifs] 📦 Stockage de ${dispositifsMap.size} dispositifs`);
        for (const d of dispositifsMap.values()) {
            const insertKey = await this.#databaseService.insertDispositif(d);
            if (!insertKey) {
                console.warn(`[storeDispositifs] ❌ Échec du stockage du dispositif: "${d.libelle}"`);
            } else {
                console.log(`[storeDispositifs] ✅ Dispositif stocké avec clé: ${insertKey}`);
                count++;
            }
        };
        return count;
    }

    /** 
     * Stocke les relations dispositifs-établissements en base
     */
    async #storeDispositifsParEtablissement(dispositifsParEtablissementMap) {
        let count = 0;

        console.log(`[storeDispositifsParEtablissement] 📦 Stockage de ${dispositifsParEtablissementMap.size} relations dispositifs-établissements`);
        for (const relation of dispositifsParEtablissementMap.values()) {
            const insertKey = await this.#databaseService.insertDispositifParEtablissement(relation);
            if (!insertKey) {
                console.warn(`[storeDispositifsParEtablissement] ❌ Échec du stockage de la relation dispositif-établissement: "${relation.libelle}" - UAI: ${relation.uai}`);
            } else {
                console.log(`[storeDispositifsParEtablissement] ✅ Relation dispositif-établissement stockée avec clé: ${insertKey}`);
                count++;
            }
        };
        return count;
    }

    /**
     * Stocke les options 2nde GT en base
     */
    async #storeOptions2ndeGT(options2ndeGTMap) {
        let count = 0;
        
        console.log(`[storeOptions2ndeGT] 📦 Stockage de ${options2ndeGTMap.size} options de 2nde GT`);
        for (const o of options2ndeGTMap.values()) {
            const insertKey = await this.#databaseService.insertOption2ndeGT(o);
            if (!insertKey) {
                console.warn(`[storeOptions2ndeGT] ❌ Échec du stockage de l'option de 2nde GT: "${o.libelle}"`);
            } else {
                console.log(`[storeOptions2ndeGT] ✅ Option de 2nde GT stockée avec clé: ${insertKey}`);
                count++;
            }
        };
        return count;
    }
    
    /**
     * Stocke les relations options 2nde GT - établissements en base
     */
    async #storeOptions2ndeGTParEtablissement(relationsMap) {
        let count = 0;

        console.log(`[storeOptions2ndeGTParEtablissement] 📦 Stockage de ${relationsMap.size} relations options 2nde GT - établissements`);
        for (const relation of relationsMap.values()) {
            const insertKey = await this.#databaseService.insertOption2ndeGTParEtablissement(relation);
            if (!insertKey) {
                console.warn(`[storeOptions2ndeGTParEtablissement] ❌ Échec du stockage de la relation option 2nde GT - établissement: "${relation.libelle}" - UAI: ${relation.uai}`);
            } else {
                console.log(`[storeOptions2ndeGTParEtablissement] ✅ Relation option 2nde GT - établissement stockée avec clé: ${insertKey}`);
                count++;
            }
        };
        return count;
    }
    
    
    /**
     * Stocke les spécialités 1ère G en base
     */
    async #storeSpecialites1ereG(specialites1ereGMap) {
        let count = 0;

        console.log(`[storeSpecialites1ereG] 📦 Stockage de ${specialites1ereGMap.size} spécialités de 1ère G`);
        for (const s of specialites1ereGMap.values()) {
            const insertKey = await this.#databaseService.insertSpecialite1ereG(s);
            if (!insertKey) {
                console.warn(`[storeSpecialites1ereG] ❌ Échec du stockage de la spécialité de 1ère G: "${s.libelle}"`);
            } else {
                console.log(`[storeSpecialites1ereG] ✅ Spécialité de 1ère G stockée avec clé: ${insertKey}`);
                count++;
            }
        };
        return count;
    }

    /** 
     * Stocke les relations spécialités 1ère G - établissements en base
     */
    async #storeSpecialites1ereGParEtablissement(relationsMap) {
        let count = 0;

        console.log(`[storeSpecialites1ereGParEtablissement] 📦 Stockage de ${relationsMap.size} relations spécialités 1ère G - établissements`);
        for (const relation of relationsMap.values()) {
            const insertKey = await this.#databaseService.insertSpecialite1ereGParEtablissement(relation);
            if (!insertKey) {
                console.warn(`[storeSpecialites1ereGParEtablissement] ❌ Échec du stockage de la relation spécialité 1ère G - établissement: "${relation.libelle}" - UAI: ${relation.uai}`);
            } else {
                console.log(`[storeSpecialites1ereGParEtablissement] ✅ Relation spécialité 1ère G - établissement stockée avec clé: ${insertKey}`);
                count++;
            }
        };
        return count;
    }
    
    /**
     * Formate le message de stats final
     */
    #formatStatsMessage(stats) {
        // Cas apprentissage uniquement : stats n'a pas de propriété "stored"
        if (!stats || !stats.stored) {
            const nbEtab = stats?.etablissements ?? 0;
            const nbDip  = stats?.diplomes ?? 0;
            const duree  = stats?.duree != null ? ` en ${(stats.duree / 1000).toFixed(1)}s` : '';
            return [
                `✅ Extraction terminée${duree}`,
                '',
                '📊 Résumé:',
                `• ${nbEtab} établissements stockés`,
                `• ${nbDip} formations stockées`
            ].join('\n');
        }

        const lines = [
            `✅ Extraction terminée en ${(stats.duree / 1000).toFixed(1)}s`,
            '',
            '📊 Résumé:',
            `• ${stats.stored.etablissements} établissements stockés`,
            `• ${stats.stored.relationsDiplomesEtablissements} relations diplômes - établissements stockées`,
            `• ${stats.stored.diplomes} diplômes stockés`,
            `• ${stats.stored.relationsDispositifsEtablissements} relations dispositifs - établissements stockées`,
            `• ${stats.stored.dispositifs} dispositifs stockés`,
            `• ${stats.stored.relationsOptions2ndeGTEtablissements} relations options 2nde - établissements stockées`,
            `• ${stats.stored.options2ndeGT} options 2nde stockées`,
            `• ${stats.stored.relationsSpecialites1ereGEtablissements} relations spécialités 1ère G - établissements stockées`,
            `• ${stats.stored.specialites1ereG} spécialités 1ère G stockées`
        ];
        
        // Ajouter infos cascade si suppressions
        if (stats.cascade.etablissementsSansDiplome > 0) {
            lines.push('');
            lines.push('🗑️ Suppressions en cascade:');
            lines.push(`• ${stats.cascade.diplomes} diplômes invalides`);
            lines.push(`• ${stats.cascade.etablissements} établissements sans diplôme`);
            lines.push(`• ${stats.cascade.dispositifs} dispositifs orphelins`);
            lines.push(`• ${stats.cascade.options2nde} options 2nde orphelines`);
            lines.push(`• ${stats.cascade.specialites1ere} spécialités 1ère orphelines`);
        }
        
        return lines.join('\n');
    }

    /**
     * Enrichit les établissements CARIF-OREF avec type/statut depuis le dataset ONISEP structures.
     * Appelé après une extraction CARIF pour les établissements sans type ni statut.
     * @param {string[]} uais - Liste des UAI à enrichir
     * @returns {Promise<number>} Nombre d'établissements enrichis
     */
    async enrichirTypeStatutParUAIs(uais) {
        if (!uais || uais.length === 0) return 0;
        if (!this.isAuthenticated()) {
            console.warn('[OnisepExtractionController] enrichirTypeStatutParUAIs : non authentifié');
            return 0;
        }

        console.log(`[OnisepExtractionController] Enrichissement type/statut pour ${uais.length} UAI(s)...`);
        try {
            const structures = await this.#onisepAPI.queryDataset('structures', {
                q: uais,
                size: 200
            }, 10);

            const parsed = OnisepParser.parseStructures(structures);
            let nbEnrichis = 0;

            for (const etab of parsed.etablissements) {
                if (!etab.uai) continue;
                const existing = await this.#databaseService.getEtablissementByUai(etab.uai);
                if (!existing) continue;

                // N'écraser que les champs manquants
                const updates = {};
                if (!existing.type  && etab.type)   updates.type   = etab.type;
                if (!existing.statut && etab.statut) updates.statut = etab.statut;
                if (!existing.nom   && etab.nom)     updates.nom    = etab.nom;

                if (Object.keys(updates).length > 0) {
                    await this.#databaseService.updateEtablissement(existing._id, updates);
                    nbEnrichis++;
                }
            }

            if (nbEnrichis > 0) this.#databaseService.flush(); // 💾 batch save enrichissements
            console.log(`[OnisepExtractionController] ✅ ${nbEnrichis} établissements enrichis (type/statut)`);
            return nbEnrichis;

        } catch (error) {
            console.warn('[OnisepExtractionController] Enrichissement type/statut échoué:', error);
            return 0;
        }
    }
}

// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    window.OnisepExtractionController = OnisepExtractionController;
}
