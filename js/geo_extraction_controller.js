/************************************************
 * Fichier : geo_extraction_controller.js
 * Description : Contrôleur d'extraction pour l'API Géo
 * Auteur : Laurent COSTE
 * Date : 2026-02-03
 * Version : 1.0
 ************************************************/

/**
 * Contrôleur d'extraction pour l'API Géo
 * Orchestre les recherches géographiques pour l'extraction ONISEP
 */
class GeoExtractionController {
    
    // =====================================
    // PROPRIÉTÉS
    // =====================================
    
    #geoAPI; // Public temporairement (TODO: créer méthodes publiques)
    #databaseService;
    
    /**
     * Constructeur - Instancie GeoAPI en interne
     */
    constructor() {
        console.log('[GeoExtractionController] 🏗️ Initialisation...');
        this.#geoAPI = new GeoAPI();
        // DatabaseService est global (window.databaseService)
        this.#databaseService = null; // Sera assigné plus tard
        console.log('[GeoExtractionController] ✅ Initialisé');
    }
    
    /**
     * Initialise le controller avec DatabaseService global
     * Appelé après la création de window.databaseService
     */
    init() {
        this.#databaseService = window.databaseService;
        console.log('[GeoExtractionController] 🔗 DatabaseService connecté');
    }

    // =====================================
    // RECHERCHE COMMUNES
    // =====================================
    
    /**
     * Recherche des communes par pattern
     * @param {string} pattern - Pattern de recherche
     * @param {Object} options - Options de recherche
     * @param {number} options.limit - Nombre max de résultats (défaut: 10)
     * @param {string} options.codeDepartement - Filtrer par département
     * @param {string} options.codeRegion - Filtrer par région
     * @returns {Promise<Array>} Liste de communes parsées
     */
    async searchCommunes(pattern, options = {}) {
        console.log(`[GeoExtractionController] 🔍 Recherche communes: ${pattern}`);
        
        try {
            // Requête API
            const communesRaw = await this.#geoAPI.searchCommunes(pattern, options);
            
            // Parsing
            const communes = GeoDataParser.parseCommunes(communesRaw);
            
            console.log(`[GeoExtractionController] ✅ ${communes.length} commune(s) trouvée(s)`);
            
            return communes;
            
        } catch (error) {
            console.error('[GeoExtractionController] ❌ Erreur recherche communes:', error);
            throw error;
        }
    }
    
    /**
     * Récupère une commune par son code INSEE
     * @param {string} codeCommune - Code INSEE (5 caractères)
     * @returns {Promise<Object>} Commune parsée
     */
    async getCommuneByCode(codeCommune) {
        console.log(`[GeoExtractionController] 📍 Récupération commune: ${codeCommune}`);
        
        try {
            const communeRaw = await this.#geoAPI.getCommuneByCode(codeCommune);
            const communes = GeoDataParser.parseCommunes([communeRaw]);
            
            return communes[0];
            
        } catch (error) {
            console.error('[GeoExtractionController] ❌ Erreur récupération commune:', error);
            throw error;
        }
    }
    
    /**
     * Récupère toutes les communes d'un EPCI par son code
     * @param {string} codeEpci - Code SIREN de l'EPCI (9 caractères)
     * @returns {Promise<Array>} Liste de communes
     */
    async getCommunesByEPCI(codeEpci) {
        try {
            const communesRaw = await this.#geoAPI.getCommunesByEPCI(codeEpci);
            const communes = GeoDataParser.parseCommunes(communesRaw);

            return communes;
            
        } catch (error) {
            console.error('[GeoExtractionController] ❌ Erreur récupération communes d\'un EPCI:', error);
            throw error;
        }
    }

    // =====================================
    // RECHERCHE EPCI
    // =====================================
    
    /**
     * Recherche des EPCI par nom
     * @param {string} nom - Nom de l'EPCI
     * @returns {Promise<Array>} Liste d'EPCI parsés
     */
    async searchEPCI(nom) {
        console.log(`[GeoExtractionController] 🔍 Recherche EPCI: ${nom}`);
        
        try {
            // Requête API
            const epcisRaw = await this.#geoAPI.searchEPCI(nom);
            
            // Parsing
            const epcis = GeoDataParser.parseEPCIs(epcisRaw);
            
            console.log(`[GeoExtractionController] ✅ ${epcis.length} EPCI trouvé(s)`);
            
            return epcis;
            
        } catch (error) {
            console.error('[GeoExtractionController] ❌ Erreur recherche EPCI:', error);
            throw error;
        }
    }

