/************************************************
 * Fichier : database_service.js
 * Description : Service de base de données (localStorage)
 * Auteur : Laurent COSTE / Claude
 * Date : 2026-02-04
 * Version : 1.0 - localStorage (compatible navigateurs modernes)
 ************************************************/

/**
 * Génère un identifiant court pseudo-aléatoire (8 caractères hex)
 * @returns {string}
 */
function _genId() {
    return Math.random().toString(36).slice(2, 10).padEnd(8, '0');
}

/**
 * Service de base de données avec localStorage
 * Alternative moderne à WebSQL (obsolète)
 */
class DatabaseService {
    
    #dbName = 'parcours_avenir';
    #version = 1;
    #storage = {};
    #loaded = false;      // true une fois le chargement localStorage terminé
    #loadPromise = null;  // Promise résolue quand le chargement est terminé

    
        /**
         * Crée une instance du service de base de données.
         * Initialise les tables en mémoire et charge localStorage si des données existent.
         * @param {string|null} [dbName=null] - Clé localStorage (défaut : 'parcours_avenir')
         */
constructor(dbName = null) {
        if (dbName) {
            this.#dbName = dbName;
        }
        
        console.log('[DatabaseService] 🗄️ Initialisation de la base de données');
        
        // Structure des tables
        this.#storage = {
            etablissements: {},
            diplomes: {},
            diplomes_par_etablissement: {},
            dispositifs: {},
            dispositifs_par_etablissement: {},
            options_2nde_gt: {},
            options_2nde_gt_par_etablissement: {},
            specialites_1ereG: {},
            specialites_1ereG_par_etablissement: {},
            // Voie apprentissage (CARIF-OREF)
            diplomes_apprentissage: {},
            diplomes_apprentissage_par_etablissement: {},
            // Autres formations niveau 5+ (ONISEP scolaire + CARIF-OREF apprentissage)
            autres_formations_par_etablissement: {},
            langues: {},
            communes: {},
            departements: {},
            regions: {},
            epci: {}
        };
        
        // Lancer le chargement localStorage en arrière-plan (non-bloquant)
        this.#loadPromise = this.#loadFromLocalStorageAsync();
    }
    
        /**
         * Charge l'état des tables depuis localStorage de façon asynchrone et non-bloquante.
         * Utilise setTimeout(0) pour céder le thread au navigateur, permettant l'affichage
         * immédiat de l'interface avant la désérialisation JSON (qui peut être longue).
         * @private
         * @returns {Promise<void>}
         */
#loadFromLocalStorageAsync() {
        return new Promise((resolve) => {
            // Céder le thread immédiatement → le navigateur peut peindre l'UI
            setTimeout(() => {
                try {
                    const t0 = performance.now();
                    const stored = localStorage.getItem(this.#dbName);
                    if (stored) {
                        this.#storage = JSON.parse(stored);
                        const ms = Math.round(performance.now() - t0);
                        console.log(`[DatabaseService] 📂 Données chargées en ${ms}ms (${(stored.length/1024).toFixed(0)} Ko)`);
                        // Reconstruire l'index d'unicité et le compteur d'IDs
                        this.#rebuildEtabIndex();
                    } else {
                        console.log('[DatabaseService] 📂 Aucune donnée en localStorage');
                    }
                } catch (error) {
                    console.warn('[DatabaseService] ⚠️ Impossible de charger depuis localStorage:', error);
                } finally {
                    this.#loaded = true;
                    resolve();
                    // Notifier l'UI que les données sont prêtes
                    document.dispatchEvent(new CustomEvent('db:ready'));
                }
            }, 0);
        });
    }

    /**
     * Attend que le chargement initial soit terminé.
     * @returns {Promise<void>}
     */
    waitReady() {
        return this.#loadPromise;
    }

    /**
     * Reconstruit l'index d'unicité des établissements et le compteur d'ID
     * après un chargement depuis localStorage.
     * @private
     */
    #rebuildEtabIndex() {
        this.#etabUniquenessIndex.clear();
        let maxId = 0;
        for (const [id, etab] of Object.entries(this.#storage.etablissements || {})) {
            // Reconstruire l'index d'unicité
            const uniqueKey = this.#buildEtabUniquenessKey(etab);
            if (uniqueKey) {
                this.#etabUniquenessIndex.set(uniqueKey, id);
            }
            // Recalculer le prochain ID
            const match = id.match(/^etab_(\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num >= maxId) maxId = num;
            }
        }
        this.#nextEtabId = maxId + 1;
        console.log(`[DatabaseService] 🔄 Index établissements reconstruit: ${this.#etabUniquenessIndex.size} entrées, prochain ID: ${this.#nextEtabId}`);
    }

    /**
     * Indique si le chargement depuis localStorage est terminé.
     * @returns {boolean}
     */
    isLoaded() {
        return this.#loaded;
    }

    // #loadFromLocalStorage synchrone supprimée en v0.59 : remplacée par #loadFromLocalStorageAsync

        /**
         * Persiste toutes les tables dans localStorage.
         * Pour les batches d'insertions, préférer flush() après la boucle.
         * @private
         * @returns {void}
         */
#saveToLocalStorage() {
        try {
            localStorage.setItem(this.#dbName, JSON.stringify(this.#storage));
        } catch (error) {
            console.warn('[DatabaseService] ⚠️ Impossible de sauver dans localStorage:', error);
        }
    }

    /**
     * Persiste l'état courant dans localStorage.
     * À appeler explicitement après une série d'insertions en batch,
     * plutôt qu'après chaque insert individuel.
     */
    flush() {
        this.#saveToLocalStorage();
    }
    
        /**
         * Initialise le service (compatibilité avec les contrôleurs async).
         * L'initialisation réelle se fait dans le constructeur.
         * @returns {Promise<void>}
         */
