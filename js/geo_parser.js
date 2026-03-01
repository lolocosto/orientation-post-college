/************************************************
 * Fichier : geo_data_parser.js
 * Description : Parsers spécialisés pour les données de l'API Géo
 * Auteur : Laurent COSTE
 * Date : 2026-02-03
 * Version : 1.0 - Phase 2
 ************************************************/

/**
 * Service de parsing des données API Géo
 * Un parser spécialisé par type de données
 */
class GeoDataParser {
    
    // =====================================
    // SCHÉMAS DE VALIDATION
    // =====================================
    
    static #SCHEMAS = {
        commune: [
            'nom',
            'code',
            'codeDepartement',
            'siren',
            'codeEpci',
            'codeRegion',
            'codesPostaux',
            'population'
            // Note: '_score' est optionnel (présent seulement dans recherches)
        ],
        
        epci: [
            'nom',
            'code',
            'codesDepartements',  // Présent dans getEPCIByCode
            'codesRegions',  // Présent dans getEPCIByCode
            'population'  // Présent dans getEPCIByCode
            // Note: '_score' est optionnel (présent seulement dans recherches)
        ],
        
        departement: [
            'nom',
            'code',
            'codeRegion'
        ],
        
        region: [
            'nom',
            'code'
        ]
    };
    
    /**
     * Valide les champs d'un objet par rapport à un schéma
     * @private
     * @param {Object} data - Données à valider
     * @param {Array} schema - Schéma de validation
     * @param {string} dataType - Type de données (pour les logs)
     * @returns {Object} { manquants: Array, inattendus: Array }
     */
    static _validateFields(data, schema, dataType) {
        const dataFields = Object.keys(data);
        
        // Champs manquants (attendus mais absents)
        const manquants = schema.filter(field => !(field in data));
        
        // Champs inattendus (présents mais non attendus)
        const inattendus = dataFields.filter(field => !schema.includes(field));
        
        // Logger si anomalies détectées
        if (manquants.length > 0) {
            console.warn(`[GeoDataParser] ${dataType} - Champs MANQUANTS (${manquants.length}):`, manquants);
        }
        
        if (inattendus.length > 0) {
            console.info(`[GeoDataParser] ${dataType} - Champs INATTENDUS (${inattendus.length}):`, inattendus);
        }
        
        // Si tout est OK
        if (manquants.length === 0 && inattendus.length === 0) {
            console.log(`[GeoDataParser] ${dataType} - ✅ Tous les champs correspondent au schéma`);
        }
        
        return { manquants, inattendus };
    }
    
    // =====================================
    // PARSER : COMMUNE
    // =====================================
    
    /**
     * Parse une commune
     * @private
     * @param {Object} commune - Commune brute de l'API
     * @returns {Object} Commune normalisée
     */
    static _parseCommune(commune) {
        return {
            nom: commune.nom || null,
            code: commune.code || null,
            codeDepartement: commune.codeDepartement || null,
            siren: commune.siren || null,
            codeEpci: commune.codeEpci || null,
            codeRegion: commune.codeRegion || null,
            codesPostaux: commune.codesPostaux || [],
            population: commune.population || null
        };
    }
    
    /**
     * Parse un tableau de communes
     * @param {Array<Object>} communes - Tableau de communes
     * @param {boolean} validate - Valider le schéma (défaut: true)
     * @returns {Array} Communes normalisées
     */
    static parseCommunes(communes, validate = true) {
        // Validation du schéma sur le premier enregistrement
        if (validate && communes.length > 0) {
            this._validateFields(communes[0], this.#SCHEMAS.commune, 'commune');
        }
        
        return communes.map(c => this._parseCommune(c));
    }
    
    // =====================================
    // PARSER : EPCI
    // =====================================
    
    /**
     * Parse un EPCI
     * @private
     * @param {Object} epci - EPCI brut de l'API
     * @returns {Object} EPCI normalisé
     */
    static _parseEPCI(epci) {
        return {
            nom: epci.nom || null,
            code: epci.code || null,
            population: epci.population || null
        };
    }
    
    /**
     * Parse un tableau d'EPCI
     * @param {Array<Object>} epcis - Tableau d'EPCI
     * @param {boolean} validate - Valider le schéma (défaut: true)
     * @returns {Array} EPCI normalisés
     */
    static parseEPCIs(epcis, validate = true) {
        // Validation du schéma sur le premier enregistrement
        if (validate && epcis.length > 0) {
            this._validateFields(epcis[0], this.#SCHEMAS.epci, 'epci');
        }
        
        return epcis.map(e => this._parseEPCI(e));
    }
    
    // =====================================
    // PARSER : DÉPARTEMENT
    // =====================================
    
    /**
     * Parse un département
     * @private
     * @param {Object} departement - Département brut de l'API
     * @returns {Object} Département normalisé
     */
    static _parseDepartement(departement) {
        return {
            nom: departement.nom || null,
            code: departement.code || null,
            codeRegion: departement.codeRegion || null
        };
    }
    
    /**
     * Parse un tableau de départements
     * @param {Array<Object>} departements - Tableau de départements
     * @param {boolean} validate - Valider le schéma (défaut: true)
     * @returns {Array} Départements normalisés
     */
    static parseDepartements(departements, validate = true) {
        // Validation du schéma sur le premier enregistrement
        if (validate && departements.length > 0) {
            this._validateFields(departements[0], this.#SCHEMAS.departement, 'departement');
        }
        
        return departements.map(d => this._parseDepartement(d));
    }
    
    // =====================================
    // PARSER : RÉGION
    // =====================================
    
    /**
     * Parse une région
     * @private
     * @param {Object} region - Région brute de l'API
     * @returns {Object} Région normalisée
     */
    static _parseRegion(region) {
        return {
            nom: region.nom || null,
            code: region.code || null
        };
    }
    
    /**
     * Parse un tableau de régions
     * @param {Array<Object>} regions - Tableau de régions
     * @param {boolean} validate - Valider le schéma (défaut: true)
     * @returns {Array} Régions normalisées
     */
    static parseRegions(regions, validate = true) {
        // Validation du schéma sur le premier enregistrement
        if (validate && regions.length > 0) {
            this._validateFields(regions[0], this.#SCHEMAS.region, 'region');
        }
        
        return regions.map(r => this._parseRegion(r));
    }
}

// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    window.GeoDataParser = GeoDataParser;
}