    async getEPCIByCode(codeEPCI) {
        console.log(`[GeoExtractionController] 📍 Récupération EPCI: ${codeEPCI}`);
        
        // Gérer cas null/undefined
        if (!codeEPCI) {
            console.log('[GeoExtractionController] ⚠️ Code EPCI vide');
            return null;
        }
        
        try {
            const epci = await this.#databaseService.getEPCI(codeEPCI);
            
            if (!epci) {
                console.log(`[GeoExtractionController] ⚠️ EPCI ${codeEPCI} non trouvé en base`);
                return null;
            }
            
            console.log(`[GeoExtractionController] nom EPCI: ${epci.nom} : `, epci);
            return epci;
        } catch (error) {
            console.error('[GeoExtractionController] ❌ Erreur récupération EPCI par code:', error);
            return null; // Retourner null au lieu de throw
        }
    }

    /**
     * Récupère un EPCI par son code SIREN et ses communes
     * @param {string} codeEpci - Code SIREN de l'EPCI (9 caractères)
     * @returns {Promise<Object>} { epci, communes }
     */
    async getEPCIWithCommunes(codeEpci) {
        console.log(`[GeoExtractionController] 📍 Récupération EPCI: ${codeEpci}`);
        
        try {
            // Récupérer l'EPCI
            const epciRaw = await this.#geoAPI.getEPCIByCode(codeEpci);
            const epcis = GeoDataParser.parseEPCIs([epciRaw]);
            const epci = epcis[0];
            
            // Récupérer les communes de l'EPCI
            const communesRaw = await this.#geoAPI.getCommunesByEPCI(codeEpci);
            const communes = GeoDataParser.parseCommunes(communesRaw);
            
            console.log(`[GeoExtractionController] ✅ ${epci.nom}: ${communes.length} communes`);
            
            return { epci, communes };
            
        } catch (error) {
            console.error('[GeoExtractionController] ❌ Erreur récupération EPCI:', error);
            throw error;
        }
    }
    
    /**
     * Récupère tous les EPCI et les stocke en base
     */
    async getAllEPCIs() {
        console.log(`[GeoExtractionController] 📋 Récupération tous EPCI`);
        
        try {
            const EPCIRaw = await this.#geoAPI.searchEPCIs();
            const EPCIs = GeoDataParser.parseEPCIs(EPCIRaw);
            
            console.log(`[GeoExtractionController] ✅ ${EPCIs.length} EPCI trouvés : `, EPCIs);
            console.log(`[GeoExtractionController] Effacement des données en base et stockage des nouveaux EPCI`);
            this.#databaseService.clearGeoData();
            for (const epci of EPCIs){
                await this.#databaseService.insertEPCI(epci);
            }            
        } catch (error) {
            console.error('[GeoExtractionController] ❌ Erreur récupération départements:', error);
            throw error;
        }
    }
    
    // =====================================
    // RECHERCHE DÉPARTEMENTS
    // =====================================
    
    /**
     * Recherche des départements par nom
     * @param {string} nom - Nom du département
     * @returns {Promise<Array>} Liste de départements parsés
     */
    async searchDepartements(nom) {
        console.log(`[GeoExtractionController] 🔍 Recherche départements: ${nom}`);
        
        try {
            const departementsRaw = await this.#geoAPI.searchDepartements(nom);
            const departements = GeoDataParser.parseDepartements(departementsRaw);
            
            console.log(`[GeoExtractionController] ✅ ${departements.length} département(s) trouvé(s)`);
            
            return departements;
            
        } catch (error) {
            console.error('[GeoExtractionController] ❌ Erreur recherche départements:', error);
            throw error;
        }
    }
    
