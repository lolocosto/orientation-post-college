// Copyright (c) 2026 Laurent COSTE — Licensed under EUPL v1.2 — See LICENSE
/************************************************
 * Fichier : data_education_parser.js
 * Description : Parsers spécialisés pour Data.Education.gouv.fr
 * Auteur : Laurent COSTE
 * Date : 2026-02-03
 ************************************************/

/**
 * Service de parsing des données Data.Education.gouv.fr
 * Un parser spécialisé par dataset
 */
class DataEducationParser {
    
    // =====================================
    // SCHÉMAS DE VALIDATION
    // =====================================
    
    static #SCHEMAS = {
        section_sportive: [
            'uai',
            'nom_etablissement',
            'sections_scolaires',
            'type_etablissement',
            'statut_public_prive',
            'nom_commune',
            'code_postal',
            'adresse_1',
            'adresse_2',
            'adresse_3',
            'telephone',
            'web',
            'mail',
            'hebergement',
            'appartenance_education_prioritaire',
            'fiche_onisep',
            'libelle_region',
            'libelle_academie',
            'libelle_departement',
            'position'
        ],
        
        langue: [
            'uai',
            'libelle',
            'adresse',
            'enseignements',
            'langues',
            'code_departement',
            'departement',
            'code_region',
            'region',
            'code_academie',
            'academie',
            'commune',
            'type_d_etablissement',
            'position',
            'secteur_de_l_etablissement'
        ],
        
        effectifs_gt: [
            'rentree_scolaire',
            'numero_lycee',
            'denomination_principale',
            'patronyme',
            'secteur',
            'commune',
            'departement',
            'academie',
            'nombre_d_eleves'
        ],
        