async init() {
        console.log('[DatabaseService] ✅ Base de données initialisée');
        return Promise.resolve();
    }
    
    // =====================================
    // ÉTABLISSEMENTS
    // =====================================
    
    /**
     * Compteur auto-incrémenté pour les _id internes des établissements.
     * @type {number}
     * @private
     */
    #nextEtabId = 1;

    /**
     * Index d'unicité UAI+nom pour détecter les doublons.
     * Clé : `${uai}||${nomNormalisé}` ou `${siret}||${nomNormalisé}`
     * Valeur : _id interne
     * @type {Map<string, string>}
     * @private
     */
    #etabUniquenessIndex = new Map();

    /**
     * Normalise un nom pour comparaison : minuscules, sans accents, trimmed.
     * @param {string} nom
     * @returns {string}
     * @private
     */
    #normalizeNom(nom) {
        return (nom || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    /**
     * Construit la clé d'unicité d'un établissement.
     * Pour ONISEP : UAI + nomNormalisé. Pour CARIF : SIRET + nomNormalisé (si pas d'UAI).
     * La normalisation supprime les accents et passe en minuscules
     * pour fusionner correctement les noms ONISEP/CARIF (ex: "Hélène" vs "HELENE").
     * @param {Object} etab
     * @returns {string|null} Clé d'unicité ou null si impossible
     * @private
     */
    #buildEtabUniquenessKey(etab) {
        const nom = this.#normalizeNom(etab.nomOnisep || etab.nomCarif || etab.nom || '');
        const uai   = etab.uai   ? String(etab.uai).trim()   : null;
        const siret = etab.siret ? String(etab.siret).trim() : null;
        if (uai) return `${uai}||${nom}`;
        if (siret) return `${siret}||${nom}`;
        return null;
    }

    /**
     * Insère un établissement en base (stockage "bête").
     * 
     * Responsabilité : validation des champs obligatoires, test d'unicité, stockage.
     * Pas de logique métier : c'est au contrôleur de préparer les données
     * (voies, noms, enrichissements) AVANT d'appeler cette méthode.
     * 
     * Champs obligatoires :
     *   - UAI ou SIRET (identification)
     *   - nomOnisep ou nomCarif (au moins un nom source)
     *   - voies (tableau non vide, ex: ['scolaire'] ou ['apprentissage'])
     * 
     * En cas de doublon (même clé d'unicité UAI+nom ou SIRET+nom), retourne
     * l'_id existant sans modifier les données en base.
     * 
     * @param {Object} etablissement - Données préparées par le contrôleur
     * @returns {Promise<string|null>} _id interne ou null si refusé
     */
    async insertEtablissement(etablissement) {
        const uai   = etablissement.uai   ? String(etablissement.uai).trim()   : null;
        const siret = etablissement.siret ? String(etablissement.siret).trim() : null;

        // Vérification des champs obligatoires : UAI ou SIRET, au moins un nom, au moins une voie
        if (!uai && !siret) {
            console.warn('[DatabaseService] ❌ Établissement refusé (UAI et SIRET nuls):', etablissement);
            return null;
        }
        if (!etablissement.nomOnisep && !etablissement.nomCarif) {
            console.warn('[DatabaseService] ❌ Établissement refusé (aucun nom fourni):', etablissement);
            return null;
        }
        if (!etablissement.voies || etablissement.voies.length === 0) {
            console.warn('[DatabaseService] ❌ Établissement refusé (aucune voie fournie):', etablissement);
            return null;
        }

        // Initialiser le champ nom pour affichage dans l'UI,
        // en fonction de la voie (priorité ONISEP pour scolaire, CARIF pour apprentissage)
        if (etablissement.voies.includes('scolaire')) {
            etablissement.nom = etablissement.nomOnisep;
        } else {
            etablissement.nom = etablissement.nomCarif;
        }

        // Test d'unicité : UAI+nom pour Onisep, SIRET+nom pour Carif
        const uniqueKey = this.#buildEtabUniquenessKey(etablissement);
        if (uniqueKey && this.#etabUniquenessIndex.has(uniqueKey)) {
            const existingId = this.#etabUniquenessIndex.get(uniqueKey);
            console.info(`[DatabaseService] ℹ️ Doublon établissement détecté (clé: ${uniqueKey}) → retourne ${existingId}`);
            return existingId;
        }

        // Générer _id (numérique auto-incrémenté)
        if (!etablissement._id) {
            etablissement._id = `etab_${this.#nextEtabId++}`;
        }

        this.#storage.etablissements[etablissement._id] = etablissement;

        // Mettre à jour l'index d'unicité
        if (uniqueKey) {
            this.#etabUniquenessIndex.set(uniqueKey, etablissement._id);
        }

        return etablissement._id;
    }

    /**
     * Recherche un _id interne par la clé d'unicité (UAI+nom).
     * Ne crée rien — retourne null si l'établissement n'est pas en base.
     * Utilisé par les contrôleurs pour résoudre UAI+nom → _id.
     * 
     * @param {string} uai  - Code UAI (obligatoire)
     * @param {string} nom  - Nom de la structure (obligatoire)
     * @returns {string|null} _id interne ou null si non trouvé
     */
    getEtabIdByUaiNom(uai, nom) {
        if (!uai || !nom) return null;
        const nomNorm = this.#normalizeNom(nom);
        const uniqueKey = `${String(uai).trim()}||${nomNorm}`;
        return this.#etabUniquenessIndex.get(uniqueKey) || null;
    }

    /**
     * @deprecated v0.59 — Sera supprimée en v0.60.
     * Utiliser insertEtablissement() + getEtabIdByUaiNom() à la place.
     * Ce wrapper maintient la compatibilité le temps de la migration des contrôleurs.
     *
     * Réserve ou retrouve un _id pour un couple (uai, nom).
     * @param {string} uai  - Code UAI (obligatoire)
     * @param {string} nom  - Nom de la structure (obligatoire)
     * @returns {string|null} _id interne ou null si uai/nom manquant
     */
    getOrCreateEtablissementId(uai, nom) {
        console.warn('[DatabaseService] ⚠️ DEPRECATED: getOrCreateEtablissementId() → utiliser insertEtablissement() + getEtabIdByUaiNom()');
        if (!uai || !nom) return null;

        // Déjà connu → retourner l'_id existant
        const existingId = this.getEtabIdByUaiNom(uai, nom);
        if (existingId) return existingId;

        // Nouveau → créer un slot minimal via insertEtablissement
        const newId = `etab_${this.#nextEtabId++}`;
        const etabMinimal = {
            _id: newId,
            uai: String(uai).trim(),
            nom: nom.trim(),
            nomOnisep: nom.trim(),
            voies: ['scolaire']
        };
        this.#storage.etablissements[newId] = etabMinimal;
        // Indexer
        const nomNorm = this.#normalizeNom(nom);
        const uniqueKey = `${String(uai).trim()}||${nomNorm}`;
        this.#etabUniquenessIndex.set(uniqueKey, newId);
        return newId;
    }
    
    /**
     * Met à jour un établissement par son _id interne.
     * Enrichissement non-destructif : ne remplace que les champs null/undefined/vides
     * dans l'existant, sauf pour les champs explicitement passés dans `options.overwrite`.
     * 
     * Pour les voies : ajoute les nouvelles voies sans retirer les existantes (union).
     * 
     * @param {string} id - _id interne (etab_1, etab_2, …)
     * @param {Object} updates - Champs à mettre à jour
     * @param {Object} [options] - Options d'update
     * @param {boolean} [options.overwrite=false] - Si true, écrase tous les champs (y compris non-null)
     * @returns {boolean} true si l'établissement a été trouvé et mis à jour
     */
    updateEtablissement(id, updates, options = {}) {
        const existing = this.#storage.etablissements[id];
        if (!existing) {
            console.warn(`[DatabaseService] ⚠️ updateEtablissement: _id ${id} non trouvé`);
            return false;
        }

        for (const [key, val] of Object.entries(updates)) {
            if (key === '_id') continue; // Ne jamais écraser l'_id

            if (key === 'voies') {
                // Voies : fusion (union) sans doublons
                if (Array.isArray(val) && val.length > 0) {
                    if (!existing.voies) existing.voies = [];
                    const merged = new Set([...existing.voies, ...val]);
                    existing.voies = [...merged];
                }
            } else if (key === 'commune') {
                // v0.60 : pour les communes, toujours garder la version avec le plus d'accents
                // Ex: "Cesson-Sévigné" (ONISEP) vs "Cesson-Sevigne" (CARIF-OREF)
                const prefer = typeof preferAccentedCommune === 'function'
                    ? preferAccentedCommune : (typeof window !== 'undefined' && window.preferAccentedCommune);
                if (prefer) {
                    existing.commune = prefer(existing.commune, val);
                } else {
                    // Fallback : comportement par défaut (enrichissement ou overwrite)
                    if (options.overwrite || !existing.commune) {
                        existing.commune = val;
                    }
                }
            } else if (options.overwrite) {
                // Mode overwrite : écraser systématiquement
                existing[key] = val;
            } else {
                // Mode enrichissement : ne pas écraser un champ déjà renseigné
                if (existing[key] === undefined || existing[key] === null || existing[key] === '') {
                    existing[key] = val;
                }
            }
        }

        // Recalculer le nom d'affichage si les noms sources ont changé
        if (updates.nomOnisep || updates.nomCarif) {
            if (existing.voies?.includes('scolaire')) {
                existing.nom = existing.nomOnisep || existing.nomCarif;
            } else {
                existing.nom = existing.nomCarif || existing.nomOnisep;
            }
        }

        return true;
    }

    /**
     * Récupère un établissement par son _id interne.
     * @param {string} id
     */
    async getEtablissement(id) {
        return this.#storage.etablissements[id] || null;
    }

    /**
     * Récupère un établissement par son UAI et son nom (unicité garantie).
     * La combinaison UAI+nom est la clé d'unicité depuis v0.58.
     * Si le nom n'est pas disponible au point d'appel, utiliser getEtablissement(_id)
     * avec l'identifiant interne, ou getEtablissementsByUaiSync(uai) pour obtenir
     * tous les établissements partageant un même UAI.
     * @param {string} uai - Code UAI de l'établissement
     * @param {string} nom - Nom de l'établissement (obligatoire pour garantir l'unicité)
     * @returns {Object|null}
     */
    getEtablissementByUaiSync(uai, nom) {
        if (!uai || !nom) return null;
        const nomLower = nom.trim().toLowerCase();
        return Object.values(this.#storage.etablissements).find(e =>
            e.uai === uai &&
            (e.nom || '').trim().toLowerCase() === nomLower
        ) || null;
    }

    /**
     * Récupère TOUS les établissements partageant un même UAI.
     * Nécessaire depuis v0.58 car un UAI peut correspondre à plusieurs structures
     * (ex: "Lycée Victor et Hélène Basch" et "Micro-lycée Victor et Hélène Basch" — même UAI 0352009U).
     * @param {string} uai
     * @returns {Object[]}
     */
    getEtablissementsByUaiSync(uai) {
        if (!uai) return [];
        return Object.values(this.#storage.etablissements).filter(e => e.uai === uai);
    }

        /**
         * Récupère un établissement par son code UAI (version asynchrone).
         * @param {string} uai - Code UAI
         * @param {string} nom - Nom de l'établissement (obligatoire)
         * @returns {Promise<Object|null>}
         */
async getEtablissementByUai(uai, nom) {
        return this.getEtablissementByUaiSync(uai, nom);
    }
    
        /**
         * Retourne tous les établissements stockés.
         * @returns {Promise<Object[]>}
         */
async getAllEtablissements() {
        return Object.values(this.#storage.etablissements);
    }
    
    // =====================================
    // DIPLÔMES
    // =====================================
    
        /**
         * Insère ou met à jour un diplôme voie scolaire (clé : libellé).
         * @param {Object} diplome - Doit contenir `libelle`
         * @returns {Promise<string|null>} Libellé, ou null si absent
         */
async insertDiplome(diplome) {
        if (!diplome.libelle) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer diplôme sans libellé:', diplome);
            return null;
        }
        if (this.#storage.diplomes[diplome.libelle]) {
            console.info(`[DatabaseService] ℹ️ Diplôme existant mis à jour: "${diplome.libelle}"`);
        }
        this.#storage.diplomes[diplome.libelle] = diplome;
        return diplome.libelle;
    }
    
        /**
         * Met à jour les champs d'un diplôme scolaire.
         * @param {string} libelle - Clé du diplôme
         * @param {Object} updates
         * @returns {Promise<void>}
         */
async updateDiplome(libelle, updates) {
        if (this.#storage.diplomes[libelle]) {
            Object.assign(this.#storage.diplomes[libelle], updates);
        }
        else {
            console.warn(`[DatabaseService] ⚠️ Impossible de mettre à jour diplôme: libellé ${libelle} non trouvé`);
        }
    }

    /**
     * Insère une relation diplôme↔établissement.
     * Si relation.id est absent, génère un _id automatique.
     * Stocke aussi etabId (_id interne de l'établissement) si fourni.
     */
    async insertDiplomeParEtablissement(relation) {
        if (!relation.id) {
            relation.id = `rel_dip_${_genId()}`;
            console.warn(`[DatabaseService] ⚠️ Relation diplôme-établissement sans ID API → ID généré: ${relation.id}`);
        }
        if (this.#storage.diplomes_par_etablissement[relation.id] && !relation.etabId) {
            console.info(`[DatabaseService] ℹ️ Relation diplôme-étab existante: ${relation.id}`);
        }
        this.#storage.diplomes_par_etablissement[relation.id] = relation;
        return relation.id;
    }
    
        /**
         * Récupère un diplôme scolaire par son libellé.
         * @param {string} libelle
         * @returns {Promise<Object|null>}
         */
async getDiplome(libelle) {
        return this.#storage.diplomes[libelle] || null;
    }
    
        /**
         * Retourne tous les diplômes voie scolaire.
         * @returns {Promise<Object[]>}
         */
async getAllDiplomes() {
        return Object.values(this.#storage.diplomes);
    }

        /**
         * Retourne toutes les relations diplôme↔établissement (scolaire).
         * @returns {Promise<Object[]>}
         */
async getAllDiplomesParEtablissement() {
        return Object.values(this.#storage.diplomes_par_etablissement);
    }

    // =====================================
    // DISPOSITIFS
    // =====================================
    
        /**
         * Insère ou met à jour un dispositif pédagogique (clé : libellé).
         * @param {Object} dispositif - Doit contenir `libelle`
         * @returns {Promise<string|null>}
         */
async insertDispositif(dispositif) {
        if (!dispositif.libelle) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer dispositif sans libellé:', dispositif);
            return null;
        }
        if (this.#storage.dispositifs[dispositif.libelle]) {
            console.info(`[DatabaseService] ℹ️ Dispositif existant mis à jour: "${dispositif.libelle}"`);
        }
        this.#storage.dispositifs[dispositif.libelle] = dispositif;
        return dispositif.libelle;
    }
    
        /**
         * Met à jour les champs d'un dispositif.
         * @param {string} libelle
         * @param {Object} updates
         * @returns {Promise<void>}
         */
async updateDispositif(libelle, updates) {
        if (this.#storage.dispositifs[libelle]) {
            Object.assign(this.#storage.dispositifs[libelle], updates);
        }
        else {
            console.warn(`[DatabaseService] ⚠️ Impossible de mettre à jour dispositif: libellé ${libelle} non trouvé`);
        }
    }
    
        /**
         * Insère une relation dispositif↔établissement.
         * Génère un id automatique si `relation.id` est absent.
         * @param {Object} relation
         * @returns {Promise<string>} Id de la relation
         */
async insertDispositifParEtablissement(relation) {
        if (!relation.id) {
            relation.id = `rel_disp_${_genId()}`;
            console.warn(`[DatabaseService] ⚠️ Relation dispositif-établissement sans ID API → ID généré: ${relation.id}`);
        }
        this.#storage.dispositifs_par_etablissement[relation.id] = relation;
        return relation.id;
    }
    
        /**
         * Récupère un dispositif par son libellé.
         * @param {string} libelle
         * @returns {Promise<Object|null>}
         */
async getDispositif(libelle) {
        return this.#storage.dispositifs[libelle] || null;
    }
    
        /**
         * Retourne tous les dispositifs pédagogiques.
         * @returns {Promise<Object[]>}
         */
async getAllDispositifs() {
        return Object.values(this.#storage.dispositifs);
    }

        /**
         * Retourne toutes les relations dispositif↔établissement.
         * @returns {Promise<Object[]>}
         */
async getAllDispositifsParEtablissement() {
        return Object.values(this.#storage.dispositifs_par_etablissement);
    }
    
    // =====================================
    // OPTIONS 2NDE GT
    // =====================================
    
        /**
         * Insère ou met à jour une option de 2nde GT (clé : libellé).
         * @param {Object} option - Doit contenir `libelle`
         * @returns {Promise<string|null>}
         */
async insertOption2ndeGT(option) {
        if (!option.libelle) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer option 2nde GT sans libellé:', option);
            return null;
        }
        if (this.#storage.options_2nde_gt[option.libelle]) {
            console.info(`[DatabaseService] ℹ️ Option 2nde GT existante mise à jour: "${option.libelle}"`);
        }
        this.#storage.options_2nde_gt[option.libelle] = option;
        return option.libelle;
    }
    
        /**
         * Insère une relation option 2nde GT↔établissement.
         * Génère un id automatique si `relation.id` est absent.
         * @param {Object} relation
         * @returns {Promise<string>}
         */
async insertOption2ndeGTParEtablissement(relation) {
        if (!relation.id) {
            relation.id = `rel_opt_${_genId()}`;
            console.warn(`[DatabaseService] ⚠️ Relation option 2nde GT-établissement sans ID API → ID généré: ${relation.id}`);
        }
        this.#storage.options_2nde_gt_par_etablissement[relation.id] = relation;
        return relation.id;
    }

        /**
         * Récupère une option de 2nde GT par son libellé.
         * @param {string} libelle
         * @returns {Promise<Object|null>}
         */
async getOption2ndeGT(libelle) {
        return this.#storage.options_2nde_gt[libelle] || null;
    }
    
        /**
         * Retourne toutes les options de 2nde GT.
         * @returns {Promise<Object[]>}
         */
async getAllOptions2ndeGT() {
        return Object.values(this.#storage.options_2nde_gt);
    }
    
        /**
         * Retourne toutes les relations option 2nde GT↔établissement.
         * @returns {Promise<Object[]>}
         */
async getAllOptions2ndeGTParEtablissement() {
        return Object.values(this.#storage.options_2nde_gt_par_etablissement);
    }

        /**
         * Retourne toutes les options 2nde GT avec le nombre d'établissements proposants.
         * @returns {Promise<Array<{libelle:string, nbEtablissements:number}>>}
         */
async getAllOptions2ndeGTAvecComptage() {
        const options = await this.getAllOptions2ndeGT();
        const relations = await this.getAllOptions2ndeGTParEtablissement();

        // Compter les établissements distincts (par etabId) pour chaque option
        const compteur = new Map(); // libelle → Set<etabId>
        relations.forEach(rel => {
            if (rel.libelle && rel.etabId) {
                if (!compteur.has(rel.libelle)) compteur.set(rel.libelle, new Set());
                compteur.get(rel.libelle).add(rel.etabId);
            }
        });

        return options.map(option => ({
            libelle: option.libelle,
            nbEtablissements: compteur.get(option.libelle)?.size || 0
        }));
    }

        /**
         * Retourne la liste des zones géographiques des établissements.
         * @param {'departement'|'academie'} type
         * @returns {Promise<string[]>} Valeurs triées
         */
async getAllZones(type) {
        const etablissements = await this.getAllEtablissements();
        const zones = new Set();
        etablissements.forEach(etab => {
            const zone = type === 'departement' ? etab.departement : etab.academie;
            if (zone) zones.add(zone);
        });
        return Array.from(zones).sort();
    }

        /**
         * Retourne les libellés d'options 2nde GT disponibles dans une zone.
         * @param {'departement'|'academie'} perimetre
         * @param {string} zone
         * @returns {Promise<string[]>}
         */
async getOptionsDisponiblesParPerimetre(perimetre, zone) {
        const relations = await this.getAllOptions2ndeGTParEtablissement();
        const etablissements = await this.getAllEtablissements();

        // Indexer les établissements par _id
        const etabIndex = {};
        etablissements.forEach(etab => { etabIndex[etab._id] = etab; });

        const optionsSet = new Set();
        relations.forEach(relation => {
            // Jointure par etabId (_id interne)
            const etab = relation.etabId ? etabIndex[relation.etabId] : null;
            if (!etab) return;
            const etabZone = perimetre === 'departement' ? etab.departement : etab.academie;
            if (etabZone === zone && relation.libelle) {
                optionsSet.add(relation.libelle);
            }
        });
        return Array.from(optionsSet).sort();
    }

        /**
         * Retourne une option enrichie avec la liste des établissements proposants.
         * @param {string} libelle
         * @returns {Promise<{option:Object, etablissements:Object[]}|null>}
         */
async getOption2ndeGTEnrichie(libelle) {
        const option = await this.getOption2ndeGT(libelle);
        if (!option) return null;

        const relations = Object.values(this.#storage.options_2nde_gt_par_etablissement)
            .filter(rel => rel.libelle === libelle);

        console.log(`[getOption2ndeGTEnrichie] "${libelle}" : ${relations.length} relation(s) trouvée(s)`);
        for (const rel of relations) {
            console.log(`[getOption2ndeGTEnrichie]   → rel.id=${rel.id}, rel.etabId=${rel.etabId}`);
        }

        // Jointure par _id interne — même pattern que getDiplomeEnrichi/getDispositifEnrichi
        const etabIds = new Set(relations.map(rel => rel.etabId).filter(Boolean));

        // DIAGNOSTIC COMPLET : dumper tous les _id et noms du storage
        const allEtabs = Object.entries(this.#storage.etablissements);
        console.log(`[getOption2ndeGTEnrichie] 📋 storage.etablissements: ${allEtabs.length} entrée(s)`);
        for (const [key, e] of allEtabs) {
            console.log(`[getOption2ndeGTEnrichie]   clé="${key}" _id="${e._id}" nom="${e.nom}" uai="${e.uai}"`);
        }

        const etablissements = Object.values(this.#storage.etablissements)
            .filter(e => etabIds.has(e._id))
            .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'));

        if (etablissements.length !== etabIds.size) {
            const missing = [...etabIds].filter(id => !this.#storage.etablissements[id]);
            console.warn(`[getOption2ndeGTEnrichie] ⚠️ ${etabIds.size} etabId mais ${etablissements.length} trouvés. Manquants:`, missing);
            // Chercher si un étab a cet _id dans sa valeur mais sous une autre clé
            for (const mid of missing) {
                const found = allEtabs.find(([k, e]) => e._id === mid);
                if (found) {
                    console.warn(`[getOption2ndeGTEnrichie] 🔍 ${mid} trouvé sous clé "${found[0]}" (≠ "${mid}") — BUG clé/valeur !`);
                } else {
                    console.warn(`[getOption2ndeGTEnrichie] 🔍 ${mid} absent du storage (ni comme clé ni comme _id)`);
                }
            }
        }

        return { option, etablissements };
    }

    // =====================================
    // SPÉCIALITÉS 1ÈRE G
    // =====================================
    
        /**
         * Insère ou met à jour une spécialité de 1ère Générale (clé : libellé).
         * @param {Object} specialite - Doit contenir `libelle`
         * @returns {Promise<string|null>}
         */
async insertSpecialite1ereG(specialite) {
        if (!specialite.libelle) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer spécialité 1ère G sans libellé:', specialite);
            return null;
        }
        if (this.#storage.specialites_1ereG[specialite.libelle]) {
            console.info(`[DatabaseService] ℹ️ Spécialité 1ère G existante mise à jour: "${specialite.libelle}"`);
        }
        this.#storage.specialites_1ereG[specialite.libelle] = specialite;
        return specialite.libelle;
    }
    
        /**
         * Insère une relation spécialité 1ère G↔établissement.
         * Génère un id automatique si absent.
         * @param {Object} relation
         * @returns {Promise<string>}
         */
async insertSpecialite1ereGParEtablissement(relation) {
        if (!relation.id) {
            relation.id = `rel_spe_${_genId()}`;
            console.warn(`[DatabaseService] ⚠️ Relation spécialité 1ère G-établissement sans ID API → ID généré: ${relation.id}`);
        }
        this.#storage.specialites_1ereG_par_etablissement[relation.id] = relation;
        return relation.id;
    }

        /**
         * Récupère une spécialité de 1ère G par son libellé.
         * @param {string} libelle
         * @returns {Promise<Object|null>}
         */
async getSpecialite1ereG(libelle) {
        return this.#storage.specialites_1ereG[libelle] || null;
    }
    
        /**
         * Retourne toutes les spécialités de 1ère Générale.
         * @returns {Promise<Object[]>}
         */
async getAllSpecialites1ereG() {
        return Object.values(this.#storage.specialites_1ereG);
    }
    
    // =====================================
    // LANGUES
    // =====================================
    
        /**
         * Insère une langue enseignée (clé composite : uai_langue_enseignement).
         * @param {Object} langue - Doit contenir `uai`, `langue`, `enseignement`
         * @returns {Promise<string>} Clé composite
         */
async insertLangue(langue) {
        const key = `${langue.uai}_${langue.langue}_${langue.enseignement}`;
        if (!this.#storage.langues[key]) {
            langue.id = Object.keys(this.#storage.langues).length + 1;
            this.#storage.langues[key] = langue;
            this.#saveToLocalStorage();
        }
        return key;
    }

        /**
         * Retourne toutes les langues enseignées.
         * @returns {Promise<Object[]>}
         */
async getAllLangues() {
        return Object.values(this.#storage.langues);
    }
    
    // =====================================
    // STATISTIQUES
    // =====================================
    
        /**
         * Retourne les statistiques de remplissage de la base (nb d'enregistrements par table).
         * @returns {Promise<Object>}
         */
async getStats() {
        return {
            etablissements: Object.keys(this.#storage.etablissements).length,
            diplomes: Object.keys(this.#storage.diplomes).length,
            diplomes_par_etablissement: Object.keys(this.#storage.diplomes_par_etablissement).length,
            dispositifs: Object.keys(this.#storage.dispositifs).length,
            dispositifs_par_etablissement: Object.keys(this.#storage.dispositifs_par_etablissement).length,
            options_2nde_gt: Object.keys(this.#storage.options_2nde_gt).length,
            options_2nde_gt_par_etablissement: Object.keys(this.#storage.options_2nde_gt_par_etablissement).length,
            specialites_1ereG: Object.keys(this.#storage.specialites_1ereG).length,
            specialites_1ereG_par_etablissement: Object.keys(this.#storage.specialites_1ereG_par_etablissement).length,
            diplomes_apprentissage: Object.keys(this.#storage.diplomes_apprentissage).length,
            diplomes_apprentissage_par_etablissement: Object.keys(this.#storage.diplomes_apprentissage_par_etablissement).length,
            langues: Object.keys(this.#storage.langues).length
        };
    }

    // =====================================
    // DONNÉES ENRICHIES (jointures)
    // =====================================

    /**
     * Récupère un établissement enrichi (avec tous ses diplômes/dispositifs/options)
     * @param {string} id - _id interne de l'établissement
     */
    async getEtablissementEnrichi(id) {
        const etablissement = await this.getEtablissement(id);
        if (!etablissement) return null;
        
        const diplomes               = await this.getDiplomesParEtablissement(id);
        const diplomes_apprentissage = await this.getDiplomesApprentissageParEtablissement(id);
        const dispositifs            = await this.getDispositifsParEtablissement(id);
        const options2ndeGT          = await this.getOptions2ndeGTParEtablissement(id);
        const specialites1ereG       = await this.getSpecialites1ereGParEtablissement(id);
        
        return {
            etablissement,
            diplomes,
            diplomes_apprentissage,
            dispositifs,
            options2ndeGT,
            specialites1ereG
        };
    }

    /**
     * Jointure relations → diplômes pour un établissement (par _id).
     * Les relations portent le champ uai ; on les filtre par etabId OU par uai.
     */
    async getDiplomesParEtablissement(etabId) {
        return this.getDiplomesParEtablissementSync(etabId);
    }
    
        /**
         * Retourne les diplômes scolaires d'un établissement (jointure synchrone).
         * Filtre par etabId (_id interne) uniquement.
         * @param {string} etabId - _id interne
         * @returns {Object[]}
         */
getDiplomesParEtablissementSync(etabId) {
        const etab = this.#storage.etablissements[etabId];
        if (!etab) return [];

        const libellesSet = new Set(
            Object.values(this.#storage.diplomes_par_etablissement)
                .filter(rel => rel.etabId === etabId)
                .map(rel => rel.libelle)
        );

        const diplomes = Object.values(this.#storage.diplomes).filter(d => libellesSet.has(d.libelle));
        for (const diplome of diplomes) {
            const relation = Object.values(this.#storage.diplomes_par_etablissement)
                .find(rel => rel.etabId === etabId && rel.libelle === diplome.libelle);
            if (relation) Object.assign(diplome, relation);
        }
        return diplomes;
    }
    
        /**
         * Retourne les dispositifs pédagogiques d'un établissement (jointure).
         * @param {string} etabId - _id interne
         * @returns {Promise<Object[]>}
         */
async getDispositifsParEtablissement(etabId) {
        const etab = this.#storage.etablissements[etabId];
        if (!etab) return [];

        const libellesSet = new Set(
            Object.values(this.#storage.dispositifs_par_etablissement)
                .filter(rel => rel.etabId === etabId)
                .map(rel => rel.libelle)
        );

        const dispositifs = Object.values(this.#storage.dispositifs).filter(d => libellesSet.has(d.libelle));
        for (const dispositif of dispositifs) {
            const relation = Object.values(this.#storage.dispositifs_par_etablissement)
                .find(rel => rel.etabId === etabId && rel.libelle === dispositif.libelle);
            if (relation) Object.assign(dispositif, relation);
        }
        return dispositifs;
    }

        /**
         * Retourne les options de 2nde GT d'un établissement (jointure).
         * @param {string} etabId - _id interne
         * @returns {Promise<Object[]>}
         */
async getOptions2ndeGTParEtablissement(etabId) {
        const etab = this.#storage.etablissements[etabId];
        if (!etab) return [];

        const libellesSet = new Set(
            Object.values(this.#storage.options_2nde_gt_par_etablissement)
                .filter(rel => rel.etabId === etabId)
                .map(rel => rel.libelle)
        );

        const options = Object.values(this.#storage.options_2nde_gt).filter(o => libellesSet.has(o.libelle));
        for (const option of options) {
            const relation = Object.values(this.#storage.options_2nde_gt_par_etablissement)
                .find(rel => rel.etabId === etabId && rel.libelle === option.libelle);
            if (relation) Object.assign(option, relation);
        }
        return options;
    }

        /**
         * Retourne les spécialités de 1ère G d'un établissement (jointure).
         * @param {string} etabId - _id interne
         * @returns {Promise<Object[]>}
         */
async getSpecialites1ereGParEtablissement(etabId) {
        const etab = this.#storage.etablissements[etabId];
        if (!etab) return [];

        const libellesSet = new Set(
            Object.values(this.#storage.specialites_1ereG_par_etablissement)
                .filter(rel => rel.etabId === etabId)
                .map(rel => rel.libelle)
        );

        const specialites = Object.values(this.#storage.specialites_1ereG).filter(s => libellesSet.has(s.libelle));
        for (const specialite of specialites) {
            const relation = Object.values(this.#storage.specialites_1ereG_par_etablissement)
                .find(rel => rel.etabId === etabId && rel.libelle === specialite.libelle);
            if (relation) Object.assign(specialite, relation);
        }
        return specialites;
    }

        /**
         * Retourne les langues enseignées dans un établissement.
         * Jointure par UAI (les langues sont liées au site physique, pas à la structure).
         * Tous les établissements partageant un même UAI partagent les mêmes langues.
         * @param {string} etabId - _id interne
         * @returns {Promise<Object[]>}
         */
async getLanguesParEtablissement(etabId) {
        const etab = this.#storage.etablissements[etabId];
        if (!etab || !etab.uai) return [];
        // Jointure par UAI : les langues sont liées au site physique (UAI),
        // pas à la structure administrative — c'est correct sémantiquement.
        return Object.values(this.#storage.langues).filter(l => l.uai === etab.uai);
    }

    // =====================================
    // DIPLÔMES ENRICHIS (jointure établissements)
    // =====================================

        /**
         * Retourne un diplôme scolaire enrichi avec la liste de ses établissements.
         * @param {string} libelle
         * @returns {Promise<{diplome:Object, etablissements:Object[]}|null>}
         */
async getDiplomeEnrichi(libelle) {
        const diplome = await this.getDiplome(libelle);
        if (!diplome) return null;

        const relations = Object.values(this.#storage.diplomes_par_etablissement)
            .filter(rel => rel.libelle === libelle);

        // Jointure par _id interne uniquement
        const etabIds = new Set(relations.map(rel => rel.etabId).filter(Boolean));

        const etablissements = Object.values(this.#storage.etablissements)
            .filter(e => etabIds.has(e._id))
            .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'));

        // Infos de la relation pour chaque étab (page web, durée, etc.)
        const etabsAvecRelation = etablissements.map(etab => {
            const rel = relations.find(r => r.etabId === etab._id);
            return { ...etab, ...(rel || {}) };
        });

        return { diplome, etablissements: etabsAvecRelation, parcours: this.#lookupParcoursBacPro(libelle) };
    }

        /**
         * Retourne un dispositif enrichi avec la liste de ses établissements.
         * @param {string} libelle
         * @returns {Promise<{dispositif:Object, etablissements:Object[]}|null>}
         */
async getDispositifEnrichi(libelle) {
        const dispositif = await this.getDispositif(libelle);
        if (!dispositif) return null;

        const relations = Object.values(this.#storage.dispositifs_par_etablissement)
            .filter(rel => rel.libelle === libelle);

        // Jointure par _id interne uniquement
        const etabIds = new Set(relations.map(rel => rel.etabId).filter(Boolean));

        const etablissements = Object.values(this.#storage.etablissements)
            .filter(e => etabIds.has(e._id))
            .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'));

        const etabsAvecRelation = etablissements.map(etab => {
            const rel = relations.find(r => r.etabId === etab._id);
            return { ...etab, ...(rel || {}) };
        });

        return { dispositif, etablissements: etabsAvecRelation };
    }

    /**
     * Recherche le parcours de formation (famille de métiers) pour un diplôme bac pro.
     * Utilise la variable globale PARCOURS_BAC_PRO (data/parcours_bac_pro.js).
     * @param {string} libelle - Libellé du diplôme (ex: "Bac pro Aéronautique option avionique")
     * @returns {Object|null} { famille, seconde, premiere, terminale } ou null
     * @private
     */
    #lookupParcoursBacPro(libelle) {
        if (typeof PARCOURS_BAC_PRO === 'undefined' || !libelle) return null;

        const search = libelle.toLowerCase().trim();

        for (const famille of PARCOURS_BAC_PRO) {
            for (const p of famille.parcours) {
                if (p.diplome && p.diplome.toLowerCase().trim() === search) {
                    return {
                        famille:   famille.famille,
                        seconde:   famille.seconde,
                        premiere:  p.premiere  || null,
                        terminale: p.terminale || null
                    };
                }
            }
        }

        // Recherche plus souple : le libellé contient le nom du diplôme ou l'inverse
        for (const famille of PARCOURS_BAC_PRO) {
            for (const p of famille.parcours) {
                const diplomeLow = (p.diplome || '').toLowerCase().trim();
                if (diplomeLow && (search.includes(diplomeLow) || diplomeLow.includes(search))) {
                    return {
                        famille:   famille.famille,
                        seconde:   famille.seconde,
                        premiere:  p.premiere  || null,
                        terminale: p.terminale || null
                    };
                }
            }
        }

        return null;
    }

    // =====================================
    // DIPLÔMES APPRENTISSAGE
    // =====================================
    
        /**
         * Insère ou met à jour un diplôme voie apprentissage (clé : id CARIF-OREF).
         * @param {Object} diplome - Doit contenir `id`
         * @returns {Promise<string|null>}
         */
async insertDiplomeApprentissage(diplome) {
        if (!diplome.id) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer diplôme apprentissage sans ID:', diplome);
            return null;
        }
        if (this.#storage.diplomes_apprentissage[diplome.id]) {
            console.info(`[DatabaseService] ℹ️ Diplôme apprentissage existant mis à jour: "${diplome.id}" (${diplome.libelle || '?'})`);
        }
        this.#storage.diplomes_apprentissage[diplome.id] = diplome;
        return diplome.id;
    }

        /**
         * Récupère un diplôme apprentissage par son identifiant.
         * @param {string} id
         * @returns {Promise<Object|null>}
         */
async getDiplomeApprentissage(id) {
        return this.#storage.diplomes_apprentissage[id] || null;
    }

        /**
         * Retourne un diplôme apprentissage enrichi avec la liste de ses établissements.
         * @param {string} id
         * @returns {Promise<{diplome:Object, etablissements:Object[]}|null>}
         */
async getDiplomeApprentissageEnrichi(id) {
        const diplome = await this.getDiplomeApprentissage(id);
        if (!diplome) return null;

        // Jointure par _id interne uniquement
        const relations = Object.values(this.#storage.diplomes_apprentissage_par_etablissement)
            .filter(rel => rel.diplomId === id);

        const etabIds = new Set(relations.map(rel => rel.etabId).filter(Boolean));

        const etablissements = Object.values(this.#storage.etablissements)
            .filter(e => etabIds.has(e._id))
            .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'));

        // Retourner les relations pour accéder à dureeAnnees, courriel, etc.
        return { diplome, etablissements, relations };
    }

        /**
         * Retourne tous les diplômes voie apprentissage.
         * @returns {Promise<Object[]>}
         */
async getAllDiplomesApprentissage() {
        return Object.values(this.#storage.diplomes_apprentissage);
    }

        /**
         * Vérifie si un diplôme ONISEP est également disponible en apprentissage.
         * @param {string} libelleOnisep
         * @returns {Promise<boolean>}
         */
async estAussiEnApprentissage(libelleOnisep) {
        if (!libelleOnisep) return false;
        const libelleNorm = libelleOnisep.toLowerCase().trim();
        return Object.values(this.#storage.diplomes_apprentissage).some(d => {
            const intitule = (d.onisepIntitule || '').toLowerCase().trim();
            return intitule && intitule === libelleNorm;
        });
    }

        /**
         * Vérifie si un diplôme apprentissage existe aussi en voie scolaire.
         * @param {string} onisepIntitule
         * @returns {Promise<boolean>}
         */
async estAussiEnScolaire(onisepIntitule) {
        if (!onisepIntitule) return false;
        const libelleNorm = onisepIntitule.toLowerCase().trim();
        return Object.values(this.#storage.diplomes).some(d => {
            const libelle = (d.libelle || '').toLowerCase().trim();
            return libelle && libelle === libelleNorm;
        });
    }

    /**
     * Insère une relation diplôme-apprentissage↔établissement.
     * Si relation.id est absent, génère un _id automatique.
     */
    async insertDiplomeApprentissageParEtablissement(relation) {
        if (!relation.id) {
            relation.id = `rel_app_${_genId()}`;
            console.warn(`[DatabaseService] ⚠️ Relation diplôme-apprentissage sans ID API → ID généré: ${relation.id}`);
        }
        this.#storage.diplomes_apprentissage_par_etablissement[relation.id] = relation;
        return relation.id;
    }

        /**
         * Retourne toutes les relations diplôme apprentissage↔établissement.
         * @returns {Promise<Object[]>}
         */
async getAllDiplomesApprentissageParEtablissement() {
        return Object.values(this.#storage.diplomes_apprentissage_par_etablissement);
    }

        /**
         * Retourne les diplômes apprentissage d'un établissement (async).
         * Filtre par etabId OU uai (compatibilité).
         * @param {string} etabId - _id interne
         * @returns {Promise<Object[]>}
         */
async getDiplomesApprentissageParEtablissement(etabId) {
        const relations = Object.values(this.#storage.diplomes_apprentissage_par_etablissement)
            .filter(rel => rel.etabId === etabId);
        const ids = new Set(relations.map(r => r.diplomId));
        return Object.values(this.#storage.diplomes_apprentissage).filter(d => ids.has(d.id));
    }

        /**
         * Retourne les diplômes apprentissage d'un établissement (synchrone, pour la carte).
         * @param {string} etabId - _id interne
         * @returns {Object[]}
         */
getDiplomesApprentissageParEtablissementSync(etabId) {
        const relations = Object.values(this.#storage.diplomes_apprentissage_par_etablissement)
            .filter(rel => rel.etabId === etabId);
        const ids = new Set(relations.map(r => r.diplomId));
        const diplomes = Object.values(this.#storage.diplomes_apprentissage).filter(d => ids.has(d.id));
        // Enrichir chaque diplôme avec les données de la relation (dureeAnnees, courriel, etc.)
        for (const diplome of diplomes) {
            const relation = relations.find(r => r.diplomId === diplome.id);
            if (relation) {
                if (relation.dureeAnnees && !diplome._dureeAnnees) diplome._dureeAnnees = relation.dureeAnnees;
            }
        }
        return diplomes;
    }

    // =====================================
    // AUTRES FORMATIONS NIVEAU 5+ (ONISEP + CARIF-OREF)
    // =====================================

    /**
     * Insère une liste de formations niveau 5+ pour un établissement (par _id interne).
     * Chaque formation est un objet léger { libelle, niveau, typeDiplome }.
     * @param {string} etabId - _id interne de l'établissement
     * @param {Object[]} formations - [{ libelle, niveau, typeDiplome }]
     */
    async insertAutresFormationsParEtablissement(etabId, formations) {
        if (!etabId || !formations || formations.length === 0) return;
        this.#storage.autres_formations_par_etablissement[etabId] = formations;
    }

    /**
     * Retourne les formations niveau 5+ d'un établissement.
     * @param {string} etabId - _id interne de l'établissement
     * @returns {Object[]} [{ libelle, niveau, typeDiplome }]
     */
    getAutresFormationsParEtablissement(etabId) {
        return this.#storage.autres_formations_par_etablissement[etabId] || [];
    }

    /**
     * Retourne toutes les relations diplômes-apprentissage ↔ établissements.
     * Utilisé par buildEtablissementDetailsHTML pour récupérer le courriel CARIF-OREF (v0.56).
     * @returns {Object}
     */
    _getApprentissageRelations() {
        return this.#storage.diplomes_apprentissage_par_etablissement || {};
    }

    /**
     * Supprime toutes les données "autres formations" (lors du reset apprentissage).
     */
    clearAutresFormations() {
        this.#storage.autres_formations_par_etablissement = {};
    }

    /**
     * Retire les formations 5+ issues de CARIF (source='carif') de la table
     * autres_formations_par_etablissement, tout en préservant celles issues d'Onisep
     * (source='onisep' — CPGE, BTS scolaires, etc.).
     * Supprime les clés devenues vides après purge.
     * @private
     */
    #purgeAutresFormationsCarif() {
        const table = this.#storage.autres_formations_par_etablissement;
        let nbPurged = 0;
        for (const etabId of Object.keys(table)) {
            const formations = table[etabId];
            if (!Array.isArray(formations)) {
                delete table[etabId];
                continue;
            }
            const kept = formations.filter(f => f.source !== 'carif');
            if (kept.length === 0) {
                delete table[etabId];
            } else {
                table[etabId] = kept;
            }
            nbPurged += formations.length - kept.length;
        }
        if (nbPurged > 0) {
            console.log(`[DatabaseService] 🧹 ${nbPurged} formation(s) CARIF 5+ purgées, formations Onisep préservées`);
        }
    }

    /**
     * @deprecated v0.59 — Sera supprimée en v0.60.
     * La logique de fusion doit être dans le contrôleur CARIF, pas dans le DatabaseService.
     * Ce wrapper maintient la compatibilité le temps de la migration.
     *
     * Fusionne la voie apprentissage sur un établissement existant,
     * ou insère un nouvel établissement si aucun match UAI+nom.
     * @param {Object} etabAprentissage - Données CARIF de l'établissement
     * @returns {Promise<string|null>} _id interne ou null si refusé
     */
    async fusionnerEtablissementAprentissage(etabAprentissage) {
        console.warn('[DatabaseService] ⚠️ DEPRECATED: fusionnerEtablissementAprentissage() → à déplacer dans le contrôleur CARIF');
        const uai   = etabAprentissage.uai   ? String(etabAprentissage.uai).trim()   : null;
        const siret = etabAprentissage.siret ? String(etabAprentissage.siret).trim() : null;

        if (!uai && !siret) {
            console.warn('[DatabaseService] ❌ Fusion impossible : établissement sans UAI ni SIRET');
            return null;
        }

        // Stocker le nom CARIF dans nomCarif
        if (!etabAprentissage.nomCarif) {
            etabAprentissage.nomCarif = etabAprentissage.nom || null;
        }

        // Chercher tous les existants avec cet UAI
        const existants = uai ? this.getEtablissementsByUaiSync(uai) : [];

        // Trouver le bon existant par comparaison de nom normalisé
        const nomCarifNorm = this.#normalizeNom(etabAprentissage.nomCarif || etabAprentissage.nom);
        let existant = null;

        if (existants.length > 0) {
            existant = existants.find(e => {
                const nomExistantNorm = this.#normalizeNom(e.nomOnisep || e.nomCarif || e.nom);
                return nomExistantNorm === nomCarifNorm;
            });
            if (!existant && existants.length === 1) {
                existant = existants[0];
            }
        }

        if (existant) {
            // Enrichir via updateEtablissement (non-destructif)
            const updates = {};
            for (const [key, val] of Object.entries(etabAprentissage)) {
                if (key === 'voies' || key === '_id') continue;
                updates[key] = val;
            }
            // Toujours mettre à jour nomCarif
            if (etabAprentissage.nomCarif) updates.nomCarif = etabAprentissage.nomCarif;
            // Ajouter la voie apprentissage
            updates.voies = ['apprentissage'];
            this.updateEtablissement(existant._id, updates);
            return existant._id;
        } else {
            // Nouvel établissement
            if (!etabAprentissage.voies) etabAprentissage.voies = ['apprentissage'];
            if (!etabAprentissage.nomCarif) etabAprentissage.nomCarif = etabAprentissage.nom || null;
            return await this.insertEtablissement(etabAprentissage);
        }
    }
    
    // =====================================
    // CLEAR / RESET
    // =====================================
    
        /**
         * Vide toutes les tables éducatives. Préserve les référentiels géographiques.
         * @returns {Promise<void>}
         */
async clearAllData() {
        console.log('[DatabaseService] 🗑️ Vidage de toutes les tables (référentiels géographiques préservés)');
        // Les EPCI, communes, départements et régions sont des référentiels fixes
        // chargés une fois à l'initialisation — ils ne doivent PAS être effacés
        // lors d'une nouvelle extraction éducative.
        this.#storage.etablissements = {};
        this.#storage.diplomes = {};
        this.#storage.diplomes_par_etablissement = {};
        this.#storage.dispositifs = {};
        this.#storage.dispositifs_par_etablissement = {};
        this.#storage.options_2nde_gt = {};
        this.#storage.options_2nde_gt_par_etablissement = {};
        this.#storage.specialites_1ereG = {};
        this.#storage.specialites_1ereG_par_etablissement = {};
        this.#storage.diplomes_apprentissage = {};
        this.#storage.diplomes_apprentissage_par_etablissement = {};
        this.#storage.autres_formations_par_etablissement = {};
        this.#storage.langues = {};
        this.#etabUniquenessIndex.clear();
        this.#nextEtabId = 1;
        this.#saveToLocalStorage();
    }

    /**
     * Vide uniquement les données CARIF-OREF (établissements apprentissage + diplômes apprentissage).
     * Les données ONISEP (scolaire) et les référentiels géographiques sont préservés.
     * Utile pour forcer une ré-extraction CARIF avec les nouvelles corrections.
     * @returns {Promise<void>}
     */
    async clearCARIFData() {
        console.log('[DatabaseService] 🗑️ Vidage des données CARIF-OREF (apprentissage uniquement)');
        // Retirer les établissements purement CARIF (voie apprentissage sans données ONISEP)
        for (const [id, etab] of Object.entries(this.#storage.etablissements)) {
            if (etab.voie === 'apprentissage') {
                delete this.#storage.etablissements[id];
            }
        }
        this.#storage.diplomes_apprentissage = {};
        this.#storage.diplomes_apprentissage_par_etablissement = {};
        // v0.60 fix : ne supprimer que les formations 5+ issues de CARIF (source='carif')
        this.#purgeAutresFormationsCarif();
        this.#saveToLocalStorage();
        console.log('[DatabaseService] ✅ Données CARIF-OREF vidées');
    }

        /**
         * Vide les données ONISEP et CARIF-OREF (établissements, diplômes, dispositifs, options).
         * @returns {Promise<void>}
         */
async clearOnisepData() {
        console.log('[DatabaseService] 🗑️ Vidage de toutes les données extraites d\'Onisep et CARIF-OREF');
        this.#storage.etablissements={};
        this.#storage.diplomes={};
        this.#storage.diplomes_par_etablissement={};
        this.#storage.dispositifs={};
        this.#storage.dispositifs_par_etablissement={};
        this.#storage.options_2nde_gt={};
        this.#storage.options_2nde_gt_par_etablissement={};
        this.#storage.specialites_1ereG={};
        this.#storage.specialites_1ereG_par_etablissement={};
        this.#storage.diplomes_apprentissage={};
        this.#storage.diplomes_apprentissage_par_etablissement={};
        this.#storage.autres_formations_par_etablissement={};
        this.#etabUniquenessIndex.clear();
        this.#nextEtabId = 1;
        this.#saveToLocalStorage();
    }

        /**
         * Vide les données apprentissage CARIF-OREF et retire 'apprentissage' des voies.
         * @returns {Promise<void>}
         */
async clearAprentissageData() {
        console.log('[DatabaseService] 🗑️ Vidage des données apprentissage CARIF-OREF');
        this.#storage.diplomes_apprentissage={};
        this.#storage.diplomes_apprentissage_par_etablissement={};
        // v0.60 fix : ne supprimer que les formations 5+ issues de CARIF (source='carif'),
        // préserver celles issues d'Onisep (source='onisep') — CPGE, BTS scolaires, etc.
        this.#purgeAutresFormationsCarif();
        for (const id of Object.keys(this.#storage.etablissements)) {
            const etab = this.#storage.etablissements[id];
            if (etab.voies) {
                etab.voies = etab.voies.filter(v => v !== 'apprentissage');
                // Si les voies sont vides après retrait de 'apprentissage',
                // restaurer 'scolaire' si l'établissement a des relations scolaires
                if (etab.voies.length === 0) {
                    etab.voies = ['scolaire'];
                }
            }
        }
        this.#saveToLocalStorage();
    }

    /**
     * Supprime les établissements CARIF (voie apprentissage uniquement) sans aucune relation diplôme.
     * @param {Set<string>} uaisAvecRelations - UAI ayant au moins une relation
     */
    async supprimerEtablissementsCarifSansRelation(uaisAvecRelations) {
        // 🔍 DIAGNOSTIC v0.58f — conserver jusqu'à résolution complète
        console.log(`[supprimerCarifSansRelation] AVANT: ${Object.keys(this.#storage.etablissements).length} étab(s), uaisAvecRelations: [${[...uaisAvecRelations].join(', ')}]`);
        
        // Construire l'ensemble des etabId ayant au moins une relation ONISEP (scolaire)
        const etabIdsAvecRelationsScolaires = new Set();
        for (const rel of Object.values(this.#storage.diplomes_par_etablissement || {})) {
            if (rel.etabId) etabIdsAvecRelationsScolaires.add(rel.etabId);
        }
        for (const rel of Object.values(this.#storage.options_2nde_gt_par_etablissement || {})) {
            if (rel.etabId) etabIdsAvecRelationsScolaires.add(rel.etabId);
        }
        for (const rel of Object.values(this.#storage.specialites_1ereG_par_etablissement || {})) {
            if (rel.etabId) etabIdsAvecRelationsScolaires.add(rel.etabId);
        }
        for (const rel of Object.values(this.#storage.dispositifs_par_etablissement || {})) {
            if (rel.etabId) etabIdsAvecRelationsScolaires.add(rel.etabId);
        }
        
        let nbSupprimes = 0;
        for (const id of Object.keys(this.#storage.etablissements)) {
            const etab = this.#storage.etablissements[id];
            const voiesScolaireAbsentes = !etab.voies || !etab.voies.includes('scolaire');
            const voieApprPresente = etab.voies && etab.voies.includes('apprentissage');
            const aDesRelationsScolaires = etabIdsAvecRelationsScolaires.has(id);
            
            // PROTECTION : ne jamais supprimer un établissement qui a des relations scolaires
            if (aDesRelationsScolaires) {
                continue;
            }
            
            if (voieApprPresente && voiesScolaireAbsentes && etab.uai && !uaisAvecRelations.has(etab.uai)) {
                console.log(`[supprimerCarifSansRelation] 🗑️ Suppression ${id} (uai=${etab.uai}, nom="${etab.nom}", voies=${JSON.stringify(etab.voies)})`);
                delete this.#storage.etablissements[id];
                nbSupprimes++;
            }
        }
        
        console.log(`[supprimerCarifSansRelation] APRÈS: ${Object.keys(this.#storage.etablissements).length} étab(s), ${nbSupprimes} supprimé(s)`);
        
        if (nbSupprimes > 0) {
            this.#saveToLocalStorage();
        }
        return nbSupprimes;
    }

    /**
     * Vérifie et répare la cohérence des voies de tous les établissements.
     * 
     * Règles appliquées :
     *   - Un établissement avec des relations diplômes scolaires doit avoir 'scolaire' dans ses voies.
     *   - Un établissement avec des relations diplômes apprentissage doit avoir 'apprentissage' dans ses voies.
     *   - Un établissement sans aucune voie reçoit 'scolaire' par défaut.
     * 
     * @returns {{ repares: number, details: string[] }} Nombre d'établissements corrigés et détails.
     */
    verifierCoherenceVoies() {
        // Construire les ensembles d'etabId par voie
        const etabIdsAvecScolaire = new Set();
        for (const rel of Object.values(this.#storage.diplomes_par_etablissement || {})) {
            if (rel.etabId) etabIdsAvecScolaire.add(rel.etabId);
        }
        for (const rel of Object.values(this.#storage.options_2nde_gt_par_etablissement || {})) {
            if (rel.etabId) etabIdsAvecScolaire.add(rel.etabId);
        }
        for (const rel of Object.values(this.#storage.specialites_1ereG_par_etablissement || {})) {
            if (rel.etabId) etabIdsAvecScolaire.add(rel.etabId);
        }
        for (const rel of Object.values(this.#storage.dispositifs_par_etablissement || {})) {
            if (rel.etabId) etabIdsAvecScolaire.add(rel.etabId);
        }
        
        const etabIdsAvecApprentissage = new Set();
        for (const rel of Object.values(this.#storage.diplomes_apprentissage_par_etablissement || {})) {
            if (rel.etabId) etabIdsAvecApprentissage.add(rel.etabId);
        }
        
        let repares = 0;
        const details = [];
        
        for (const [id, etab] of Object.entries(this.#storage.etablissements)) {
            if (!etab.voies) etab.voies = [];
            const voiesAvant = [...etab.voies];
            
            const doitAvoirScolaire = etabIdsAvecScolaire.has(id);
            const doitAvoirApprentissage = etabIdsAvecApprentissage.has(id);
            
            // Ajouter 'scolaire' si relations scolaires existent
            if (doitAvoirScolaire && !etab.voies.includes('scolaire')) {
                etab.voies.push('scolaire');
            }
            // Ajouter 'apprentissage' si relations apprentissage existent
            if (doitAvoirApprentissage && !etab.voies.includes('apprentissage')) {
                etab.voies.push('apprentissage');
            }
            // Retirer 'apprentissage' si aucune relation apprentissage
            if (!doitAvoirApprentissage && etab.voies.includes('apprentissage')) {
                etab.voies = etab.voies.filter(v => v !== 'apprentissage');
            }
            // Par défaut si aucune voie
            if (etab.voies.length === 0) {
                etab.voies = ['scolaire'];
            }
            
            // Vérifier si des changements ont été faits
            if (JSON.stringify(voiesAvant) !== JSON.stringify(etab.voies)) {
                repares++;
                details.push(`${id} (${etab.nom}): [${voiesAvant}] → [${etab.voies}]`);
            }
        }
        
        if (repares > 0) {
            console.log(`[DatabaseService] 🔧 verifierCoherenceVoies: ${repares} établissement(s) corrigé(s)`);
            details.forEach(d => console.log(`  → ${d}`));
            this.#saveToLocalStorage();
        } else {
            console.log('[DatabaseService] ✅ verifierCoherenceVoies: toutes les voies sont cohérentes');
        }
        
        return { repares, details };
    }

        /**
         * Vide les données de data.education.gouv.fr (langues).
         * @returns {Promise<void>}
         */
async clearEducationData() {
        console.log('[DatabaseService] 🗑️ Vidage de toutes les données extraites de data.education.gouv.fr');
        this.#storage.langues={};
    }

    // =====================================
    // GÉO (communes, départements, régions, EPCI)
    // =====================================

        /**
         * Insère une commune dans le référentiel géographique.
         * @param {Object} commune - Doit contenir `code` (INSEE)
         * @returns {Promise<string|null>}
         */
async insertCommune(commune) {
        if (!commune.code) return null;
        this.#storage.communes[commune.code] = commune;
        // Pas de saveToLocalStorage ici — appeler flush() après la boucle d'insertion
        return commune.code;
    }

        /**
         * Récupère une commune par son code INSEE.
         * @param {string} code
         * @returns {Promise<Object|null>}
         */
async getCommune(code) {
        return this.#storage.communes[code] || null;
    }

        /**
         * Insère un département dans le référentiel géographique.
         * @param {Object} departement - Doit contenir `code`
         * @returns {Promise<string|null>}
         */
async insertDepartement(departement) {
        if (!departement.code) return null;
        this.#storage.departements[departement.code] = departement;
        // Pas de saveToLocalStorage ici — appeler flush() après la boucle d'insertion
        return departement.code;
    }

        /**
         * Récupère un département par son code.
         * @param {string} code - ex : '35', '2A'
         * @returns {Promise<Object|null>}
         */
async getDepartement(code) {
        return this.#storage.departements[code] || null;
    }

        /**
         * Insère une région dans le référentiel géographique.
         * @param {Object} region - Doit contenir `code`
         * @returns {Promise<string|null>}
         */
async insertRegion(region) {
        if (!region.code) return null;
        this.#storage.regions[region.code] = region;
        // Pas de saveToLocalStorage ici — appeler flush() après la boucle d'insertion
        return region.code;
    }

        /**
         * Récupère une région par son code.
         * @param {string} code
         * @returns {Promise<Object|null>}
         */
async getRegion(code) {
        return this.#storage.regions[code] || null;
    }

        /**
         * Insère un EPCI dans le référentiel (clé : code SIREN).
         * @param {Object} epci - Doit contenir `code`
         * @returns {Promise<string|null>}
         */
async insertEpci(epci) {
        if (!epci.code) return null;
        this.#storage.epci[epci.code] = epci;
        // Pas de saveToLocalStorage ici — appeler flush() après la boucle d'insertion
        return epci.code;
    }

        /**
         * Récupère un EPCI par son code SIREN.
         * @param {string} code
         * @returns {Promise<Object|null>}
         */
async getEpci(code) {
        return this.#storage.epci[code] || null;
    }

    /** Alias majuscules attendus par geo_extraction_controller */
    async getEPCI(code) {
        return this.getEpci(code);
    }

        /**
         * Alias majuscules de insertEpci (compatibilité geo_extraction_controller).
         * @param {Object} epci
         * @returns {Promise<string|null>}
         */
async insertEPCI(epci) {
        return this.insertEpci(epci);
    }

        /**
         * Vide les référentiels géographiques (EPCI, communes, départements, régions).
         * @returns {Promise<void>}
         */
async clearGeoData() {
        console.log('[DatabaseService] 🗑️ Vidage des données géographiques (EPCI, communes, départements, régions)');
        this.#storage.epci = {};
        this.#storage.communes = {};
        this.#storage.departements = {};
        this.#storage.regions = {};
        this.#saveToLocalStorage();
    }

    // =====================================
    // MÉTHODES COMPATIBILITÉ (anciennes interfaces)
    // =====================================

    // =====================================
    // CROSS-VOIES (compatibilité croisée scolaire/apprentissage)
    // =====================================

    /**
     * Cherche si un diplôme ONISEP (par son libellé) est également accessible par apprentissage.
     */
    async estAussiEnApprentissage(libelleOnisep) {
        if (!libelleOnisep) return false;
        const libelleNorm = libelleOnisep.toLowerCase().trim();
        return Object.values(this.#storage.diplomes_apprentissage).some(d => {
            const intitule = (d.onisepIntitule || '').toLowerCase().trim();
            return intitule && intitule === libelleNorm;
        });
    }

    async estAussiEnScolaire(onisepIntitule) {
        if (!onisepIntitule) return false;
        const libelleNorm = onisepIntitule.toLowerCase().trim();
        return Object.values(this.#storage.diplomes).some(d => {
            const libelle = (d.libelle || '').toLowerCase().trim();
            return libelle && libelle === libelleNorm;
        });
    }

    // ══════════════════════════════════════════════════════
    // INTERFACE v0.45 — API simplifiée (séparation des responsabilités)
    // Toute la couche UI doit passer par ces méthodes, jamais par localStorage.
    // ══════════════════════════════════════════════════════

    // lireEtablissements, lireEtablissementsAsync, sauvegarderEtablissement
    // supprimées en v0.59 : aucun appelant externe. Remplacées par getAllEtablissements()
    // et insertEtablissement() / updateEtablissement().

    // enrichirEtablissement supprimée en v0.59 : remplacée par updateEtablissement(id, updates)
    // qui fait du enrichissement non-destructif par défaut.

    /**
     * Retourne toutes les formations sous forme d'objet indexé par id.
     * @returns {Object.<string, Object>}
     */
    lireFormations() {
        // Les formations sont réparties dans plusieurs tables internes
        const formations = {};
        // Diplômes voie scolaire
        for (const [id, d] of Object.entries(this.#storage.diplomes || {})) {
            formations[id] = { ...d, voieScolaire: true, voieApprentissage: false };
        }
        // Diplômes voie apprentissage
        for (const [id, d] of Object.entries(this.#storage.diplomes_apprentissage || {})) {
            if (formations[id]) {
                formations[id].voieApprentissage = true;
                formations[id].source = 'both';
            } else {
                formations[id] = { ...d, voieScolaire: false, voieApprentissage: true };
            }
        }
        return formations;
    }

    /**
     * Sauvegarde une formation (insert ou update).
     * @param {Object} formation
     * @returns {string} id interne.
     */
    sauvegarderFormation(formation) {
        const id = formation.id || formation._id || `form_${_genId()}`;
        const table = formation.voieApprentissage && !formation.voieScolaire
            ? 'diplomes_apprentissage'
            : 'diplomes';
        if (!this.#storage[table]) this.#storage[table] = {};
        this.#storage[table][id] = { id, ...formation };
        return id;
    }

    /**
     * Lit toutes les préférences utilisateur (objet libre).
     * Fusionne les préférences stockées dans 'preferences' et les clés
     * legacy ('settings_*', 'pref_*') encore présentes en localStorage.
     * @returns {Promise<Object>}
     */
    async lirePreferences() {
        const stored = this.#storage.preferences || {};
        // Fallback sur les clés legacy pour la compatibilité v0.44
        const legacy = {};
        const keysLegacy = ['settings_email', 'settings_password', 'settings_app_id',
                            'settings_auto_connect', 'pref_user_uai',
                            'pref_user_etablissement', 'pref_user_domicile'];
        for (const k of keysLegacy) {
            const v = localStorage.getItem(k);
            if (v !== null) legacy[k] = v;
        }
        return { ...legacy, ...stored };
    }

    /**
     * Sauvegarde une ou plusieurs préférences utilisateur.
     * @param {string|Object} cle   - Clé (string) ou objet de préférences multiples.
     * @param {*}             [val] - Valeur si `cle` est une string.
     * @returns {void}
     */
    sauvegarderPreference(cle, val) {
        if (!this.#storage.preferences) this.#storage.preferences = {};
        if (typeof cle === 'object') {
            Object.assign(this.#storage.preferences, cle);
        } else {
            this.#storage.preferences[cle] = val;
        }
        this.#saveToLocalStorage();
    }

    /**
     * Lit une préférence par sa clé.
     * @param {string} cle
     * @returns {*} Valeur ou null.
     */
    lirePreference(cle) {
        return (this.#storage.preferences || {})[cle]
            ?? localStorage.getItem(cle)
            ?? null;
    }

    /**
     * Retourne les statistiques de la base (nb d'entités par type).
     * @returns {{etablissements: number, formations: number, dispositifs: number,
     *            options2ndeGT: number, specialites1ereG: number, diplomesApprentissage: number}}
     */
    statistiques() {
        return {
            etablissements:       Object.keys(this.#storage.etablissements || {}).length,
            formations:           Object.keys(this.#storage.diplomes || {}).length,
            dispositifs:          Object.keys(this.#storage.dispositifs || {}).length,
            options2ndeGT:        Object.keys(this.#storage.options_2nde_gt || {}).length,
            specialites1ereG:     Object.keys(this.#storage.specialites_1ereG || {}).length,
            diplomesApprentissage:Object.keys(this.#storage.diplomes_apprentissage || {}).length,
        };
    }

    // =====================================
    // SNAPSHOT (export / import de jeux de données)
    // =====================================

    /**
     * Liste des tables éducatives exportables dans un snapshot.
     * Exclut les référentiels géographiques (communes, départements, régions, epci)
     * et les préférences utilisateur.
     * @private
     * @type {string[]}
     */
    static #EDUCATIONAL_TABLES = [
        'etablissements',
        'diplomes',
        'diplomes_par_etablissement',
        'dispositifs',
        'dispositifs_par_etablissement',
        'options_2nde_gt',
        'options_2nde_gt_par_etablissement',
        'specialites_1ereG',
        'specialites_1ereG_par_etablissement',
        'diplomes_apprentissage',
        'diplomes_apprentissage_par_etablissement',
        'autres_formations_par_etablissement',
        'langues'
    ];

    /**
     * Retourne une copie profonde des tables éducatives uniquement.
     * Les référentiels géographiques et les préférences sont exclus.
     * Utilisé par DatasetService pour l'export de jeux de données.
     * @returns {Promise<Object>} Copie profonde des tables éducatives
     */
    async getStorageSnapshot() {
        const snapshot = {};
        for (const table of DatabaseService.#EDUCATIONAL_TABLES) {
            snapshot[table] = JSON.parse(JSON.stringify(this.#storage[table] || {}));
        }
        return snapshot;
    }

    /**
     * Remplace les tables éducatives par celles d'un snapshot importé.
     * Préserve les référentiels géographiques (communes, départements, régions, epci)
     * et les préférences utilisateur.
     * Reconstruit l'index d'unicité des établissements après chargement.
     * @param {Object} data - Objet contenant les tables éducatives à charger
     * @returns {Promise<void>}
     */
    async loadStorageSnapshot(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('[DatabaseService] loadStorageSnapshot: données invalides');
        }
        console.log('[DatabaseService] 📥 Chargement d\'un snapshot de données…');
        for (const table of DatabaseService.#EDUCATIONAL_TABLES) {
            this.#storage[table] = data[table] || {};
        }
        this.#rebuildEtabIndex();
        this.#saveToLocalStorage();
        console.log('[DatabaseService] ✅ Snapshot chargé avec succès');
    }

    /**
     * Indique si la base contient au moins un établissement.
     * Permet de déterminer rapidement si des données éducatives existent.
     * @returns {boolean}
     */
    hasEducationalData() {
        return Object.keys(this.#storage.etablissements || {}).length > 0;
    }

    /**
     * Sauvegarde les métadonnées de la dernière extraction effectuée.
     * Stockées dans localStorage sous clé dédiée (hors #storage) pour ne
     * pas polluer les snapshots de données.
     * @param {Object} metadata - Métadonnées de la recherche
     * @param {string} metadata.typeRecherche - 'geo'|'diplomes'|'options'
     * @param {Object} metadata.params - Paramètres de la recherche (format favoris)
     * @param {string} metadata.date - Date ISO de l'extraction
     * @param {Object} [metadata.stats] - Statistiques post-extraction
     */
    setLastExtractionMetadata(metadata) {
        try {
            localStorage.setItem('last_extraction_metadata', JSON.stringify(metadata));
            console.log('[DatabaseService] 📝 Métadonnées d\'extraction sauvegardées');
        } catch (error) {
            console.warn('[DatabaseService] ⚠️ Impossible de sauver les métadonnées:', error);
        }
    }

    /**
     * Récupère les métadonnées de la dernière extraction effectuée.
     * @returns {Object|null} Métadonnées ou null si aucune extraction enregistrée
     */
    getLastExtractionMetadata() {
        try {
            const raw = localStorage.getItem('last_extraction_metadata');
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('[DatabaseService] ⚠️ Impossible de lire les métadonnées:', error);
            return null;
        }
    }

    /**
     * Retourne la liste des noms de tables éducatives (utile pour la validation externe).
     * @returns {string[]}
     */
    static getEducationalTableNames() {
        return [...DatabaseService.#EDUCATIONAL_TABLES];
    }

    // =====================================
    // PURGE
    // =====================================

    /**
     * Efface toutes les données de la base (établissements, formations, etc.)
     * SANS toucher aux préférences utilisateur.
     * @returns {void}
     */
    purger() {
        const preferences = { ...this.#storage.preferences };
        this.#storage = {
            etablissements: {}, diplomes: {}, diplomes_par_etablissement: {},
            dispositifs: {}, dispositifs_par_etablissement: {},
            options_2nde_gt: {}, options_2nde_gt_par_etablissement: {},
            specialites_1ereG: {}, specialites_1ereG_par_etablissement: {},
            diplomes_apprentissage: {}, diplomes_apprentissage_par_etablissement: {},
            langues: {}, communes: {}, departements: {}, regions: {}, epci: {},
            preferences,
        };
        this.#etabUniquenessIndex.clear();
        this.#nextEtabId = 1;
        this.#saveToLocalStorage();
        console.log('[DatabaseService] 🗑️ Base purgée (préférences conservées)');
    }
}

// Exposition globale
if (typeof window !== 'undefined') {
    window.DatabaseService = DatabaseService;
}
