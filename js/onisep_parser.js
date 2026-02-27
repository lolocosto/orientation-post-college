/************************************************
 * Fichier : onisep_parser.js
 * Description : Parsers spécialisés par dataset ONISEP
 * Auteur : Laurent COSTE
 * Date : 2026-02-03
 * Version : 2.0 - Phase 2 (refonte complète)
 ************************************************/

/**
 * Service de parsing des données ONISEP
 * Un parser spécialisé par dataset qui génère des structures normalisées séparées
 * Chaque parser retourne { diplomes: [], etablissements: [], relations: [] }
 */
class OnisepParser {
    
    // =====================================
    // SCHÉMAS DE VALIDATION (champs attendus)
    // =====================================
    
    static #SCHEMAS = {
        // Dataset actions_lycee / actions_sup
        actionFormation: {
            // Champs formation (for_...)
            formation: [
                'formation_for_libelle',
                'for_code_rncp',
                'for_type',
                'for_nature_du_certificat',
                'for_niveau_de_sortie',
                'for_indexation_domaine_web_onisep',
                'for_url_et_id_onisep',
                'for_url_referentiel'
            ],
            // Champs établissement (ens_...)
            etablissement: [
                'ens_code_uai',
                'lieu_denseignement_ens_libelle',
                'ens_statut',
                'ens_adresse',
                'ens_code_postal',
                'ens_commune',
                'ens_departement',
                'ens_academie',
                'ens_region',
                'ens_latitude',
                'ens_longitude',
                'ens_n_telephone',
                'ens_site_web',
                'ens_hebergement',
                'ens_accessibilite',
                'ens_url_et_id_onisep'
            ],
            // Champs action (af_...)
            action: [
                'action_de_formation_af_identifiant_onisep',
                'af_duree_cycle_standard',
                'af_modalites_scolarite',
                'af_elements_denseignement',
                'af_cout_scolarite',
                'af_modalites_accueil',
                'af_page_web',
                'af_date_de_creation',
                'af_date_de_modification'
            ],
            // Champs géolocalisation
            geoloc: ['_geoloc']
        },
        
        // Dataset dispositifs
        actionDispositif: {
            // Champs dispositif (typdisp_...)
            dispositif: [
                'action_de_dispositif_ad_identifiant_onisep',
                'type_de_dispositif_typdisp_libelle',
                'typdisp_id_et_url_onisep',
                'typdisp_indexation_onisep'
            ],
            // Champs établissement (ens_...)
            etablissement: [
                'ens_code_uai',
                'structure_denseignement_ens_libelle',
                'ens_type',
                'ens_statut',
                'ens_adresse',
                'ens_code_postal',
                'ens_commune',
                'ens_departement',
                'ens_academie',
                'ens_region',
                'ens_latitude',
                'ens_longitude',
                'ens_telephone',
                'ens_site_web',
                'ens_hebergement',
                'ens_accessibilite',
                'ens_url_et_id_onisep'
            ],
            // Champs action (ad_...)
            action: [
                'ad_duree',
                'ad_elements_denseignement',
                'ad_modalites_accueil',
                'ad_date_de_creation',
                'ad_date_de_modification'
            ],
            // Champs géolocalisation
            geoloc: ['_geoloc']
        },
        
        // Dataset structures
        structure: [
            'code_uai',
            'n_siret',
            'type_detablissement',
            'nom',
            'sigle',
            'statut',
            'tutelle',
            'universite_de_rattachement_libelle_et_uai',
            'universite_de_rattachement_id_et_url_onisep',
            'etablissements_lies_libelles',
            'etablissements_lies_url_et_id_onisep',
            'adresse',
            'boite_postale',
            'cp',
            'commune',
            'commune_cog',
            'cedex',
            'arrondissement',
            'departement',
            'academie',
            'region',
            'region_cog',
            'longitude_x',
            'latitude_y',
            'telephone',
            'langues_enseignees',
            'journees_portes_ouvertes',
            'url_et_id_onisep',
            'date_creation',
            'date_de_modification',
            '_geoloc'
        ],
        
