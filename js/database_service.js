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
            langues: {},
            communes: {},
            departements: {},
            regions: {},
            epci: {}
        };
        
        // Charger depuis localStorage si disponible
        this.#loadFromLocalStorage();
    }
    
    #loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem(this.#dbName);
            if (stored) {
                this.#storage = JSON.parse(stored);
                console.log('[DatabaseService] 📂 Données chargées depuis localStorage');
            }
        } catch (error) {
            console.warn('[DatabaseService] ⚠️ Impossible de charger depuis localStorage:', error);
        }
    }
    
    #saveToLocalStorage() {
        try {
            localStorage.setItem(this.#dbName, JSON.stringify(this.#storage));
        } catch (error) {
            console.warn('[DatabaseService] ⚠️ Impossible de sauver dans localStorage:', error);
        }
    }
    
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
        this.#saveToLocalStorage();
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
            this.#saveToLocalStorage();
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

    async getEtablissementByUai(uai) {
        return this.getEtablissementByUaiSync(uai);
    }
    
    async getAllEtablissements() {
        return Object.values(this.#storage.etablissements);
    }
    
    // =====================================
    // DIPLÔMES
    // =====================================
    
    async insertDiplome(diplome) {
        if (!diplome.libelle) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer diplôme sans libellé:', diplome);
            return null;
        }
        this.#storage.diplomes[diplome.libelle] = diplome;
        this.#saveToLocalStorage();
        return diplome.libelle;
    }
    
    async updateDiplome(libelle, updates) {
        if (this.#storage.diplomes[libelle]) {
            Object.assign(this.#storage.diplomes[libelle], updates);
            this.#saveToLocalStorage();
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
        this.#saveToLocalStorage();
        return relation.id;
    }
    
    async getDiplome(libelle) {
        return this.#storage.diplomes[libelle] || null;
    }
    
    async getAllDiplomes() {
        return Object.values(this.#storage.diplomes);
    }

    async getAllDiplomesParEtablissement() {
        return Object.values(this.#storage.diplomes_par_etablissement);
    }

    // =====================================
    // DISPOSITIFS
    // =====================================
    
    async insertDispositif(dispositif) {
        if (!dispositif.libelle) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer dispositif sans libellé:', dispositif);
            return null;
        }
        this.#storage.dispositifs[dispositif.libelle] = dispositif;
        this.#saveToLocalStorage();
        return dispositif.libelle;
    }
    
    async updateDispositif(libelle, updates) {
        if (this.#storage.dispositifs[libelle]) {
            Object.assign(this.#storage.dispositifs[libelle], updates);
            this.#saveToLocalStorage();
        }
        else {
            console.warn(`[DatabaseService] ⚠️ Impossible de mettre à jour dispositif: libellé ${libelle} non trouvé`);
        }
    }
    
    async insertDispositifParEtablissement(relation) {
        if (!relation.id) {
            relation.id = `rel_disp_${_genId()}`;
            console.warn(`[DatabaseService] ⚠️ Relation dispositif-établissement sans ID API → ID généré: ${relation.id}`);
        }
        this.#storage.dispositifs_par_etablissement[relation.id] = relation;
        this.#saveToLocalStorage();
        return relation.id;
    }
    
    async getDispositif(libelle) {
        return this.#storage.dispositifs[libelle] || null;
    }
    
    async getAllDispositifs() {
        return Object.values(this.#storage.dispositifs);
    }

    async getAllDispositifsParEtablissement() {
        return Object.values(this.#storage.dispositifs_par_etablissement);
    }
    
    // =====================================
    // OPTIONS 2NDE GT
    // =====================================
    
    async insertOption2ndeGT(option) {
        if (!option.libelle) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer option 2nde GT sans libellé:', option);
            return null;
        }
        this.#storage.options_2nde_gt[option.libelle] = option;
        this.#saveToLocalStorage();
        return option.libelle;
    }
    
    async insertOption2ndeGTParEtablissement(relation) {
        if (!relation.id) {
            relation.id = `rel_opt_${_genId()}`;
            console.warn(`[DatabaseService] ⚠️ Relation option 2nde GT-établissement sans ID API → ID généré: ${relation.id}`);
        }
        this.#storage.options_2nde_gt_par_etablissement[relation.id] = relation;
        this.#saveToLocalStorage();
        return relation.id;
    }

    async getOption2ndeGT(libelle) {
        return this.#storage.options_2nde_gt[libelle] || null;
    }
    
    async getAllOptions2ndeGT() {
        return Object.values(this.#storage.options_2nde_gt);
    }
    
    async getAllOptions2ndeGTParEtablissement() {
        return Object.values(this.#storage.options_2nde_gt_par_etablissement);
    }

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

    async getAllZones(type) {
        const etablissements = await this.getAllEtablissements();
        const zones = new Set();
        etablissements.forEach(etab => {
            const zone = type === 'departement' ? etab.departement : etab.academie;
            if (zone) zones.add(zone);
        });
        return Array.from(zones).sort();
    }

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
    
    async insertSpecialite1ereG(specialite) {
        if (!specialite.libelle) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer spécialité 1ère G sans libellé:', specialite);
            return null;
        }
        this.#storage.specialites_1ereG[specialite.libelle] = specialite;
        this.#saveToLocalStorage();
        return specialite.libelle;
    }
    
    async insertSpecialite1ereGParEtablissement(relation) {
        if (!relation.id) {
            relation.id = `rel_spe_${_genId()}`;
            console.warn(`[DatabaseService] ⚠️ Relation spécialité 1ère G-établissement sans ID API → ID généré: ${relation.id}`);
        }
        this.#storage.specialites_1ereG_par_etablissement[relation.id] = relation;
        this.#saveToLocalStorage();
        return relation.id;
    }

    async getSpecialite1ereG(libelle) {
        return this.#storage.specialites_1ereG[libelle] || null;
    }
    
    async getAllSpecialites1ereG() {
        return Object.values(this.#storage.specialites_1ereG);
    }
    
    // =====================================
    // LANGUES
    // =====================================
    
    async insertLangue(langue) {
        const key = `${langue.uai}_${langue.langue}_${langue.enseignement}`;
        if (!this.#storage.langues[key]) {
            langue.id = Object.keys(this.#storage.langues).length + 1;
            this.#storage.langues[key] = langue;
            this.#saveToLocalStorage();
        }
        return key;
    }

    async getAllLangues() {
        return Object.values(this.#storage.langues);
    }
    
    // =====================================
    // STATISTIQUES
    // =====================================
    
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

    async getLanguesParEtablissement(etabId) {
        const etab = this.#storage.etablissements[etabId];
        if (!etab || !etab.uai) return [];
        return Object.values(this.#storage.langues).filter(l => l.uai === etab.uai);
    }

    // =====================================
    // DIPLÔMES ENRICHIS (jointure établissements)
    // =====================================

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

        return { diplome, etablissements: etabsAvecRelation };
    }

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

    // =====================================
    // DIPLÔMES APPRENTISSAGE
    // =====================================
    
    async insertDiplomeApprentissage(diplome) {
        if (!diplome.id) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer diplôme apprentissage sans ID:', diplome);
            return null;
        }
        this.#storage.diplomes_apprentissage[diplome.id] = diplome;
        this.#saveToLocalStorage();
        return diplome.id;
    }

    async getDiplomeApprentissage(id) {
        return this.#storage.diplomes_apprentissage[id] || null;
    }

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

        return { diplome, etablissements };
    }

    async getAllDiplomesApprentissage() {
        return Object.values(this.#storage.diplomes_apprentissage);
    }

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
        this.#saveToLocalStorage();
        return relation.id;
    }

    async getAllDiplomesApprentissageParEtablissement() {
        return Object.values(this.#storage.diplomes_apprentissage_par_etablissement);
    }

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

    getDiplomesApprentissageParEtablissementSync(etabId) {
        const etab = this.#storage.etablissements[etabId];
        const uai  = etab ? etab.uai : null;
        const relations = Object.values(this.#storage.diplomes_apprentissage_par_etablissement)
            .filter(rel => rel.etabId === etabId || (uai && rel.uai === uai));
        const ids = new Set(relations.map(r => r.diplomId));
        return Object.values(this.#storage.diplomes_apprentissage).filter(d => ids.has(d.id));
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
            this.#saveToLocalStorage();
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
        this.#storage.langues = {};
        this.#saveToLocalStorage();
    }

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
        this.#saveToLocalStorage();
    }

    async clearAprentissageData() {
        console.log('[DatabaseService] 🗑️ Vidage des données apprentissage CARIF-OREF');
        this.#storage.diplomes_apprentissage={};
        this.#storage.diplomes_apprentissage_par_etablissement={};
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

    async clearEducationData() {
        console.log('[DatabaseService] 🗑️ Vidage de toutes les données extraites de data.education.gouv.fr');
        this.#storage.langues={};
    }

    // =====================================
    // GÉO (communes, départements, régions, EPCI)
    // =====================================

    async insertCommune(commune) {
        if (!commune.code) return null;
        this.#storage.communes[commune.code] = commune;
        this.#saveToLocalStorage();
        return commune.code;
    }

    async getCommune(code) {
        return this.#storage.communes[code] || null;
    }

    async insertDepartement(departement) {
        if (!departement.code) return null;
        this.#storage.departements[departement.code] = departement;
        this.#saveToLocalStorage();
        return departement.code;
    }

    async getDepartement(code) {
        return this.#storage.departements[code] || null;
    }

    async insertRegion(region) {
        if (!region.code) return null;
        this.#storage.regions[region.code] = region;
        this.#saveToLocalStorage();
        return region.code;
    }

    async getRegion(code) {
        return this.#storage.regions[code] || null;
    }

    async insertEpci(epci) {
        if (!epci.code) return null;
        this.#storage.epci[epci.code] = epci;
        this.#saveToLocalStorage();
        return epci.code;
    }

    async getEpci(code) {
        return this.#storage.epci[code] || null;
    }

    /** Alias majuscules attendus par geo_extraction_controller */
    async getEPCI(code) {
        return this.getEpci(code);
    }

    async insertEPCI(epci) {
        return this.insertEpci(epci);
    }

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
            this.#saveToLocalStorage();
            return;
        }
        // Fallback : chercher par UAI
        const etab = this.getEtablissementByUaiSync(idOrUai);
        if (etab) {
            Object.assign(etab, updates);
            this.#saveToLocalStorage();
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
}

// Exposition globale
if (typeof window !== 'undefined') {
    window.DatabaseService = DatabaseService;
}
