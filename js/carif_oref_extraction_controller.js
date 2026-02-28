// Copyright (c) 2026 Laurent COSTE — Licensed under EUPL v1.2 — See LICENSE
/************************************************
 * Fichier : carif_oref_extraction_controller.js
 * Description : Contrôleur d'extraction des données CARIF-OREF (apprentissage)
 * Auteur : Laurent COSTE
 * Date : 2026-02-20
 *
 * Séparation stricte des responsabilités :
 *   - Ce contrôleur ne connaît pas OnisepExtractionController.
 *   - L'orchestration multi-sources est dans gestion_onglet_recherche.js.
 *
 * API publique :
 *
 *   extractByGeo(params)
 *     Flux géo complet (2 étapes) :
 *       1. /etablissements par code_insee_localite → établissements
 *       2. /formations par UAI → diplômes + relations
 *     Gère sa propre ProgressModal.
 *
 *   extractByDiplomesLibelles(libelles, uaisParLibelle)
 *     Flux diplômes (2 étapes) :
 *       1. /etablissements par UAI (déjà connus depuis l'étape de liste)
 *       2. /formations par UAI → diplômes + relations
 *     Gère sa propre ProgressModal.
 *
 *   getDiplomesDisponibles(geoType, geoValue)
 *     Liste légère pour l'UI (SANS stockage en base) :
 *     Retourne { libelle, libelleNormalise, uais: Set<string> }[]
 *     Utilisé par gestion_onglet_recherche pour préparer la liste diplômes.
 ************************************************/

class CARIFOREFExtractionController {

    // =====================================
    // PROPRIÉTÉS PRIVÉES
    // =====================================

    #carifOrefApi;
    #databaseService;
    #geoController;
    #currentProgressModal = null;
    #isStopped = false;

    // =====================================
    // CONSTRUCTEUR
    // =====================================

        /**
         * Crée une instance du contrôleur d'extraction CARIF-OREF.
         * Nécessite init() pour connecter le DatabaseService.
         */
constructor() {
        console.log('[CARIFOREFExtractionController] 🏗️ Initialisation...');
        this.#carifOrefApi = new CARIFOREFApi();
        this.#databaseService = null;
        this.#geoController = null;
        console.log('[CARIFOREFExtractionController] ✅ Initialisé');
    }

    // =====================================
    // INITIALISATION
    // =====================================

        /**
         * Connecte le DatabaseService partagé (window.databaseService).
         * @returns {void}
         */
init() {
        this.#databaseService = window.databaseService;
        console.log('[CARIFOREFExtractionController] 🔗 DatabaseService connecté');
    }

        /**
         * Connecte le GeoExtractionController pour accéder aux codes INSEE.
         * @param {GeoExtractionController} geoController
         * @returns {void}
         */
setGeoController(geoController) {
        this.#geoController = geoController;
        console.log('[CARIFOREFExtractionController] 🔗 GeoController connecté');
    }

    // =====================================
    // API PUBLIQUE — EXTRACTION GÉOGRAPHIQUE
    // =====================================

