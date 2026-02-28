// Copyright (c) 2026 Laurent COSTE — Licensed under EUPL v1.2 — See LICENSE
/************************************************
 * Fichier : data_education_extraction_controller.js
 * Description : Contrôleur d'extraction pour l'API Data.Education
 * Auteur : Laurent COSTE
 * Date : 2026-02-03
 ************************************************/

/**
 * Contrôleur d'extraction pour l'API Data.Education
 * Orchestre l'enrichissement des établissements (sports, langues, effectifs)
 */
class DataEducationExtractionController {
    
    // =====================================
    // PROPRIÉTÉS PRIVÉES
    // =====================================
    
    #dataEducAPI;
    #databaseService;
    
    /**
     * Constructeur - Instancie DataEducationAPI en interne
     */
    constructor() {
        console.log('[DataEducationExtractionController] 🏗️ Initialisation...');
        this.#dataEducAPI = new DataEducationAPI();
        // DatabaseService est global
        this.#databaseService = null;
        console.log('[DataEducationExtractionController] ✅ Initialisé');
    }
    
    /**
     * Initialise avec DatabaseService global
     */
    init() {
        this.#databaseService = window.databaseService;
        console.log('[DataEducationExtractionController] 🔗 DatabaseService connecté');
    }
    
    // =====================================
    // ENRICHISSEMENT PAR UAI
    // =====================================
    