    /**
     * Récupère tous les départements
     * @returns {Promise<Array>} Liste de tous les départements
     */
    async getAllDepartements() {
        console.log(`[GeoExtractionController] 📋 Récupération tous départements`);
        
        try {
            const departementsRaw = await this.#geoAPI.getAllDepartements();
            const departements = GeoDataParser.parseDepartements(departementsRaw);
            
            console.log(`[GeoExtractionController] ✅ ${departements.length} départements`);
            
            return departements;
            
        } catch (error) {
            console.error('[GeoExtractionController] ❌ Erreur récupération départements:', error);
            throw error;
        }
    }
    
    /**
     * Récupère un département et ses communes
     * @param {string} codeDepartement - Code du département
     * @returns {Promise<Object>} { departement, communes }
     */
    async getDepartementWithCommunes(codeDepartement) {
        console.log(`[GeoExtractionController] 📍 Récupération département: ${codeDepartement}`);
        
        try {
            const departementRaw = await this.#geoAPI.getDepartementByCode(codeDepartement);
            const departements = GeoDataParser.parseDepartements([departementRaw]);
            const departement = departements[0];
            
            const communesRaw = await this.#geoAPI.getCommunesByDepartement(codeDepartement);
            const communes = GeoDataParser.parseCommunes(communesRaw);
            
            console.log(`[GeoExtractionController] ✅ ${departement.nom}: ${communes.length} communes`);
            
            return { departement, communes };
            
        } catch (error) {
            console.error('[GeoExtractionController] ❌ Erreur récupération département:', error);
            throw error;
        }
    }
    
    // =====================================
    // RECHERCHE RÉGIONS
    // =====================================
    
    /**
     * Recherche des régions par nom
     * @param {string} nom - Nom de la région
     * @returns {Promise<Array>} Liste de régions parsées
     */
    async searchRegions(nom) {
        console.log(`[GeoExtractionController] 🔍 Recherche régions: ${nom}`);
        
        try {
            const regionsRaw = await this.#geoAPI.searchRegions(nom);
            const regions = GeoDataParser.parseRegions(regionsRaw);
            
            console.log(`[GeoExtractionController] ✅ ${regions.length} région(s) trouvée(s)`);
            
            return regions;
            
        } catch (error) {
            console.error('[GeoExtractionController] ❌ Erreur recherche régions:', error);
            throw error;
        }
    }
    
    /**
     * Récupère toutes les régions
     * @returns {Promise<Array>} Liste de toutes les régions
     */
    async getAllRegions() {
        console.log(`[GeoExtractionController] 📋 Récupération toutes régions`);
        
        try {
            const regionsRaw = await this.#geoAPI.getAllRegions();
            const regions = GeoDataParser.parseRegions(regionsRaw);
            
            console.log(`[GeoExtractionController] ✅ ${regions.length} régions`);
            
            return regions;
            
        } catch (error) {
            console.error('[GeoExtractionController] ❌ Erreur récupération régions:', error);
            throw error;
        }
    }
    
    /**
     * Récupère une région avec ses départements et communes
     * @param {string} codeRegion - Code de la région
     * @returns {Promise<Object>} { region, departements, communes }
     */
    async getRegionComplete(codeRegion) {
        console.log(`[GeoExtractionController] 📍 Récupération région complète: ${codeRegion}`);
        
        try {
            // Région
            const regionRaw = await this.#geoAPI.getRegionByCode(codeRegion);
            const regions = GeoDataParser.parseRegions([regionRaw]);
            const region = regions[0];
            
            // Départements
            const departementsRaw = await this.#geoAPI.getDepartementsByRegion(codeRegion);
            const departements = GeoDataParser.parseDepartements(departementsRaw);
            
            // Communes
            const communesRaw = await this.#geoAPI.getCommunesByRegion(codeRegion);
            const communes = GeoDataParser.parseCommunes(communesRaw);
            
            console.log(`[GeoExtractionController] ✅ ${region.nom}: ${departements.length} départements, ${communes.length} communes`);
            
            return { region, departements, communes };
            
        } catch (error) {
            console.error('[GeoExtractionController] ❌ Erreur récupération région:', error);
            throw error;
        }
    }
}

// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    window.GeoExtractionController = GeoExtractionController;
}
