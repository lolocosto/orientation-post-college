/************************************************
 * Fichier : carif_oref_api.js
 * Description : Classe pour interagir avec l'API CARIF-OREF (catalogue apprentissage)
 * Auteur : Laurent COSTE
 * Date : 2026-02-20
 * Version : 2.0
 * Documentation API : https://catalogue-apprentissage.intercariforef.org/api/swagger
 *
 * Endpoints utilisés :
 *   GET /api/v1/entity/etablissements?query={...}&page=...&limit=...
 *   GET /api/v1/entity/formations?query={...}&page=...&limit=...
 *
 * Flux géo (2 étapes) :
 *   1. getEtablissementsByCommunes(codesInsee) → liste des établissements + UAI
 *   2. getFormationsByUAIs(uais)               → formations/diplômes par établissement
 *
 * Flux diplômes disponibles (liste sans stockage) :
 *   getDiplomesByZone(type, value)  → niveaux 3 et 4 pour un département ou académie
 *
 * Flux extraction par diplômes (2 étapes) :
 *   1. getEtablissementsByUAIs(uais)   → données établissements pour UAI connus
 *   2. getFormationsByUAIs(uais)       → formations/diplômes correspondants
 ************************************************/

class CARIFOREFApi {

    #baseURL = 'https://catalogue-apprentissage.intercariforef.org/api/v1/entity';
    #defaultLimit = 100;
    #http;

    // Niveaux toujours extraits (3 = CAP, 4 = BAC) — niveaux 5/6/7 exclus (post-bac)
    static NIVEAUX_APPRENTISSAGE = ['3 (CAP...)', '4 (BAC...)'];

    // Préfixes de niveaux à exclure (post-bac, hors scope post-collège)
    static NIVEAUX_EXCLUS = ['5 (', '6 (', '7 ('];

    constructor() {
        this.#http = new HttpClient({ label: 'CARIFOREFApi' });
        console.log('[CARIFOREFApi] Instance créée');
    }