    /**
     * Extrait et stocke les établissements et diplômes apprentissage
     * pour un périmètre géographique (commune ou intercommunalité).
     *
     * Flux (2 étapes) :
     *   1. /etablissements filtrés par code_insee_localite → stockage établissements
     *   2. /formations filtrées par UAI → stockage diplômes + relations
     *
     * Gère sa propre ProgressModal.
     *
     * @param {Object} params
     * @param {string} params.type    - 'commune' | 'intercommunalite'
     * @param {string} params.value   - Code INSEE commune ou code EPCI
     * @param {Object} params.displayInfo - { nom: string }
     * @returns {Promise<Object>} { success, stats, extractionInfo }
     */
    async extractByGeo(params) {
        console.log('[CARIFOREFExtractionController] 🚀 Extraction géographique:', params);

        return await this.#runExtraction(async () => {
            await this.#resetAprentissageData();

            // ── Résolution des codes INSEE ────────────────────────────────
            let codesCommunes;
            if (params.type === 'commune') {
                codesCommunes = [params.value];
            } else if (params.type === 'intercommunalite') {
                this.#update('Récupération communes EPCI...', 5, 100);
                const communes = await this.#geoController.getCommunesByEPCI(params.value);
                codesCommunes = communes.map(c => c.code);
                this.#detail(`📍 ${codesCommunes.length} commune(s) dans l'EPCI`);
            } else {
                throw new Error(`Type d'extraction inconnu: ${params.type}`);
            }

            const stats = await this.#extractEtabsEtDiplomesByCommunes(codesCommunes);
            if (stats.cancelled) return { cancelled: true };

            return {
                success: true,
                stats,
                extractionInfo: {
                    type: params.type,
                    zone: params.displayInfo?.nom || params.value,
                    date: new Date().toISOString()
                }
            };
        });
    }

    // =====================================
    // API PUBLIQUE — EXTRACTION PAR DIPLÔMES
    // =====================================

    /**
     * Extrait et stocke les établissements et diplômes apprentissage
     * pour une liste de diplômes sélectionnés par l'utilisateur.
     *
     * Les UAI sont déjà connus (issus de getDiplomesDisponibles() à l'étape 1).
     * On passe directement à l'étape établissements → formations.
     *
     * Les établissements sont construits depuis les champs etablissement_formateur_*
     * des formations — adresse de l'antenne locale (département cible), pas du siège.
     * Un GRETA ou CFA régional dont le siège est hors périmètre sera ainsi représenté
     * avec l'adresse correcte de son antenne locale.
     *
     * TODO (v0.48+) : Certains établissements "nationaux" (AFPA, grands organismes)
     *   apparaissent dans les résultats alors qu'ils n'ont pas de formation physique
     *   dans le périmètre demandé. Il faudra ajouter un filtre post-extraction sur
     *   le champ num_departement des formations pour exclure ces établissements
     *   hors-périmètre et ne conserver que ceux ayant au moins une formation locale.
     *   Tracking : issue #hors-perimetre-carif
     *
     * @param {string[]} libelles       - Libellés des diplômes sélectionnés
     * @param {Object}   uaisParLibelle - Map libelle → string[] (UAI CARIF depuis getDiplomesDisponibles)
     * @param {Object}   [geoContext]   - Réservé (non utilisé). Conservé pour compatibilité API.
     * @returns {Promise<Object>} { success, stats, extractionInfo }
     */
    async extractByDiplomesLibelles(libelles, uaisParLibelle, geoContext = null) {
        console.log(`[CARIFOREFExtractionController] 🚀 Extraction par ${libelles.length} diplôme(s)`);

        return await this.#runExtraction(async () => {
            await this.#resetAprentissageData();

            // ── Collecter tous les UAI correspondant aux diplômes sélectionnés ──
            const uaisSet = new Set();
            for (const libelle of libelles) {
                const uais = uaisParLibelle[libelle];
                if (uais) {
                    for (const uai of uais) uaisSet.add(uai);
                }
            }
            const uais = Array.from(uaisSet);

            this.#detail(`🎓 ${libelles.length} diplôme(s) → ${uais.length} UAI identifié(s)`);

            if (uais.length === 0) {
                this.#detail('⚠️ Aucun UAI trouvé pour les diplômes sélectionnés');
                return {
                    success: true,
                    stats: { etablissements: 0, diplomes: 0, relations: 0 }
                };
            }

            // Les établissements sont maintenant construits depuis les champs
            // etablissement_formateur_* des formations — adresse de l'antenne locale,
            // pas du siège. Aucun filtre géographique post-récupération nécessaire.
            const stats = await this.#extractEtabsEtDiplomesByUAIs(uais, 10, 100);
            if (stats.cancelled) return { cancelled: true };

            return {
                success: true,
                stats,
                extractionInfo: {
                    type: 'diplomes',
                    libelles,
                    date: new Date().toISOString()
                }
            };
        });
    }

    // =====================================
    // API PUBLIQUE — LISTE DIPLÔMES DISPONIBLES (sans stockage)
    // =====================================

    /**
     * Retourne la liste des diplômes apprentissage disponibles pour une zone,
     * SANS stocker en base. Utilisé par gestion_onglet_recherche.js (étape 1)
     * pour construire les checkboxes et préparer les UAI pour l'étape 2.
     *
     * @param {'departement'|'academie'} geoType
     * @param {string} geoValue - Numéro département (ex: "35") ou académie (ex: "14")
     * @param {Function|null} progressCallback - Callback(detail: string)
     * @returns {Promise<Array<{
     *   libelle: string,
     *   libelleNormalise: string,
     *   typeDiplome: string,
     *   niveau: string,
     *   nbEtablissements: number,
     *   uais: string[]
     * }>>}
     */
    async getDiplomesDisponibles(geoType, geoValue, progressCallback = null) {
        console.log(`[CARIFOREFExtractionController] 📋 Diplômes disponibles pour ${geoType} ${geoValue}`);

        const formationsBrutes = await this.#carifOrefApi.getDiplomesByZone(
            geoType, geoValue, progressCallback
        );

        if (!formationsBrutes || formationsBrutes.length === 0) return [];

        // Agréger par diplôme (clé : rncp_code ou libellé normalisé)
        // Pour chaque diplôme : collecter les UAI uniques
        const diplomesMap = new Map();

        for (const f of formationsBrutes) {
            const uai     = (f.etablissement_formateur_uai || '').trim() || null;
            const libelle = (f.intitule_long || f.intitule_court || '').trim() || null;
            if (!libelle || !uai) continue;

            const rncpCode = (f.rncp_code || '').trim() || null;
            const cleCarif = rncpCode || CARIFOREFParser._normaliserLibelle(libelle);

            if (!diplomesMap.has(cleCarif)) {
                diplomesMap.set(cleCarif, {
                    libelle,
                    libelleNormalise: CARIFOREFParser._normaliserLibelle(libelle),
                    rncpCode,
                    typeDiplome: (f.diplome || '').trim() || null,
                    niveau:      (f.niveau  || '').trim() || null,
                    uaisSet:     new Set()
                });
            }
            diplomesMap.get(cleCarif).uaisSet.add(uai);
        }

        // Convertir en tableau final (Set → Array + compteur)
        const diplomes = Array.from(diplomesMap.values()).map(d => ({
            libelle:          d.libelle,
            libelleNormalise: d.libelleNormalise,
            rncpCode:         d.rncpCode,
            typeDiplome:      d.typeDiplome,
            niveau:           d.niveau,
            nbEtablissements: d.uaisSet.size,
            uais:             Array.from(d.uaisSet)
        }));

        // Trier : niveaux croissants puis libellé alphabétique
        diplomes.sort((a, b) => {
            const nA = a.niveau || '';
            const nB = b.niveau || '';
            if (nA !== nB) return nA.localeCompare(nB);
            return a.libelle.localeCompare(b.libelle);
        });

        console.log(`[CARIFOREFExtractionController] ✅ ${diplomes.length} diplômes disponibles`);
        return diplomes;
    }

    /**
     * Arrête l'extraction en cours
     */
    stop() {
        this.#isStopped = true;
    }

    // =====================================
    // PATTERN BOILERPLATE : #runExtraction
    // =====================================

    async #runExtraction(extractFn) {
        this.#isStopped = false;
        this.#currentProgressModal = new ProgressModal(null, null, false, '🎓 Extraction voie apprentissage en cours…');

        try {
            this.#currentProgressModal.show();
            this.#update('Démarrage de l\'extraction apprentissage...', 0, 100);

            const result = await extractFn();

            if (result.cancelled) {
                this.#update('⚠️ Extraction annulée', 100, 100);
                this.#detail('L\'extraction a été interrompue par l\'utilisateur');
                return { success: false, cancelled: true };
            }

            const summaryMsg = this.#formatStatsMessage(result.stats);
            this.#update(summaryMsg, 100, 100);
            this.#detail('✅ Extraction apprentissage terminée !');
            this.#currentProgressModal.hideWithSuccess(2000);

            return result;

        } catch (error) {
            console.error('[CARIFOREFExtractionController] ❌ Erreur:', error);
            this.#update('❌ Erreur lors de l\'extraction', 100, 100);
            this.#detail(error.message || 'Erreur inconnue');
            throw error;
        } finally {
            this.#currentProgressModal = null;
        }
    }

    // =====================================
    // FLUX INTERNE — PAR COMMUNES (géo)
    // =====================================

    /**
     * Étape 1 : /etablissements par codes INSEE → UAI
     * Étape 2 : /formations par UAI → diplômes + relations
     * @private
     */
    async #extractEtabsEtDiplomesByCommunes(codesCommunes) {
        // ── ÉTAPE 1 : Établissements ────────────────────────────────────
        this.#update('🏫 Recherche des établissements apprentissage...', 10, 100);
        this.#detail(`📍 ${codesCommunes.length} commune(s) dans le périmètre`);

        const etabsBruts = await this.#carifOrefApi.getEtablissementsByCommunes(
            codesCommunes,
            (d) => this.#detail(d)
        );
        if (this.#checkStopped()) return { cancelled: true };

        this.#detail(`✅ ${etabsBruts.length} établissements trouvés`);

        // Parser + fusionner les établissements
        this.#update('🔄 Analyse des établissements...', 30, 100);
        const etablissements = CARIFOREFParser.parseEtablissements(etabsBruts);
        const uais = etablissements.map(e => e.uai).filter(Boolean);

        this.#update('💾 Stockage des établissements...', 40, 100);
        let nbEtabStockes = 0;
        let nbEtabRefuses = 0;
        for (const e of etablissements) {
            const key = await this.#fusionnerOuInsererEtablissement(e);
            if (key) {
                nbEtabStockes++;
            } else {
                nbEtabRefuses++;
                this.#detail(`⚠️ Établissement refusé (UAI et SIRET absents): ${e.nom || '?'}`, 'warning');
            }
        }
        this.#detail(`${etablissements.length} établissements → ${nbEtabStockes} fusionnés${nbEtabRefuses > 0 ? ` (${nbEtabRefuses} refusés)` : ''}`);
        this.#databaseService.flush(); // 💾 batch save établissements

        if (uais.length === 0) {
            this.#detail('⚠️ Aucun UAI valide, arrêt de l\'extraction');
            return { etablissements: nbEtabStockes, diplomes: 0, relations: 0 };
        }

        // ── ÉTAPE 2 : Formations → Diplômes ────────────────────────────
        const statsStep2 = await this.#extractDiplomesByUAIs(uais, 50, 90);
        if (statsStep2.cancelled) return { cancelled: true };

        // ── ÉTAPE 3 : Enrichissement type/statut via ONISEP ────────────
        // Les établissements CARIF n'ont pas type/statut — on les récupère depuis ONISEP structures
        this.#update('🔎 Enrichissement type/statut (ONISEP)...', 92, 100);
        try {
            const uaisActuels = (await this.#databaseService.getAllEtablissements())
                .filter(e => e.voies?.includes('apprentissage') && (!e.type || !e.statut))
                .map(e => e.uai);
            if (uaisActuels.length > 0 && window.onisepExtractionController?.isAuthenticated()) {
                const nbEnrichis = await window.onisepExtractionController.enrichirTypeStatutParUAIs(uaisActuels);
                if (nbEnrichis > 0) this.#detail(`🏷️ ${nbEnrichis} établissement(s) enrichis (type/statut ONISEP)`);
            }
        } catch (err) {
            console.warn('[CARIFOREFExtractionController] Enrichissement type/statut non critique:', err);
        }

        // ── ÉTAPE 4 : Extraction des formations niveau 5+ (non cliquables) ──
        this.#update('🎓 Recherche des formations post-bac (niveau 5+)...', 95, 100);
        try {
            await this.#extractAutresFormationsNiveau5Plus(uais);
        } catch (err) {
            console.warn('[CARIFOREFExtractionController] Extraction niveau 5+ non critique:', err);
        }

        return {
            etablissements: nbEtabStockes,
            diplomes:  statsStep2.diplomes,
            relations: statsStep2.relations
        };
    }

    // =====================================
    // FLUX INTERNE — PAR UAI (diplômes)
    // =====================================

    /**
     * Récupère les formations par UAI, puis :
     *  - Étape 1 : construit les établissements depuis les champs etablissement_formateur_*
     *              des formations (adresse de l'antenne locale, pas du siège)
     *  - Étape 2 : parse et stocke diplômes + relations
     * @private
     */
    async #extractEtabsEtDiplomesByUAIs(uais, startPercent = 10, endPercent = 90) {
        const mid1 = Math.round(startPercent + (endPercent - startPercent) * 0.3);
        const mid2 = Math.round(startPercent + (endPercent - startPercent) * 0.5);

        // ── ÉTAPE UNIQUE : Formations (contiennent toutes les données formateur) ──
        this.#update('🎓 Récupération des formations et données établissements...', startPercent, 100);
        this.#detail(`🔍 Formations pour ${uais.length} établissement(s)...`);

        const formationsBrutes = await this.#carifOrefApi.getFormationsByUAIs(
            uais,
            (d) => this.#detail(d)
        );
        if (this.#checkStopped()) return { cancelled: true };

        this.#detail(`✅ ${formationsBrutes.length} formations récupérées`);

        // ── ÉTAPE 1 : Établissements depuis les formations ───────────────
        // On utilise les champs etablissement_formateur_* qui reflètent
        // l'adresse de l'antenne locale (et non du siège)
        this.#update('🏫 Construction des établissements depuis les formations...', mid1, 100);
        const etablissements = CARIFOREFParser.parseEtablissementsDepuisFormations(formationsBrutes);

        this.#update('💾 Stockage des établissements...', mid2, 100);
        let nbEtabStockes = 0;
        let nbEtabRefuses = 0;
        for (const e of etablissements) {
            const key = await this.#fusionnerOuInsererEtablissement(e);
            if (key) {
                nbEtabStockes++;
            } else {
                nbEtabRefuses++;
                this.#detail(`⚠️ Établissement refusé (UAI et SIRET absents): ${e.nom || '?'}`, 'warning');
            }
        }
        this.#detail(`${etablissements.length} établissements → ${nbEtabStockes} stockés${nbEtabRefuses > 0 ? ` (${nbEtabRefuses} refusés)` : ''}`);
        this.#databaseService.flush(); // 💾 batch save établissements

        // ── ÉTAPE 2 : Parser formations → Diplômes ─────────────────────
        const statsStep2 = await this.#parseEtStoreDiplomesDepuisFormations(formationsBrutes, mid2 + 5, endPercent);
        if (statsStep2.cancelled) return { cancelled: true };

        // ── ÉTAPE 3 : Enrichissement type/statut via ONISEP ────────────
        try {
            const uaisActuels = (await this.#databaseService.getAllEtablissements())
                .filter(e => e.voies?.includes('apprentissage') && (!e.type || !e.statut))
                .map(e => e.uai);
            if (uaisActuels.length > 0 && window.onisepExtractionController?.isAuthenticated()) {
                const nbEnrichis = await window.onisepExtractionController.enrichirTypeStatutParUAIs(uaisActuels);
                if (nbEnrichis > 0) this.#detail(`🏷️ ${nbEnrichis} établissement(s) enrichis (type/statut ONISEP)`);
            }
        } catch (err) {
            console.warn('[CARIFOREFExtractionController] Enrichissement type/statut non critique:', err);
        }

        // ── ÉTAPE 4 : Extraction des formations niveau 5+ (non cliquables) ──
        try {
            await this.#extractAutresFormationsNiveau5Plus(uais);
        } catch (err) {
            console.warn('[CARIFOREFExtractionController] Extraction niveau 5+ non critique:', err);
        }

        return {
            etablissements: nbEtabStockes,
            diplomes:  statsStep2.diplomes,
            relations: statsStep2.relations
        };
    }

    // =====================================
    // FLUX INTERNE — DIPLÔMES PAR UAI
    // =====================================

    /**
     * Récupère, parse et stocke les diplômes + relations pour une liste d'UAI.
     * Utilisé par les deux flux (géo et diplômes).
     * @private
     */
    /**
     * Parse et stocke les diplômes + relations depuis un tableau de formations brutes
     * déjà récupérées. Évite un second appel API quand les formations sont connues.
     * @private
     * @param {Object[]} formationsBrutes
     * @param {number} startPercent
     * @param {number} endPercent
     * @returns {Promise<{ diplomes: number, relations: number, cancelled?: boolean }>}
     */
    async #parseEtStoreDiplomesDepuisFormations(formationsBrutes, startPercent, endPercent) {
        const midPercent = Math.round((startPercent + endPercent) / 2);

        if (this.#checkStopped()) return { cancelled: true };
        this.#detail(`✅ Analyse de ${formationsBrutes.length} formations...`);

        this.#update('🔄 Analyse des formations...', midPercent, 100);
        const parsed = CARIFOREFParser.parseFormations(formationsBrutes);

        this.#update('💾 Stockage diplômes apprentissage...', endPercent - 5, 100);
        return await this.#storeDiplomes(parsed);
    }

    async #extractDiplomesByUAIs(uais, startPercent, endPercent) {
        const midPercent = Math.round((startPercent + endPercent) / 2);

        // ── Requête API ─────────────────────────────────────────────────
        this.#update('🎓 Recherche des formations apprentissage...', startPercent, 100);
        this.#detail(`🔍 Formations pour ${uais.length} établissement(s)...`);

        const formationsBrutes = await this.#carifOrefApi.getFormationsByUAIs(
            uais,
            (d) => this.#detail(d)
        );
        if (this.#checkStopped()) return { cancelled: true };

        this.#detail(`✅ ${formationsBrutes.length} formations récupérées`);

        // ── Parser ──────────────────────────────────────────────────────
        this.#update('🔄 Analyse des formations...', midPercent, 100);
        const parsed = CARIFOREFParser.parseFormations(formationsBrutes);

        // ── Stocker ─────────────────────────────────────────────────────
        this.#update('💾 Stockage diplômes apprentissage...', endPercent - 5, 100);
        const stats = await this.#storeDiplomes(parsed);

        return stats;
    }

    // =====================================
    // STOCKAGE DIPLÔMES
    // =====================================

    /**
     * Déduplique et stocke les diplômes + relations
     * @private
     * @param {{ diplomesApprentissage: Object[], diplomesApprentissage_par_etablissement: Object[] }} parsed
     * @returns {Promise<{ diplomes: number, relations: number }>}
     */
    async #storeDiplomes(parsed) {
        let nbDiplomes = 0;
        let nbRelations = 0;

        // ── Dédupliquer et stocker les diplômes ──────────────────────────
        const diplomesMap = new Map();
        for (const d of parsed.diplomesApprentissage) {
            if (d.id && !diplomesMap.has(d.id)) diplomesMap.set(d.id, d);
        }
        for (const d of diplomesMap.values()) {
            const key = await this.#databaseService.insertDiplomeApprentissage(d);
            if (key) nbDiplomes++;
        }
        this.#detail(`${parsed.diplomesApprentissage.length} diplômes → ${nbDiplomes} stockés`);
        this.#databaseService.flush(); // 💾 batch save diplômes apprentissage

        // ── Dédupliquer et stocker les relations ─────────────────────────
        const relationsMap = new Map();
        for (const r of parsed.diplomesApprentissage_par_etablissement) {
            if (r.id && diplomesMap.has(r.diplomId)) {
                relationsMap.set(r.id, r);
            }
        }
        for (const r of relationsMap.values()) {
            // Résoudre etabId (_id interne) via UAI+nom ou UAI seul
            if (!r.etabId && r.uai) {
                if (r.etabNom) {
                    // Recherche exacte UAI+nom
                    const etabExact = this.#databaseService.getEtablissementByUaiSync(r.uai, r.etabNom);
                    if (etabExact) r.etabId = etabExact._id;
                }
                // Fallback : premier établissement avec cet UAI
                if (!r.etabId) {
                    const etabs = this.#databaseService.getEtablissementsByUaiSync(r.uai);
                    if (etabs.length > 0) r.etabId = etabs[0]._id;
                }
            }
            const key = await this.#databaseService.insertDiplomeApprentissageParEtablissement(r);
            if (key) nbRelations++;
        }
        this.#detail(`${parsed.diplomesApprentissage_par_etablissement.length} relations → ${nbRelations} stockées`);
        this.#databaseService.flush(); // 💾 batch save relations apprentissage

        // ── Supprimer les établissements CARIF sans aucune relation (niveaux 5/6/7 exclus) ──
        const uaisAvecRelations = new Set(relationsMap.values() ? [...relationsMap.values()].map(r => r.uai) : []);
        const nbSupprimes = await this.#databaseService.supprimerEtablissementsCarifSansRelation(uaisAvecRelations);
        if (nbSupprimes > 0) {
            this.#detail(`🚫 ${nbSupprimes} établissement(s) exclus (niveaux bac+2 et plus uniquement)`);
        }

        return { diplomes: nbDiplomes, relations: nbRelations };
    }

    // =====================================
    // UTILITAIRES PRIVÉS
    // =====================================

    async #resetAprentissageData() {
        this.#isStopped = false;
        if (this.#databaseService) {
            await this.#databaseService.clearAprentissageData();
        }
    }

    /**
     * Récupère les formations de niveau 5+ (BTS, licence, master) pour les UAIs donnés
     * et les stocke par établissement pour affichage dans la section « Autres formations ».
     * Ces données sont informatives uniquement (non cliquables, pas de navigation).
     * @param {string[]} uais - UAI des établissements à interroger
     * @private
     */
    async #extractAutresFormationsNiveau5Plus(uais) {
        if (!uais || uais.length === 0) return;

        this.#detail('🎓 Recherche des formations niveau 5+ (BTS, licence…)…');

        const formationsBrutes = await this.#carifOrefApi.getFormationsNiveau5PlusByUAIs(
            uais,
            (d) => this.#detail(d)
        );

        if (!formationsBrutes || formationsBrutes.length === 0) {
            this.#detail('ℹ️ Aucune formation niveau 5+ trouvée');
            return;
        }

        // Agréger par (UAI, nom) — clé composite pour gérer les multi-structures
        const parEtab = new Map(); // clé "UAI||nom" → { uai, etabNom, formations: Map }
        for (const f of formationsBrutes) {
            const uai = (f.etablissement_formateur_uai || '').trim();
            if (!uai) continue;
            const etabNom = (f.etablissement_formateur_enseigne || '').trim()
                         || (f.etablissement_formateur_entreprise_raison_sociale || '').trim()
                         || '';

            const cleEtab = `${uai}||${etabNom}`;
            if (!parEtab.has(cleEtab)) parEtab.set(cleEtab, { uai, etabNom: etabNom || null, formations: new Map() });

            const entry = parEtab.get(cleEtab);
            const libelle = (f.intitule_long || f.intitule_court || '').trim();
            const cleUnique = libelle.toLowerCase();
            if (!libelle || entry.formations.has(cleUnique)) continue;

            entry.formations.set(cleUnique, {
                libelle,
                niveau:      (f.niveau  || '').trim(),
                typeDiplome: (f.diplome || '').trim(),
                source:      'carif'
            });
        }

        // Stocker en base par _id interne, résolution par UAI+nom puis fallback UAI seul
        let nbEtabs = 0;
        let nbFormations = 0;
        for (const [, { uai, etabNom, formations: formationsMap }] of parEtab) {
            const formations = Array.from(formationsMap.values());

            // Résoudre vers l'_id interne par UAI+nom
            let etabId = null;
            if (etabNom) {
                const etabExact = this.#databaseService.getEtablissementByUaiSync(uai, etabNom);
                if (etabExact) etabId = etabExact._id;
            }
            // Fallback : si un seul étab pour cet UAI, on le prend ;
            //            si plusieurs, on applique à tous (formations partagées par site)
            if (!etabId) {
                const etabs = this.#databaseService.getEtablissementsByUaiSync(uai);
                if (etabs.length === 0) continue;
                if (etabs.length === 1) {
                    etabId = etabs[0]._id;
                } else {
                    // Plusieurs structures : appliquer à toutes (formations niv5+ = site physique)
                    for (const etab of etabs) {
                        const existantes = this.#databaseService.getAutresFormationsParEtablissement(etab._id) || [];
                        const existantesSet = new Set(existantes.map(f => f.libelle.toLowerCase()));
                        const nouvelles = formations.filter(f => !existantesSet.has(f.libelle.toLowerCase()));
                        if (nouvelles.length > 0) {
                            await this.#databaseService.insertAutresFormationsParEtablissement(etab._id, [...existantes, ...nouvelles]);
                            nbEtabs++;
                            nbFormations += nouvelles.length;
                        }
                    }
                    continue;
                }
            }

            // Cas simple : un seul étab résolu
            const existantes = this.#databaseService.getAutresFormationsParEtablissement(etabId) || [];
            const existantesSet = new Set(existantes.map(f => f.libelle.toLowerCase()));
            const nouvelles = formations.filter(f => !existantesSet.has(f.libelle.toLowerCase()));
            if (nouvelles.length > 0) {
                await this.#databaseService.insertAutresFormationsParEtablissement(etabId, [...existantes, ...nouvelles]);
                nbEtabs++;
                nbFormations += nouvelles.length;
            }
        }

        this.#databaseService.flush();
        this.#detail(`✅ ${nbFormations} formations niveau 5+ réparties sur ${nbEtabs} établissement(s)`);
    }

    /**
     * Fusionne un établissement CARIF avec un existant (scolaire),
     * ou insère un nouvel établissement en voie apprentissage.
     * 
     * Logique de recherche (déplacée depuis DatabaseService.fusionnerEtablissementAprentissage) :
     *   1. Cherche un existant avec même UAI ET même nom (normalisé)
     *      → enrichissement + ajout voie 'apprentissage'
     *   2. Si aucun match par nom mais un seul existant avec cet UAI
     *      → enrichissement (cas fréquent : un seul établissement par UAI)
     *   3. Si plusieurs existants et aucun match par nom → nouvel enregistrement
     *   4. Si aucun existant → nouvel enregistrement
     * 
     * @param {Object} etabCarif - Données CARIF de l'établissement
     * @returns {Promise<string|null>} _id interne ou null si refusé
     * @private
     */
    async #fusionnerOuInsererEtablissement(etabCarif) {
        const uai   = etabCarif.uai   ? String(etabCarif.uai).trim()   : null;
        const siret = etabCarif.siret ? String(etabCarif.siret).trim() : null;

        if (!uai && !siret) {
            console.warn('[CARIFController] ❌ Établissement sans UAI ni SIRET');
            return null;
        }

        // S'assurer que nomCarif est renseigné
        if (!etabCarif.nomCarif) {
            etabCarif.nomCarif = etabCarif.nom || null;
        }

        // Chercher les existants par UAI
        const existants = uai ? this.#databaseService.getEtablissementsByUaiSync(uai) : [];

        // Chercher un match par nom normalisé
        const nomCarifLower = (etabCarif.nomCarif || etabCarif.nom || '').trim().toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let existant = null;

        if (existants.length > 0) {
            // Match exact par nom normalisé
            existant = existants.find(e => {
                const nomExistant = (e.nomOnisep || e.nomCarif || e.nom || '').trim().toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                return nomExistant === nomCarifLower;
            });

            // Si pas de match par nom mais un seul existant → fusion par défaut
            if (!existant && existants.length === 1) {
                existant = existants[0];
            }
            // Si plusieurs existants et aucun match par nom → nouvel enregistrement
        }

        if (existant) {
            // Enrichir l'existant : nomCarif, champs manquants, ajouter voie apprentissage
            const updates = {};
            for (const [key, val] of Object.entries(etabCarif)) {
                if (key === 'voies' || key === '_id' || key === 'nom') continue;
                if (val !== null && val !== undefined && val !== '') {
                    updates[key] = val;
                }
            }
            // Toujours pousser nomCarif
            if (etabCarif.nomCarif) updates.nomCarif = etabCarif.nomCarif;
            // Ajouter la voie apprentissage
            updates.voies = ['apprentissage'];
            this.#databaseService.updateEtablissement(existant._id, updates);
            return existant._id;
        } else {
            // Nouvel établissement : préparer les champs obligatoires pour insertEtablissement
            etabCarif.voies = ['apprentissage'];
            if (!etabCarif.nomCarif) etabCarif.nomCarif = etabCarif.nom || null;
            return await this.#databaseService.insertEtablissement(etabCarif);
        }
    }

    #checkStopped() {
        return this.#isStopped;
    }

    #update(message, current, total) {
        if (this.#currentProgressModal) {
            this.#currentProgressModal.update(message, current, total);
        }
    }

    #detail(detail, type = 'info') {
        if (detail && this.#currentProgressModal) {
            this.#currentProgressModal.addDetail(detail, type);
        }
    }

    #formatStatsMessage(stats) {
        if (!stats || stats.cancelled) return '⚠️ Extraction annulée';
        return [
            `✅ Extraction apprentissage terminée`,
            `• ${stats.etablissements ?? 0} établissement(s) traité(s)`,
            `• ${stats.diplomes ?? 0} diplôme(s) stocké(s)`,
            `• ${stats.relations ?? 0} relation(s) diplôme-établissement`
        ].join('\n');
    }
}

if (typeof window !== 'undefined') {
    window.CARIFOREFExtractionController = CARIFOREFExtractionController;
}
