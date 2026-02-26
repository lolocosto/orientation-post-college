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
            // Autres formations niveau 5+ (CARIF-OREF, non cliquables)
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
     * Indique si le chargement depuis localStorage est terminé.
     * @returns {boolean}
     */
    isLoaded() {
        return this.#loaded;
    }

    /**
     * @deprecated Utiliser #loadFromLocalStorageAsync en interne
     * @private
     */
#loadFromLocalStorage() {
        // Méthode obsolète - le chargement est désormais asynchrone via #loadFromLocalStorageAsync
    }

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
     * Insère ou met à jour un établissement.
     * Clé interne : _id généré (etab_<SIRET> ou etab_<random>).
     * Refuse si UAI et SIRET sont tous deux nuls/vides.
     * @param {Object} etablissement
     * @returns {Promise<string|null>} _id interne ou null si refusé
     */
    async insertEtablissement(etablissement) {
        const uai   = etablissement.uai   ? String(etablissement.uai).trim()   : null;
        const siret = etablissement.siret ? String(etablissement.siret).trim() : null;

        if (!uai && !siret) {
            console.warn('[DatabaseService] ❌ Établissement refusé (UAI et SIRET nuls):', etablissement);
            return null;
        }

        // Générer ou réutiliser _id
        if (!etablissement._id) {
            if (uai) {
                etablissement._id = `etab_${uai}`;
            } else {
                etablissement._id = `etab_${siret}`;
            }
        }

        // Initialiser la voie scolaire si le champ voies est absent
        if (!etablissement.voies) {
            etablissement.voies = ['scolaire'];
        }

        this.#storage.etablissements[etablissement._id] = etablissement;
        return etablissement._id;
    }
    
    /**
     * Met à jour un établissement par son _id interne.
     * @param {string} id - _id interne de l'établissement
     * @param {Object} updates
     */
    async updateEtablissement(id, updates) {
        if (this.#storage.etablissements[id]) {
            Object.assign(this.#storage.etablissements[id], updates);
        } else {
            console.warn(`[DatabaseService] ⚠️ Impossible de mettre à jour établissement: _id ${id} non trouvé`);
        }
    }

    /**
     * Met à jour un établissement par son UAI (compatibilité enrichissement ONISEP).
     * @param {string} uai
     * @param {Object} updates
     */
    async updateEtablissementByUai(uai, updates) {
        const etab = this.getEtablissementByUaiSync(uai);
        if (etab) {
            await this.updateEtablissement(etab._id, updates);
        } else {
            console.warn(`[DatabaseService] ⚠️ updateEtablissementByUai: UAI ${uai} non trouvé`);
        }
    }
    
    /**
     * Récupère un établissement par son _id interne.
     * @param {string} id
     */
    async getEtablissement(id) {
        return this.#storage.etablissements[id] || null;
    }

    /**
     * Récupère un établissement par son UAI (recherche linéaire).
     * @param {string} uai
     * @returns {Object|null}
     */
    getEtablissementByUaiSync(uai) {
        if (!uai) return null;
        return Object.values(this.#storage.etablissements).find(e => e.uai === uai) || null;
    }

        /**
         * Récupère un établissement par son code UAI (version asynchrone).
         * @param {string} uai - Code UAI
         * @returns {Promise<Object|null>}
         */
async getEtablissementByUai(uai) {
        return this.getEtablissementByUaiSync(uai);
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

        const compteur = new Map();
        relations.forEach(rel => {
            if (rel.libelle) {
                compteur.set(rel.libelle, (compteur.get(rel.libelle) || 0) + 1);
            }
        });

        return options.map(option => ({
            libelle: option.libelle,
            nbEtablissements: compteur.get(option.libelle) || 0
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
            // Jointure par etabId (_id interne) ou UAI (compatibilité)
            const etab = relation.etabId
                ? etabIndex[relation.etabId]
                : etablissements.find(e => e.uai === relation.uai);
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

        const relations = await this.getAllOptions2ndeGTParEtablissement();
        const etablissements = [];
        for (const rel of relations) {
            if (rel.libelle !== libelle) continue;
            // Jointure par etabId ou UAI (compatibilité)
            const etab = rel.etabId
                ? await this.getEtablissement(rel.etabId)
                : this.getEtablissementByUaiSync(rel.uai);
            if (etab) etablissements.push(etab);
        }
        etablissements.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
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
         * Filtre par etabId OU uai (compatibilité ascendante).
         * @param {string} etabId - _id interne
         * @returns {Object[]}
         */
getDiplomesParEtablissementSync(etabId) {
        const etab = this.#storage.etablissements[etabId];
        if (!etab) return [];
        const uai = etab.uai;

        const libellesSet = new Set(
            Object.values(this.#storage.diplomes_par_etablissement)
                .filter(rel => rel.etabId === etabId || (uai && rel.uai === uai))
                .map(rel => rel.libelle)
        );

        const diplomes = Object.values(this.#storage.diplomes).filter(d => libellesSet.has(d.libelle));
        for (const diplome of diplomes) {
            const relation = Object.values(this.#storage.diplomes_par_etablissement)
                .filter(rel => rel.etabId === etabId || (uai && rel.uai === uai))
                .find(rel => rel.libelle === diplome.libelle);
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
        const uai = etab.uai;

        const libellesSet = new Set(
            Object.values(this.#storage.dispositifs_par_etablissement)
                .filter(rel => rel.etabId === etabId || (uai && rel.uai === uai))
                .map(rel => rel.libelle)
        );

        const dispositifs = Object.values(this.#storage.dispositifs).filter(d => libellesSet.has(d.libelle));
        for (const dispositif of dispositifs) {
            const relation = Object.values(this.#storage.dispositifs_par_etablissement)
                .filter(rel => rel.etabId === etabId || (uai && rel.uai === uai))
                .find(rel => rel.libelle === dispositif.libelle);
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
        const uai = etab.uai;

        const libellesSet = new Set(
            Object.values(this.#storage.options_2nde_gt_par_etablissement)
                .filter(rel => rel.etabId === etabId || (uai && rel.uai === uai))
                .map(rel => rel.libelle)
        );

        const options = Object.values(this.#storage.options_2nde_gt).filter(o => libellesSet.has(o.libelle));
        for (const option of options) {
            const relation = Object.values(this.#storage.options_2nde_gt_par_etablissement)
                .filter(rel => rel.etabId === etabId || (uai && rel.uai === uai))
                .find(rel => rel.libelle === option.libelle);
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
        const uai = etab.uai;

        const libellesSet = new Set(
            Object.values(this.#storage.specialites_1ereG_par_etablissement)
                .filter(rel => rel.etabId === etabId || (uai && rel.uai === uai))
                .map(rel => rel.libelle)
        );

        const specialites = Object.values(this.#storage.specialites_1ereG).filter(s => libellesSet.has(s.libelle));
        for (const specialite of specialites) {
            const relation = Object.values(this.#storage.specialites_1ereG_par_etablissement)
                .filter(rel => rel.etabId === etabId || (uai && rel.uai === uai))
                .find(rel => rel.libelle === specialite.libelle);
            if (relation) Object.assign(specialite, relation);
        }
        return specialites;
    }

        /**
         * Retourne les langues enseignées dans un établissement.
         * @param {string} etabId - _id interne
         * @returns {Promise<Object[]>}
         */
async getLanguesParEtablissement(etabId) {
        const etab = this.#storage.etablissements[etabId];
        if (!etab || !etab.uai) return [];
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

        const etabIds = new Set(relations.map(rel => rel.etabId).filter(Boolean));
        // Compatibilité : certaines relations n'ont pas encore etabId, joindre via uai
        const uais = new Set(relations.filter(r => !r.etabId && r.uai).map(r => r.uai));

        const etablissements = Object.values(this.#storage.etablissements)
            .filter(e => etabIds.has(e._id) || (e.uai && uais.has(e.uai)))
            .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'));

        // Infos de la relation pour chaque étab (page web, durée, etc.)
        const etabsAvecRelation = etablissements.map(etab => {
            const rel = relations.find(r =>
                r.etabId === etab._id || (etab.uai && r.uai === etab.uai)
            );
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

        const etabIds = new Set(relations.map(rel => rel.etabId).filter(Boolean));
        const uais    = new Set(relations.filter(r => !r.etabId && r.uai).map(r => r.uai));

        const etablissements = Object.values(this.#storage.etablissements)
            .filter(e => etabIds.has(e._id) || (e.uai && uais.has(e.uai)))
            .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'));

        const etabsAvecRelation = etablissements.map(etab => {
            const rel = relations.find(r =>
                r.etabId === etab._id || (etab.uai && r.uai === etab.uai)
            );
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

        // Récupérer les etabIds (ou UAI) depuis la table de relations
        const relations = Object.values(this.#storage.diplomes_apprentissage_par_etablissement)
            .filter(rel => rel.diplomId === id);

        const etabIds = new Set(relations.map(rel => rel.etabId).filter(Boolean));
        const uais    = new Set(relations.filter(r => !r.etabId && r.uai).map(r => r.uai));

        const etablissements = Object.values(this.#storage.etablissements)
            .filter(e => etabIds.has(e._id) || (e.uai && uais.has(e.uai)))
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
            .filter(rel => {
                if (rel.etabId === etabId) return true;
                // Compatibilité : chercher via uai si l'établissement a un UAI
                const etab = this.#storage.etablissements[etabId];
                return etab && etab.uai && rel.uai === etab.uai;
            });
        const ids = new Set(relations.map(r => r.diplomId));
        return Object.values(this.#storage.diplomes_apprentissage).filter(d => ids.has(d.id));
    }

        /**
         * Retourne les diplômes apprentissage d'un établissement (synchrone, pour la carte).
         * @param {string} etabId - _id interne
         * @returns {Object[]}
         */
getDiplomesApprentissageParEtablissementSync(etabId) {
        const etab = this.#storage.etablissements[etabId];
        const uai  = etab ? etab.uai : null;
        const relations = Object.values(this.#storage.diplomes_apprentissage_par_etablissement)
            .filter(rel => rel.etabId === etabId || (uai && rel.uai === uai));
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
    // AUTRES FORMATIONS NIVEAU 5+ (CARIF-OREF)
    // =====================================

    /**
     * Insère une liste de formations niveau 5+ pour un établissement (par UAI).
     * Chaque formation est un objet léger { libelle, niveau, typeDiplome }.
     * Stockage par UAI pour lookup rapide dans la fiche établissement.
     * @param {string} uai
     * @param {Object[]} formations - [{ libelle, niveau, typeDiplome }]
     */
    async insertAutresFormationsParEtablissement(uai, formations) {
        if (!uai || !formations || formations.length === 0) return;
        this.#storage.autres_formations_par_etablissement[uai] = formations;
    }

    /**
     * Retourne les formations niveau 5+ d'un établissement.
     * @param {string} uai
     * @returns {Object[]} [{ libelle, niveau, typeDiplome }]
     */
    getAutresFormationsParEtablissement(uai) {
        return this.#storage.autres_formations_par_etablissement[uai] || [];
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
     * Fusionne la voie apprentissage sur un établissement existant,
     * ou insère un nouvel établissement si l'UAI est inconnu.
     * Retourne le _id interne.
     */
    async fusionnerEtablissementAprentissage(etabAprentissage) {
        const uai   = etabAprentissage.uai   ? String(etabAprentissage.uai).trim()   : null;
        const siret = etabAprentissage.siret ? String(etabAprentissage.siret).trim() : null;

        if (!uai && !siret) {
            console.warn('[DatabaseService] ❌ Fusion impossible : établissement sans UAI ni SIRET');
            return null;
        }

        // Chercher un existant par UAI
        let existant = uai ? this.getEtablissementByUaiSync(uai) : null;

        if (existant) {
            // Enrichir seulement les champs null/undefined
            for (const [key, val] of Object.entries(etabAprentissage)) {
                if (key === 'voies' || key === '_id') continue;
                if (existant[key] === null || existant[key] === undefined) {
                    existant[key] = val;
                }
            }
            if (!existant.voies) existant.voies = [];
            if (!existant.voies.includes('apprentissage')) {
                existant.voies.push('apprentissage');
            }
            return existant._id;
        } else {
            // Nouvel établissement
            if (!etabAprentissage.voies) etabAprentissage.voies = ['apprentissage'];
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
        this.#storage.autres_formations_par_etablissement = {};
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
        this.#storage.autres_formations_par_etablissement={};
        for (const id of Object.keys(this.#storage.etablissements)) {
            const etab = this.#storage.etablissements[id];
            if (etab.voies) {
                etab.voies = etab.voies.filter(v => v !== 'apprentissage');
            }
        }
        this.#saveToLocalStorage();
    }

    /**
     * Supprime les établissements CARIF (voie apprentissage uniquement) sans aucune relation diplôme.
     * @param {Set<string>} uaisAvecRelations - UAI ayant au moins une relation
     */
    async supprimerEtablissementsCarifSansRelation(uaisAvecRelations) {
        let nbSupprimes = 0;
        for (const id of Object.keys(this.#storage.etablissements)) {
            const etab = this.#storage.etablissements[id];
            const voiesScolaireAbsentes = !etab.voies || !etab.voies.includes('scolaire');
            const voieApprPresente = etab.voies && etab.voies.includes('apprentissage');
            if (voieApprPresente && voiesScolaireAbsentes && etab.uai && !uaisAvecRelations.has(etab.uai)) {
                delete this.#storage.etablissements[id];
                nbSupprimes++;
            }
        }
        if (nbSupprimes > 0) {
            this.#saveToLocalStorage();
        }
        return nbSupprimes;
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

    /**
     * @deprecated Utiliser updateEtablissementByUai ou updateEtablissement(_id)
     */
    async updateEtablissement(idOrUai, updates) {
        // Essai direct par _id
        if (this.#storage.etablissements[idOrUai]) {
            Object.assign(this.#storage.etablissements[idOrUai], updates);
            return;
        }
        // Fallback : chercher par UAI
        const etab = this.getEtablissementByUaiSync(idOrUai);
        if (etab) {
            Object.assign(etab, updates);
        } else {
            console.warn(`[DatabaseService] ⚠️ updateEtablissement: ${idOrUai} non trouvé`);
        }
    }

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

    /**
     * Retourne tous les établissements sous forme d'objet indexé par _id.
     * @returns {Object.<string, Object>}
     */
    lireEtablissements() {
        return { ...this.#storage.etablissements };
    }

    /**
     * Alias async (pour les contrôleurs qui attendent une Promise).
     * @returns {Promise<Object.<string, Object>>}
     */
    async lireEtablissementsAsync() {
        return this.lireEtablissements();
    }

    /**
     * Sauvegarde (insert ou update) un établissement.
     * Clé : `uai` si définie, sinon `_id` généré.
     * @param {Object} etablissement
     * @returns {string} _id interne de l'établissement.
     */
    sauvegarderEtablissement(etablissement) {
        // Chercher par UAI d'abord
        if (etablissement.uai) {
            const existing = this.getEtablissementByUaiSync(etablissement.uai);
            if (existing) {
                Object.assign(existing, etablissement);
                return existing._id;
            }
        }
        const id = etablissement._id || `etab_${_genId()}`;
        this.#storage.etablissements[id] = { _id: id, ...etablissement };
        return id;
    }

    /**
     * Enrichit un établissement existant (par UAI) sans écraser les champs déjà renseignés.
     * Si les deux sources sont présentes, met `source` à 'both'.
     * @param {string} uai    - Code UAI de l'établissement à enrichir.
     * @param {Object} champs - Champs à ajouter (ignorés s'ils existent déjà).
     * @returns {boolean} true si l'établissement a été trouvé et enrichi.
     */
    enrichirEtablissement(uai, champs) {
        const etab = this.getEtablissementByUaiSync(uai);
        if (!etab) return false;
        for (const [cle, valeur] of Object.entries(champs)) {
            // Ne pas écraser un champ déjà renseigné, sauf 'source'
            if (cle === 'source') {
                if (etab.source && etab.source !== valeur) etab.source = 'both';
                else etab.source = valeur;
            } else if (etab[cle] === undefined || etab[cle] === null || etab[cle] === '') {
                etab[cle] = valeur;
            }
        }
        return true;
    }

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
        this.#saveToLocalStorage();
        console.log('[DatabaseService] 🗑️ Base purgée (préférences conservées)');
    }
}

// Exposition globale
if (typeof window !== 'undefined') {
    window.DatabaseService = DatabaseService;
}