    /**
     * Enrichit un établissement avec toutes les données disponibles
     * @param {string} uai - UAI de l'établissement
     * @param {Object} options - Options
     * @param {boolean} options.sections - Récupérer sections sportives (défaut: true)
     * @param {boolean} options.langues - Récupérer langues (défaut: true)
     * @param {boolean} options.effectifs - Récupérer effectifs (défaut: true)
     * @param {string} options.rentree - Année de rentrée (défaut: "2024")
     * @returns {Promise<Object>} Données d'enrichissement
     */
    async enrichEtablissement(uai, options = {}) {
        const {
            sections = true,
            langues = true,
            effectifs = true,
            rentree = '2024'
        } = options;
        
        console.log(`[DataEducationExtractionController] 🔄 Enrichissement établissement: ${uai}`);
        
        const result = {
            uai,
            sections: null,
            langues: null,
            effectifs: null,
            etablissementInfos: {}
        };
        
        try {
            // Sections sportives
            if (sections) {
                try {
                    const sectionsRaw = await this.#dataEducAPI.getSectionsSportivesByUAI(uai);
                    
                    if (sectionsRaw.length > 0) {
                        const parsed = DataEducationParser.parseSectionsSportives(sectionsRaw, false);
                        result.sections = parsed.dispositifs[0]; // { sports: [...] }
                        
                        // Infos établissement complémentaires
                        const etabInfos = parsed.etablissements[0];
                        if (etabInfos.siteWeb) result.etablissementInfos.siteWeb = etabInfos.siteWeb;
                        if (etabInfos.mail) result.etablissementInfos.mail = etabInfos.mail;
                        if (etabInfos.telephone) result.etablissementInfos.telephone = etabInfos.telephone;
                        
                        console.log(`[DataEducationExtractionController] ✅ ${result.sections.sports.length} sport(s)`);
                    }
                } catch (error) {
                    console.warn('[DataEducationExtractionController] ⚠️ Erreur sections sportives:', error.message);
                }
            }
            
            // Langues
            if (langues) {
                try {
                    const languesRaw = await this.#dataEducAPI.getLanguesByUAI(uai);
                    
                    if (languesRaw.length > 0) {
                        const parsed = DataEducationParser.parseLangues(languesRaw, false);
                        result.langues = parsed.langues; // Array
                        
                        console.log(`[DataEducationExtractionController] ✅ ${result.langues.length} langue(s)`);
                    }
                } catch (error) {
                    console.warn('[DataEducationExtractionController] ⚠️ Erreur langues:', error.message);
                }
            }
            
            // Effectifs
            if (effectifs) {
                try {
                    const effectifsTotaux = await this.#dataEducAPI.getEffectifsTotauxByUAI(uai, rentree);
                    
                    if (effectifsTotaux.total > 0) {
                        result.effectifs = effectifsTotaux;
                        result.etablissementInfos.nombreEleves = effectifsTotaux.total;
                        
                        console.log(`[DataEducationExtractionController] ✅ ${effectifsTotaux.total} élèves (GT: ${effectifsTotaux.effectifsGT || 0}, Pro: ${effectifsTotaux.effectifsPro || 0})`);
                    }
                } catch (error) {
                    console.warn('[DataEducationExtractionController] ⚠️ Erreur effectifs:', error.message);
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('[DataEducationExtractionController] ❌ Erreur enrichissement:', error);
            throw error;
        }
    }
    
    // =====================================
    // ENRICHISSEMENT BATCH
    // =====================================
    
    /**
     * Enrichit plusieurs établissements
     * @param {Array<string>} uais - Liste des UAI
     * @param {Object} options - Options
     * @returns {Promise<Object>} Résultats de l'enrichissement
     */
    async enrichEtablissements(uais, options = {}) {
        const {
            sections = true,
            langues = true,
            effectifs = true,
            rentree = '2024'
        } = options;
        
        console.log(`[DataEducationExtractionController] 🔄 Enrichissement de ${uais.length} établissements`);
        
        const results = {
            sections: [],
            langues: [],
            effectifs: [],
            etablissementsInfos: [],
            stats: {
                sections: 0,
                langues: 0,
                effectifs: 0
            }
        };
        
        try {
            const uaisString = uais.join(', ');
            
            // Sections sportives (batch)
            if (sections) {
                try {
                    const sectionsRaw = await this.#dataEducAPI.getSectionsSportivesByUAIs(uais);
                    
                    if (sectionsRaw.length > 0) {
                        const parsed = DataEducationParser.parseSectionsSportives(sectionsRaw, false);
                        results.sections = parsed.dispositifs;
                        
                        // Infos établissements
                        for (const etab of parsed.etablissements) {
                            const infos = { uai: etab.uai };
                            if (etab.siteWeb) infos.siteWeb = etab.siteWeb;
                            if (etab.mail) infos.mail = etab.mail;
                            if (etab.telephone) infos.telephone = etab.telephone;
                            
                            if (Object.keys(infos).length > 1) {
                                results.etablissementsInfos.push(infos);
                            }
                        }
                        
                        results.stats.sections = results.sections.length;
                        console.log(`[DataEducationExtractionController] ✅ ${results.stats.sections} section(s) sportive(s)`);
                    }
                } catch (error) {
                    console.warn('[DataEducationExtractionController] ⚠️ Erreur sections sportives:', error.message);
                }
            }
            
            // Langues (batch)
            if (langues) {
                try {
                    const languesRaw = await this.#dataEducAPI.getLanguesByUAIs(uais);
                    
                    if (languesRaw.length > 0) {
                        const parsed = DataEducationParser.parseLangues(languesRaw, false);
                        results.langues = parsed.langues;
                        
                        results.stats.langues = results.langues.length;
                        console.log(`[DataEducationExtractionController] ✅ ${results.stats.langues} langue(s)`);
                    }
                } catch (error) {
                    console.warn('[DataEducationExtractionController] ⚠️ Erreur langues:', error.message);
                }
            }
            
            // Effectifs (batch)
            if (effectifs) {
                try {
                    const [effectifsGTRaw, effectifsProRaw] = await Promise.all([
                        this.#dataEducAPI.getEffectifsLyceesGTByUAIs(uais, rentree),
                        this.#dataEducAPI.getEffectifsLyceesProByUAIs(uais, rentree)
                    ]);
                    
                    const parsedGT = DataEducationParser.parseEffectifsGT(effectifsGTRaw, false);
                    const parsedPro = DataEducationParser.parseEffectifsPro(effectifsProRaw, false);
                    
                    // Fusionner par UAI
                    const effectifsMap = new Map();
                    
                    for (const eff of parsedGT) {
                        effectifsMap.set(eff.uai, {
                            uai: eff.uai,
                            effectifsGT: eff.nombreEleves,
                            effectifsPro: 0,
                            total: eff.nombreEleves
                        });
                    }
                    
                    for (const eff of parsedPro) {
                        if (effectifsMap.has(eff.uai)) {
                            effectifsMap.get(eff.uai).effectifsPro = eff.nombreEleves;
                            effectifsMap.get(eff.uai).total += eff.nombreEleves;
                        } else {
                            effectifsMap.set(eff.uai, {
                                uai: eff.uai,
                                effectifsGT: 0,
                                effectifsPro: eff.nombreEleves,
                                total: eff.nombreEleves
                            });
                        }
                    }
                    
                    results.effectifs = Array.from(effectifsMap.values());
                    
                    // Ajouter aux infos établissements
                    for (const eff of results.effectifs) {
                        results.etablissementsInfos.push({
                            uai: eff.uai,
                            nombreEleves: eff.total
                        });
                    }
                    
                    results.stats.effectifs = results.effectifs.length;
                    console.log(`[DataEducationExtractionController] ✅ ${results.stats.effectifs} établissement(s) avec effectifs`);
                } catch (error) {
                    console.warn('[DataEducationExtractionController] ⚠️ Erreur effectifs:', error.message);
                }
            }
            
            return results;
            
        } catch (error) {
            console.error('[DataEducationExtractionController] ❌ Erreur enrichissement batch:', error);
            throw error;
        }
    }
    
    // =====================================
    // STOCKAGE EN BASE
    // =====================================
    
    /**
     * Stocke les données d'enrichissement en base
     * @param {Object} enrichmentData - Données d'enrichissement
     * @returns {Promise<void>}
     */
    async storeEnrichmentData(enrichmentData) {
        if (!this.#databaseService) {
            console.warn('[DataEducationExtractionController] ⚠️ DatabaseAPI non disponible');
            return;
        }
        
        console.log('[DataEducationExtractionController] 💾 Stockage en base...');
        
        try {
            // Stocker langues
            for (const langue of enrichmentData.langues || []) {
                await this.#databaseService.insertLangue(langue);
            }
            
            // Mettre à jour établissements (résoudre UAI → _id interne)
            for (const infos of enrichmentData.etablissementsInfos || []) {
                if (!infos.uai) continue;
                const etabs = this.#databaseService.getEtablissementsByUaiSync(infos.uai);
                for (const etab of etabs) {
                    this.#databaseService.updateEtablissement(etab._id, infos);
                }
            }
            
            // Mettre à jour dispositifs avec sports
            for (const section of enrichmentData.sections || []) {
                await this.#databaseService.updateDispositif(section.uai, {
                    sports: section.sports
                });
            }
            
            console.log('[DataEducationExtractionController] ✅ Stockage terminé');
            
        } catch (error) {
            console.error('[DataEducationExtractionController] ❌ Erreur stockage:', error);
            throw error;
        }
    }
}

// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    window.DataEducationExtractionController = DataEducationExtractionController;
}