        effectifs_pro: [
            'rentree_scolaire',
            'numero_lycee',
            'denomination_principale',
            'patronyme',
            'secteur',
            'commune',
            'departement',
            'academie',
            'nombre_d_eleves'
        ]
    };
    
    /**
     * Valide les champs
     * @private
     */
    static _validateFields(data, schema, dataType) {
        const dataFields = Object.keys(data);
        const manquants = schema.filter(field => !(field in data));
        const inattendus = dataFields.filter(field => !schema.includes(field));
        
        if (manquants.length > 0) {
            console.warn(`[DataEducationParser] ${dataType} - Champs MANQUANTS (${manquants.length}):`, manquants);
        }
        
        if (inattendus.length > 0) {
            console.info(`[DataEducationParser] ${dataType} - Champs INATTENDUS (${inattendus.length}):`, inattendus);
        }
        
        if (manquants.length === 0 && inattendus.length === 0) {
            console.log(`[DataEducationParser] ${dataType} - ✅ Tous les champs correspondent`);
        }
        
        return { manquants, inattendus };
    }
    
    // =====================================
    // PARSER : SECTIONS SPORTIVES
    // =====================================
    
    /**
     * Parse une section sportive
     * @private
     * @param {Object} record - Enregistrement brut de l'API
     * @returns {Object} { dispositif, etablissement }
     */
    static _parseSectionSportive(record) {
        const data = record.record?.fields || record;
        
        // Structure DISPOSITIF avec sports
        const dispositif = {
            uai: data.uai || null,
            libelle: 'Section sportive scolaire',
            sports: data.sections_scolaires || [], // Array de sports
            urlOnisep: data.fiche_onisep || null
        };
        
        // Structure ETABLISSEMENT (infos complémentaires)
        const etablissement = {
            uai: data.uai || null,
            nom: data.nom_etablissement || null,
            type: data.type_etablissement || null,
            statut: data.statut_public_prive || null,
            
            // Adresse
            adresse: data.adresse_1 || null,
            adresse2: data.adresse_2 || null,
            adresse3: data.adresse_3 || null,
            codePostal: data.code_postal || null,
            commune: data.nom_commune || null,
            departement: data.libelle_departement || null,
            academie: data.libelle_academie || null,
            region: data.libelle_region || null,
            
            // Géolocalisation
            latitude: data.position?.lat || null,
            longitude: data.position?.lon || null,
            
            // Contact
            telephone: data.telephone || null,
            siteWeb: data.web || null,
            mail: data.mail || null,
            
            // Informations pratiques
            hebergement: data.hebergement || null,
            educationPrioritaire: data.appartenance_education_prioritaire || null,
            urlOnisep: data.fiche_onisep || null
        };
        
        return { dispositif, etablissement };
    }
    
    /**
     * Parse un tableau de sections sportives
     * @param {Array<Object>} records - Tableau d'enregistrements
     * @param {boolean} validate - Valider le schéma (défaut: true)
     * @returns {Object} { dispositifs: Array, etablissements: Array }
     */
    static parseSectionsSportives(records, validate = true) {
        // Validation
        if (validate && records.length > 0) {
            const data = records[0].record?.fields || records[0];
            this._validateFields(data, this.#SCHEMAS.section_sportive, 'section_sportive');
        }
        
        const dispositifs = [];
        const etablissements = [];
        
        for (const record of records) {
            const parsed = this._parseSectionSportive(record);
            dispositifs.push(parsed.dispositif);
            etablissements.push(parsed.etablissement);
        }
        
        return { dispositifs, etablissements };
    }
    
    // =====================================
    // PARSER : LANGUES
    // =====================================
    
    /**
     * Parse une offre de langue
     * @private
     * @param {Object} record - Enregistrement brut de l'API
     * @returns {Object} { langue, etablissement }
     */
    static _parseLangue(record) {
        const data = record.record?.fields || record;
        
        // Structure LANGUE
        const langue = {
            uai: data.uai || null,
            langue: data.langues || null,
            enseignement: data.enseignements || null // LV1, LV2, LV3, etc.
        };
        
        // Structure ETABLISSEMENT (infos complémentaires)
        const etablissement = {
            uai: data.uai || null,
            nom: data.libelle || null,
            type: data.type_d_etablissement || null,
            statut: data.secteur_de_l_etablissement || null,
            
            // Adresse
            adresse: data.adresse || null,
            commune: data.commune || null,
            codeDepartement: data.code_departement || null,
            departement: data.departement || null,
            codeRegion: data.code_region || null,
            region: data.region || null,
            codeAcademie: data.code_academie || null,
            academie: data.academie || null,
            
            // Géolocalisation
            latitude: data.position?.lat || null,
            longitude: data.position?.lon || null
        };
        
        return { langue, etablissement };
    }
    
    /**
     * Parse un tableau d'offres de langues
     * @param {Array<Object>} records - Tableau d'enregistrements
     * @param {boolean} validate - Valider le schéma (défaut: true)
     * @returns {Object} { langues: Array, etablissements: Array }
     */
    static parseLangues(records, validate = true) {
        // Validation
        if (validate && records.length > 0) {
            const data = records[0].record?.fields || records[0];
            this._validateFields(data, this.#SCHEMAS.langue, 'langue');
        }
        
        const langues = [];
        const etablissements = [];
        
        for (const record of records) {
            const parsed = this._parseLangue(record);
            langues.push(parsed.langue);
            etablissements.push(parsed.etablissement);
        }
        
        return { langues, etablissements };
    }
    
    // =====================================
    // PARSER : EFFECTIFS GT
    // =====================================
    
    /**
     * Parse les effectifs d'un lycée GT
     * @private
     * @param {Object} record - Enregistrement brut de l'API
     * @returns {Object} Effectifs normalisés
     */
    static _parseEffectifsGT(record) {
        const data = record.record?.fields || record;
        
        return {
            uai: data.numero_lycee || null,
            rentree: data.rentree_scolaire || null,
            nombreEleves: data.nombre_d_eleves || 0,
            denomination: data.denomination_principale || null,
            patronyme: data.patronyme || null,
            secteur: data.secteur || null,
            commune: data.commune || null,
            departement: data.departement || null,
            academie: data.academie || null
        };
    }
    
    /**
     * Parse un tableau d'effectifs GT
     * @param {Array<Object>} records - Tableau d'enregistrements
     * @param {boolean} validate - Valider le schéma (défaut: true)
     * @returns {Array} Effectifs normalisés
     */
    static parseEffectifsGT(records, validate = true) {
        // Validation
        if (validate && records.length > 0) {
            const data = records[0].record?.fields || records[0];
            this._validateFields(data, this.#SCHEMAS.effectifs_gt, 'effectifs_gt');
        }
        
        return records.map(r => this._parseEffectifsGT(r));
    }
    
    // =====================================
    // PARSER : EFFECTIFS PRO
    // =====================================
    
    /**
     * Parse les effectifs d'un lycée Pro
     * @private
     * @param {Object} record - Enregistrement brut de l'API
     * @returns {Object} Effectifs normalisés
     */
    static _parseEffectifsPro(record) {
        const data = record.record?.fields || record;
        
        return {
            uai: data.numero_lycee || null,
            rentree: data.rentree_scolaire || null,
            nombreEleves: data.nombre_d_eleves || 0,
            denomination: data.denomination_principale || null,
            patronyme: data.patronyme || null,
            secteur: data.secteur || null,
            commune: data.commune || null,
            departement: data.departement || null,
            academie: data.academie || null
        };
    }
    
    /**
     * Parse un tableau d'effectifs Pro
     * @param {Array<Object>} records - Tableau d'enregistrements
     * @param {boolean} validate - Valider le schéma (défaut: true)
     * @returns {Array} Effectifs normalisés
     */
    static parseEffectifsPro(records, validate = true) {
        // Validation
        if (validate && records.length > 0) {
            const data = records[0].record?.fields || records[0];
            this._validateFields(data, this.#SCHEMAS.effectifs_pro, 'effectifs_pro');
        }
        
        return records.map(r => this._parseEffectifsPro(r));
    }
}

// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    window.DataEducationParser = DataEducationParser;
}
