/************************************************
 * Fichier : database_service.js
 * Description : Service de base de données (localStorage)
 * Auteur : Laurent COSTE / Claude
 * Date : 2026-02-04
 * Version : 1.0 - localStorage (compatible navigateurs modernes)
 ************************************************/

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
    
    async insertEtablissement(etablissement) {
        if (!etablissement.uai) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer établissement sans UAI:', etablissement);
            return null;
        }
        this.#storage.etablissements[etablissement.uai] = etablissement;
        this.#saveToLocalStorage();
        return etablissement.uai;
    }
    
    async updateEtablissement(uai, updates) {
        if (this.#storage.etablissements[uai]) {
            Object.assign(this.#storage.etablissements[uai], updates);
            this.#saveToLocalStorage();
        }
        else {
            console.warn(`[DatabaseService] ⚠️ Impossible de mettre à jour établissement: UAI ${uai} non trouvé`);
        }
    }
    
    async getEtablissement(uai) {
        return this.#storage.etablissements[uai] || null;
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
    async insertDiplomeParEtablissement(relation) {
        if (!relation.id) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer relation diplôme-établissement sans ID:', relation);
            return null;
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

    /**
     * Récupère toutes les relations diplômes-établissements
     * @returns {Promise<Array>} Liste des relations
     */
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
            console.warn('[DatabaseService] ❌ Impossible d\'insérer relation dispositif-établissement sans ID:', relation);
            return null;
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
            console.warn('[DatabaseService] ❌ Impossible d\'insérer relation option 2nde GT-établissement sans ID:', relation);
            return null;
        }
        this.#storage.options_2nde_gt_par_etablissement[relation.id] = relation;
        this.#saveToLocalStorage();
        return relation.id;
    }

    async getOption2ndeGT(libelle) {
        return this.#storage.options_2nde_gt[libelle] || null;
    }
    
    /**
     * Récupère toutes les options 2nde GT (objets bruts)
     * @returns {Promise<Array>} Liste des options
     */
    async getAllOptions2ndeGT() {
        return Object.values(this.#storage.options_2nde_gt);
    }
    
    async getAllOptions2ndeGTParEtablissement() {
        return Object.values(this.#storage.options_2nde_gt_par_etablissement);
    }

    /**
     * Récupère toutes les options 2nde GT avec le nombre d'établissements qui les proposent
     * @returns {Promise<Array<{libelle: string, nbEtablissements: number}>>}
     */
    async getAllOptions2ndeGTAvecComptage() {
        const options = await this.getAllOptions2ndeGT();
        const relations = await this.getAllOptions2ndeGTParEtablissement();

        // Comptage par libellé via une Map
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
     * Récupère toutes les zones (noms de départements ou d'académies) présentes dans les établissements stockés
     * @param {string} type - 'departement' ou 'academie'
     * @returns {Promise<Array<string>>} Liste triée des zones disponibles
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
     * Récupère les libellés des options 2nde GT disponibles dans un département ou une académie donnée
     * @param {string} perimetre - 'departement' ou 'academie'
     * @param {string} zone - Nom du département ou de l'académie
     * @returns {Promise<Array<string>>} Liste triée des libellés d'options
     */
    async getOptionsDisponiblesParPerimetre(perimetre, zone) {
        const relations = await this.getAllOptions2ndeGTParEtablissement();
        const etablissements = await this.getAllEtablissements();

        // Indexer les établissements par UAI pour éviter une boucle imbriquée
        const etabIndex = {};
        etablissements.forEach(etab => { etabIndex[etab.uai] = etab; });

        const optionsSet = new Set();
        relations.forEach(relation => {
            const etab = etabIndex[relation.uai];
            if (!etab) return;
            const etabZone = perimetre === 'departement' ? etab.departement : etab.academie;
            if (etabZone === zone && relation.libelle) {
                optionsSet.add(relation.libelle);
            }
        });
        return Array.from(optionsSet).sort();
    }

    /**
     * Récupère une option 2nde GT enrichie avec la liste des établissements qui la proposent
     * @param {string} libelle - Libellé de l'option
     * @returns {Promise<{option: Object, etablissements: Array}|null>}
     */
    async getOption2ndeGTEnrichie(libelle) {
        const option = await this.getOption2ndeGT(libelle);
        if (!option) return null;

        const relations = await this.getAllOptions2ndeGTParEtablissement();
        const uaisAvecOption = relations
            .filter(rel => rel.libelle === libelle)
            .map(rel => rel.uai);

        // Récupérer les établissements correspondants
        const etablissements = [];
        for (const uai of uaisAvecOption) {
            const etab = await this.getEtablissement(uai);
            if (etab) etablissements.push(etab);
        }

        // Trier par nom
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
            console.warn('[DatabaseService] ❌ Impossible d\'insérer relation spécialité 1ère G-établissement sans ID:', relation);
            return null;
        }
        this.#storage.specialites_1ereG_par_etablissement[relation.id] = relation;
        this.#saveToLocalStorage();
        return relation.id;
    }

    async getSpecialite1ereG(libelle) {
        return this.#storage.specialites_1ereG[libelle] || null;
    }
    
    /**
     * Récupère toutes les spécialités 1ère G
     * @returns {Promise<Array>} Liste des spécialités
     */
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
    }

        /**
     * Récupère toutes les langues
     * @returns {Promise<Array>} Liste des langues
     */
    async getAllLangues() {
        return Object.values(this.#storage.langues);
    }

    // =====================================
    // RÉFÉRENTIELS GÉOGRAPHIQUES
    // =====================================
    
    async insertCommune(commune) {
        if (!commune.code) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer commune sans code:', commune);
            return null;
        }
        this.#storage.communes[commune.code] = commune;
        this.#saveToLocalStorage();
    }
    
    async getCommune(code) {
        return this.#storage.communes[code] || null;
    }
    
    async insertDepartement(departement) {
        if (!departement.code) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer département sans code:', departement);
            return null;
        }
        this.#storage.departements[departement.code] = departement;
        this.#saveToLocalStorage();
    }
    
    async getDepartement(code) {
        return this.#storage.departements[code] || null;
    }
    
    async insertRegion(region) {
        if (!region.code) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer région sans code:', region);
            return null;
        }
        this.#storage.regions[region.code] = region;
        this.#saveToLocalStorage();
    }
    
    async getRegion(code) {
        return this.#storage.regions[code] || null;
    }
    
    async insertEPCI(epci) {
        if (!epci.code) {
            console.warn('[DatabaseService] ❌ Impossible d\'insérer EPCI sans code:', epci);
            return null;
        }
        this.#storage.epci[epci.code] = epci;
        this.#saveToLocalStorage();
    }
    
    async getEPCI(code) {
        return this.#storage.epci[code] || null;
    }
    
    // =====================================
    // MÉTHODES UI pour un établissement donné
    // =====================================

    /**
     * Récupère les informations complètes d'un établissement (données de base + données liées)
     * @param {string} uai - UAI de l'établissement
     * @returns {Promise<Object>} Informations complètes de l'établissement
     */
    async getEtablissementEnrichi(uai) {
        const etablissement = await this.getEtablissement(uai);
        if (!etablissement) return null;
        
        // Récupérer les données liées
        const diplomes = await this.getDiplomesParEtablissement(uai);
        const dispositifs = await this.getDispositifsParEtablissement(uai);
        const options2ndeGT = await this.getOptions2ndeGTParEtablissement(uai);
        const specialites1ereG = await this.getSpecialites1ereGParEtablissement(uai);
        
        return {
            etablissement,
            diplomes,
            dispositifs,
            options2ndeGT,
            specialites1ereG
        };
    }

    /**
     * Récupère les diplômes d'un établissement
     * @param {string} uai - UAI de l'établissement
     * @returns {Promise<Array>} Liste des diplômes
     */
    async getDiplomesParEtablissement(uai) {
        return this.getDiplomesParEtablissementSync(uai);
    }
    
    /**
     * Version synchrone pour popup carte (pas d'await possible)
     * @param {string} uai - UAI de l'établissement
     * @returns {Array} Liste des diplômes
     */
    getDiplomesParEtablissementSync(uai) {
        // On recupère d'abord les libellés des diplômes pour l'établissement donné
        const libellesSet = new Set(Object.values(this.#storage.diplomes_par_etablissement)
            .filter(rel => rel.uai === uai)
            .map(rel => rel.libelle));

        // On renvoie les diplômes correspondants à ces libellés
        const diplomes = Object.values(this.#storage.diplomes).filter(d => libellesSet.has(d.libelle));
        for (const diplome of diplomes) {
            // Récupérer les informations de la relation diplôme-établissement pour ce diplôme et cet établissement
            const relation = Object.values(this.#storage.diplomes_par_etablissement)
                .filter(rel => rel.uai === uai).find(rel => rel.libelle === diplome.libelle);
            if (relation) {
                // Fusionner les données du diplôme et de la relation
                Object.assign(diplome, relation);
            }
        }
        return diplomes;
    }
    
    /**
     * Récupère les dispositifs d'un établissement
     * @param {string} uai - UAI de l'établissement
     * @returns {Promise<Array>} Liste des dispositifs
     */
    async getDispositifsParEtablissement(uai) {
        // Récupérer les libellés des dispositifs pour l'établissement donné
        const libellesSet = new Set(Object.values(this.#storage.dispositifs_par_etablissement)
            .filter(rel => rel.uai === uai)
            .map(rel => rel.libelle));
        

        // Récupérer les informations complètes des dispositifs
        const dispositifs = Object.values(this.#storage.dispositifs).filter(d => libellesSet.has(d.libelle));
        for (const dispositif of dispositifs) {
            // Récupérer les informations de la relation dispositif-établissement pour ce dispositif et cet établissement
            const relation = Object.values(this.#storage.dispositifs_par_etablissement)
                .filter(rel => rel.uai === uai).find(rel => rel.libelle === dispositif.libelle);
            if (relation) {
                // Fusionner les données du dispositif et de la relation
                Object.assign(dispositif, relation);
            }
        }
        return dispositifs;
    }
    
    /**
     * Récupère les options 2nde GT d'un établissement
     * @param {string} uai - UAI de l'établissement
     * @returns {Promise<Array>} Liste des options 2nde GT
     */
    async getOptions2ndeGTParEtablissement(uai) {
        // Récupérer les libellés des options 2nde GT pour l'établissement donné
        const libellesSet = new Set(Object.values(this.#storage.options_2nde_gt_par_etablissement)
            .filter(rel => rel.uai === uai)
            .map(rel => rel.libelle));
        
        // Récupérer les informations complètes des options 2nde GT
        const options = Object.values(this.#storage.options_2nde_gt).filter(o => libellesSet.has(o.libelle));
        for (const option of options) {
            // Récupérer les informations de la relation option-2nde-GT-établissement pour cette option et cet établissement
            const relation = Object.values(this.#storage.options_2nde_gt_par_etablissement)
                .filter(rel => rel.uai === uai).find(rel => rel.libelle === option.libelle);
            if (relation) {
                // Fusionner les données de l'option et de la relation
                Object.assign(option, relation);
            }
        }
        return options;
    }
    
    /**
     * Récupère les spécialités 1ère G d'un établissement
     * @param {string} uai - UAI de l'établissement
     * @returns {Promise<Array>} Liste des spécialités
     */
    async getSpecialites1ereGParEtablissement(uai) {
        // Récupérer les libellés des spécialités 1ère G pour l'établissement donné
        const libellesSet = new Set(Object.values(this.#storage.specialites_1ereG_par_etablissement)
            .filter(rel => rel.uai === uai)
            .map(rel => rel.libelle));
        
        // Récupérer les informations complètes des spécialités 1ère G
        const specialites = Object.values(this.#storage.specialites_1ereG).filter(s => libellesSet.has(s.libelle));
        for (const specialite of specialites) {
            // Récupérer les informations de la relation spécialité-1ère-G-établissement pour cette spécialité et cet établissement
            const relation = Object.values(this.#storage.specialites_1ereG_par_etablissement)
                .filter(rel => rel.uai === uai).find(rel => rel.libelle === specialite.libelle);
            if (relation) {
                // Fusionner les données de la spécialité et de la relation
                Object.assign(specialite, relation);
            }
        }
        return specialites;
    }

    async getLanguesByUAI(uai) {
        return Object.values(this.#storage.langues).filter(l => l.uai === uai);
    }
    
    /**
     * Compte le nombre de diplômes d'un établissement
     * @param {string} uai - UAI de l'établissement
     * @returns {Promise<number>} Nombre de diplômes
     */
    async countDiplomesParEtablissement(uai) {
        const relations = Object.values(this.#storage.diplomes_par_etablissement)
            .filter(rel => rel.uai === uai);
        return relations.length;
    }

    // =====================================
    // MÉTHODES UI pour un diplôme donné
    // =====================================

    /** 
     * Récupère les données complètes d'un diplôme (données de base + données liées)
     * @param {string} libelle - Libellé du diplôme
     * @returns {Promise<Object>} Les données complètes du diplôme
     */
    async getDiplomeEnrichi(libelle) {
        const diplome = await this.getDiplome(libelle);
        if (!diplome) return null;

        // Récupérer les données liées
        const etablissements = await this.getEtablissementsParDiplome(libelle);

        // Vérifier si c'est un Bac Pro pour ajouter le parcours
        if (libelle.toLowerCase().includes('bac pro')) {
            const parcours = getParcoursBacPro(libelle);
            if (!parcours) {
                console.warn(`[showDiplomeDetails] Aucun parcours trouvé pour "${libelle}"`);
            } else {
                console.log(`[showDiplomeDetails] Parcours ajouté au diplôme:`, parcours);
                return {
                    diplome,
                    etablissements,
                    parcours
                }
            }
        }
        
        return {
            diplome,
            etablissements
        }
    }

    /**
     * Récupère les établissements proposant un diplôme
     * @param {string} libelle - Libellé du diplôme
     * @returns {Promise<Array>} Liste des établissements
     */
    async getEtablissementsParDiplome(libelle) {
        // On recupère d'abord les uai des établissements pour le diplôme donné
        const uaiSet = new Set(Object.values(this.#storage.diplomes_par_etablissement)
            .filter(rel => rel.libelle === libelle)
            .map(rel => rel.uai));

        // On renvoie les etablissements correspondants à ces uai
        const etablissements = Object.values(this.#storage.etablissements).filter(e => uaiSet.has(e.uai));
        for (const etablissement of etablissements) {
            // Récupérer les informations de la relation diplôme-établissement pour ce diplôme et cet établissement
            const relation = Object.values(this.#storage.diplomes_par_etablissement)
                .filter(rel => rel.uai === etablissement.uai).find(rel => rel.libelle === libelle);
            if (relation) {
                // Fusionner les données du diplôme et de la relation
                Object.assign(etablissement, relation);
            }
        }
        return etablissements;

    }
    
    // =====================================
    // MÉTHODES UI pour un dispositif donné
    // =====================================

    /** 
     * Récupère les données complètes d'un dispositif (données de base + données liées)
     * @param {string} libelle - Libellé du dispositif
     * @returns {Promise<Object>} Les données complètes du dispositif
     */
    async getDispositifEnrichi(libelle) {
        const dispositif = await this.getDispositif(libelle);
        if (!dispositif) return null;

        // Récupérer les données liées
        const etablissements = await this.getEtablissementsParDispositif(libelle);

        return {
            dispositif,
            etablissements
        }
    }

    /**
     * Récupère les établissements proposant un dispositif
     * @param {string} libelle - Libellé du dispositif
     * @returns {Promise<Array>} Liste des établissements
     */
    async getEtablissementsParDispositif(libelle) {
        // On recupère d'abord les uai des établissements pour le dispositif donné
        const uaiSet = new Set(Object.values(this.#storage.dispositifs_par_etablissement)
            .filter(rel => rel.libelle === libelle)
            .map(rel => rel.uai));

        // On renvoie les etablissements correspondants à ces uai
        const etablissements = Object.values(this.#storage.etablissements).filter(e => uaiSet.has(e.uai));
        for (const etablissement of etablissements) {
            // Récupérer les informations de la relation dispositif-établissement pour ce dispositif et cet établissement
            const relation = Object.values(this.#storage.dispositifs_par_etablissement)
                .filter(rel => rel.uai === etablissement.uai).find(rel => rel.libelle === libelle);
            if (relation) {
                // Fusionner les données du dispositif et de la relation
                Object.assign(etablissement, relation);
            }
        }
        return etablissements;
    }
    
    // =====================================
    // UTILITAIRES
    // =====================================
    
    async clearAllData() {
        console.log('[DatabaseService] 🗑️ Vidage de toutes les tables');
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
            langues: {},
            communes: {},
            departements: {},
            regions: {},
            epci: {}
        };
        this.#saveToLocalStorage();
    }

    async clearOnisepData() {
        console.log('[DatabaseService] 🗑️ Vidage de toutes les données extraites d\'Onisep');
        this.#storage.etablissements={};
        this.#storage.diplomes={};
        this.#storage.diplomes_par_etablissement={};
        this.#storage.dispositifs={};
        this.#storage.dispositifs_par_etablissement={};
        this.#storage.options_2nde_gt={};
        this.#storage.options_2nde_gt_par_etablissement={};
        this.#storage.specialites_1ereG={};
        this.#storage.specialites_1ereG_par_etablissement={};
        this.#saveToLocalStorage();
    }

    async clearEducationData() {
        console.log('[DatabaseService] 🗑️ Vidage de toutes les données extraites de data.education.gouv.fr');
        this.#storage.langues={};
    }
    
    async clearGeoData() {
        console.log('[DatabaseService] 🗑️ Vidage de toutes les données extraites de geo.gouv.fr');
        this.#storage.communes={};
        this.#storage.departements={};
        this.#storage.regions={};
        this.#storage.epci={};
        this.#saveToLocalStorage();
    }
    
    async count(table) {
        return Object.keys(this.#storage[table] || {}).length;
    }
    
    async getStats() {        
        return {
            etablissements: await this.count('etablissements'),
            diplomes: await this.count('diplomes'),
            diplomes_par_etablissement: await this.count('diplomes_par_etablissement'),
            dispositifs: await this.count('dispositifs'),
            dispositifs_par_etablissement: await this.count('dispositifs_par_etablissement'),
            options_2nde_gt: await this.count('options_2nde_gt'),
            options_2nde_gt_par_etablissement: await this.count('options_2nde_gt_par_etablissement'),
            specialites_1ereG: await this.count('specialites_1ereG'),
            specialites_1ereG_par_etablissement: await this.count('specialites_1ereG_par_etablissement'),
            langues: await this.count('langues'),
            communes: await this.count('communes'),
            departements: await this.count('departements'),
            regions: await this.count('regions'),
            epci: await this.count('epci')
        };
    }
}

function getParcoursBacPro(libelle) {
    try {
        console.log(`[getParcoursBacPro] Recherche parcours pour: "${libelle}"`);
        
        // Normaliser le libellé pour la recherche (enlever "bac pro" et mettre en minuscules)
        const normalized = libelle.toLowerCase().replace(/^bac pro\s+/i, '');
        console.log(`[getParcoursBacPro] Libellé normalisé: "${normalized}"`);
        
        if (window.PARCOURS_BAC_PRO.length === 0) {
            console.log(`[getParcoursBacPro] Aucun parcours !`);
            return null;
        }

        for (const parcoursFamille of window.PARCOURS_BAC_PRO) {
            for (const parcours of parcoursFamille.parcours) {
                const parcoursDiplome = parcours.diplome || '';
                if (parcoursDiplome.toLowerCase().includes(normalized)) {
                    console.log(`[getParcoursBacPro] Parcours trouvé:`, parcours);
                    return {
                        famille: parcoursFamille.famille,
                        seconde: parcoursFamille.seconde,
                        premiere: parcours.premiere,
                        terminale: parcours.terminale
                    };
                }
            }
        }
        console.log(`[getParcoursBacPro] Parcours non trouvé pour: "${normalized}"`);
        return null;

    } catch (error) {
        console.error(`Erreur lecture parcours Bac Pro:`, error);
        return null;
    }
}

// =====================================
// EXPOSITION GLOBALE
// =====================================
if (typeof window !== 'undefined') {
    window.DatabaseService = DatabaseService;
}