    get _requestCount() { return this.#http.requestCount; }
    get requestCount()  { return this.#http.requestCount; }

    // =====================================
    // ÉTABLISSEMENTS
    // =====================================

    /**
     * Récupère les établissements pour une liste de codes INSEE de communes.
     * Filtre : exclut ferme=true et uai=null.
     * Étape 1 du flux géo.
     *
     * @param {string|string[]} codesInsee
     * @param {Function|null} progressCallback
     * @returns {Promise<Object[]>} établissements bruts API /etablissements
     */
    async getEtablissementsByCommunes(codesInsee, progressCallback = null) {
        const codes = Array.isArray(codesInsee) ? codesInsee : [codesInsee];
        if (codes.length === 0) return [];

        console.log(`[CARIFOREFApi] 🔍 Établissements pour ${codes.length} commune(s)`);

        const query = codes.length === 1
            ? { code_insee_localite: codes[0] }
            : { $or: codes.map(c => ({ code_insee_localite: c })) };

        const tous = await this.#queryEtablissements(query, progressCallback);
        const valides = tous.filter(e => e.uai && !e.ferme && !e.entreprise_ferme);

        console.log(`[CARIFOREFApi] ✅ ${valides.length} établissements valides (${tous.length} bruts)`);
        return valides;
    }

    /**
     * Récupère les données d'établissements pour une liste d'UAI connus.
     * Filtre : exclut ferme=true et uai=null.
     * Utilisé lors de la recherche par diplômes.
     *
     * @param {string[]} uais
     * @param {Function|null} progressCallback
     * @returns {Promise<Object[]>} établissements bruts
     */
    async getEtablissementsByUAIs(uais, progressCallback = null) {
        if (!uais || uais.length === 0) return [];

        const uaisUniques = [...new Set(uais)];
        console.log(`[CARIFOREFApi] 🔍 Établissements pour ${uaisUniques.length} UAI(s)`);

        const allResults = [];
        const batchSize = 30;
        const totalBatches = Math.ceil(uaisUniques.length / batchSize);

        for (let i = 0; i < uaisUniques.length; i += batchSize) {
            const batch = uaisUniques.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;

            const query = batch.length === 1
                ? { uai: batch[0] }
                : { $or: batch.map(u => ({ uai: u })) };

            const results = await this.#queryEtablissements(query);
            allResults.push(...results);

            if (progressCallback) {
                progressCallback(`Lot ${batchNum}/${totalBatches} : ${allResults.length} établissements`);
            }
            if (i + batchSize < uaisUniques.length) await this._sleep(200);
        }

        const valides = allResults.filter(e => e.uai && !e.ferme && !e.entreprise_ferme);
        const map = new Map();
        for (const e of valides) map.set(e.uai, e);

        console.log(`[CARIFOREFApi] ✅ ${map.size} établissements valides uniques`);
        return Array.from(map.values());
    }

    // =====================================
    // FORMATIONS / DIPLÔMES
    // =====================================

    /**
     * Récupère les formations pour une liste d'UAI.
     * Étape 2 du flux géo et du flux diplômes.
     *
     * @param {string[]} uais
     * @param {Function|null} progressCallback
     * @returns {Promise<Object[]>} formations brutes API /formations
     */
    async getFormationsByUAIs(uais, progressCallback = null) {
        if (!uais || uais.length === 0) return [];

        const allResults = [];
        const uaisUniques = [...new Set(uais)];

        console.log(`[CARIFOREFApi] 🔍 Formations pour ${uaisUniques.length} UAI(s)`);

        const batchSize = 10;
        const totalBatches = Math.ceil(uaisUniques.length / batchSize);

        for (let i = 0; i < uaisUniques.length; i += batchSize) {
            const batch = uaisUniques.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;

            // Filtre UAI + niveaux 3 et 4 uniquement (exclut niveaux 5/6/7 = BTS/Licence/Master)
            const uaiFilter = batch.length === 1
                ? { etablissement_formateur_uai: batch[0] }
                : { $or: batch.map(u => ({ etablissement_formateur_uai: u })) };

            const niveauxFilter = { $or: CARIFOREFApi.NIVEAUX_APPRENTISSAGE.map(n => ({ niveau: n })) };

            // Exclut les RNCP inactifs sur France Compétences ET les CFD périmés dans BCN
            // (les deux référentiels sont indépendants et non synchronisés)
            const query = { $and: [ uaiFilter, niveauxFilter, { rncp_eligible_apprentissage: true }, { cfd_outdated: false } ] };

            if (progressCallback) {
                progressCallback(`🔍 Lot ${batchNum}/${totalBatches} (UAI ${i+1}–${Math.min(i+batchSize, uaisUniques.length)}/${uaisUniques.length})...`);
            }

            const results = await this.#queryFormations(query, progressCallback);
            allResults.push(...results);

            if (i + batchSize < uaisUniques.length) await this._sleep(200);
        }

        const unique = this.#deduplicateById(allResults, 'id');
        console.log(`[CARIFOREFApi] ✅ ${unique.length} formations uniques (${allResults.length} brutes)`);
        return unique;
    }

    /**
     * Récupère la liste légère des diplômes (niveaux 3 et 4) pour un département
     * ou une académie. Utilisé pour peupler la liste de sélection SANS stocker.
     *
     * Champs retournés : etablissement_formateur_uai, rncp_code,
     *                    intitule_long, intitule_court, diplome, niveau
     *
     * @param {'departement'|'academie'} type
     * @param {string} value - Numéro département (ex: "35") ou académie (ex: "14")
     * @param {Function|null} progressCallback
     * @returns {Promise<Object[]>} formations brutes (champs limités)
     */
    async getDiplomesByZone(type, value, progressCallback = null) {
        if (!type || !value) throw new Error('[CARIFOREFApi] getDiplomesByZone : type et value requis');

        const zoneField = type === 'departement' ? 'num_departement' : 'num_academie';
        console.log(`[CARIFOREFApi] 🔍 Diplômes niveaux 3/4 pour ${type} ${value}`);

        const query = {
            $and: [
                { [zoneField]: String(value) },
                { $or: CARIFOREFApi.NIVEAUX_APPRENTISSAGE.map(n => ({ niveau: n })) }
            ]
        };

        const select = {
            etablissement_formateur_uai: 1,
            rncp_code: 1,
            intitule_long: 1,
            intitule_court: 1,
            diplome: 1,
            niveau: 1
        };

        const results = await this.#queryFormations(query, progressCallback, select);
        console.log(`[CARIFOREFApi] ✅ ${results.length} formations niveaux 3/4`);
        return results;
    }

    // =====================================
    // REQUÊTES INTERNES
    // =====================================

    /**
     * Récupère les formations de niveau 5+ (BTS, licence, etc.) pour un ensemble d'UAI.
     * Utilisé pour la section « Autres formations et diplômes » dans la fiche établissement.
     * Retourne une liste légère (intitulé, niveau, type) sans stocker en base.
     *
     * @param {string[]} uais - Liste d'UAI des établissements
     * @param {Function|null} progressCallback
     * @returns {Promise<Object[]>} formations brutes (champs limités)
     */
    async getFormationsNiveau5PlusByUAIs(uais, progressCallback = null) {
        if (!uais || uais.length === 0) return [];

        const allResults = [];
        const uaisUniques = [...new Set(uais)];

        console.log(`[CARIFOREFApi] 🔍 Formations niveau 5+ pour ${uaisUniques.length} UAI(s)`);

        const batchSize = 10;
        const totalBatches = Math.ceil(uaisUniques.length / batchSize);

        for (let i = 0; i < uaisUniques.length; i += batchSize) {
            const batch = uaisUniques.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;

            const uaiFilter = batch.length === 1
                ? { etablissement_formateur_uai: batch[0] }
                : { $or: batch.map(u => ({ etablissement_formateur_uai: u })) };

            // L'API CARIF-OREF ne supporte pas de filtre regex sur le champ « niveau ».
            // On récupère toutes les formations actives de ces UAI avec un select léger,
            // puis on filtre côté client pour ne garder que les niveaux 5+.
            const query = { $and: [ uaiFilter, { rncp_eligible_apprentissage: true }, { cfd_outdated: false } ] };

            const select = {
                etablissement_formateur_uai: 1,
                rncp_code: 1,
                intitule_long: 1,
                intitule_court: 1,
                diplome: 1,
                niveau: 1
            };

            if (progressCallback) {
                progressCallback(`🔍 Lot ${batchNum}/${totalBatches} (formations niveau 5+)...`);
            }

            const results = await this.#queryFormations(query, null, select);
            // Filtrer côté client : garder uniquement les niveaux 5+
            const filtered = results.filter(f => {
                const niveau = (f.niveau || '').trim();
                return CARIFOREFApi.NIVEAUX_EXCLUS.some(prefix => niveau.startsWith(prefix));
            });
            allResults.push(...filtered);

            if (i + batchSize < uaisUniques.length) await this._sleep(200);
        }

        const unique = this.#deduplicateById(allResults, 'id');
        console.log(`[CARIFOREFApi] ✅ ${unique.length} formations niveau 5+ uniques`);
        return unique;
    }

    /**
     * Requête générique sur /etablissements avec pagination automatique
     * @private
     */
    async #queryEtablissements(queryParams, progressCallback = null) {
        const allResults = [];
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages) {
            const url = this.#buildUrl('etablissements', queryParams, page, this.#defaultLimit);
            console.log(`[CARIFOREFApi] Étab. page ${page}/${totalPages}`);

            const data = await this.#http.getJSON(url);

            const results = data.etablissements || [];
            const pagination = data.pagination || {};

            if (page === 1) {
                const total = pagination.total || results.length;
                totalPages = Math.ceil(total / this.#defaultLimit);
                if (totalPages > 1) {
                    console.log(`[CARIFOREFApi] 📊 ${total} établissements, ${totalPages} page(s)`);
                }
            }

            allResults.push(...results);

            if (progressCallback && totalPages > 1) {
                progressCallback(`Page ${page}/${totalPages} : ${allResults.length} établissements`);
            }

            page++;
            if (page <= totalPages) await this.#http.sleep(200);
        }

        return allResults;
    }

    /**
     * Requête générique sur /formations avec pagination automatique.
     * Exclut les formations fermées (date_fermeture non nulle).
     * progressCallback est appelé à chaque page.
     * @private
     */
    async #queryFormations(queryParams, progressCallback = null, select = null) {
        const allResults = [];
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages) {
            const url = this.#buildUrl('formations', queryParams, page, this.#defaultLimit, select);
            console.log(`[CARIFOREFApi] Form. page ${page}/${totalPages}`);

            const data = await this.#http.getJSON(url);

            const results = data.formations || [];
            const pagination = data.pagination || {};

            if (page === 1) {
                const total = pagination.total || results.length;
                totalPages = Math.ceil(total / this.#defaultLimit);
                if (totalPages > 1) {
                    console.log(`[CARIFOREFApi] 📊 ${total} formations, ${totalPages} page(s)`);
                }
            }

            const actives = results.filter(f => !f.date_fermeture);
            allResults.push(...actives);

            // Callback à chaque page — sans throttle pour que l'utilisateur voit chaque requête
            if (progressCallback && totalPages > 1) {
                progressCallback(`📄 ${allResults.length} formations — page ${page}/${totalPages}...`);
            }

            page++;
            if (page <= totalPages) await this.#http.sleep(200);
        }

        return allResults;

    }