        // Dataset enseignements_optionnels_2nde
        enseignementOptionnel2nde: [
            'identifiant_action_de_formation',
            'enseignements_optionnels_et_langues_de_classe_de_2nde_gt',
            'identifiant_et_fiche_onisep_lieu_de_cours',
            'uai_lieu_de_cours',
            'libelle_lieu_de_cours',
            'adresse_lieu_de_cours',
            'boite_postale_lieu_de_cours',
            'code_postal_lieu_de_cours',
            'commune_lieu_de_cours',
            'departement_lieu_de_cours',
            'region_lieu_de_cours',
            'academie_lieu_de_cours',
            'af_date_creation',
            'af_date_de_modification'
        ],
        
        // Dataset enseignements_specialite_1ere
        enseignementSpecialite1ere: [
            'identifiant_action_de_formation',
            'enseignements_de_specialite_de_classe_de_1ere_generale',
            'identifiant_et_fiche_onisep_lieu_de_cours',
            'uai_lieu_de_cours',
            'libelle_lieu_de_cours',
            'adresse_lieu_de_cours',
            'boite_postale_lieu_de_cours',
            'code_postal_lieu_de_cours',
            'commune_lieu_de_cours',
            'departement_lieu_de_cours',
            'region_lieu_de_cours',
            'academie_lieu_de_cours',
            'af_date_creation',
            'af_date_de_modification'
        ]
    };
    
    /**
     * Valide les champs d'un objet par rapport à un schéma
     * @private
     * @param {Object} data - Données à valider
     * @param {Array|Object} schema - Schéma de validation (liste de champs ou objet avec catégories)
     * @param {string} datasetName - Nom du dataset (pour les logs)
     * @returns {Object} { manquants: Array, inattendus: Array }
     */
    static _validateFields(data, schema, datasetName) {
        const dataFields = Object.keys(data);
        let expectedFields = [];
        
        // Si le schéma est un objet avec catégories (ex: actionFormation)
        if (schema && typeof schema === 'object' && !Array.isArray(schema)) {
            expectedFields = Object.values(schema).flat();
        } else if (Array.isArray(schema)) {
            expectedFields = schema;
        }
        
        // Champs manquants (attendus mais absents)
        const manquants = expectedFields.filter(field => !(field in data));
        
        // Champs inattendus (présents mais non attendus)
        const inattendus = dataFields.filter(field => !expectedFields.includes(field));
        
        // Logger si anomalies détectées
        if (manquants.length > 0) {
            console.warn(`[OnisepParser] ${datasetName} - Champs MANQUANTS (${manquants.length}):`, manquants);
        }
        
        if (inattendus.length > 0) {
            console.info(`[OnisepParser] ${datasetName} - Champs INATTENDUS (${inattendus.length}):`, inattendus);
        }
        
        // Si tout est OK
        if (manquants.length === 0 && inattendus.length === 0) {
            console.log(`[OnisepParser] ${datasetName} - ✅ Tous les champs correspondent au schéma`);
        }
        
        return { manquants, inattendus };
    }
    
    // =====================================
    // PARSER : ACTIONS_LYCEE
    // =====================================
    
    /**
     * Parse une action lycée (dataset actions_lycee)
     * @private
     * @param {Object} action - Action brute de l'API
     * @returns {Object} { diplomes: Array, diplomes_par_etablissement: Array }
     */
    static _parseActionLycee(action) {
        const result = {
            diplomes: [],
            diplomes_par_etablissement: [],
            enrichissements_etab: []  // ens_hebergement, ens_site_web, ens_accessibilite par UAI
        };
        
        // Structure DIPLOME (champs for_...)
        if (action.formation_for_libelle) {
            result.diplomes.push({
                // Identification (CLÉ PRIMAIRE = libelle, pas codeRNCP)
                libelle: action.formation_for_libelle,
                libelleOnisep: action.formation_for_libelle,
                libelleCarif: null,
                
                // Type et nature
                type: action.for_type || null,
                natureCertificat: action.for_nature_du_certificat || null,
                
                // Niveau
                niveauSortie: action.for_niveau_de_sortie || null,
                
                // Domaines ONISEP
                // Format brut: "construction.../finition|matières.../bois"
                // Devient: [{domaine: "construction...", categorie: "finition"}, ...]
                domaines: action.for_indexation_domaine_web_onisep 
                    ? action.for_indexation_domaine_web_onisep
                        .split('|')
                        .map(d => d.trim())
                        .filter(d => d.length > 0)
                        .map(d => {
                            // Séparer par le dernier /
                            const parts = d.split('/');
                            if (parts.length >= 2) {
                                const categorie = parts.pop().trim(); // Dernier élément = catégorie
                                const domaine = parts.join('/').trim().replace(/\\/g, ''); // Le reste = domaine
                                return { domaine, categorie };
                            }
                            return { domaine: d.replace(/\\/g, ''), categorie: '' };
                        })
                    : [],
                
                // URLs
                urlOnisep: action.for_url_et_id_onisep || null,
                urlReferentiel: action.for_url_referentiel || null,

                // Code RNCP extrait depuis urlReferentiel (France Compétences) ou urlOnisep
                rncpCode: (() => {
                    const urlRef = action.for_url_referentiel || '';
                    const urlOnisep = action.for_url_et_id_onisep || '';
                    const m = urlRef.match(/\/rncp\/(\d+)\//i) || urlOnisep.match(/RNCP(\d+)/i);
                    return m ? `RNCP${m[1]}` : null;
                })()
            });
        }
        
        // Structure ETABLISSEMENT (champs ens_...) — enrichissement par UAI (1 fois)
        
        // Enrichissement établissement : hebergement / siteWeb / accessibilite / telephone / urlOnisep
        // Stocké par UAI (première valeur rencontrée lors du traitement amont)
        if (action.ens_code_uai) {
            const enrich = {};
            // Nom de l'établissement (pour résolution UAI+nom → _id)
            const etabNom = action.lieu_denseignement_ens_libelle
                         || action.structure_denseignement_ens_libelle
                         || null;
            if (etabNom) enrich.etabNom = etabNom;
            if (action.ens_hebergement)       enrich.hebergement   = action.ens_hebergement;
            if (action.ens_site_web)          enrich.siteWeb       = action.ens_site_web;
            if (action.ens_accessibilite)     enrich.accessibilite = action.ens_accessibilite;
            // ens_n_telephone (actions_lycee) ou ens_telephone (dispositifs)
            const tel = action.ens_n_telephone || action.ens_telephone;
            if (tel) enrich.telephone = tel;
            if (action.ens_url_et_id_onisep) enrich.urlOnisep     = action.ens_url_et_id_onisep;
            if (Object.keys(enrich).length > 0) {
                result.enrichissements_etab.push({ uai: action.ens_code_uai, ...enrich });
            }
        }

        // Structure DIPLOME_PAR_ETABLISSEMENT (champs af_... + clés externes)
        if (action.ens_code_uai && action.formation_for_libelle) {
            result.diplomes_par_etablissement.push({
                // Clé primaire
                id: action.action_de_formation_af_identifiant_onisep || null,
                // Clés étrangères
                uai: action.ens_code_uai,
                // Nom de l'établissement (clé composite UAI+nom pour unicité)
                etabNom: action.lieu_denseignement_ens_libelle
                      || action.structure_denseignement_ens_libelle
                      || null,
                libelle: action.formation_for_libelle,                 
                
                // Champs AF (informations spécifiques à l'action de formation)
                dureeCycleStandard: action.af_duree_cycle_standard || null,
                modalitesScolarite: action.af_modalites_scolarite || null,
                elementsDenseignement: action.af_elements_denseignement || null,
                coutScolarite: action.af_cout_scolarite || null,
                modalitesAccueil: action.af_modalites_accueil || null,
                pageWeb: action.af_page_web || null,
                
                // Dates
                dateCreation: action.af_date_de_creation || null,
                dateModification: action.af_date_de_modification || null
            });
        }
        
        return result;
    }
    
    // =====================================
    // PARSER : ACTIONS_SUP
    // =====================================
    
    /**
     * Parse une action supérieur (dataset actions_sup)
     * Même structure que _parseActionLycee car datasets similaires
     * @private
     * @param {Object} action - Action brute de l'API
     * @returns {Object} { diplomes: Array, diplomes_par_etablissement: Array }
     */
    static _parseActionSup(action) {
        // Même logique que _parseActionLycee (structures identiques)
        return this._parseActionLycee(action);
    }
    
    // =====================================
    // PARSER : DISPOSITIFS
    // =====================================
    
    /**
     * Parse une action dispositif (dataset dispositifs)
     * @private
     * @param {Object} action - Action brute de l'API
     * @returns {Object} { dispositifs: Array, dispositifs_par_etablissement: Array }
     */
    static _parseActionDispositif(action) {
        const result = {
            dispositifs: [],
            dispositifs_par_etablissement: []
        };
        
        // Structure DISPOSITIF
        if (action.type_de_dispositif_typdisp_libelle) {
            
            result.dispositifs.push({
                // Identification
                libelle: action.type_de_dispositif_typdisp_libelle,
                
                // Indexation ONISEP
                // Format brut: "lettres, langues, enseignement/formations généralistes| lettres, langues, enseignement/langues"
                // Devient: [{domaine: "lettres, langues, enseignement", categorie: "formations généralistes"}, ...]
                domaines: action.typdisp_indexation_onisep 
                    ? action.typdisp_indexation_onisep
                        .split('|')
                        .map(d => d.trim())
                        .filter(d => d.length > 0)
                        .map(d => {
                            // Séparer par le dernier /
                            const parts = d.split('/');
                            if (parts.length >= 2) {
                                const categorie = parts.pop().trim(); // Dernier élément = catégorie
                                const domaine = parts.join('/').trim().replace(/\\/g, ''); // Le reste = domaine
                                return { domaine, categorie };
                            }
                            return { domaine: d.replace(/\\/g, ''), categorie: '' };
                        })
                    : [],
                
                // URLs
                urlOnisep: action.typdisp_id_et_url_onisep || null
            });
        }
        
        // Structure ETABLISSEMENT (champs ens_...)
        // On ne stocke rien car il manque des champs
        
        // Structure DISPOSITIF_PAR_ETABLISSEMENT (champs ad_... + clés externes)
        if (action.ens_code_uai && action.type_de_dispositif_typdisp_libelle) {
            result.dispositifs_par_etablissement.push({
                // Clé primaire
                id: action.action_de_dispositif_ad_identifiant_onisep || null,
                // Clés étrangères
                uai: action.ens_code_uai,
                // Nom de l'établissement (clé composite UAI+nom pour unicité)
                etabNom: action.lieu_denseignement_ens_libelle
                      || action.structure_denseignement_ens_libelle
                      || null,
                libelle: action.type_de_dispositif_typdisp_libelle,
                
                // Champs AD (informations spécifiques à l'action de dispositif)
                duree: action.ad_duree || null,
                elementsDenseignement: action.ad_elements_denseignement || null,
                modalitesAccueil: action.ad_modalites_accueil || null,
                sports: action.ad_sports || null, // ✅ Ajouté
                
                // Dates
                dateCreation: action.ad_date_de_creation || null,
                dateModification: action.ad_date_de_modification || null
            });
        }
        
        return result;
    }
    
    // =====================================
    // PARSER : STRUCTURES
    // =====================================
    
    /**
     * Parse une structure d'enseignement secondaire (dataset structures)
     * @private
     * @param {Object} structure - Structure brute de l'API
     * @returns {Object} { etablissements: Array }
     */
    static _parseStructureEnseignementSecondaire(structure) {
        const result = {
            etablissements: []
        };
        
        // Structure ETABLISSEMENT
        if (structure.code_uai) {
            result.etablissements.push({
                // Identification
                uai: structure.code_uai,
                siret: structure.n_siret || null,
                nom: structure.nom,
                nomOnisep: structure.nom || null,
                nomCarif: null,
                sigle: structure.sigle || null,
                type: structure.type_detablissement || null,
                
                // Statut et tutelle
                statut: structure.statut || null,
                tutelle: structure.tutelle || null,
                
                // Rattachements
                universiteRattachement: structure.universite_de_rattachement_libelle_et_uai || null,
                universiteRattachementUrl: structure.universite_de_rattachement_id_et_url_onisep || null,
                etablissementsLies: structure.etablissements_lies_libelles || null,
                etablissementsLiesUrls: structure.etablissements_lies_url_et_id_onisep || null,
                
                // Adresse — v0.57 : normalisation casse commune
                adresse: structure.adresse || null,
                boitePostale: structure.boite_postale || null,
                codePostal: structure.cp || null,
                commune: typeof normaliserNomCommune === 'function'
                    ? normaliserNomCommune(structure.commune || null)
                    : (structure.commune || null),
                codeCommuneCOG: structure.commune_cog || null,
                cedex: structure.cedex || null,
                arrondissement: structure.arrondissement || null,
                departement: structure.departement || null,
                academie: structure.academie || null,
                region: structure.region || null,
                regionCOG: structure.region_cog || null,
                
                // Géolocalisation
                latitude: structure.latitude_y || structure._geoloc?.lat || null,
                longitude: structure.longitude_x || structure._geoloc?.lon || null,
                
                // Contact
                telephone: structure.telephone || null,
                
                // Informations complémentaires
                languesEnseignees: structure.langues_enseignees || null,
                journeesPortesOuvertes: structure.journees_portes_ouvertes || null,
                
                // URLs
                urlOnisep: structure.url_et_id_onisep || null,
                
                // Dates
                dateCreation: structure.date_creation || null,
                dateModification: structure.date_de_modification || null
            });
        }
        
        return result;
    }
    
    // =====================================
    // PARSER : ENSEIGNEMENTS OPTIONNELS 2NDE GT
    // =====================================
    
    /**
     * Parse les enseignements optionnels de 2nde GT
     * @private
     * @param {Object} data - Données brutes de l'API
     * @returns {Object} { options2ndeGT: Array, options2ndeGT_par_etablissement: Array }
     */
    static _parseEnseignementOptionnel2ndeGT(data) {
        const result = {
            options2ndeGT: [],
            options2ndeGT_par_etablissement: []
        };
        
        const optionsStr = data.enseignements_optionnels_et_langues_de_classe_de_2nde_gt || '';
        
        if (!optionsStr || optionsStr.trim() === '') {
            return result;
        }
        
        // Parser les options (séparées par \/ ou /)
        const optionsList = optionsStr
            .split(/\\\/|\//)
            .map(s => s.trim())
            .filter(s => s && s !== '');
        
        // Structure OPTIONS_2NDE_GT (une par option unique)
        const optionsSet = new Set(optionsList);
        for (const option of optionsSet) {
            result.options2ndeGT.push({
                libelle: option
            });
        }
        
        // Structure ETABLISSEMENT
        // On ne stocke rien car il manque des champs

        // Structure OPTIONS_2NDE_GT_PAR_ETABLISSEMENT (relation)
        if (data.uai_lieu_de_cours) {
            for (const option of optionsList) {
                result.options2ndeGT_par_etablissement.push({
                    // Clés primaire  : combinaison option + uai pour garantir l'unicité
                    id: option + '_' + data.uai_lieu_de_cours,
                    // Clés étrangères
                    uai: data.uai_lieu_de_cours,
                    // Nom de l'établissement (clé composite UAI+nom pour unicité)
                    etabNom: data.libelle_lieu_de_cours || null,
                    libelle: option,
                    
                    // Identifiant de l'action de formation pour référence (dupliqué pour toutes les options liées au même établissement !)
                    idActionFormation: data.identifiant_action_de_formation,
                    
                    // Dates
                    dateCreation: data.af_date_creation || null,
                    dateModification: data.af_date_de_modification || null
                });
            }
        }
        
        return result;
    }
    
    // =====================================
    // PARSER : ENSEIGNEMENTS SPÉCIALITÉ 1ÈRE G
    // =====================================
    
    /**
     * Parse les enseignements de spécialité de 1ère générale
     * @private
     * @param {Object} data - Données brutes de l'API
     * @returns {Object} { specialites1ereG: Array, specialites1ereG_par_etablissement: Array }
     */
    static _parseEnseignementSpecialite1ereG(data) {
        const result = {
            specialites1ereG: [],
            specialites1ereG_par_etablissement: []
        };
        
        const specialitesStr = data.enseignements_de_specialite_de_classe_de_1ere_generale || '';
        
        if (!specialitesStr || specialitesStr.trim() === '') {
            return result;
        }
        
        // Parser les spécialités (séparées par \/ ou /)
        const specialitesList = specialitesStr
            .split(/\\\/|\//)
            .map(s => s.trim())
            .filter(s => s && s !== '');
        
        // Structure specialites_1ereG (une par spécialité unique)
        const specialitesSet = new Set(specialitesList);
        for (const specialite of specialitesSet) {
            result.specialites1ereG.push({
                libelle: specialite
            });
        }
        
        // Structure ETABLISSEMENT
        // On ne stocke rien car il manque des champs

        // Structure specialites_1ereG_PAR_ETABLISSEMENT (relation)
        if (data.uai_lieu_de_cours) {
            for (const specialite of specialitesList) {
                result.specialites1ereG_par_etablissement.push({
                    // Clé primaire : combinaison spécialité + uai pour garantir l'unicité
                    id: specialite + '_' + data.uai_lieu_de_cours,

                    // Clés étrangères
                    uai: data.uai_lieu_de_cours,
                    // Nom de l'établissement (clé composite UAI+nom pour unicité)
                    etabNom: data.libelle_lieu_de_cours || null,
                    libelle: specialite,
                    
                    // Identifiant de l'action de formation pour référence (dupliqué pour toutes les spécialités liées au même établissement !)
                    idActionFormation: data.identifiant_action_de_formation,

                    // Dates
                    dateCreation: data.af_date_creation || null,
                    dateModification: data.af_date_de_modification || null
                });
            }
        }
        
        return result;
    }
    
    // =====================================
    // MÉTHODES PUBLIQUES : PARSING PAR LOT
    // =====================================
    
    /**
     * Parse un tableau d'actions lycée
     * @param {Array<Object>} actions - Tableau d'actions
     * @param {boolean} validate - Valider le schéma (défaut: true)
     * @returns {Object} { diplomes: Array, diplomes_par_etablissement: Array }
     */
    static parseActionsLycee(actions, validate = true) {
        // Validation du schéma sur le premier enregistrement
        if (validate && actions.length > 0) {
            this._validateFields(actions[0], this.#SCHEMAS.actionFormation, 'actions_lycee');
        }
        
        const result = {
            diplomes: [],
            diplomes_par_etablissement: [],
            enrichissements_etab: []
        };
        
        for (const action of actions) {
            const parsed = this._parseActionLycee(action);
            result.diplomes.push(...parsed.diplomes);
            result.diplomes_par_etablissement.push(...parsed.diplomes_par_etablissement);
            if (parsed.enrichissements_etab) result.enrichissements_etab.push(...parsed.enrichissements_etab);
        }
        
        return result;
    }
    
    /**
     * Parse un tableau d'actions supérieur
     * @param {Array<Object>} actions - Tableau d'actions
     * @param {boolean} validate - Valider le schéma (défaut: true)
     * @returns {Object} { diplomes: Array, diplomes_par_etablissement: Array }
     */
    static parseActionsSup(actions, validate = true) {
        // Validation du schéma sur le premier enregistrement
        if (validate && actions.length > 0) {
            this._validateFields(actions[0], this.#SCHEMAS.actionFormation, 'actions_sup');
        }
        
        const result = {
            diplomes: [],
            diplomes_par_etablissement: [],
            enrichissements_etab: []  // v0.60 : collecte des enrichissements (hébergement, site web…)
        };
        
        for (const action of actions) {
            const parsed = this._parseActionSup(action);
            result.diplomes.push(...parsed.diplomes);
            result.diplomes_par_etablissement.push(...parsed.diplomes_par_etablissement);
            if (parsed.enrichissements_etab) result.enrichissements_etab.push(...parsed.enrichissements_etab);
        }
        
        return result;
    }
    
    /**
     * Parse un tableau d'actions dispositifs
     * @param {Array<Object>} actions - Tableau d'actions
     * @param {boolean} validate - Valider le schéma (défaut: true)
     * @returns {Object} { dispositifs: Array, dispositifs_par_etablissement: Array }
     */
    static parseActionsDispositifs(actions, validate = true) {
        // Validation du schéma sur le premier enregistrement
        if (validate && actions.length > 0) {
            this._validateFields(actions[0], this.#SCHEMAS.actionDispositif, 'dispositifs');
        }
       
        const result = {
            dispositifs: [],
            dispositifs_par_etablissement: []
        };
        for (const action of actions) {
            const parsed = this._parseActionDispositif(action);
            result.dispositifs.push(...parsed.dispositifs);
            result.dispositifs_par_etablissement.push(...parsed.dispositifs_par_etablissement);
        }
        
        return result;
    }
    
    /**
     * Parse un tableau de structures
     * @param {Array<Object>} structures - Tableau de structures
     * @param {boolean} validate - Valider le schéma (défaut: true)
     * @returns {Object} { etablissements: Array }
     */
    static parseStructures(structures, validate = true) {
        // Validation du schéma sur le premier enregistrement
        if (validate && structures.length > 0) {
            this._validateFields(structures[0], this.#SCHEMAS.structure, 'structures');
        }
        
        const result = {
            etablissements: []
        };
        
        for (const structure of structures) {
            const parsed = this._parseStructureEnseignementSecondaire(structure);
            result.etablissements.push(...parsed.etablissements);
        }
        
        return result;
    }
    
    /**
     * Parse un tableau d'enseignements optionnels 2nde GT
     * @param {Array<Object>} data - Tableau de données
     * @param {boolean} validate - Valider le schéma (défaut: true)
     * @returns {Object} { options2ndeGT: Array, options2ndeGT_par_etablissement: Array }
     */
    static parseEnseignementsOptionnels2ndeGT(data, validate = true) {
        // Validation du schéma sur le premier enregistrement
        if (validate && data.length > 0) {
            this._validateFields(data[0], this.#SCHEMAS.enseignementOptionnel2nde, 'enseignements_optionnels_2nde');
        }
        
        const result = {
            options2ndeGT: [],
            options2ndeGT_par_etablissement: []
        };
        
        for (const item of data) {
            const parsed = this._parseEnseignementOptionnel2ndeGT(item);
            result.options2ndeGT.push(...parsed.options2ndeGT);
            result.options2ndeGT_par_etablissement.push(...parsed.options2ndeGT_par_etablissement);
        }
        
        return result;
    }
    
    /**
     * Parse un tableau d'enseignements de spécialité 1ère G
     * @param {Array<Object>} data - Tableau de données
     * @param {boolean} validate - Valider le schéma (défaut: true)
     * @returns {Object} { specialites1ereG: Array, specialites1ereG_par_etablissement: Array }
     */
    static parseEnseignementsSpecialites1ereG(data, validate = true) {
        // Validation du schéma sur le premier enregistrement
        if (validate && data.length > 0) {
            this._validateFields(data[0], this.#SCHEMAS.enseignementSpecialite1ere, 'enseignements_specialite_1ere');
        }
        
        const result = {
            specialites1ereG: [],
            specialites1ereG_par_etablissement: []
        };
        
        for (const item of data) {
            const parsed = this._parseEnseignementSpecialite1ereG(item);
            result.specialites1ereG.push(...parsed.specialites1ereG);
            result.specialites1ereG_par_etablissement.push(...parsed.specialites1ereG_par_etablissement);
        }
        
        return result;
    }
}

// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    window.OnisepParser = OnisepParser;
}