    // =====================================
    // CONSTRUCTION URL
    // =====================================

    /**
     * Construit l'URL de requête avec encodage JSON du query
     * @private
     */
    #buildUrl(endpoint, queryParams, page = 1, limit = 100, select = null) {
        const queryJson = encodeURIComponent(JSON.stringify(queryParams));
        let url = `${this.#baseURL}/${endpoint}?query=${queryJson}&page=${page}&limit=${limit}`;
        if (select) {
            url += `&select=${encodeURIComponent(JSON.stringify(select))}`;
        }
        return url;
    }

    // =====================================
    // HTTP AVEC RETRY
    // =====================================

    // =====================================
    // UTILITAIRES PRIVÉS
    // =====================================

        /**
         * Dédoublonne une liste d'objets selon une clé.
         * @private
         * @param {Object[]} items - Tableau d'objets
         * @param {string} key - Nom du champ clé d'unicité
         * @returns {Object[]} Tableau dédoublonné
         */
#deduplicateById(items, key) {
        const map = new Map();
        for (const item of items) {
            const k = item[key] || item._id || JSON.stringify(item);
            if (!map.has(k)) map.set(k, item);
        }
        return Array.from(map.values());
    }

    _sleep(ms) { return this.#http.sleep(ms); }
}

if (typeof window !== 'undefined') {
    window.CARIFOREFApi = CARIFOREFApi;
}
